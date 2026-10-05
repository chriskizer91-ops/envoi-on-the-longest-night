// player.js: plays a cutscene written as data: a place, a cast and a list of shots (scene.js), with every line it shows
// in one file (words.js). It is general: a new scene, or a new creature's first meeting, is a new place and shot list
// for this player, not a new player. It builds everything inside the element it is given, plays it through the film
// camera (cinema.js: depth of field, bloom, moonlight shafts, a film grade, letterbox), and afterwards frees everything,
// its WebGL context and its sound included, so the battle can build its own.
//
// Defines makeCutscene(def) only. def: {
//   id, title,
//   scene(arena)   the scene's data (scene.js), made fresh for each run; arena is opts.arena (below), or null
//   words()   its lines (words.js)
//   place(renderer, quality, placeData)   builds the place; returns { scene, moonDir, heightAt(x, z), update(t, dt, camera),
//             shadowAt(x, z), setWarm(p, r)?, impact(x, z, k)?, set(o)?, dispose()? }
//   cast()    the models it may use (cast.js): { name: { kind: 'person' | 'creature', make(quality, castEntry), ... } }
//   sfx(snd)  optional: the scene's own sounds, played through the place's sound (sfx.js)
// }
// Returns { id, title, seconds, play(container, opts), prepare(container, opts), last }.
//   play(container, opts) builds, plays and frees everything; it returns a promise that settles 'done' or 'skipped'.
//   prepare(container, opts) builds only; it returns { ready (a promise), start() (plays: the same promise as play), cancel(),
//     stats(), test (headless hooks, with opts.test) }, so a page can build behind its start screen and play on a tap.
//   opts: { quality: 'light' | 'phone' | 'laptop' (default: phone on a phone, else laptop), volume: { music, effects,
//     surroundings } (0 to 1, the game's three volumes), skip (default true: a Skip button), soundButton (a sound on/off
//     chip), still (default true: when it ends, the last frame stays in the container as a picture, for a cross-fade;
//     the caller removes it, .envoi-cs-still), onProgress(fraction, words), idle (while waiting for start(), the
//     opening view drifts behind the caller's start screen), test (frames are driven from the test hooks only), from
//     (start that many seconds in, for checking), arena (when the fight is fought in its arena, the game gives it, and
//     the last shot settles into the fight's opening frame there instead of on the flat painting: { place, camera: { x,
//     h, z, pitch, fov }, frame: [w, h], ppm, heroes: [{ id, at: [x, z], tall, yawBias }], foes: [{ id, at, tall, halfW,
//     yawBias }] }, in the arena's metres; src/game/game.js arenaFor) }
//   last: after a run, { result, fps, worst, quality, seconds, triangles, calls }.
function makeCutscene(def) {
  'use strict';
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const EASE = { l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x), io: (x) => x * x * (3 - 2 * x), soft: (x) => .5 - .5 * Math.cos(Math.PI * x),
    // slow in, then gliding to a stop: for a camera that settles
    settle: (x) => 1 - Math.pow(1 - x, 3) };
  // the film camera's settings at each detail; the place and the cast pick their own detail from the same name
  // (soft: the moon's shadow filtered softly; floor: the lowest the picture's sharpness may drop to keep up, see keepUp)
  const QUALITY = {
    light: { name: 'Light', px: 1, scale: .7, msaa: 0, blur: 8, cap: 30, soft: false, floor: .55 },
    phone: { name: 'Phone', px: 1.25, scale: .8, msaa: 2, blur: 10, cap: 30, soft: false, floor: .6 },
    laptop: { name: 'Laptop', px: 1.5, scale: 1, msaa: 4, blur: 12, cap: 0, soft: true, floor: .7 }
  };
  const isPhone = () => (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 560;
  function timeline(SC) { let t = 0; for (const s of SC.shots) { s.start = t; t += s.d; } SC.total = t; return SC; }
  // a value along keys [[t, v], ...], eased between them
  function keyed(list, t, def0) {
    if (!list || !list.length) return def0;
    if (t <= list[0][0]) return list[0][1];
    for (let i = 0; i < list.length - 1; i++) { const [a, va] = list[i], [b, vb] = list[i + 1]; if (t < b) return lerp(va, vb, EASE.soft(cl((t - a) / (b - a), 0, 1))); }
    return list[list.length - 1][1];
  }

  // ---------- the look of the words and buttons, scoped to the cutscene's own box ----------
  const CSS = '.envoi-cs{position:absolute;inset:0;overflow:hidden;background:#05030c;color:#e3e6f2;font-family:"Atkinson Hyperlegible",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}' +
    '.envoi-cs canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:manipulation}' +
    '.envoi-cs .cs-cap{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;width:min(50rem,calc(100% - 32px));text-align:center;pointer-events:none;z-index:3}' +
    '.envoi-cs .cs-words{margin:0;font-family:"IM Fell English","Iowan Old Style",Georgia,serif;font-style:italic;font-size:clamp(1.02rem,2.05vw,1.5rem);line-height:1.4;color:#eef0f8;' +
    'text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 22px rgba(0,0,0,.85);opacity:0;transition:opacity .8s ease;text-wrap:balance}' +
    '.envoi-cs .cs-cap.on .cs-words{opacity:1}' +
    '.envoi-cs .cs-chip{position:absolute;top:max(10px,env(safe-area-inset-top,0px));z-index:4;min-height:36px;padding:0 14px;border:1px solid rgba(214,222,255,.4);border-radius:18px;' +
    'background:rgba(18,16,40,.55);color:#f4f6ff;font:700 14px/1 "Atkinson Hyperlegible",system-ui,sans-serif;opacity:.78;cursor:pointer}' +
    '.envoi-cs .cs-chip:hover,.envoi-cs .cs-chip:focus-visible{opacity:1}.envoi-cs .cs-chip:focus-visible{outline:2px solid #dcb767;outline-offset:2px}' +
    '.envoi-cs .cs-skip{right:max(10px,env(safe-area-inset-right,0px))}.envoi-cs .cs-snd{right:calc(max(10px,env(safe-area-inset-right,0px)) + 76px)}' +
    '.envoi-cs [hidden]{display:none!important}' +
    '.envoi-cs-still{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}' +
    '@media (max-height:460px){.envoi-cs .cs-words{font-size:1rem}}' +
    '@media (prefers-reduced-motion:reduce){.envoi-cs .cs-words{transition:none}}';
  function addStyle() {
    if (document.getElementById('envoi-cs-style')) return;
    const st = document.createElement('style'); st.id = 'envoi-cs-style'; st.textContent = CSS; document.head.appendChild(st);
  }

  // ---------- three.js's fog chunks: a place may replace them (Frostmere's height fog); they go back afterwards ----------
  const CHUNKS = ['fog_pars_vertex', 'fog_vertex', 'fog_pars_fragment', 'fog_fragment'];

  function prepare(container, opts) {
    opts = opts || {};
    const qn = QUALITY[opts.quality] ? opts.quality : (isPhone() ? 'phone' : 'laptop'), QP = QUALITY[qn];
    const TEST = !!opts.test, vol = Object.assign({ music: 1, effects: 1, surroundings: 1 }, opts.volume || {});
    const SC = timeline(def.scene(opts.arena || null)), WORDS = def.words(), CAST = def.cast();
    // opts.level: the level the fight meets its creature at (the cast's own level otherwise)
    if (opts.level) for (const id in SC.cast) if (SC.cast[id].level) SC.cast[id].level = opts.level;
    const saved = {}; for (const k of CHUNKS) saved[k] = THREE.ShaderChunk[k];
    let E = null, gone = false, raf = 0, settle = null, result = null;
    const listeners = [];
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); listeners.push([el, ev, fn, o]); };

    // ---------- its box: the picture, the words, Skip ----------
    addStyle();
    const box = document.createElement('div'); box.className = 'envoi-cs'; box.dataset.cutscene = def.id;
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-label', SC.alt || def.title); canvas.style.visibility = 'hidden';
    const cap = document.createElement('div'); cap.className = 'cs-cap'; cap.setAttribute('aria-live', 'polite');
    const words = document.createElement('p'); words.className = 'cs-words'; cap.appendChild(words);
    const skipB = document.createElement('button'); skipB.type = 'button'; skipB.className = 'cs-chip cs-skip'; skipB.textContent = 'Skip'; skipB.hidden = true;
    const sndB = document.createElement('button'); sndB.type = 'button'; sndB.className = 'cs-chip cs-snd'; sndB.hidden = true; sndB.setAttribute('aria-pressed', 'true'); sndB.textContent = 'Sound on';
    box.append(canvas, cap, skipB, sndB);
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.appendChild(box);

    // ---------- building it, in steps, so a loading line can move ----------
    const steps = [
      ['Lighting the moon', () => {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QP.px));
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = QP.soft ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; renderer.info.autoReset = false;
        E = { renderer, ms: {}, actors: {}, list: [], scale: QP.scale };
      }],
      ['Building the place', () => { const t = performance.now(); E.world = def.place(E.renderer, qn, SC.place || {}); E.ms.place = performance.now() - t; }],
      ['Bringing in the cast', () => {
        const t = performance.now();
        for (const id in SC.cast) {
          const c = SC.cast[id], K = CAST[c.model]; if (!K) throw new Error('no model ' + c.model);
          const m = K.make(qn, c); E.world.scene.add(m.root); if (m.fx) E.world.scene.add(m.fx);
          const a = makeActor(id, m, c, K); E.actors[id] = a; E.list.push(a);
        }
        E.ms.cast = performance.now() - t;
      }],
      ['Setting up the camera', () => {
        E.camera = new THREE.PerspectiveCamera(36, 1, .1, 12000);
        E.cine = makeCinema(E.renderer, { scale: QP.scale, msaa: QP.msaa }); E.cine.sun(E.world.moonDir);
        E.cine.set(Object.assign({ exposure: 1.4, bloom: .45, rays: .22, grain: .025, vignette: .3, split: .08, saturation: 1, focus: 12, aperture: .5, maxBlur: QP.blur }, SC.look || {}));
        E.breath = SC.place && SC.place.cold ? makeBreath(E.world.scene) : null;
        resize(); on(window, 'resize', resize);
      }],
      ['Making the sounds', () => {
        if (TEST || typeof makeFieldSounds !== 'function') return;
        try {
          const snd = makeFieldSounds(); snd.setGroup('bramble', .9 * vol.effects); snd.setGroup('night', .55 * vol.surroundings);
          snd.init(); snd.setWind(SC.place && SC.place.wind ? SC.place.wind.level || .5 : .5); E.snd = snd;
          E.sfx = def.sfx ? def.sfx(snd, vol) : null;
        } catch (e) { E.snd = null; E.sfx = null; }
      }],
      ['Waking them', () => { const t = performance.now(); restart(); warmUp(); E.ms.compile = performance.now() - t; }]
    ];
    const ready = new Promise((res, rej) => {
      let i = 0;
      const next = () => {
        if (gone) return rej(new Error('cancelled'));
        if (i >= steps.length) { if (opts.onProgress) opts.onProgress(1, ''); return res(); }
        if (opts.onProgress) opts.onProgress(i / steps.length, steps[i][0]);
        setTimeout(() => {
          try { steps[i][1](); i++; next(); } catch (e) { console.error(e); dispose(); rej(e); }
        }, TEST ? 0 : 30);
      };
      next();
    }).then(() => { if (opts.idle && !TEST) { film.mode = 'idle'; film.t = SC.idleAt || 3; canvas.style.visibility = ''; loop.start(); } });

    function resize() {
      if (!E || !E.camera) return;
      const w = Math.max(2, box.clientWidth || container.clientWidth || window.innerWidth), h = Math.max(2, box.clientHeight || container.clientHeight || window.innerHeight);
      E.renderer.setSize(w, h, false); E.view = { w, h }; E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
    }
    // every shader the scene can need, compiled now rather than at the moment it first shows (a phone stalls on each)
    function warmUp() {
      const hid = []; E.world.scene.traverse((o) => { if (!o.visible) { hid.push(o); o.visible = true; } });
      frame(1 / 30, false, true);
      try { E.renderer.compile(E.world.scene, E.camera); } catch (e) { /* compiled on first use instead */ }
      E.cine.render(E.world.scene, E.camera, 0);
      for (const o of hid) o.visible = false;
      restart();
    }

    // ---------- the people and creatures ----------
    // A person walks a path of points at her own pace (her walk cycle turns K.stride radians a meter, as the game drives
    // it), turning toward each point and easing to a stop at the last; she can turn to face a point, and her moves carry
    // her as they do in the battle (a lunge, a guard step). A creature stands where it is rooted. The model only ever
    // gets what the game gives it: its place, its facing, and animate(phase, walk, t, dt).
    function makeActor(id, m, c, K) {
      const a = { id, m, c, K, kind: K.kind, x: c.at[0], z: c.at[1], yaw: c.yaw || 0, phase: 0, walk: 0, speed: 1, path: null, face: null, ramps: [], dash: true, breath: 0 };
      if (K.setup) K.setup(m, c);
      return a;
    }
    function placeActor(a) {
      a.x = a.c.at[0]; a.z = a.c.at[1]; a.yaw = a.c.yaw || 0; a.phase = 0; a.walk = 0; a.path = null; a.face = null; a.ramps = []; a.speed = a.c.speed || 1; a.breath = a.c.breathAt || Math.random() * 2;
      if (a.m.reset) a.m.reset();
      if (a.m.state && a.c.state) Object.assign(a.m.state, a.c.state);
      if (a.K.pose) a.K.pose(a, a.c.pose || 'base', E);
    }
    function aimOf(p) { if (typeof p === 'string') { const b = E.actors[p]; return b ? [b.x, b.z] : null; } return p; }
    function actorStep(a, t, dt, sdt) {
      let want = 0;
      if (a.path) {
        let p = a.path[0];
        while (a.path.length > 1 && Math.hypot(p[0] - a.x, p[1] - a.z) < .45) { a.path.shift(); p = a.path[0]; }
        const dx = p[0] - a.x, dz = p[1] - a.z, d = Math.hypot(dx, dz);
        const ahead = dx * Math.sin(a.yaw) + dz * Math.cos(a.yaw);
        if (a.path.length === 1 && (d < .03 || (ahead < .02 && d < .3))) a.path = null;
        else { want = a.path.length === 1 ? Math.min(1, d / .55) : 1; a.yaw += wrapA(Math.atan2(dx, dz) - a.yaw) * Math.min(1, sdt * 4); }
      } else if (a.face !== null) {
        const f = typeof a.face === 'number' ? a.face : (() => { const q = aimOf(a.face); return q ? Math.atan2(q[0] - a.x, q[1] - a.z) : a.yaw; })();
        a.yaw += wrapA(f - a.yaw) * Math.min(1, sdt * (a.faceRate || 3));
      }
      a.walk += (want - a.walk) * Math.min(1, sdt * 3.2);
      if (a.walk < 1e-3 && !a.path) a.walk = 0;
      const sp = a.speed * a.walk;
      a.x += Math.sin(a.yaw) * sp * sdt; a.z += Math.cos(a.yaw) * sp * sdt; a.phase += sp * sdt * (a.K.stride || 4.2);
      // a move's own step (a guard step, a lunge) carries the body, as the battle's does
      if (a.dash && a.m.busy && a.m.dash && sdt > 0) { const d = a.m.dash * sdt; a.x += Math.sin(a.yaw) * d; a.z += Math.cos(a.yaw) * d; }
      for (const r of a.ramps) a.m.state[r.key] = keyed(r.keys, film.t - r.t0, r.keys[0][1]);
      const gy = E.world.heightAt(a.x, a.z);
      a.m.root.position.set(a.x, gy, a.z); a.m.root.rotation.y = a.yaw;
      a.m.animate(a.phase, a.walk, t, sdt);
      if (a.K.after) a.K.after(a.m, a, sdt);
    }
    // a creature's moves: their sounds, what their blows do to the ground, and the camera's tremor (cast.js gives each
    // creature its own: which of its sounds each move makes, and when)
    function watchCreature(a, sdt) {
      const m = a.m, K = a.K, mv = m.action, p = m.progress;
      if (mv && (mv !== a.lastAct || p < a.lastProg)) a.lastProg = -1e-6;
      if (mv) {
        for (const [u, name, g] of (K.sounds && K.sounds[mv]) || []) if (a.lastProg < u && p >= u) creatureSound(a, name, g, name === 'heavy' || name === 'impact' ? m.anchor('impact', _s2) : null);
        const D = m.ACTIONS && m.ACTIONS[mv];
        if (D) {
          for (const h of D.hits) if (a.lastProg < h && p >= h) { const k = (K.hitShake && K.hitShake[mv]) || .6; m.anchor('impact', _s2); if (E.world.impact) E.world.impact(_s2.x, _s2.z, k); shakeBy(k, _s2); }
          for (const [u, k, imp] of (K.cueShake && K.cueShake[mv]) || []) if (a.lastProg < u && p >= u) { if (imp && E.world.impact) E.world.impact(a.x, a.z, imp); shakeBy(k, m.root.position); }
        }
      }
      a.lastAct = mv; a.lastProg = mv ? p : -1;
      // its heartbeat, heard only close to
      if (K.heart && m.beats !== a.beats) { a.beats = m.beats; const d = E.camera.position.distanceTo(m.anchor('heart', _s2)), g = cl(1.15 - d / 14, 0, .9); if (g > .05) creatureSound(a, 'heart', g, _s2); }
      // the ground's warmth follows it
      if (K.warm && E.world.setWarm) E.world.setWarm(m.root.position, K.warm);
    }

    // ---------- sound: placed left or right, near or far, by where it is in the picture ----------
    const _s = V3(), _s2 = V3();
    function placeOf(at) {
      _s.copy(at).applyMatrix4(E.camera.matrixWorldInverse); const d = _s.length();
      return { d, pan: cl(_s.x / Math.max(d, 4) * 1.5, -.85, .85), far: cl((d - 10) / 60, 0, 1) };
    }
    function creatureSound(a, name, g, at) {
      if (!E.snd || film.mode !== 'play') return;
      const p = placeOf(at || _s2.copy(a.m.root.position).setY(a.m.root.position.y + 2.5));
      if (a.K.sound) a.K.sound(E.snd, name, { gain: (g === undefined ? 1 : g) * cl(16 / Math.max(p.d, 1), .45, 1.15), pan: p.pan, far: p.far });
    }
    function sfxAt(id, g, at) {
      if (!E.sfx || film.mode !== 'play') return;
      const p = at ? placeOf(at) : { d: 5, pan: 0, far: 0 };
      E.sfx.play(id, { gain: g === undefined ? 1 : g, pan: p.pan, far: p.far, d: p.d });
    }
    // footsteps, when a person's walk cycle puts a foot down
    function stepSounds(a, p0) {
      if (!E.sfx || a.walk < .35 || !a.K.steps) return;
      for (const ph of [0, Math.PI]) { const s0 = Math.sin(p0 + ph), s1 = Math.sin(a.phase + ph); if (s0 > 0 && s1 <= 0) sfxAt(a.K.steps, .55 * a.walk, a.m.root.position); }
    }

    // ---------- breath in the cold: a puff from each person's mouth every few seconds, drifting off on the wind ----------
    function makeBreath(scene) {
      const N = 120, pos = new Float32Array(N * 3), age = new Float32Array(N).fill(-1), vel = new Float32Array(N * 3), life = new Float32Array(N), sz = new Float32Array(N);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aAge', new THREE.BufferAttribute(age, 1)); geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 400 }, uC: { value: new THREE.Color(.42, .45, .58) } },
        vertexShader: 'attribute float aAge, aSize; uniform float uScale; varying float vA;\nvoid main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); float a = aAge;\n' +
          ' vA = a < 0. ? 0. : smoothstep(0., .1, a) * (1. - smoothstep(.3, 1., a)); gl_PointSize = a < 0. ? 0. : aSize * (.35 + 1.6 * a) * uScale * projectionMatrix[1][1] / max(-mv.z, .05);\n' +
          ' gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uC; varying float vA;\nvoid main(){ vec2 c = gl_PointCoord - .5; float r = length(c); float a = 1. - smoothstep(.1, .5, r); gl_FragColor = vec4(uC, a * a * vA * .36); }',
        transparent: true, depthWrite: false
      });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 8; scene.add(pts);
      let n = 0;
      return {
        puff(p, dir) {
          for (let k = 0; k < 7; k++) {
            const i = n++ % N; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
            const s = .35 + Math.random() * .3, sp = (Math.random() - .5) * .12;
            vel[i * 3] = dir.x * s + sp; vel[i * 3 + 1] = .03 + Math.random() * .08; vel[i * 3 + 2] = dir.z * s + (Math.random() - .5) * .12;
            age[i] = 0; life[i] = 1.5 + Math.random() * .8; sz[i] = .05 + Math.random() * .05;
          }
        },
        step(dt, wind) {
          for (let i = 0; i < N; i++) {
            if (age[i] < 0) continue; const k = dt / life[i]; age[i] += k; if (age[i] >= 1) { age[i] = -1; continue; }
            const drag = Math.exp(-dt * 2.2);
            vel[i * 3] = vel[i * 3] * drag + wind.x * .25 * dt; vel[i * 3 + 1] = vel[i * 3 + 1] * drag + .05 * dt; vel[i * 3 + 2] = vel[i * 3 + 2] * drag + wind.z * .25 * dt;
            pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          }
          geo.attributes.position.needsUpdate = true; geo.attributes.aAge.needsUpdate = true; geo.attributes.aSize.needsUpdate = true;
        },
        clear() { age.fill(-1); geo.attributes.aAge.needsUpdate = true; },
        mat
      };
    }
    const _bm = V3(), _bd = V3();
    function breathStep(a, sdt) {
      if (!E.breath || a.kind !== 'person' || !a.K.mouth || sdt <= 0) return;
      a.breath -= sdt;
      if (a.breath <= 0) {
        a.breath = (a.walk > .5 ? 2.2 : 3.1) + Math.random() * .9;
        const o = a.K.mouth, c = Math.cos(a.yaw), s = Math.sin(a.yaw);
        a.m.anchor('head', _bm); _bm.x += o[0] * c + o[2] * s; _bm.y += o[1]; _bm.z += -o[0] * s + o[2] * c;
        E.breath.puff(_bm, _bd.set(s, 0, c));
      }
    }

    // ---------- the film: its clock, its shots, its cues ----------
    const film = { t: 0, shot: -1, mode: 'wait', fired: -1, held: false };
    const clock = { sim: 0, slow: 1 };
    const CUES = [], LINES = [];
    for (const s of SC.shots) {
      for (const d of s.do || []) CUES.push({ at: s.start + d[0], kind: 'do', d });
      for (const x of s.sound || []) CUES.push({ at: s.start + x[0], kind: 'sound', x });
      for (const [t0, t1, key] of s.say || []) LINES.push({ a0: s.start + t0, a1: s.start + t1, key, text: wordOf(key) });
    }
    CUES.sort((p, q) => p.at - q.at);
    function wordOf(key) {
      const [k, part] = String(key).split('.'); const w = WORDS[k];
      if (w === undefined) throw new Error('no words for ' + key);
      if (Array.isArray(w)) return part === undefined ? w.join(' ') : w[+part];
      return w;
    }
    function restart() {
      film.t = 0; film.shot = -1; film.fired = -1; clock.slow = 1;
      for (const a of E.list) placeActor(a);
      if (E.breath) E.breath.clear();
      // settle every spring where it stands, before anything is drawn
      for (let i = 0; i < 60; i++) { clock.sim += 1 / 30; for (const a of E.list) actorStep(a, clock.sim, 1 / 30, 1 / 30); }
      for (const a of E.list) if (a.kind === 'creature') { a.lastAct = a.m.action; a.lastProg = a.m.progress; a.beats = a.m.beats; }
      showWords(null); shake.k = 0;
      fps.frames = 0; fps.time = 0; fps.worst = 99; fps.win = []; fps.slow = 0;
      if (E.world.set && SC.place) E.world.set({ frost: SC.place.frost === undefined ? 1 : SC.place.frost, wind: SC.place.wind || { x: .6, z: .2 } });
    }
    function shotAt(t) { for (let i = SC.shots.length - 1; i >= 0; i--) if (t >= SC.shots[i].start) return i; return 0; }
    function fire(c) {
      if (c.kind === 'do') {
        const [, who, what, ...arg] = c.d;
        if (who === 'snd') { if (!E.snd) return; if (what === 'quiet') E.snd.setQuiet(!!arg[0]); else if (what === 'hush') E.snd.hush(arg[0]); else if (what === 'wind') E.snd.setWind(arg[0]); return; }
        const a = E.actors[who]; if (!a) return;
        if (what === 'walk') { a.path = arg[0].map((p) => p.slice()); if (arg[1]) a.speed = arg[1]; a.face = null; }
        else if (what === 'stop') a.path = null;
        else if (what === 'face') { a.face = arg[0]; a.faceRate = arg[1] || 3; }
        else if (what === 'play') { if (arg[1] === false) a.dash = false; else a.dash = true; a.m.play(arg[0], true); }
        else if (what === 'guard') a.m.guard(!!arg[0]);
        else if (what === 'state') a.ramps = a.ramps.filter((r) => r.key !== arg[0]).concat([{ key: arg[0], keys: arg[1], t0: c.at }]);
        else if (a.K.cue) a.K.cue(a, what, arg, E);
      } else if (c.kind === 'sound') {
        const [, kind, id, g, o] = c.x;
        if (kind === 'night') { if (E.snd) E.snd.night(id, Object.assign({ gain: g === undefined ? 1 : g }, o || {})); }
        else if (kind === 'sfx') sfxAt(id, g, o && o.at ? resolve(o.at, _s2) : null);
        else if (kind === 'creature') { const a = E.actors[o && o.who || Object.keys(E.actors).find((k) => E.actors[k].kind === 'creature')]; if (a) creatureSound(a, id, g); }
      }
    }
    function filmStep(dt) {
      const prev = film.t; film.t = Math.min(SC.total, prev + dt);
      for (const c of CUES) if (c.at > film.fired && c.at <= film.t) fire(c);
      film.fired = film.t;
      if (film.t >= SC.total - 1e-6) finish('done');
    }

    // ---------- the camera ----------
    const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m4 = new THREE.Matrix4();
    let focusD = 12;
    function relPoint(id, p, out) {
      const a = E.actors[id], c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      return out.set(a.x + p[0] * c + p[2] * s, E.world.heightAt(a.x, a.z) + p[1], a.z - p[0] * s + p[2] * c);
    }
    // a point: [x, y, z]; 'moon' (far off toward it); 'actor.part' (one of its anchors: head, chest, bud, heart, ...);
    // ['actor.part', dx, dy, dz] a little way off one; 'actor' alone is its chest
    function resolve(p, out) {
      if (Array.isArray(p) && typeof p[0] === 'string') return resolve(p[0], out).add(_d.set(p[1] || 0, p[2] || 0, p[3] || 0));
      if (Array.isArray(p)) return out.fromArray(p);
      if (p === 'moon') return out.copy(E.world.moonDir).multiplyScalar(900).add(E.camera.position);
      if (typeof p === 'string') {
        const [who, part] = p.split('.'), a = E.actors[who];
        if (a) { if (a.K.anchor && a.K.anchor(a, part, out)) return out; return a.m.anchor(part || 'chest', out); }
      }
      return out.set(0, 1.2, 0);
    }
    // where a shot's camera stands and what it looks at, at its eased moment e. A camera point given by an anchor is
    // taken where it is when the shot begins, and stays there
    const plain = (p) => Array.isArray(p) && p.length === 3 && typeof p[0] === 'number';
    function fixed(c, key, p, out) { if (plain(p)) return out.fromArray(p); if (!c[key]) c[key] = resolve(p, V3()); return out.copy(c[key]); }
    function camPose(c, e, pos, look) {
      if (c.orbit) {
        const o = c.orbit, an = lerp(o.a0, o.a1, e); resolve(o.c, look);
        pos.set(look.x + Math.sin(an) * o.r, look.y + o.h, look.z + Math.cos(an) * o.r);
        if (c.at) resolve(c.at, look);
        return;
      }
      if (c.rel) { relPoint(c.rel, c.from, pos); relPoint(c.rel, c.to || c.from, _a); pos.lerp(_a, e); }
      else { fixed(c, '_from', c.from, pos); if (c.to) pos.lerp(fixed(c, '_to', c.to, _a), e); }
      resolve(c.at, look); if (c.at2) look.lerp(resolve(c.at2, _c), e);
    }
    const BAT = { pos: V3(), look: V3(), fov: 12, view: null };
    const LENS = { cam: new THREE.PerspectiveCamera(), q: new THREE.Quaternion(), win: [0, 0, 0, 0] };
    function cameraStep(realT, cut, dt) {
      const s = SC.shots[film.shot], c = s.cam, cam = E.camera, st = film.t - s.start;
      if (cut) { delete c._from; delete c._to; }
      const e = (EASE[c.ease] || EASE.io)(cl(st / s.d, 0, 1));
      let fov = c.fov ? lerp(c.fov[0], c.fov[1], e) : 34, exact = false, lens = false;
      if (c.battle && SC.battle.arena) {
        // an arena's camera and framing (arenaFrame), reached by the end of the shot: from where the shot starts, the
        // camera moves to the arena's eye-height camera and turns to its heading while its lens's window slides and
        // narrows from the shot's own onto the battle's crop of the arena's frame; for its last moments it is exactly the
        // battle's
        arenaFrame(SC.battle);
        const b = cl((st - (c.glide ? c.glide[0] : 0)) / ((c.glide ? c.glide[1] : s.d) - (c.glide ? c.glide[0] : 0)), 0, 1), k = (EASE[c.ease] || EASE.soft)(b);
        const t0 = Math.tan((c.fov ? c.fov[0] : fov) * Math.PI / 360), a = E.view.w / E.view.h, W = BAT.win;
        if (c.from) {
          camPose(c, 0, cam.position, _b); LENS.cam.position.copy(cam.position); LENS.cam.up.set(0, 1, 0); LENS.cam.lookAt(_b);
          cam.position.lerp(BAT.full.pos, k); LENS.q.copy(LENS.cam.quaternion).slerp(BAT.full.quat, k);
          LENS.win = [lerp(-a * t0, W[0], k), lerp(a * t0, W[1], k), lerp(-t0, W[2], k), lerp(t0, W[3], k)];
        } else { cam.position.copy(BAT.full.pos); LENS.q.copy(BAT.full.quat); LENS.win = W.slice(); _b.set(0, 0, -30).applyQuaternion(LENS.q).add(cam.position); }
        exact = b >= 1; lens = true;
      } else if (c.battle) {
        // the battle's own camera and framing (battle.js), reached by the end of the shot: from where the shot starts,
        // the camera glides onto the battle's line of sight and lens; for its last moments it is exactly the battle's
        battleFrame(SC.battle);
        const b = cl((st - (c.glide ? c.glide[0] : 0)) / ((c.glide ? c.glide[1] : s.d) - (c.glide ? c.glide[0] : 0)), 0, 1), k = (EASE[c.ease] || EASE.soft)(b);
        if (c.from) { camPose(c, 0, cam.position, _b); cam.position.lerp(BAT.pos, k); _b.lerp(BAT.look, k); fov = lerp(c.fov ? c.fov[0] : fov, BAT.fov, k); }
        else { cam.position.copy(BAT.pos); _b.copy(BAT.look); fov = BAT.fov; }
        exact = b >= 1;
      } else camPose(c, e, cam.position, _b);
      if (!c.free) { const gy = E.world.heightAt(cam.position.x, cam.position.z) + .08; if (cam.position.y < gy) cam.position.y = gy; }
      if (cam.view && cam.view.enabled) cam.clearViewOffset();
      if (lens && exact) {
        // the battle's camera exactly, in an arena: the arena's lens and its crop of the arena's frame
        const B = SC.battle;
        cam.position.copy(BAT.full.pos); cam.quaternion.copy(BAT.full.quat);
        cam.fov = B.camera.fov; cam.aspect = B.width / B.height; cam.setViewOffset(B.width * BAT.view.s, B.height * BAT.view.s, BAT.view.ox, BAT.view.oy, E.view.w, E.view.h); cam.updateProjectionMatrix();
      } else if (lens) {
        cam.quaternion.copy(LENS.q);
        const hk = (c.shake || 0) * (1 - sm(0, 1, st / s.d));
        if (hk > 0) { const t = realT; _e.set((Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .3 + Math.sin(t * 5.1) * .1) * hk * .012, (Math.sin(t * .7 + 2) * .6 + Math.sin(t * 1.9) * .4) * hk * .014, Math.sin(t * .5 + 3) * hk * .006); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
        lensWindow(cam, LENS.win);
      } else if (exact) {
        // the battle's camera exactly: its 12 degree lens and its crop of the painting's frame
        const B = SC.battle, A = B.width / B.height;
        cam.position.copy(BAT.full.pos); cam.up.set(0, 1, 0); cam.lookAt(BAT.full.look);
        cam.fov = B.fov; cam.aspect = A; cam.setViewOffset(B.width * BAT.view.s, B.height * BAT.view.s, BAT.view.ox, BAT.view.oy, E.view.w, E.view.h); cam.updateProjectionMatrix();
      } else {
        cam.up.set(0, 1, 0); cam.lookAt(_b);
        if (c.roll) { _e.set(0, 0, lerp(c.roll[0], c.roll[1], e)); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
        const hk = (c.shake || 0) * (c.battle ? 1 - sm(0, 1, st / s.d) : 1);
        if (hk > 0) { const t = realT; _e.set((Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .3 + Math.sin(t * 5.1) * .1) * hk * .012, (Math.sin(t * .7 + 2) * .6 + Math.sin(t * 1.9) * .4) * hk * .014, Math.sin(t * .5 + 3) * hk * .006); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
        // a shot's lens is for the picture inside the letterbox, so it widens behind the bars, and a screen held upright
        // sees less of the width, so it widens to keep the subject (not for the battle's own framing, which crops its
        // frame for any screen)
        const aspect = E.view.w / E.view.h, k = c.battle ? 1 : Math.sqrt(Math.max(1, (16 / 9) / aspect)) / Math.max(.5, 1 - 2 * barsAt(s, st));
        cam.aspect = aspect; cam.fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * k) * 180 / Math.PI; cam.updateProjectionMatrix();
      }
      // impacts: a quick tremor that dies away
      shake.k = Math.max(0, shake.k - dt * 1.6); shake.t += dt;
      if (shake.k > .001 && !exact) { const k = shake.k * shake.k * .028, t = shake.t * 38; _e.set(Math.sin(t * 1.3) * k, Math.sin(t * 1.7 + 1) * k, Math.sin(t * .9 + 2) * k * .5); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
      cam.updateMatrixWorld();
      // focus: pulled to its mark, smoothly within a shot, at once on a cut
      // (focus may be keys, [[t, mark], ...]: it is pulled from one mark to the next at those moments)
      let fm = s.focus; if (Array.isArray(fm) && Array.isArray(fm[0])) { let f = fm[0][1]; for (const [t, x] of fm) if (st >= t) f = x; fm = f; }
      const fd = typeof fm === 'number' ? fm : cam.position.distanceTo(resolve(fm || c.at || [0, 1, 0], _c));
      focusD = cut ? fd : focusD + (fd - focusD) * (1 - Math.exp(-dt * 6));
      const P = E.cine.params;
      P.focus = focusD; P.aperture = Array.isArray(s.ap) ? keyed(s.ap, st, .5) : (s.ap === undefined ? .5 : s.ap); P.exposure = Array.isArray(s.exp) ? keyed(s.exp, st, 1.4) : (s.exp || 1.4);
      P.fade = s.fade ? keyed(s.fade, st, 1) : 1;
      if (film.mode === 'idle') P.fade *= .55;
      // letterbox: a 2.39 to 1 frame while it plays (none on a screen held upright); the bars open out as it hands over
      P.bars = barsAt(s, st);
      cap.style.bottom = Math.max(12, P.bars * E.view.h * .5 - 14) + 'px';
      // the shadow covers what the shot looks at
      if (E.world.shadowAt) { const f = s.shadow ? resolve(s.shadow, _c) : _c.copy(_b); E.world.shadowAt(f.x, f.z); }
    }
    function barsAt(s, st) {
      const asp = E.view.w / E.view.h, full = asp >= 1.2 ? cl((1 - asp / 2.39) / 2, 0, .13) : 0;
      return full * (s.bars !== undefined ? (Array.isArray(s.bars) ? keyed(s.bars, st, 1) : s.bars) : 1);
    }
    function shakeBy(k, at) { const d = E.camera.position.distanceTo(at || E.camera.position); shake.k = Math.max(shake.k, k * cl(16 / Math.max(d, 1), .3, 1.2)); shake.t = 0; }
    const shake = { k: 0, t: 0 };

    // ---------- the battle's framing: its painting camera, and the crop its field shot takes for this screen ----------
    // The battle screen (src/battle/screen.js) looks at the ground through a camera matched to its painting: a long lens
    // (fov), pitched down (pitch), at the distance that makes ppm painting pixels a meter. Its opening shot of a fight
    // (shotField) crops that frame round everyone standing, heads and a sprawling foe's width included, for the screen it
    // is on. SC.battle gives the painting's numbers, where the battle's origin is in the place (at), and who stands where.
    function battleFrame(B) {
      if (BAT.key === E.view.w + 'x' + E.view.h) return;
      BAT.key = E.view.w + 'x' + E.view.h;
      const IW = B.width, IH = B.height, A = IW / IH, PITCH = B.pitch * Math.PI / 180, DIST = (IH / 2) / (B.ppm * Math.tan(B.fov / 2 * Math.PI / 180));
      const o = B.at || [0, 0, 0];
      const full = new THREE.PerspectiveCamera(B.fov, A, DIST * .6, DIST * 1.6);
      full.position.set(o[0], o[1] + DIST * Math.sin(PITCH), o[2] + DIST * Math.cos(PITCH)); full.lookAt(o[0], o[1], o[2]); full.updateMatrixWorld(); full.updateProjectionMatrix();
      const toPx = (x, y, z) => { _a.set(x, y, z).project(full); return [(_a.x + 1) / 2 * IW, (1 - _a.y) / 2 * IH]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const f of B.field) {
        const pts = [[f.x, 0, f.z], [f.x, f.tall, f.z]]; if (f.halfW) pts.push([f.x + f.halfW, 0, f.z], [f.x - f.halfW, 0, f.z]);
        for (const p of pts) { const q = toPx(p[0] + o[0], p[1] + o[1], p[2] + o[2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      }
      const w = E.view.w, h = E.view.h, availH = Math.max(120, h - 40);
      const s = Math.min((w - 16) / (x1 - x0 + 120), availH / (y1 - y0 + 70)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const S2 = Math.max(Math.max(w / IW, h / IH), s), midY = h / 2 + 20;
      let ox = cx * S2 - w / 2, oy = cy * S2 - midY; ox = cl(ox, 0, IW * S2 - w); oy = cl(oy, 0, IH * S2 - h);
      BAT.view = { s: S2, ox, oy };
      BAT.full = { pos: full.position.clone(), look: V3(o[0], o[1], o[2]) };
      // the same picture through an ordinary lens: the ray through the crop's middle, and the crop's height as its angle
      const u = (ox + w / 2) / S2, v = (oy + h / 2) / S2, ndc = new THREE.Vector2(u / IW * 2 - 1, 1 - v / IH * 2);
      const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, full);
      BAT.pos.copy(full.position); BAT.look.copy(full.position).addScaledVector(ray.ray.direction, DIST);
      BAT.fov = 2 * Math.atan((h / S2) / IH * Math.tan(B.fov / 2 * Math.PI / 180)) * 180 / Math.PI;
    }

    // ---------- an arena's framing (the new battles): its locked camera, and the crop its opening shot takes ----------
    // When the game says the fight is in its arena (opts.arena: the scene then gives SC.battle.arena), the battle looks
    // through the arena's locked camera (src/fx/arena.js): at eye height on flat ground, with its own lens and a frame the
    // painting's size, everyone placed in metres. Its opening shot crops that frame round everyone as the battle screen
    // does in an arena (src/battle/screen.js: shotField, shotFit, applyCam, before the menu shows): the flat paintings'
    // margins scaled by ZK (the place's frame pixels a metre over 54, and a fifth more), a giant whose head won't fit going
    // out of the top rather than everyone's feet out of the bottom, the zoom never past half as big again as the widest
    // (ZMAX), and the crop allowed down past the frame's bottom edge (BELOW). SC.battle gives the arena's camera, frame
    // and ppm, everyone in the arena's metres (field), and where the arena's origin is in the place and how it is turned
    // there (at, turn).
    function arenaFrame(B) {
      if (BAT.key === E.view.w + 'x' + E.view.h) return;
      BAT.key = E.view.w + 'x' + E.view.h;
      const IW = B.width, IH = B.height, CA = B.camera, ZK = B.ppm / 54 * 1.2, ZMAX = 1.5, BELOW = Math.round(IH * .14);
      const full = new THREE.PerspectiveCamera(CA.fov, IW / IH, .1, 900);
      full.position.set(CA.x || 0, CA.h, CA.z); full.lookAt(CA.x || 0, CA.h + Math.tan(CA.pitch * Math.PI / 180) * 100, CA.z - 100); full.updateMatrixWorld(); full.updateProjectionMatrix();
      const toPx = (x, y, z) => { _a.set(x, y, z).project(full); return [(_a.x + 1) / 2 * IW, (1 - _a.y) / 2 * IH]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const f of B.field) {
        const pts = [[f.x, 0, f.z], [f.x, f.tall, f.z]]; if (f.halfW) pts.push([f.x + f.halfW, 0, f.z], [f.x - f.halfW, 0, f.z]);
        for (const p of pts) { const q = toPx(p[0], p[1], p[2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      }
      const w = E.view.w, h = E.view.h, availH = Math.max(120, h - 40), sMin = Math.max(w / IW, h / IH);
      const S2 = Math.min(Math.max(Math.min((w - 16) / (x1 - x0 + 120 * ZK), availH / (y1 - y0 + 70 * ZK)), sMin), sMin * ZMAX);
      const cy = (y1 - y0 + 70 * ZK) * S2 > availH ? y1 + 20 * ZK - availH / 2 / S2 : (y0 + y1) / 2, DPR = Math.min(window.devicePixelRatio || 1, 2);
      let ox = (x0 + x1) / 2 * S2 - w / 2, oy = cy * S2 - (h / 2 + 20);
      ox = cl(ox, 0, IW * S2 - w); oy = cl(oy, 0, IH * S2 - h + BELOW * S2);
      ox = Math.round(ox * DPR) / DPR; oy = Math.round(oy * DPR) / DPR;
      BAT.view = { s: S2, ox, oy };
      // the same camera in the place, and its crop as a window of its lens (tangents of the angles off its heading:
      // left, right, bottom, top)
      const turn = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), B.turn || 0);
      BAT.full = { pos: full.position.clone().applyQuaternion(turn).add(V3(B.at[0], B.at[1], B.at[2])), quat: turn.multiply(full.quaternion) };
      const ty = Math.tan(CA.fov * Math.PI / 360), tx = ty * IW / IH, l = tx * (2 * ox / (IW * S2) - 1), t = ty * (1 - 2 * oy / (IH * S2));
      BAT.win = [l, l + 2 * tx * w / (IW * S2), t - 2 * ty * h / (IH * S2), t];
    }
    // a lens that shows the window [left, right, bottom, top] of tangents round the camera's heading, at the screen's
    // shape: an off-centre crop of a wider lens, as a battle's shot is of its frame
    function lensWindow(cam, W) {
      const tx = Math.max(Math.abs(W[0]), Math.abs(W[1])), ty = Math.max(Math.abs(W[2]), Math.abs(W[3])), fh = E.view.h * 2 * ty / (W[3] - W[2]), fw = fh * tx / ty;
      cam.fov = Math.atan(ty) * 360 / Math.PI; cam.aspect = tx / ty;
      cam.setViewOffset(fw, fh, (W[0] + tx) / (2 * tx) * fw, (ty - W[3]) / (2 * ty) * fh, E.view.w, E.view.h); cam.updateProjectionMatrix();
    }

    // ---------- the words: narration in a lower third ----------
    let shown = null;
    function wordsStep() {
      let n = null; if (film.mode === 'play') for (const L of LINES) if (film.t >= L.a0 && film.t < L.a1) n = L;
      showWords(n);
    }
    function showWords(n) { if (n === shown) return; shown = n; if (n) words.textContent = n.text; cap.classList.toggle('on', !!n); }

    // ---------- how fast this screen draws it ----------
    const fps = { frames: 0, time: 0, worst: 99, win: [], slow: 0 };
    function fpsStep(dt) {
      if (film.mode !== 'play' || TEST) return;
      fps.frames++; fps.time += dt;
      fps.win.push(dt); let s = 0; for (const x of fps.win) s += x; while (s > 1 && fps.win.length > 1) s -= fps.win.shift();
      if (fps.time > 3 && s >= .98) fps.worst = Math.min(fps.worst, fps.win.length / s);
      keepUp(s);
    }
    // if this screen falls well behind (under about 25 frames a second for two seconds), the picture is drawn a little
    // less sharp, a step at a time, down to the detail's floor; the end card says so
    function keepUp(s) {
      if (s < .98 || !E || !E.cine) return;
      const f = fps.win.length / s, want = QP.cap ? QP.cap * .84 : 40;
      fps.low = f < want ? (fps.low || 0) + fps.win[fps.win.length - 1] : 0;
      if (fps.low > 2 && E.scale > QP.floor + 1e-3 && fps.time - (fps.stepAt || 0) > 3) {
        E.scale = Math.max(QP.floor, E.scale * .86); E.cine.params.scale = E.scale; fps.stepAt = fps.time; fps.low = 0; fps.win = [];
      }
    }

    // ---------- each frame ----------
    function frame(realDt, autoAll, noDraw) {
      E.renderer.info.reset();
      const dt = Math.min(realDt, 1 / 10);
      if (film.mode === 'play') filmStep(dt);
      if (!E) return; // it finished during this step
      const si = shotAt(film.t), cut = si !== film.shot; film.shot = si;
      const s = SC.shots[si], st = film.t - s.start;
      clock.slow = s.slow ? keyed(s.slow, st, 1) : 1;
      const sdt = dt * clock.slow; clock.sim += sdt;
      for (const a of E.list) {
        const p0 = a.phase; actorStep(a, clock.sim, dt, sdt);
        if (a.kind === 'creature') watchCreature(a, sdt); else { stepSounds(a, p0); breathStep(a, sdt); }
      }
      if (E.breath) { E.breath.step(sdt, SC.place && SC.place.wind || { x: .6, z: .2 }); E.breath.mat.uniforms.uScale.value = E.cine.size.h * .5 || 300; }
      cameraStep(film.t, cut, dt);
      // (the place draws its lake's reflection here, so only for a frame that is drawn)
      if (!noDraw) E.world.update(clock.sim, sdt, E.camera);
      if (E.snd) { if (!(film.mode === 'idle')) E.snd.tick(dt); }
      wordsStep();
      if (!noDraw) E.cine.render(E.world.scene, E.camera, dt);
    }
    // the frame clock: every refresh, or every other on a phone (30 a second: steady, and it spares the phone)
    const loop = {
      last: 0, due: 0, on: false,
      start() { if (this.on) return; this.on = true; this.last = 0; raf = requestAnimationFrame(this.tick); },
      tick: (now) => {
        if (!E || !loop.on) return;
        raf = requestAnimationFrame(loop.tick);
        if (QP.cap && loop.last && now - loop.last < 1000 / QP.cap - 4) return;
        const raw = loop.last ? (now - loop.last) / 1000 : 1 / 60; loop.last = now;
        frame(Math.min(.1, raw));
        if (E) fpsStep(Math.min(raw, 2));
      }
    };

    // ---------- the start and the end ----------
    function start() {
      if (settle) return settle.p;
      settle = {}; settle.p = new Promise((res) => { settle.res = res; });
      ready.then(() => {
        if (gone) return;
        if (E.snd) { E.snd.init(); E.snd.setMuted(false); }
        if (opts.skip !== false) skipB.hidden = false;
        if (opts.soundButton && E.snd) sndB.hidden = false;
        canvas.style.visibility = '';
        restart(); film.mode = 'play';
        // (opts.from: start that many seconds in, the film before it run through without drawing; for checking the end)
        if (opts.from > 0) while (film.t < opts.from - 1e-6 && film.mode === 'play') frame(Math.min(1 / 30, opts.from - film.t), true, true);
        if (!TEST) loop.start();
      }, () => settle.res('skipped'));
      return settle.p;
    }
    on(skipB, 'click', (e) => { e.stopPropagation(); if (film.mode === 'play') finish('skipped'); });
    on(sndB, 'click', (e) => { e.stopPropagation(); if (!E || !E.snd) return; const m = !E.snd.muted; E.snd.setMuted(m); sndB.textContent = m ? 'Sound off' : 'Sound on'; sndB.setAttribute('aria-pressed', String(!m)); });
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && film.mode === 'play' && opts.skip !== false) finish('skipped'); });
    // the hand-over, also when skipped: everyone where the battle stands them, and its framing, so the battle can take
    // over from the same picture either way
    function toHandover() {
      const H = SC.handover || {};
      for (const a of E.list) {
        const h = H[a.id]; if (!h) continue;
        a.path = null; a.face = null; a.walk = 0; a.ramps = [];
        if (h.at) { a.x = h.at[0]; a.z = h.at[1]; } if (h.yaw !== undefined) a.yaw = h.yaw;
        if (a.m.reset) a.m.reset();
        if (h.state) Object.assign(a.m.state, h.state);
        if (h.guard) a.m.guard(true);
        if (a.K.pose && h.pose) a.K.pose(a, h.pose, E);
      }
      for (const a of E.list) { const h = H[a.id]; if (h && h.target && a.K.cue) a.K.cue(a, 'target', [h.target], E); }
      film.t = SC.total - 1e-3; film.shot = SC.shots.length - 1;
      for (let i = 0; i < 45; i++) { clock.sim += 1 / 30; for (const a of E.list) actorStep(a, clock.sim, 1 / 30, 1 / 30); }
      if (E.breath) E.breath.clear();
    }
    function finish(why) {
      if (result || !E) return; result = why; film.mode = 'end';
      if (why === 'skipped') toHandover();
      showWords(null); skipB.hidden = true; sndB.hidden = true;
      // the last picture: the battle's framing, kept as a still for the cross-fade
      let still = null;
      try {
        frame(1 / 30, false, false);
        if (opts.still !== false && !TEST) {
          still = document.createElement('canvas'); still.className = 'envoi-cs-still'; still.width = canvas.width; still.height = canvas.height;
          still.getContext('2d').drawImage(canvas, 0, 0);
        }
      } catch (e) { still = null; }
      const f = fps.time > 2 ? Math.round(fps.frames / fps.time) : 0, r = E.renderer.info.render;
      api.last = { result: why, fps: f, worst: fps.worst < 99 ? Math.round(fps.worst) : 0, quality: qn, qualityName: QP.name, seconds: Math.round(fps.time), triangles: r.triangles, calls: r.calls, built: Object.assign({}, E.ms), sharpness: Math.round(E.scale / QP.scale * 100) };
      if (TEST) { if (settle) settle.res(why); return; }
      if (still) container.appendChild(still);
      dispose();
      if (settle) settle.res(why);
    }
    // everything goes: the scene's geometry, materials and textures, the film camera's pictures, the sound, the WebGL
    // context itself, and the box; three.js's fog chunks go back as they were
    function dispose() {
      if (gone) return; gone = true; loop.on = false; cancelAnimationFrame(raf);
      for (const [el, ev, fn, o] of listeners) el.removeEventListener(ev, fn, o);
      if (E) {
        try { if (E.snd && E.snd.close) E.snd.close(); } catch (e) { /* already closed */ }
        const seen = new Set(), freeTex = (t) => { if (t && t.isTexture && !seen.has(t)) { seen.add(t); t.dispose(); } };
        const freeMat = (m) => {
          if (!m || seen.has(m)) return; seen.add(m);
          for (const k in m) { const v = m[k]; if (v && v.isTexture) freeTex(v); }
          if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) freeTex(v); else if (Array.isArray(v)) v.forEach(freeTex); }
          m.dispose();
        };
        if (E.world && E.world.scene) {
          E.world.scene.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(freeMat);
            if (o.customDepthMaterial) freeMat(o.customDepthMaterial); if (o.customDistanceMaterial) freeMat(o.customDistanceMaterial);
            if (o.isSkinnedMesh && o.skeleton && o.skeleton.boneTexture) o.skeleton.boneTexture.dispose();
            if (o.shadow && o.shadow.map) o.shadow.map.dispose();
          });
          freeTex(E.world.scene.environment); freeTex(E.world.scene.background);
          if (E.world.dispose) E.world.dispose();
        }
        if (E.cine && E.cine.dispose) E.cine.dispose();
        if (E.renderer) { E.renderer.dispose(); try { E.renderer.forceContextLoss(); } catch (e) { /* no extension */ } }
      }
      for (const k of CHUNKS) THREE.ShaderChunk[k] = saved[k];
      if (box.parentNode) box.parentNode.removeChild(box);
      E = null;
    }
    function cancel() { if (!result) { result = 'skipped'; dispose(); if (settle) settle.res('skipped'); } }

    // ---------- test hooks (headless pictures) ----------
    const test = TEST ? {
      get E() { return E; }, film, scene: SC, quality: qn,
      // play from the start up to t without drawing, then draw n frames
      at(t, n) { restart(); film.mode = 'play'; canvas.style.visibility = ''; while (film.t < t - 1e-6 && film.mode === 'play') frame(Math.min(1 / 30, t - film.t), true, true); return this.step(n || 1); },
      step(n, dt) { for (let i = 0; i < (n || 1); i++) { frame(dt || 1 / 30); syncGL(); } const r = E.renderer.info.render; return { t: +film.t.toFixed(2), shot: SC.shots[film.shot].id, calls: r.calls, tris: r.triangles }; },
      handover() { restart(); film.mode = 'play'; canvas.style.visibility = ''; toHandover(); return this.step(2); },
      end() { result = null; film.mode = 'play'; finish('skipped'); return api.last; },
      stats: () => ({ placeMs: Math.round(E.ms.place), castMs: Math.round(E.ms.cast), compileMs: Math.round(E.ms.compile), quality: qn, cast: E.list.map((a) => [a.id, a.tris || triCount(a.m)]) })
    } : null;
    // waits until the drawing is really done (reading back one pixel), so a headless timing measures the drawing itself
    const px1 = new Uint8Array(4);
    function syncGL() { const gl = E.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); } // (the film camera's last pass draws to the screen)
    function triCount(m) { let n = 0; m.root.traverse((o) => { if (o.isMesh) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(n); }
    const handle = { ready, start, cancel, test, stats: () => api.last, get canvas() { return canvas; } };
    return handle;
  }
  function play(container, opts) { const h = prepare(container, opts); return h.ready.then(() => h.start(), () => 'skipped'); }
  const api = { id: def.id, title: def.title, seconds: timeline(def.scene()).total, play, prepare, last: null, E: null };
  return api;
}
