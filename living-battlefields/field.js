// field.js: a living battlefield seen through one locked camera: the wild meadow at night, for a fight. three.js r128
// (global THREE). Defines makeLivingField(opts) only.
//
// The camera never moves. A shot is a crop or a zoom of its frame, as the battle screen's shots are of its painting, so
// nothing outside the frame is ever made, and the field comes in two parts:
// - the painting: everything far off (the night sky, the moon and the stars, mountains, the forest round the meadow, the
//   ground and the far grass) is drawn once, when the page opens, into one picture the size of the frame. It can be as
//   detailed as the phone can draw once, because afterwards it costs one flat picture a frame. Its shader brings it to
//   life where a picture can live: clouds drift over the moon and a storm rolls in over the sky, lightning lights it, gusts
//   and shockwaves sweep the far grass, the ground darkens in the rain and its puddles ripple, blows crack and scorch it,
//   and a fire or a spell lights the ground round it;
// - the live layer: what is in the frame and near enough to move: the grass in front of the forest (made only where the
//   camera sees it, and drawn nearest first so that hidden grass costs little), trees that frame the shot, mist,
//   fireflies, leaves, dust, turf and rocks thrown up, rain, lightning, birds.
// opts: { camera: { pos, target, fov } (the locked camera; its aspect is the frame's), frame: [w, h] (the painting's size
//   in pixels; 2048 x 1536), live (how far from the camera the grass still moves, in metres; 40), clear (the radius of the
//   trampled clearing round the middle; 11), seed }
// Returns { root, camera (the locked camera: clone it to render, with setViewOffset for shots), bake(renderer), baked,
//   update(t, dt), impact(x, z, s), roar(s), vortex(x, z, r, s), decal(kind, x, z, r, o), glow(i, x, y, z, r, color,
//   intensity), strike(x, z) (lightning into the ground), setWeather('clear' | 'rain' | 'storm'), weather, setWrath(0 to 1),
//   light (what the scene's hemisphere and moonlight should be), flash, onThunder, stats, painting() (the painting as a
//   canvas), setDebug(on) (tints what is painted blue and what is live as it is) }.
function makeLivingField(opts) {
  'use strict';
  opts = opts || {};
  const TAU = Math.PI * 2, PI = Math.PI;
  let seed = opts.seed || 610091;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0), V4 = () => new THREE.Vector4(0, 0, 0, 0), COL = (h) => new THREE.Color(h);
  const rgb = (r, g, b, a) => 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (a === undefined ? 1 : a) + ')';
  const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
  // mipmaps that keep their cover: each smaller level is drawn from the one before with its alpha raised, so grass and
  // leaves seen from far off stay full instead of thinning away (from the wild meadow)
  const fullMips = (c) => {
    const t = tex(c), m = [c]; let p = c;
    while (p.width > 1 || p.height > 1) {
      const q = cvs(Math.max(1, p.width >> 1), Math.max(1, p.height >> 1)), g = q.getContext('2d'); g.drawImage(p, 0, 0, q.width, q.height);
      const d = g.getImageData(0, 0, q.width, q.height), a = d.data; for (let i = 3; i < a.length; i += 4) a[i] = Math.min(255, a[i] * 1.3);
      g.putImageData(d, 0, 0); m.push(q); p = q;
    }
    t.mipmaps = m; t.generateMipmaps = false; return t;
  };
  const root = new THREE.Group(); root.name = 'LivingField';
  const STATS = { paintTufts: 0, liveTufts: 0, paintMs: 0, paintTrees: 0 };

  // ---------- the locked camera and its frame ----------
  const FRAME = opts.frame || [2048, 1536], FW = FRAME[0], FH = FRAME[1];
  const CAMP = Object.assign({ pos: [2.5, 2.4, 21.5], target: [-.5, 4, 0], fov: 38 }, opts.camera || {});
  const cam = new THREE.PerspectiveCamera(CAMP.fov, FW / FH, .1, 900);
  cam.position.set(CAMP.pos[0], CAMP.pos[1], CAMP.pos[2]); cam.lookAt(CAMP.target[0], CAMP.target[1], CAMP.target[2]);
  cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const CP = cam.position.clone(), FWD = cam.getWorldDirection(V3());
  const DLIVE = opts.live || 40, CLEAR = opts.clear || 11;
  const _p = V3(), _q = V3(), _r = V3();
  // the ray through a point of the frame (u across, v down, 0 to 1)
  const rayAt = (u, v, out) => out.set(u * 2 - 1, 1 - v * 2, .5).unproject(cam).sub(CP).normalize();
  // whether a thing standing at (x, z), h tall, shows in the frame (m: a margin, in halves of the frame)
  function shows(x, z, h, m) {
    m = m || 0;
    for (const f of [0, .5, 1]) { _p.set(x, h * f, z).project(cam); if (_p.z < 1 && _p.z > -1 && Math.abs(_p.x) <= 1 + m && Math.abs(_p.y) <= 1 + m) return true; }
    return false;
  }
  const dCam = (x, z) => Math.hypot(x - CP.x, z - CP.z);
  // a box round the ground the frame sees, out to a distance, to scatter things in
  function groundBox(dMax, m) {
    let x0 = CP.x, x1 = CP.x, z0 = CP.z, z1 = CP.z;
    for (let i = 0; i <= 32; i++) for (let j = 0; j <= 32; j++) {
      rayAt(-m + (1 + 2 * m) * i / 32, -m + (1 + 2 * m) * j / 32, _q);
      const t = _q.y < -1e-4 ? Math.min(dMax, -CP.y / _q.y) : dMax, x = CP.x + _q.x * t, z = CP.z + _q.z * t;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    return [x0, x1, z0, z1];
  }
  // where the moon hangs in the frame (up and to the left, over the forest), and the light it gives: from its side, a
  // little higher, as the battle's moonlight comes from behind and to the left
  const MOOND = rayAt(.31, .17, V3());
  const MOONL = V3(MOOND.x, 0, MOOND.z).normalize().multiplyScalar(Math.cos(.62)).setY(Math.sin(.62)).normalize();

  // ---------- the air: one wind for everything, shockwaves (x, z, radius, strength) and a whirlwind (from the meadow) ----------
  const AIRU = {
    uT: { value: 0 }, uWind: { value: new THREE.Vector4(.83, .55, .4, .7) }, uFlow: { value: V4() }, uRings: { value: [V4(), V4(), V4(), V4()] }, uVortex: { value: new THREE.Vector4(0, 0, 9, 0) },
    uWet: { value: 0 }, uShake: { value: [0, 0, 0, 0, 0, 0] },
  };
  const AIR = [
    'uniform float uT; uniform vec4 uWind; uniform vec4 uFlow; uniform vec4 uRings[4]; uniform vec4 uVortex;',
    'float mh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float mn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(mh(i), mh(i + vec2(1., 0.)), f.x), mix(mh(i + vec2(0., 1.)), mh(i + vec2(1., 1.)), f.x), f.y); }',
    'float mf(vec2 p){ return mn(p) * .55 + mn(p * 2.03 + 7.1) * .3 + mn(p * 4.01 + 3.3) * .15; }',
    'float gustAt(vec2 p){ vec2 d = uWind.xy; float a = dot(p, d), c = dot(p, vec2(-d.y, d.x)); return smoothstep(.38, .82, mf(vec2(a * .06 - uFlow.z, c * .045))) * uWind.w; }',
    'vec2 windAt(vec2 p){ vec2 d = uWind.xy; float a = dot(p, d), c = dot(p, vec2(-d.y, d.x));',
    ' return d * (uWind.z * (.22 + 1.3 * gustAt(p)) + .05 * sin(uT * 1.9 + a * .35 + c * .2)); }',
    'vec2 pushAt(vec2 p){ vec2 o = vec2(0.);',
    ' for (int i = 0; i < 4; i++) { vec4 R = uRings[i]; if (R.w > .002) { vec2 v = p - R.xy; float d = length(v) + .001;',
    '  o += v / d * R.w * (exp(-pow((d - R.z) / 1.8, 2.)) * 2.2 + .5 * step(d, R.z) * smoothstep(0., 4., R.z - d) * exp(-(R.z - d) * .25)); } }',
    ' vec2 v = p - uVortex.xy; float d = length(v) + .001;',
    ' o += (vec2(-v.y, v.x) * 1.6 + v * .3) / d * uVortex.w * smoothstep(uVortex.z * 1.6, uVortex.z * .5, d) * smoothstep(.5, 3., d);',
    ' return o; }'].join('\n');
  const NOISE2 = AIR.split('\n').slice(1, 4).join('\n') + '\n';
  // the clouds' shadows on the ground, drifting with the wind (the same waves as the clouds over the moon, cloudAt below)
  const CSH = 'float cshade(vec2 p){ vec2 q = (p - uFlow.xy) * .05; return smoothstep(.3, .7, sin(q.x + 1.3 * sin(q.y * .7 + 1.1)) * sin(q.y * .83 + 1.1 * sin(q.x * .6 + 1.7))) * uFlow.w; }\n';
  // lights that a fire, a spell or the colossus's heart throw on the ground and the grass: up to four at once
  const GLOWU = { uGlowP: { value: [V4(), V4(), V4(), V4()] }, uGlowC: { value: [V3(), V3(), V3(), V3()] } };
  const GLOW = 'uniform vec4 uGlowP[4]; uniform vec3 uGlowC[4];\nvec3 glowAt(vec3 p){ vec3 s = vec3(0.); for (int i = 0; i < 4; i++) { vec4 g = uGlowP[i]; if (g.w > 0.) { vec3 v = p - g.xyz; float q = dot(v, v) / (g.w * g.w); s += uGlowC[i] * (1. - smoothstep(.5, 1., q)) / (1. + 7. * q); } } return s; }\n';
  // marks on the ground: cracks (a blow splitting the soil, glowing if its veins are in them) and scorches (fire), fading
  // uDec: x, z, radius, strength; uDecK: kind (1 crack, 2 scorch), how much it glows, a seed, its glow's color (0 vein, 1 ember)
  const DECU = { uDec: { value: Array.from({ length: 8 }, V4) }, uDecK: { value: Array.from({ length: 8 }, V4) } };
  const DECAL = [
    'uniform vec4 uDec[8]; uniform vec4 uDecK[8];',
    // x: how dark, y: how much it glows, z: how trampled, w: the glow's color (0 vein, 1 ember)
    'vec4 decalAt(vec2 p){ vec4 o = vec4(0.); for (int i = 0; i < 8; i++) { vec4 D = uDec[i]; if (D.w > .002) { vec2 v = p - D.xy; float d = length(v) / D.z; if (d < 1.) { vec4 K = uDecK[i];',
    '  if (K.x < 1.5) { float a = atan(v.y, v.x) / 6.2832 + .5, w = .05 + .09 * (1. - d), f = abs(fract(a * 9. + (mn(vec2(d * 5., K.z)) - .5) * .7) - .5) * 2.;',
    '   float ring = abs(fract(d * 2.6 + mn(vec2(a * 30., K.z)) * .5) - .5) * 2., cr = max(1. - smoothstep(w * .6, w, f), (1. - smoothstep(.04, .1, ring)) * step(.3, d) * .7) * smoothstep(1., .5, d);',
    '   float pit = smoothstep(.3, 0., d); o.x = max(o.x, (cr * .75 + pit * .5) * D.w); if (cr * K.y * D.w > o.y) { o.y = cr * K.y * D.w * (1. - d * .6); o.w = K.w; } }',
    '  else { float e = smoothstep(1., .4 + .35 * mn(v * 2.4 / D.z + K.z), d); o.x = max(o.x, e * .78 * D.w); float em = e * K.y * D.w * smoothstep(.62, .8, mn(v * 7. / D.z + vec2(uT * .4, K.z))); if (em > o.y) { o.y = em; o.w = K.w; } }',
    '  o.z = max(o.z, smoothstep(1., .15, d) * D.w * .5); } } } return o; }'].join('\n');
  const DECC = 'vec3 decalC(float w){ return mix(vec3(1., .16, .42), vec3(1., .5, .12), w); }\n';

  // ---------- painted textures ----------
  // grass: an atlas of four tufts, base at the bottom: meadow grass, grass gone to seed, grass with pale moonflowers,
  // and low clover; each blade is a tapered leaf, dark at its root and pale at its tip
  function blade(g, x, y0, h, lean, w, c0, c1) {
    const tx = x + lean, ty = y0 - h, cx = x + lean * .22, cy = y0 - h * .55, q = g.createLinearGradient(0, y0, 0, ty);
    q.addColorStop(0, c0); q.addColorStop(1, c1); g.fillStyle = q;
    g.beginPath(); g.moveTo(x - w / 2, y0); g.quadraticCurveTo(cx - w * .3, cy, tx, ty); g.quadraticCurveTo(cx + w * .3, cy, x + w / 2, y0); g.closePath(); g.fill();
  }
  const grassTex = (() => {
    const W = 2048, H = 512, c = cvs(W, H), g = c.getContext('2d');
    for (let k = 0; k < 4; k++) {
      const ox = k * 512, n = [64, 40, 44, 30][k];
      for (let i = 0; i < n; i++) {
        const x = ox + rr(46, 466), h = rr(220, 490) * (k === 3 ? .55 : 1), sh = rr(.6, 1), w = rr(7, 15) * (k === 3 ? .8 : 1);
        blade(g, x, H, h, rr(-120, 120), w, rgb(66 * sh, 92 * sh, 50 * sh), rgb(196 * sh, 224 * sh, 158 * sh));
      }
      if (k === 1) for (let i = 0; i < 12; i++) { // seed heads on thin stems
        const x = ox + rr(80, 432), top = rr(30, 140), lean = rr(-40, 40);
        g.strokeStyle = 'rgb(150,160,104)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * .3, (H + top) / 2, x + lean, top); g.stroke();
        g.fillStyle = 'rgb(214,206,150)'; for (let s = 0; s < 9; s++) { g.beginPath(); g.ellipse(x + lean + rr(-5, 5), top + s * 7, 5, 8, rr(-.4, .4), 0, TAU); g.fill(); }
      }
      if (k === 2) for (let i = 0; i < 11; i++) { // pale moonflowers
        const x = ox + rr(60, 452), y = rr(70, 230);
        g.strokeStyle = 'rgb(84,120,66)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + rr(-20, 20), (H + y) / 2, x, y); g.stroke();
        g.fillStyle = i % 3 ? '#f2eefa' : '#c9b4f0'; for (let p = 0; p < 6; p++) { const a = p / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 10, 5.5, a, 0, TAU); g.fill(); }
        g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      }
      if (k === 3) for (let i = 0; i < 26; i++) { // clover leaves low among the blades
        const x = ox + rr(40, 472), y = H - rr(10, 150), s = rr(10, 18);
        g.fillStyle = rgb(70 + rr(0, 40), 110 + rr(0, 40), 60); for (let p = 0; p < 3; p++) { const a = p / 3 * TAU - PI / 2; g.beginPath(); g.ellipse(x + Math.cos(a) * s * .7, y + Math.sin(a) * s * .7, s * .62, s * .5, a, 0, TAU); g.fill(); }
      }
    }
    return fullMips(c);
  })();
  // the ground: meadow turf with clover and dry patches (from the meadow)
  const groundTex = (() => {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = '#4e6136'; g.fillRect(0, 0, S, S);
    const wrapFill = (x, y, r, col) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, col); q.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); };
    for (let i = 0; i < 80; i++) wrapFill(rnd() * S, rnd() * S, rr(40, 150), ['rgba(40,58,30,.4)', 'rgba(110,128,60,.3)', 'rgba(118,104,60,.25)', 'rgba(70,96,46,.4)'][(rnd() * 4) | 0]);
    for (let i = 0; i < 26000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(20,34,14,.25)' : 'rgba(190,220,140,.1)'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 2 + rnd() * 4); }
    const t = tex(c, 18, 18); t.anisotropy = 8; return t;
  })();
  // the forest, painted as eight kinds of tree in white (an atlas of 512-pixel cells): two broad oaks, two firs, a dead
  // tree, a tall poplar, a bramble thicket and an old twisted thorn. Red holds the shading inside the shape (darker deep
  // in the crown), alpha the shape.
  const TREECELL = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]];
  const treeTex = (() => {
    const W = 2048, H = 1024, S = 512, c = cvs(W, H), g = c.getContext('2d'); g.lineCap = g.lineJoin = 'round';
    const blob = (x, y, rx, ry, a, l) => { g.fillStyle = rgb(255 * l, 255 * l, 255 * l); g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); };
    const limb = (x, y, x2, y2, w, l) => { g.strokeStyle = rgb(255 * l, 255 * l, 255 * l); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + rr(-8, 8), (y + y2) / 2 + rr(-8, 8), x2, y2); g.stroke(); };
    const clump = (x, y, r, n) => { for (let k = 0; k < (n || 22); k++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; blob(x + Math.cos(a) * d, y + Math.sin(a) * d * .75, r * rr(.2, .4), r * rr(.16, .3), rnd() * 3, .55 + .45 * (1 - d / r) * (.6 + .4 * Math.sin(a + 2.2))); } };
    const branch = (x, y, a, l, w, d, leafy, l0) => {
      const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l; limb(x, y, x2, y2, w, l0 || .7);
      if (d > 0) { const k = 2 + (rnd() < .35 ? 1 : 0); for (let i = 0; i < k; i++) branch(x2, y2, Math.min(PI - .5, Math.max(.5, a + rr(-.6, .6))), l * rr(.58, .78), w * .62, d - 1, leafy, l0); }
      else if (leafy) clump(x2, y2, l * rr(1, 1.5), 10);
    };
    TREECELL.forEach(([cx, cy], k) => {
      g.save(); g.beginPath(); g.rect(cx * S, cy * S, S, S); g.clip(); g.translate(cx * S, cy * S);
      const B = S - 4, mid = S / 2;
      if (k < 2) { // broad oak: a flared trunk, limbs and a big clumpy crown
        const w0 = 22, top = B - 200;
        g.fillStyle = rgb(150, 150, 150); g.beginPath(); g.moveTo(mid - w0 * 2.2, B); g.quadraticCurveTo(mid - w0, B - 30, mid - w0 * .7, B - 90); g.lineTo(mid - w0 * .5, top); g.lineTo(mid + w0 * .5, top); g.lineTo(mid + w0 * .7, B - 90); g.quadraticCurveTo(mid + w0, B - 30, mid + w0 * 2.3, B); g.fill();
        for (let b = 0; b < 4; b++) branch(mid, top + 20, PI / 2 + (b / 3 - .5) * 1.7, rr(70, 100), 16, 2, true, .6);
        clump(mid + rr(-20, 20), top - 70, 150, 40); clump(mid - 95, top - 10, 90, 18); clump(mid + 100, top - 5, 95, 18);
      } else if (k < 4) { // fir: a straight trunk and tiers of drooping, jagged boughs
        const L = 12 + k, h = B - 20, tw = 120 + (k - 2) * 30;
        limb(mid, B, mid, B - h, 10, .55);
        for (let i = 0; i < L; i++) {
          const f = (i + 1) / L, y = B - h + h * f * .92, wv = tw * f * rr(.85, 1.1), l = .6 + .4 * (1 - f) * rr(.7, 1);
          g.fillStyle = rgb(255 * l, 255 * l, 255 * l); g.beginPath(); g.moveTo(mid, y - 48);
          for (let s = 0; s <= 8; s++) { const sx = mid + wv * (s / 8), sy = y - 48 + 48 * Math.pow(s / 8, .7) + (s % 2 ? 9 : -3); g.lineTo(sx, sy); }
          g.lineTo(mid, y - 10);
          for (let s = 8; s >= 0; s--) { const sx = mid - wv * (s / 8), sy = y - 48 + 48 * Math.pow(s / 8, .7) + (s % 2 ? 9 : -3); g.lineTo(sx, sy); }
          g.closePath(); g.fill();
        }
      } else if (k === 4) { // dead tree: bare branching limbs
        branch(mid, B, PI / 2 + rr(-.08, .08), 150, 26, 5, false, .62);
      } else if (k === 5) { // poplar: tall and narrow
        limb(mid, B, mid, B - 120, 12, .55);
        for (let i = 0; i < 46; i++) { const f = rnd(), y = B - 110 - f * 360, w = 70 * Math.sin(PI * Math.min(1, (1 - f) * 1.2 + .05)) + 8; blob(mid + rr(-w, w) * .7, y, rr(18, 34), rr(26, 44), rr(-.3, .3), .55 + .45 * rnd()); }
      } else if (k === 6) { // a bramble thicket: low arching canes and a mound of leaves
        for (let i = 0; i < 36; i++) { const a = rr(.25, 2.9), r = rr(90, 230); blob(mid + Math.cos(a) * r * 1.0, B - Math.sin(a) * r * .55, rr(26, 48), rr(20, 36), rnd() * 3, .5 + .5 * Math.sin(a) * rnd()); }
        for (let i = 0; i < 9; i++) { const x0 = mid + rr(-200, 200), up = rr(120, 220); g.strokeStyle = rgb(170, 170, 170); g.lineWidth = 7; g.beginPath(); g.moveTo(x0, B); g.quadraticCurveTo(x0 + rr(-60, 60), B - up * 1.6, x0 + rr(-160, 160), B - rr(10, 60)); g.stroke(); }
      } else { // an old twisted thorn tree: a leaning trunk and a few ragged clumps
        const lean = rr(-60, 60); g.strokeStyle = rgb(150, 150, 150); g.lineWidth = 30; g.beginPath(); g.moveTo(mid - lean * .3, B); g.bezierCurveTo(mid + lean, B - 120, mid - lean, B - 220, mid + lean * .5, B - 300); g.stroke();
        for (let b = 0; b < 5; b++) branch(mid + lean * .5, B - 290, PI / 2 + (b / 4 - .5) * 2.2, rr(60, 110), 12, 3, rnd() < .6, .6);
      }
      g.restore();
    });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  })();
  // a cluster of leaves and furrowed bark for the trees that frame the shot (from the meadow)
  const leafTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 150; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 100, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, s = rr(.7, 1.3), sh = rr(.5, 1.05);
      g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = rgb(60 * sh, 100 * sh, 45 * sh);
      g.beginPath(); g.ellipse(0, 0, 14 * s, 7 * s, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,40,14,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-13 * s, 0); g.lineTo(13 * s, 0); g.stroke(); g.restore();
    }
    return fullMips(c);
  })();
  const barkTex = (() => {
    const W = 128, H = 256, c = cvs(W, H), g = c.getContext('2d'); g.fillStyle = '#4a3c32'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = rnd() * W, w = rr(2, 7); g.fillStyle = rnd() < .5 ? 'rgba(20,14,10,.5)' : 'rgba(130,112,96,.25)'; for (const ox of [-W, 0, W]) g.fillRect(x + ox, 0, w, H); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(10,8,6,.35)'; g.fillRect(rnd() * W, rnd() * H, rr(3, 9), 1.5); }
    return tex(c, 2, 3);
  })();
  // sprites: a soft dot, a leaf, a rose petal and a puff of dust or smoke
  const dotTex = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.3, 'rgba(255,255,255,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
  const leafDot = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 26, 12, .5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 46); g.lineTo(54, 18); g.stroke(); return tex(c); })();
  const puffTex = (() => {
    const S = 128, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = rr(0, 26), x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = rr(16, 34), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.34)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); }
    return tex(c);
  })();
  const mistTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S, r = rr(18, 60), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();

  // ---------- the night's colors: the battle screen's Night square rig, and what weather and a wrath do to them ----------
  const NIGHT = { top: COL('#0b0816'), mid: COL('#1d1634'), hor: COL('#3f3058'), haze: COL('#2c2344'), lc: COL('#b8c0ff'), li: .62, hs: COL('#756aa8'), hg: COL('#33262f'), hi: 1.1, fi: .42 };
  const GREY = COL(0x9aa0aa), STORMC = COL(0x4a5064), RED = COL(0xff5a3a), WRATHSKY = COL(0xa85060), FLASHC = COL(0xdfe6ff), MOONC = COL(0xdfe4ff);
  const light = { hemiSky: NIGHT.hs.clone(), hemiGround: NIGHT.hg.clone(), hemiI: NIGHT.hi, dir: MOONL.clone(), color: NIGHT.lc.clone(), I: NIGHT.li, fillC: COL(0xffdcc0), fillI: NIGHT.fi };
  // how strongly the light falls on the ground, per color: the painting is relit by how this changes from the night it was
  // painted in (a storm darkens it, lightning lights it, a wrath reddens it)
  const irr = (L, out) => out.set(
    L.hemiSky.r * L.hemiI * .62 + L.hemiGround.r * L.hemiI * .38 + L.color.r * L.I * .5 + L.fillC.r * L.fillI * .25,
    L.hemiSky.g * L.hemiI * .62 + L.hemiGround.g * L.hemiI * .38 + L.color.g * L.I * .5 + L.fillC.g * L.fillI * .25,
    L.hemiSky.b * L.hemiI * .62 + L.hemiGround.b * L.hemiI * .38 + L.color.b * L.I * .5 + L.fillC.b * L.fillI * .25);
  const IRR0 = irr(light, V3());
  const FOG = new THREE.Fog(NIGHT.haze.getHex(), 26, 190); // the scene should use it too, so the live grass fades as the painted does

  // ==================================================================================================================
  // the painting: drawn once
  // ==================================================================================================================
  const paintScene = new THREE.Scene(); paintScene.fog = FOG;
  {
    const hemi = new THREE.HemisphereLight(light.hemiSky, light.hemiGround, light.hemiI), moon = new THREE.DirectionalLight(light.color, light.I), fill = new THREE.DirectionalLight(light.fillC, light.fillI);
    moon.position.copy(MOONL).multiplyScalar(30); fill.position.set(2, 5, 10); paintScene.add(hemi, moon, fill);
  }
  // each thing in the painting has a second material that draws what it is (sky, a far thing, or ground) and how far off,
  // into a second picture the live shader reads: R .0 sky, .5 a far thing, 1 ground; G the distance / 900
  const masked = [];
  function maskOf(mesh, cls, opts2) {
    const o = opts2 || {};
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uCls: { value: cls }, uCP: { value: CP } }, o.uniforms || {}),
      vertexShader: o.vs || 'varying vec3 vW;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: o.fs || 'uniform float uCls; uniform vec3 uCP; varying vec3 vW;\nvoid main(){ gl_FragColor = vec4(uCls, distance(vW, uCP) / 900., 0., 1.); }',
      side: mesh.material.side, depthWrite: true, transparent: false,
    });
    mesh.userData.paint = mesh.material; mesh.userData.mask = m; masked.push(mesh);
  }

  // ---------- the sky: the night's gradient, a big moon with its halo (and no stars), and mountains far off ----------
  const SKYP = { uMoonDir: { value: MOOND.clone() }, uTop: { value: NIGHT.top }, uMid: { value: NIGHT.mid }, uHor: { value: NIGHT.hor }, uHaze: { value: NIGHT.haze }, uMoonC: { value: MOONC }, uMask: { value: 0 } };
  const SKYFS = [
    'uniform vec3 uMoonDir, uTop, uMid, uHor, uHaze, uMoonC; uniform float uMask; varying vec3 vD;',
    NOISE2,
    'float ridge(float x){ float s = 0., a = .55, f = 1.; for (int i = 0; i < 6; i++) { s += a * (1. - abs(mn(vec2(x * f, float(i) * 7.3)) * 2. - 1.)); f *= 2.07; a *= .5; } return s; }',
    'float ridge3(float x){ float s = 0., a = .55, f = 1.; for (int i = 0; i < 3; i++) { s += a * (1. - abs(mn(vec2(x * f, float(i) * 7.3)) * 2. - 1.)); f *= 2.07; a *= .5; } return s + .12; }',
    'void main(){',
    ' vec3 d = normalize(vD); float y = d.y, az = atan(d.x, -d.z);',
    ' vec3 c = mix(uHor, uMid, smoothstep(-.02, .2, y)); c = mix(c, uTop, smoothstep(.2, .75, y));',
    // the moon's light in the air round it, and the disc: a waxing-full moon with darker seas and a bright rim
    ' float m = max(dot(d, uMoonDir), 0.), ang = acos(clamp(dot(d, uMoonDir), -1., 1.)), R = .046;',
    ' c += uMoonC * (pow(m, 6.) * .07 + pow(m, 40.) * .2 + pow(m, 400.) * .55);',
    ' vec3 e1 = normalize(cross(uMoonDir, vec3(0., 1., 0.))), e2 = cross(e1, uMoonDir); vec2 mp = vec2(dot(d, e1), dot(d, e2)) / R;',
    ' float disc = 1. - smoothstep(.97, 1.01, length(mp));',
    ' float sea = smoothstep(.52, .68, mf(mp * 1.2 + 3.)) * .8 + smoothstep(.55, .75, mf(mp * 3.1 + 9.)) * .3, limb = pow(max(0., 1. - dot(mp, mp)), .25);',
    ' vec3 moon = vec3(.98, .96, .92) * (.8 + .2 * limb) * (1. - .26 * sea) * (.94 + .06 * mn(mp * 18.));',
    ' c = mix(c, moon, disc);',
    // no stars: Noctara is the sky with no light in it, and the stars only come back at the ending (lore answers 5 and
    // 10); only a slow, deep unevenness in the dark, so it is not flat
    ' c *= .92 + .16 * mf(vec2(az * 1.3, y * 2.6) + 5.);',
    // mountains: three ranges, the far one snow-capped, their slopes toward the moon lit; haze between them
    ' float cls = 0., dist = 0.;',
    ' for (int k = 0; k < 3; k++) { float fk = float(k), base = .07 - fk * .02, amp = .2 - fk * .065, fr = 1.6 + fk * 1.9, off = fk * 4.1 + 1.7, env = .55 + .45 * smoothstep(.9, .1, abs(az + .25));',
    '  float h = base + amp * pow(ridge(az * fr + off), 1.6) * env;',
    '  if (y < h) {',
    // broad faces: lit on the moon's side of each spur (from a smoothed ridge), darker toward the foot, with gullies
    '   float sl = ridge3((az + .012) * fr + off) - ridge3((az - .012) * fr + off), side = clamp(.5 - sl * 5. * sign(uMoonDir.x + 1e-4), 0., 1.);',
    '   float depth = clamp((h - y) / max(.02, h - base + .03), 0., 1.); vec2 q = vec2(az * (30. + fk * 12.), y * (90. + fk * 30.)); float streak = mf(q * vec2(1., .28));',
    '   float lit = clamp(side * (1. - .5 * depth) + .25 * (streak - .5), 0., 1.), snow = k == 0 ? 1. - smoothstep(.1, .34, depth + .3 * (streak - .5)) : 0.;',
    '   vec3 rock = mix(vec3(.11, .1, .18), vec3(.23, .23, .35), lit), mc = mix(rock, mix(vec3(.36, .38, .5), vec3(.6, .62, .75), lit), snow * .8);',
    '   c = mix(mc, uHaze * 1.15 + vec3(.03, .025, .05), (.6 - fk * .18) + .25 * depth);',
    '   cls = .5; dist = 600. - fk * 120.; } }',
    ' if (uMask > .5) { gl_FragColor = vec4(cls, dist / 900., 0., 1.); return; }',
    ' gl_FragColor = vec4(c, 1.);',
    '}'].join('\n');
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 64, 32), new THREE.ShaderMaterial({ uniforms: SKYP, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD;\nvoid main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: SKYFS }));
  sky.position.copy(CP); sky.renderOrder = -10; sky.frustumCulled = false; paintScene.add(sky);
  {
    const mm = sky.material.clone(); mm.uniforms = Object.assign({}, SKYP, { uMask: { value: 1 } });
    sky.userData.paint = sky.material; sky.userData.mask = mm; masked.push(sky);
  }

  // the forest's edge: a ring round the meadow, with bays and points
  const edgeR = (a) => 54 + 5 * Math.sin(a * 3 + 1) + 4 * Math.sin(a * 7 + 2.3) + 2.5 * Math.sin(a * 13);
  // ---------- the forest round the meadow: trees on cards that face the camera, many deep, hazier the further off ----------
  // R holds a tree's own shading, so the near trees show their crowns' depth and the far ones are flat in the haze; the
  // side of each shape toward the moon catches a rim of moonlight; mist lies at their feet
  {
    const P = [], UV = [], CE = [], AD = [], I = [];
    const box = groundBox(240, .08);
    const tr = [];
    // round the meadow's edge (with bays and points), and behind it as deep as the frame sees
    for (let n = 0; n < 9000 && tr.length < 1500; n++) {
      const x = rr(box[0] - 20, box[1] + 20), z = rr(box[2] - 40, Math.min(box[3], CP.z + 60)), r = Math.hypot(x, z), a = Math.atan2(x, z), e = edgeR(a);
      if (r < e - 2) continue;
      const d = dCam(x, z); if (d < 30) continue;
      const deep = r - e, kind = deep < 4 && rnd() < .55 ? 6 : rnd() < .34 ? (rnd() < .5 ? 2 : 3) : rnd() < .05 ? 4 : rnd() < .08 ? 5 : rnd() < .08 ? 7 : rnd() < .5 ? 0 : 1;
      const H = (kind === 6 ? rr(3, 5.5) : kind === 5 ? rr(13, 19) : kind === 2 || kind === 3 ? rr(11, 20) : rr(8.5, 15)) * (deep < 3 ? .8 : 1) * (.8 + .2 * sm(60, 160, d));
      if (!shows(x, z, H, .06)) continue;
      // fewer, sparser trees far off (the haze fills in), and a gap toward the moon
      if (rnd() > 1.15 - d / 220) continue;
      tr.push({ x, z, H, kind, d });
    }
    STATS.paintTrees = tr.length;
    tr.sort((p, q) => q.d - p.d); // far to near: they are drawn soft-edged, each over the ones behind
    const right = V3();
    for (const t of tr) {
      right.set(-(t.z - CP.z), 0, t.x - CP.x).normalize();
      const W = t.H * (t.kind === 6 ? 2.6 : t.kind === 5 ? .55 : t.kind === 2 || t.kind === 3 ? .62 : 1.0) * rr(.85, 1.15), b = P.length / 3, cc = TREECELL[t.kind], flip = rnd() < .5;
      for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
        P.push(t.x + right.x * sx * W / 2, sy * t.H - .4, t.z + right.z * sx * W / 2); UV.push(flip ? (sx > 0 ? 0 : 1) : (sx > 0 ? 1 : 0), sy);
        CE.push(cc[0] * .25, (1 - cc[1]) * .5, .25, .5); AD.push(t.d, rr(.85, 1.1));
      }
      I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    g.setAttribute('aCell', new THREE.Float32BufferAttribute(CE, 4)); g.setAttribute('aD', new THREE.Float32BufferAttribute(AD, 2)); g.setIndex(I);
    // which way the moon is, across the frame, for the rims: from the middle of the frame toward where it hangs
    _p.copy(CP).addScaledVector(MOOND, 100).project(cam);
    const M2 = new THREE.Vector2(_p.x, _p.y + 1).normalize();
    const FU = { uMap: { value: treeTex }, uTree: { value: COL('#141826') }, uDeep: { value: COL('#1f1d33') }, uRim: { value: COL('#7f8cd0') }, uHaze: { value: NIGHT.haze }, uMist: { value: COL('#4a4268') }, uM2: { value: M2 }, uFogN: { value: FOG.near }, uFogF: { value: FOG.far } };
    const VS = 'attribute vec4 aCell; attribute vec2 aD; varying vec2 vUv; varying vec4 vCell; varying vec2 vD; varying vec3 vW;\nvoid main(){ vUv = uv; vCell = aCell; vD = aD; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
    const forest = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: FU, transparent: true, depthWrite: false, fog: false, vertexShader: VS,
      fragmentShader: [
        'uniform sampler2D uMap; uniform vec3 uTree, uDeep, uRim, uHaze, uMist; uniform vec2 uM2; uniform float uFogN, uFogF; varying vec2 vUv; varying vec4 vCell; varying vec2 vD; varying vec3 vW;',
        'void main(){ vec2 uv = vCell.xy + vUv * vCell.zw; vec4 t = texture2D(uMap, uv); if (t.a < .01) discard;',
        ' vec2 o = uM2 * vCell.zw * .005; float a2 = texture2D(uMap, uv + o).a, a3 = texture2D(uMap, uv + o * 2.2).a;',
        ' float rim = clamp(t.a - (a2 * .6 + a3 * .4), 0., 1.) * smoothstep(.15, .6, vUv.y) * .55;',
        ' float far = smoothstep(40., 170., vD.x);',
        ' vec3 c = mix(uDeep, uTree, t.r) * vD.y * (1. - .35 * far) + uRim * rim * (1.3 - far * .9);',
        ' c = mix(c, uHaze * 1.05, smoothstep(60., 270., vD.x) * .88);',
        ' c = mix(c, uMist, (1. - smoothstep(.0, 4.5, vW.y)) * .62);',
        ' gl_FragColor = vec4(c, t.a); }'].join('\n'),
    }));
    forest.renderOrder = -8; forest.frustumCulled = false; paintScene.add(forest);
    maskOf(forest, .5, { uniforms: { uMap: { value: treeTex } }, vs: VS,
      fs: 'uniform sampler2D uMap; uniform float uCls; uniform vec3 uCP; varying vec2 vUv; varying vec4 vCell; varying vec2 vD; varying vec3 vW;\nvoid main(){ if (texture2D(uMap, vCell.xy + vUv * vCell.zw).a < .45) discard; gl_FragColor = vec4(uCls, vD.x / 900., vUv.y, 1.); }' });
  }

  // ---------- the ground, and the meadow's grass as far as the forest; near the camera only the short grass under the live ----------
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: .96, color: 0x5a6650 });
  groundMat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec2 vGp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGp = vec2(position.x, -position.y);');
    sh.fragmentShader = 'varying vec2 vGp;\n' + NOISE2 + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float gr = length(vGp), clr = 1. - smoothstep(' + (CLEAR - 2.5).toFixed(1) + ', ' + (CLEAR + 1.5).toFixed(1) + ', gr);\n' +
      ' diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.4, .36, .27) * (.8 + .4 * mn(vGp * .9)), clr * (.25 + .3 * mn(vGp * .3)));');
  };
  const ground = new THREE.Mesh(new THREE.CircleGeometry(300, 96), groundMat); ground.rotation.x = -PI / 2; ground.position.set(CP.x, 0, CP.z); ground.renderOrder = -9; paintScene.add(ground);
  maskOf(ground, 1);

  // the grass's material, the same in the painting and live (live it bends with the air), so the two meet without a seam
  function grassMat(live) {
    const m = new THREE.MeshLambertMaterial({ map: grassTex, side: THREE.DoubleSide, color: 0xd2dcc2 });
    if (live) m.alphaTest = .45; else { m.transparent = true; m.depthWrite = false; }
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, AIRU, GLOWU, DECU, { uMoonC: { value: light.color }, uMoonD: { value: light.dir }, uLive: { value: live ? 1 : 0 } });
      sh.vertexShader = AIR + '\n' + GLOW + DECAL + '\nattribute vec4 aRoot; attribute float aH; uniform float uLive; varying float vB; varying float vHt; varying vec3 vGw; varying vec3 vGl; varying vec4 vDec;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec2 w = (windAt(aRoot.xy) + pushAt(aRoot.xy)) * uLive; vec2 off = w * aH * aH * aRoot.z; float L = length(off), mx = aRoot.z * .8; if (L > mx) off *= mx / L;\n' +
          ' vDec = decalAt(aRoot.xy); off *= 1. + vDec.z * 1.5;\n transformed.xz += off; transformed.y -= dot(off, off) / max(.1, aRoot.z) * .45 * aH; transformed.y *= 1. - vDec.x * .5 * aH; vB = min(1., length(w)); vHt = aH;\n' +
          ' vec4 gw = modelMatrix * vec4(transformed, 1.); vGw = gw.xyz; vGl = glowAt(gw.xyz);');
      sh.fragmentShader = 'uniform vec3 uMoonC, uMoonD;\nvarying float vB; varying float vHt; varying vec3 vGw; varying vec3 vGl; varying vec4 vDec;\n' + DECC + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(.58, 1.05, vHt) * (1. + .5 * vB * vHt) * (1. - vDec.x * .85);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n vec3 vdir = normalize(vGw - cameraPosition); float bl = pow(max(dot(vdir, normalize(uMoonD)), 0.), 3.);\n' +
          ' totalEmissiveRadiance += diffuseColor.rgb * (uMoonC * bl * vHt * vHt * 1.1 + vGl * 1.6) + decalC(vDec.w) * vDec.y * .9;');
    };
    m.customProgramCacheKey = () => 'lf-grass-' + (live ? 'live' : 'paint');
    return m;
  }
  // tufts of grass, each on one card turned to face the camera (it never moves, so the card always shows its full face),
  // with its root, height and how tall it bends from; 'order' 1 sorts them nearest first (live: hidden grass costs little),
  // -1 farthest first (painted: soft edges laid over what is behind)
  function tufts(list, order, segs) {
    const P = [], UV = [], N = [], R = [], Hh = [], I = [];
    list.sort((a, b) => order * (a.d - b.d));
    for (const t of list) {
      const ang = Math.atan2(t.x - CP.x, t.z - CP.z) + t.yaw, dx = Math.cos(ang) * t.W / 2, dz = -Math.sin(ang) * t.W / 2, b = P.length / 3, S = t.d > 26 ? 1 : segs;
      for (let j = 0; j <= S; j++) for (let s = 0; s <= 1; s++) { const h = j / S; P.push(t.x + (s ? dx : -dx), t.H * h, t.z + (s ? dz : -dz)); UV.push((t.cell + s) * .25, h); N.push(0, 1, 0); R.push(t.x, t.z, t.H, 0); Hh.push(h); }
      for (let j = 0; j < S; j++) { const c = b + j * 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aRoot', new THREE.Float32BufferAttribute(R, 4)); g.setAttribute('aH', new THREE.Float32BufferAttribute(Hh, 1)); g.setIndex(I);
    return g;
  }
  // what grows where: short trampled grass in the clearing round the middle, tall meadow grass round it, thinning toward
  // the forest; some of it gone to seed, some in flower
  function tuftAt(x, z, d) {
    const r = Math.hypot(x, z); if (r < 2.7) return null;
    const tall = sm(CLEAR - 1, CLEAR + 3, r), fl = rnd();
    const H = lerp(rr(.14, .34), rr(.62, 1.3), tall) * (.75 + .25 * sm(0, 6, Math.abs(r - CLEAR)));
    return { x, z, d, H, W: H * rr(.9, 1.5) + .12, yaw: rr(-.5, .5), cell: fl < .07 ? 2 : fl < .17 ? 1 : fl < .3 * (1 - tall) + .05 ? 3 : 0 };
  }
  // the painted grass: tall beyond the live grass, as far as the forest; short and dense under the live grass, to fill the
  // ground between its tufts
  {
    const list = [], box = groundBox(110, .04), cell = .22;
    for (let x = box[0]; x < box[1]; x += cell) for (let z = box[2]; z < box[3]; z += cell) {
      const px = x + rr(0, cell), pz = z + rr(0, cell), d = dCam(px, pz), r = Math.hypot(px, pz);
      if (d < 5 || d > 110 || r > edgeR(Math.atan2(px, pz)) - 2.5) continue;
      const far = d > DLIVE - 1;
      if (!far && rnd() > .85) continue; if (far && rnd() > .8 - (d - DLIVE) / 160) continue;
      const t = tuftAt(px, pz, d); if (!t) continue;
      if (!far) { t.H *= .32; t.W = t.H * 1.4 + .1; }
      if (!shows(px, pz, t.H, .05)) continue;
      list.push(t);
    }
    const grass = new THREE.Mesh(tufts(list, -1, 2), grassMat(false)); grass.renderOrder = -7; grass.frustumCulled = false; paintScene.add(grass);
    maskOf(grass, 1, { uniforms: { uMap: { value: grassTex } }, vs: 'varying vec2 vUv; varying vec3 vW;\nvoid main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fs: 'uniform sampler2D uMap; uniform float uCls; uniform vec3 uCP; varying vec2 vUv; varying vec3 vW;\nvoid main(){ if (texture2D(uMap, vUv).a < .45) discard; gl_FragColor = vec4(uCls, distance(vW, uCP) / 900., 0., 1.); }' });
    STATS.paintTufts = list.length;
  }
  // a low bank of mist along the forest's foot
  {
    const geo = new THREE.PlaneGeometry(1, 1); const M = new THREE.ShaderMaterial({ uniforms: { uC: { value: COL('#3e3760') }, uMap: { value: mistTex } }, transparent: true, depthWrite: false, fog: false,
      vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 uC; uniform sampler2D uMap; varying vec2 vUv;\nvoid main(){ float n = texture2D(uMap, vUv * vec2(3., .6)).r * 2.2; float a = smoothstep(0., .25, vUv.y) * (1. - smoothstep(.35, 1., vUv.y)) * smoothstep(0., .1, vUv.x) * smoothstep(1., .9, vUv.x); gl_FragColor = vec4(uC, a * min(1., n) * .3); }' });
    for (const [d, h] of [[58, 7], [80, 10], [120, 14]]) {
      const m = new THREE.Mesh(geo, M), p = CP.clone().addScaledVector(V3(FWD.x, 0, FWD.z).normalize(), d), w = d * 1.6;
      m.position.set(p.x, h * .3, p.z); m.scale.set(w, h, 1); m.lookAt(CP.x, h * .3, CP.z); m.renderOrder = -6; paintScene.add(m);
    }
  }

  // ---------- painting it: the picture, and the mask that says what each pixel is ----------
  let painted = null, maskT = null, paintMs = 0;
  function bake(renderer) {
    const t0 = performance.now();
    const rt = new THREE.WebGLRenderTarget(FW, FH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
    const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
    const read = () => { const a = new Uint8Array(FW * FH * 4); renderer.readRenderTargetPixels(rt, 0, 0, FW, FH, a); const t = new THREE.DataTexture(a, FW, FH, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(paintScene, cam);
    painted = read();
    for (const m of masked) m.material = m.userData.mask;
    paintScene.fog = null; renderer.clear(); renderer.render(paintScene, cam); paintScene.fog = FOG;
    for (const m of masked) m.material = m.userData.paint;
    maskT = read();
    renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA); rt.dispose();
    BU.uPaint.value = painted; BU.uMaskT.value = maskT; backdrop.visible = true;
    STATS.paintMs = paintMs = performance.now() - t0;
    // the painting is never drawn again: free its geometry
    paintScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    for (const m of masked) if (m.userData.mask) m.userData.mask.dispose();
    treeTex.dispose(); groundTex.dispose();
    return paintMs;
  }

  // ==================================================================================================================
  // the backdrop: the painting on a plane far off, filling the frame, brought to life by its shader
  // ==================================================================================================================
  const BU = Object.assign({
    uPaint: { value: null }, uMaskT: { value: null }, uCP: { value: CP }, uRelight: { value: V3(1, 1, 1) }, uStorm: { value: 0 }, uCloud: { value: .22 }, uWrath: { value: 0 }, uFlash: { value: 0 },
    uBolt: { value: V3(0, 1, 0) }, uBoltC: { value: COL(0xd8e0ff) }, uMoonD: { value: MOOND }, uMoonC: { value: MOONC.clone() }, uStormC: { value: COL('#2a2c3c') }, uHaze: { value: NIGHT.haze.clone() },
    uRain: { value: 0 }, uDebug: { value: 0 },
  }, AIRU, GLOWU, DECU);
  const DB = 700, BDH = 2 * DB * Math.tan(CAMP.fov / 2 * PI / 180);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(BDH * FW / FH, BDH), new THREE.ShaderMaterial({
    uniforms: BU, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vW;\nvoid main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      AIR, CSH, GLOW, DECAL, DECC,
      'uniform sampler2D uPaint, uMaskT; uniform vec3 uCP, uRelight, uBolt, uBoltC, uMoonD, uMoonC, uStormC, uHaze; uniform float uStorm, uCloud, uWrath, uFlash, uWet, uRain, uDebug; varying vec2 vUv; varying vec3 vW;',
      'void main(){',
      ' vec3 c = texture2D(uPaint, vUv).rgb; vec4 mk = texture2D(uMaskT, vUv); vec3 d = normalize(vW - uCP);',
      ' float sky = 1. - smoothstep(.12, .3, mk.r), gnd = smoothstep(.7, .85, mk.r), obj = max(0., 1. - sky - gnd), dist = mk.g * 900.;',
      // the ground: where it is, then the wind and the shockwaves in the far grass, the clouds' shadows, the rain, the marks
      // on it and the light of fires and spells
      ' if (gnd > .01 && d.y < -.0005) {',
      '  float t = -uCP.y / d.y; vec3 P = uCP + d * t; vec2 p = P.xz; float near = 1. - smoothstep(30., 140., t);',
      '  float g = gustAt(p), push = length(pushAt(p));',
      '  c *= 1. + (.22 * g * uWind.z + .45 * min(push, 1.2)) * near;',
      '  c *= 1. - .35 * cshade(p) * (1. - uStorm);',
      '  float pud = smoothstep(.6, .7, mf(p * .09)) * uWet; c *= 1. - .3 * uWet - .25 * pud;',
      '  c = mix(c, uStormC * 1.6 + uBoltC * uFlash * .6, pud * .45);',
      '  { vec2 cc = floor(p * 1.4), fr = fract(p * 1.4) - .5, o = vec2(mh(cc + 3.1), mh(cc + 7.7)) - .5; float rp = fract(uT * 1.2 + mh(cc));',
      '   c += vec3(.4, .45, .5) * smoothstep(.06, 0., abs(length(fr - o * .5) - rp * .45)) * (1. - rp) * uRain * pud * step(mh(cc + 1.9), .6) * near; }',
      '  vec4 dc = decalAt(p); c *= 1. - dc.x; c += decalC(dc.w) * dc.y * .8;',
      '  c *= uRelight; vec3 gl = glowAt(P); c += c * gl * 2.4 + gl * .03;',
      ' } else if (gnd > .01) { c *= uRelight; }',
      // far things: the forest and the mountains, relit, and lost in the rain's haze far off
      ' if (obj > .01) { c = mix(c, c * uRelight, obj); c = mix(c, uStormC * (.7 + 2. * uFlash), obj * uStorm * smoothstep(80., 400., dist) * .8); }',
      // the sky: clouds drifting over the moon (thin on a fair night, and a storm rolling in), lightning inside them, a wrath
      ' if (sky > .01) {',
      '  vec2 cu = d.xz / max(.06, d.y + .18) * 1.6 - uFlow.xy * .008;',
      '  float n = mf(cu * .42) * .62 + mf(cu * 1.25 + 4.) * .38, cov = smoothstep(1. - uCloud, 1.16 - uCloud, n) * smoothstep(-.03, .1, d.y);',
      '  float mm = max(dot(d, uMoonD), 0.);',
      '  vec3 cc = mix(uHaze * 1.1, uStormC, uStorm) * (.75 + .5 * n) + uMoonC * (pow(mm, 6.) * .45 + pow(mm, 30.) * .6) * (1.15 - n) * (1. - .85 * uStorm);',
      '  cc += uBoltC * uFlash * (.25 + 2.4 * pow(max(dot(d, uBolt), 0.), 6.));',
      '  c = mix(c, c * (1. - .55 * uStorm) + uBoltC * uFlash * .12, sky);',
      '  c = mix(c, cc, cov * .95 * sky);',
      '  c = mix(c, c * vec3(1.3, .5, .42) + vec3(.1, 0., 0.), uWrath * .6 * sky);',
      ' }',
      ' if (uDebug > .5) c = mix(c, vec3(.1, .3, .9), .45);',
      ' gl_FragColor = vec4(c, 1.);',
      '}'].join('\n'),
  }));
  backdrop.position.copy(CP).addScaledVector(FWD, DB); backdrop.quaternion.copy(cam.quaternion);
  backdrop.renderOrder = -100; backdrop.frustumCulled = false; backdrop.visible = false; root.add(backdrop);

  // ==================================================================================================================
  // the live layer
  // ==================================================================================================================
  // ---------- the grass that moves: only inside the frame, out to DLIVE, nearest first ----------
  {
    const list = [], box = groundBox(DLIVE, .02);
    // denser near the middle of the fight, less dense far off, where each tuft is small
    for (let x = box[0]; x < box[1]; x += .24) for (let z = box[2]; z < box[3]; z += .24) {
      const px = x + rr(0, .24), pz = z + rr(0, .24), d = dCam(px, pz);
      if (d > DLIVE || d < 3.5) continue;
      const r = Math.hypot(px, pz), keep = r < CLEAR - 1 ? .25 : .7 * (1 - .35 * sm(16, DLIVE, d)) * (d < 9 ? .4 : 1);
      if (rnd() > keep) continue;
      const t = tuftAt(px, pz, d); if (!t) continue;
      if (d < 9) { t.H *= 1.15; t.W *= 1.1; }
      if (!shows(px, pz, t.H, .02)) continue;
      list.push(t);
    }
    const g = tufts(list, 1, 3);
    const grass = new THREE.Mesh(g, grassMat(true)); grass.frustumCulled = false; root.add(grass);
    STATS.liveTufts = list.length;
  }

  // ---------- two old trees framing the shot: an oak at the left near the camera, a thorn tree at the right ----------
  const TREES = [];
  {
    const tP = [], tN = [], tU = [], tT = [], tI = [], cP = [], cN = [], cU = [], cT = [], cC = [], cI = [];
    const tube = (pts, rFn, k, top, rx, rz) => {
      const curve = new THREE.CatmullRomCurve3(pts), segs = 10, rs = 8, fr = curve.computeFrenetFrames(segs, false), Pt = V3(), D = V3(), b = tP.length / 3;
      for (let i = 0; i <= segs; i++) { const t = i / segs; curve.getPointAt(t, Pt); for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); tP.push(Pt.x + D.x * r, Pt.y + D.y * r, Pt.z + D.z * r); tN.push(D.x, D.y, D.z); tU.push(j / rs, t * 3); tT.push(k, cl(Pt.y / top, 0, 1), rx, rz); } }
      for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; tI.push(a, c, a + 1, a + 1, c, c + 1); }
    };
    // where: the frame's left edge, a third of the way to the colossus, and its right edge further off
    const spots = [];
    { rayAt(1.09, .78, _q); const t = -CP.y / _q.y * .82; spots.push([CP.x + _q.x * t + 2.5, CP.z + _q.z * t, 1.05]); }
    spots.forEach(([x, z, sc], k) => {
      const H = rr(6.5, 8) * sc, lx = rr(-.4, .4) - (k ? -.8 : .8), lz = rr(-.4, .4), R = rr(3.6, 4.4) * sc, top = H + R;
      const pts = []; for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(V3(x + lx * f + Math.sin(f * 3 + k) * .25, -.3 + f * H * .55, z + lz * f + Math.cos(f * 2.5 + k) * .2)); }
      tube(pts, (f) => lerp(.62, .34, f) * sc * (1 + .7 * Math.exp(-f * 9)), k, top, x, z);
      const fork = pts[4], lobes = [], nl = 5, a0 = rnd() * TAU;
      for (let b = 0; b <= nl; b++) {
        const lead = b === nl, ba = a0 + b / nl * TAU + rr(-.4, .4), sp = lead ? rr(0, .3) : rr(.6, .95), up = lead ? rr(2.6, 3.4) : rr(1.4, 2.8);
        const e = V3(fork.x + Math.cos(ba) * R * sp, fork.y + up, fork.z + Math.sin(ba) * R * sp), p0 = pts[3].clone().lerp(fork, rr(.4, 1));
        tube([p0, V3(lerp(p0.x, e.x, .45), lerp(p0.y, e.y, .6) + .3, lerp(p0.z, e.z, .45)), e], (f) => lerp(lead ? .32 : .26, .07, f) * sc, k, top, x, z);
        lobes.push([e.x, e.y + .5, e.z, R * (lead ? rr(.5, .62) : rr(.42, .56)) * (k ? .75 : 1)]);
      }
      const C = V3(); for (const L of lobes) C.add(V3(L[0], L[1], L[2])); C.divideScalar(lobes.length);
      const n = V3(), m2 = V3(), t1 = V3(), t2 = V3(), Pq = V3(), YUP = V3(0, 1, 0);
      lobes.forEach((L) => {
        for (let i = 0; i < (k ? 15 : 22); i++) {
          const u = rnd() * TAU, v = Math.acos(rr(-.7, 1)), dd = rr(.5, 1.05), s = rr(1.5, 2.3) * sc;
          n.set(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)); Pq.set(L[0] + n.x * L[3] * dd, L[1] + n.y * L[3] * .75 * dd, L[2] + n.z * L[3] * dd);
          m2.subVectors(Pq, C).normalize().add(n).normalize();
          t1.crossVectors(n, YUP); if (t1.lengthSq() < 1e-3) t1.set(1, 0, 0); t1.normalize(); t2.crossVectors(n, t1).normalize();
          const ro = rnd() * TAU, ca = Math.cos(ro), sa = Math.sin(ro), e1 = t1.clone().multiplyScalar(ca).addScaledVector(t2, sa), e2 = t2.clone().multiplyScalar(ca).addScaledVector(t1, -sa), b = cP.length / 3;
          const tint = rr(.8, 1.1) * (.5 + .5 * (m2.y * .5 + .5)) * (.75 + .25 * dd) * (k ? .8 : 1);
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const py = Pq.y + (e1.y * sx + e2.y * sy) * s / 2; cP.push(Pq.x + (e1.x * sx + e2.x * sy) * s / 2, py, Pq.z + (e1.z * sx + e2.z * sy) * s / 2); cN.push(m2.x, m2.y, m2.z); cU.push(sx * .5 + .5, sy * .5 + .5); cT.push(k, cl(py / top, 0, 1), x, z); cC.push(tint * rr(.9, 1.05) * (k ? 1.1 : 1), tint * (k ? .85 : 1), tint * rr(.85, 1)); }
          cI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
      });
      TREES.push({ x, z, c: C, R: R * (k ? .75 : 1), shake: 0, leaves: 0 });
    });
    const mk = (P, N, U, T, I, C) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aTree', new THREE.Float32BufferAttribute(T, 4)); if (C) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); return g; };
    const airyTree = (m) => {
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, AIRU, GLOWU, { uMoonC: { value: light.color }, uMoonD: { value: light.dir } });
        sh.vertexShader = AIR + '\n' + GLOW + 'attribute vec4 aTree; uniform float uShake[6]; varying vec3 vGl; varying vec3 vTw; varying float vTh;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
          ' { float h = aTree.y * aTree.y, s = 0.; int ti = int(aTree.x + .5); for (int k = 0; k < 6; k++) { if (k == ti) s = uShake[k]; }\n   vec2 w = windAt(aTree.zw) * .5 + pushAt(aTree.zw) * .2;\n' +
          '   transformed.xz += w * h * 1.5 + vec2(sin(uT * 23. + aTree.x * 3.), cos(uT * 19. + aTree.x)) * s * h * .4 + vec2(sin(uT * 2.1 + position.y * .9 + position.x), cos(uT * 1.7 + position.z * .8)) * .04 * aTree.y * (.4 + uWind.z); }\n' +
          ' vec4 tw = modelMatrix * vec4(transformed, 1.); vTw = tw.xyz; vGl = glowAt(tw.xyz); vTh = aTree.y;');
        sh.fragmentShader = 'uniform vec3 uMoonC, uMoonD; varying vec3 vGl; varying vec3 vTw; varying float vTh;\n' + sh.fragmentShader
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float bl = pow(max(dot(normalize(vTw - cameraPosition), normalize(uMoonD)), 0.), 4.);\n totalEmissiveRadiance += diffuseColor.rgb * (vGl * 1.4 + uMoonC * bl * .35 * vTh);');
      };
      m.customProgramCacheKey = () => 'lf-tree-' + (m.map === leafTex ? 'leaf' : 'bark');
      return m;
    };
    const trunks = new THREE.Mesh(mk(tP, tN, tU, tT, tI), airyTree(new THREE.MeshLambertMaterial({ map: barkTex, color: 0x9a8e84 })));
    const crowns = new THREE.Mesh(mk(cP, cN, cU, cT, cI, cC), airyTree(new THREE.MeshLambertMaterial({ map: leafTex, alphaTest: .45, side: THREE.DoubleSide, vertexColors: true, color: 0x8c98a4 })));
    trunks.frustumCulled = crowns.frustumCulled = false; root.add(trunks, crowns);
  }

  // ---------- ground mist: soft layers drifting with the wind, thin over the clearing; shockwaves blow holes in it ----------
  const MIST = { uC: { value: COL(0) }, uA: { value: .4 } };
  {
    const ctr = V3(FWD.x, 0, FWD.z).normalize().multiplyScalar(26).add(V3(CP.x, 0, CP.z));
    for (const [y, k, sp] of [[.18, 1, .6], [.6, .75, -.4], [1.3, .5, .3]]) {
      const u = Object.assign({ uMap: { value: mistTex }, uK: { value: k }, uSp: { value: sp }, uClear: { value: CLEAR - 3 } }, MIST, AIRU);
      const m = new THREE.Mesh(new THREE.CircleGeometry(34, 48), new THREE.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, fog: false,
        vertexShader: 'varying vec2 vP; varying float vCam;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; vCam = distance(w.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: AIR + '\nuniform sampler2D uMap; uniform vec3 uC; uniform float uA, uK, uSp, uClear; varying vec2 vP; varying float vCam;\n' +
          'void main(){ float r = length(vP); vec2 dr = uFlow.xy * uSp * .3;\n float n = texture2D(uMap, vP / 9. - dr * .06).r * texture2D(uMap, vP / 23. - dr * .025).r * 3.;\n' +
          ' float a = uA * uK * min(n, 1.2) * (.35 + .65 * smoothstep(uClear, uClear + 5., r)) * smoothstep(4., 14., vCam) * (1. - smoothstep(30., 44., vCam)) * (1. - clamp(length(pushAt(vP)) * .6, 0., 1.));\n gl_FragColor = vec4(uC, a); }',
      }));
      m.rotation.x = -PI / 2; m.position.set(ctr.x, y, ctr.z); m.renderOrder = 4; m.frustumCulled = false; root.add(m);
    }
  }

  // ---------- fireflies over the grass, scattering from a shockwave ----------
  const NF = 130, fpos = new Float32Array(NF * 3), fph = new Float32Array(NF * 4);
  {
    const box = groundBox(34, 0); let n = 0;
    for (let k = 0; k < 4000 && n < NF; k++) { const x = rr(box[0], box[1]), z = rr(box[2], box[3]), y = rr(.25, 2.6), r = Math.hypot(x, z), d = dCam(x, z); if (r < CLEAR - 2 || d < 6 || d > 34 || !shows(x, z, y, 0)) continue; fpos.set([x, y, z], n * 3); fph.set([rnd() * TAU, rr(.5, 1.4), rr(.15, .5), rr(.6, 1.6)], n * 4); n++; }
  }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fgeo.setAttribute('aPh', new THREE.BufferAttribute(fph, 4));
  const fliesU = Object.assign({ uScale: { value: 400 }, uOn: { value: 1 } }, AIRU);
  const flies = new THREE.Points(fgeo, new THREE.ShaderMaterial({
    uniforms: fliesU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: AIR + '\nattribute vec4 aPh; uniform float uScale, uOn; varying float vA;\n' +
      'void main(){ vec3 p = position + vec3(sin(uT * aPh.y * .5 + aPh.x) * 1.2, sin(uT * aPh.y * .7 + aPh.x * 2.) * .35, cos(uT * aPh.y * .4 + aPh.x * 1.3) * 1.2);\n' +
      ' vec2 w = pushAt(p.xz); p.xz += w * 1.6 + windAt(p.xz) * .8; p.y += length(w) * .8;\n' +
      ' vA = uOn * pow(max(0., sin(uT * aPh.w + aPh.x * 3.)), 3.); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = vA > .01 ? aPh.z * .22 * uScale / -mv.z : 0.; }',
    fragmentShader: 'varying float vA;\nvoid main(){ float d = length(gl_PointCoord - .5) * 2.; float k = smoothstep(1., 0., d); gl_FragColor = vec4(vec3(.85, 1., .45) * (k * k + .6 * smoothstep(.35, 0., d)) * vA, 1.); }',
  }));
  flies.frustumCulled = false; flies.renderOrder = 9; root.add(flies);
  const _db = new THREE.Vector2();
  flies.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); fliesU.uScale.value = _db.y; };

  // ---------- rain: thin streaks through the frame, slanting with the wind ----------
  const NRN = 3200, rP = new Float32Array(NRN * 12), rQ = new Float32Array(NRN * 8), rI = [];
  const RC = V3(FWD.x, 0, FWD.z).normalize().multiplyScalar(16).add(V3(CP.x, 0, CP.z));
  for (let i = 0; i < NRN; i++) { const x = rr(-24, 24), z = rr(-24, 24), y = rnd(); for (let k = 0; k < 4; k++) { rP.set([x, y, z], (i * 4 + k) * 3); rQ.set([k & 1 ? 1 : -1, k >> 1], (i * 4 + k) * 2); } const b = i * 4; rI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const rainG = new THREE.BufferGeometry(); rainG.setAttribute('position', new THREE.BufferAttribute(rP, 3)); rainG.setAttribute('aQ', new THREE.BufferAttribute(rQ, 2)); rainG.setIndex(rI);
  const RAIN = { uRain: { value: 0 }, uCtr: { value: RC }, uRC: { value: COL(0xb8c4d8) }, uT: AIRU.uT, uWind: AIRU.uWind };
  const rain = new THREE.Mesh(rainG, new THREE.ShaderMaterial({
    uniforms: RAIN, transparent: true, depthWrite: false,
    vertexShader: 'attribute vec2 aQ; uniform float uT, uRain; uniform vec4 uWind; uniform vec3 uCtr; varying float vA; varying float vS;\n' +
      'void main(){ vec3 b = position; float sp = 11. + 5. * fract(b.y * 7.3);\n' +
      ' vec3 v = normalize(vec3(uWind.x * uWind.z * 7., -sp, uWind.y * uWind.z * 7.)); float y = 22. * (1. - fract(b.y + uT * sp / 22.));\n' +
      ' vec3 p = vec3(uCtr.x + b.x, y, uCtr.z + b.z) - v * aQ.y * 1.1; vec4 mv = modelViewMatrix * vec4(p, 1.), m2 = modelViewMatrix * vec4(p + v, 1.);\n' +
      ' vec2 dir = normalize(m2.xy - mv.xy + 1e-5); mv.xy += vec2(-dir.y, dir.x) * aQ.x * .0011 * -mv.z;\n' +
      ' gl_Position = projectionMatrix * mv; vA = step(fract(b.y * 13.7 + b.x * .1), uRain) * uRain * smoothstep(0., 1.5, y); vS = aQ.y; }',
    fragmentShader: 'uniform vec3 uRC; varying float vA; varying float vS;\nvoid main(){ if (vA < .01) discard; gl_FragColor = vec4(uRC, vA * .42 * (.3 + .7 * vS)); }',
  }));
  rain.frustumCulled = false; rain.renderOrder = 10; rain.visible = false; root.add(rain);

  // ---------- lightning: bolts in the sky beyond the forest (hidden behind it: they read the painting's mask), and bolts
  // that come down into the meadow ----------
  const NBQ = 72;
  function boltMesh(masked2) {
    const bP = new Float32Array(NBQ * 12), bI = []; for (let i = 0; i < NBQ; i++) { const b = i * 4; bI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(bP, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(bI);
    const u = { uC: { value: COL(0xe4eaff) }, uO: { value: 0 }, uMaskT: BU.uMaskT, uVP: { value: new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse) } };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: !masked2, side: THREE.DoubleSide,
      vertexShader: 'uniform mat4 uVP; varying vec4 vF;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vF = uVP * w; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uC; uniform float uO; uniform sampler2D uMaskT; varying vec4 vF;\nvoid main(){ ' + (masked2 ? 'vec2 q = vF.xy / vF.w * .5 + .5; if (texture2D(uMaskT, q).r > .25) discard; ' : '') + 'gl_FragColor = vec4(uC * uO, 1.); }',
    }));
    m.frustumCulled = false; m.renderOrder = masked2 ? -90 : 11; m.visible = false; root.add(m);
    return { m, g, P: bP, u };
  }
  const SKYB = boltMesh(true), GNDB = boltMesh(false);
  const _e = V3(), _f = V3(), _s = V3();
  function drawBolt(B, x0, y0, z0, x1, z1, w0, jag) {
    let q = 0; B.P.fill(0);
    const seg = (ax, ay, az, bx, by, bz, w) => {
      if (q >= NBQ) return; _e.set(bx - ax, by - ay, bz - az); _f.set(ax - CP.x, 0, az - CP.z); _s.crossVectors(_e, _f).normalize().multiplyScalar(w);
      B.P.set([ax - _s.x, ay - _s.y, az - _s.z, ax + _s.x, ay + _s.y, az + _s.z, bx - _s.x, by - _s.y, bz - _s.z, bx + _s.x, by + _s.y, bz + _s.z], q * 12); q++;
    };
    // a jagged path toward its end, with a branch now and then
    const path = (x, y, z, tx, tz, n, w, main) => {
      for (let i = 0; i < n && y > 0; i++) {
        const f = 1 / (n - i), ny = Math.max(0, y - y * f * rr(.7, 1.3)), nx = lerp(x, tx, f) + rr(-1, 1) * jag * (w + .3), nz = lerp(z, tz, f) + rr(-1, 1) * jag * (w + .3);
        seg(x, y, z, nx, i === n - 1 && main ? 0 : ny, nz, w);
        if (rnd() < .16 && w > .2) path(nx, ny, nz, nx + rr(-8, 8), nz + rr(-8, 8), 4 + (rnd() * 4 | 0), w * .45, false);
        x = nx; y = ny; z = nz;
      }
    };
    path(x0, y0, z0, x1, z1, 26, w0, true);
    B.g.attributes.position.needsUpdate = true; B.g.computeBoundingSphere();
  }
  function skyBolt() {
    // somewhere over the forest the frame sees, beyond the meadow
    rayAt(rr(.05, .95), rr(.2, .45), _q); const r = rr(90, 160), x = CP.x + _q.x * r, z = CP.z + _q.z * r;
    drawBolt(SKYB, x + rr(-10, 10), rr(60, 80), z + rr(-6, 6), x, z, .9, 4);
    BU.uBolt.value.set(x - CP.x, 40, z - CP.z).normalize();
    return r;
  }

  // ---------- birds: they sit in the forest's edge and the framing trees until a roar or a blow puts them up ----------
  const NBD = 28, BP = Array.from({ length: NBD }, () => new THREE.Vector4(0, -60, 0, 0)), BH = Array.from({ length: NBD }, () => new THREE.Vector4(0, 0, 1, 0));
  {
    const P = [], A = [], I = [];
    const tri = (b, pts) => { const s = P.length / 3; for (const p of pts) { P.push(p[0], p[1], p[2]); A.push(b); } I.push(s, s + 1, s + 2); };
    for (let b = 0; b < NBD; b++) { tri(b, [[0, 0, .3], [.06, 0, 0], [-.06, 0, 0]]); tri(b, [[.06, 0, 0], [0, 0, -.22], [-.06, 0, 0]]); tri(b, [[.05, 0, .06], [.48, 0, -.06], [.05, 0, -.1]]); tri(b, [[-.05, 0, .06], [-.05, 0, -.1], [-.48, 0, -.06]]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
    const birds = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uBP: { value: BP }, uBH: { value: BH }, uC: { value: COL(0x0e0b14) } }, side: THREE.DoubleSide,
      vertexShader: 'attribute float aB; uniform vec4 uBP[' + NBD + ']; uniform vec4 uBH[' + NBD + '];\n' +
        'void main(){ int i = int(aB + .5); vec4 P = vec4(0.), H = vec4(0., 0., 1., 0.); for (int k = 0; k < ' + NBD + '; k++) { if (k == i) { P = uBP[k]; H = uBH[k]; } }\n' +
        ' vec3 f = normalize(H.xyz + vec3(0., 0., 1e-4)), r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), u = cross(r, f); vec3 l = position;\n' +
        ' l.y += sin(H.w) * .5 * abs(l.x) * step(.07, abs(l.x)); vec3 w = P.xyz + (r * l.x + u * l.y + f * l.z) * P.w;\n gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }',
      fragmentShader: 'uniform vec3 uC;\nvoid main(){ gl_FragColor = vec4(uC, 1.); }',
    }));
    birds.frustumCulled = false; birds.renderOrder = 2; root.add(birds);
  }
  // their roosts: along the forest's edge in the frame, and in the two trees
  const ROOST = [];
  for (let i = 0; i < 40 && ROOST.length < 22; i++) { const u = rr(.05, .95); rayAt(u, .5, _q); const a = Math.atan2(CP.x + _q.x * 60, CP.z + _q.z * 60), R = 48; const x = Math.sin(a) * R, z = Math.cos(a) * R; if (shows(x, z, 14, 0)) ROOST.push(V3(x, rr(9, 16), z)); }
  const BIRDS = Array.from({ length: NBD }, (_, i) => ({ i, st: 0, p: V3(), v: V3(), t: 0, wait: 0, turn: 0, flap: rnd() * TAU, dur: 10 }));

  // ---------- drifting things: leaves, petals, turf, dust, smoke, embers, sparks, splashes ----------
  // how each moves (k): 0 a leaf or petal fluttering down, 1 thrown up (it flies, then flutters down), 2 a mote drifting on
  // the wind (pollen, an ember), 3 a splash, 4 dust billowing out and settling, 5 smoke rising and spreading, 6 a spark
  // (it flies and falls fast); how each draws: a leaf (0), a glowing dot (1), a soft puff (2)
  const NPT = 1100, pPos = new Float32Array(NPT * 3), pCol = new Float32Array(NPT * 4), pSize = new Float32Array(NPT), pRot = new Float32Array(NPT), pKind = new Float32Array(NPT);
  const PT = Array.from({ length: NPT }, () => ({ life: 0, max: 1, v: V3(), c: COL(0), a: 1, s: .1, spin: 0, k: 0 })); let ptN = 0;
  const pG = new THREE.BufferGeometry(); for (const [k, a, n] of [['position', pPos, 3], ['aCol', pCol, 4], ['aSize', pSize, 1], ['aRot', pRot, 1], ['aKind', pKind, 1]]) pG.setAttribute(k, new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage));
  const pScale = { value: 400 };
  [[leafDot, THREE.NormalBlending], [dotTex, THREE.AdditiveBlending], [puffTex, THREE.NormalBlending]].forEach(([map, blending], kind) => {
    const m = new THREE.Points(pG, new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: pScale }, transparent: true, depthWrite: false, blending,
      vertexShader: 'attribute vec4 aCol; attribute float aSize; attribute float aRot; attribute float aKind; uniform float uScale; varying vec4 vC; varying float vR;\n' +
        'void main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > .002 && abs(aKind - ' + kind + '.) < .5 ? min(aSize * uScale * projectionMatrix[1][1] / -mv.z, 512.) : 0.; }',
      fragmentShader: 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1. - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }',
    }));
    m.frustumCulled = false; m.renderOrder = 9 - kind * .1; root.add(m);
    if (!kind) m.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); pScale.value = _db.y * .5; };
  });
  function emit(x, y, z, vx, vy, vz, life, c, a, s, spin, k) {
    const P = PT[ptN], i = ptN; ptN = (ptN + 1) % NPT; k = k || 0; P.life = P.max = life; P.v.set(vx, vy, vz); P.c.copy(c); P.a = a; P.s = s; P.spin = spin || 0; P.k = k;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pRot[i] = rnd() * TAU; pKind[i] = k === 0 || k === 1 ? 0 : k === 4 || k === 5 ? 2 : 1;
  }

  // ---------- rocks and clods of turf thrown up by the big blows: they fly, tumble, bounce and settle, then sink away ----------
  const NDB = 140;
  const debris = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: .95, flatShading: true }), NDB);
  debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage); debris.frustumCulled = false; debris.count = NDB; root.add(debris);
  const DBR = Array.from({ length: NDB }, () => ({ on: false, p: V3(), v: V3(), q: new THREE.Quaternion(), w: V3(), s: .1, life: 0, rest: 0 }));
  const _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _sv = V3(), ROCKC = [COL(0x4b4a52), COL(0x3c3428), COL(0x5a5560), COL(0x46562e)];
  let dbN = 0;
  { const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < NDB; i++) { debris.setMatrixAt(i, z); debris.setColorAt(i, ROCKC[i % 4]); } debris.instanceMatrix.needsUpdate = true; if (debris.instanceColor) debris.instanceColor.needsUpdate = true; }
  function throwDebris(x, z, s, n) {
    for (let k = 0; k < n; k++) {
      const D = DBR[dbN], a = rnd() * TAU, r = rr(.3, 1.6) * Math.sqrt(s), sp = rr(2, 6.5) * s; dbN = (dbN + 1) % NDB;
      D.on = true; D.p.set(x + Math.sin(a) * r, .1, z + Math.cos(a) * r); D.v.set(Math.sin(a) * sp, rr(4, 9) * Math.sqrt(s), Math.cos(a) * sp);
      D.q.setFromEuler(new THREE.Euler(rnd() * TAU, rnd() * TAU, 0)); D.w.set(rr(-9, 9), rr(-9, 9), rr(-9, 9)); D.s = rr(.06, .2) * (.7 + .5 * s); D.life = rr(4, 7); D.rest = 0;
    }
  }

  // ==================================================================================================================
  // what happens in it, and every frame
  // ==================================================================================================================
  const RING = [0, 1, 2, 3].map(() => ({ x: 0, z: 0, r: 0, s: 0, s0: 0, t: 0 })), VT = new THREE.Vector4(0, 0, 9, 0);
  let ringN = 0, decN = 0;
  const DECS = Array.from({ length: 8 }, () => ({ s: 0, life: 0, max: 1 }));
  const GRASSC = [COL(0x7a9048), COL(0x5e7c36), COL(0xa09858), COL(0x5e4e36)], DUST = COL(0x8a7e66), C1 = COL(0);
  const dust = () => C1.copy(DUST).lerp(NIGHT.haze, .35).multiplyScalar(.55);
  function startle(ox, oz, s) {
    for (const B of BIRDS) {
      if (B.st !== 0 || rnd() > s * 1.3) continue;
      const R = ROOST[B.i % ROOST.length] || V3(0, 12, -48); B.p.set(R.x + rr(-3, 3), R.y + rr(-2, 2), R.z + rr(-2, 2));
      _q.set(B.p.x - ox, 0, B.p.z - oz).normalize(); B.v.set(_q.x * rr(3, 6) + rr(-2, 2), rr(4, 7), _q.z * rr(2, 4));
      B.st = 1; B.t = -rr(0, .5); B.dur = 9; B.turn = rr(-.6, .6);
    }
    for (const T of TREES) if (rnd() < s) T.leaves += 6 * s;
  }
  function impact(x, z, s) {
    const R = RING[ringN++ % 4]; Object.assign(R, { x, z, r: 0, s, s0: s, t: 0 });
    for (const T of TREES) T.shake = Math.max(T.shake, s * .9 * cl(1.5 - Math.hypot(T.x - x, T.z - z) / 30, 0, 1));
    for (let n = 0, m = Math.round(34 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(.6, 2.6), sp = rr(2, 5) * s;
      emit(x + Math.sin(a) * r, .1, z + Math.cos(a) * r, Math.sin(a) * sp, rr(3, 7) * Math.sqrt(s), Math.cos(a) * sp, rr(1.6, 2.6), GRASSC[(rnd() * 4) | 0], 1, rr(.16, .3), rr(-9, 9), 1);
    }
    // dust billowing out in a ring round where it landed
    for (let n = 0, m = Math.round(22 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(.4, 2.2), sp = rr(3, 8) * s;
      emit(x + Math.sin(a) * r, rr(.2, .6), z + Math.cos(a) * r, Math.sin(a) * sp, rr(.3, 1.2), Math.cos(a) * sp, rr(2.2, 3.6), dust(), .36, rr(1, 1.8) * (.6 + .5 * s), rr(-.6, .6), 4);
    }
    if (s > .45) throwDebris(x, z, s, Math.round(10 * s));
    if (s > .4) startle(x, z, s);
  }
  function roar(s) {
    for (const T of TREES) { T.shake = Math.max(T.shake, s * .7); T.leaves += 10 * s; }
    startle(0, 0, s);
  }
  // a mark on the ground: kind 'crack' or 'scorch', with o: { glow (0 to 1), color: 'vein' | 'ember', life (seconds) }
  function decal(kind, x, z, r, o) {
    o = o || {}; const i = decN++ % 8, D = DECS[i];
    DECU.uDec.value[i].set(x, z, r, 1); DECU.uDecK.value[i].set(kind === 'scorch' ? 2 : 1, o.glow || 0, rnd() * 50, o.color === 'ember' ? 1 : 0);
    D.s = 1; D.life = D.max = o.life || 14;
  }
  const GL = GLOWU.uGlowP.value, GC = GLOWU.uGlowC.value;
  function glow(i, x, y, z, r, color, intensity) { if (r <= 0 || !intensity || !color) { GL[i].w = 0; return; } GL[i].set(x, y, z, r); GC[i].set(color.r, color.g, color.b).multiplyScalar(intensity); }
  // lightning straight down into the meadow (a wrath's red bolts): a blinding flash, a scorch, sparks and burning grass
  let gBoltT = -1, strikeAt = null;
  function strike(x, z) {
    drawBolt(GNDB, x + rr(-6, 6), 46, z + rr(-4, 4), x, z, .55, 2.4); gBoltT = 0; strikeAt = V3(x, 0, z);
    GNDB.u.uC.value.copy(wrathV > .5 ? RED : FLASHC).lerp(FLASHC, .35);
    decal('scorch', x, z, 2.4, { glow: 1, color: 'ember', life: 16 }); impact(x, z, .7);
    for (let n = 0; n < 40; n++) { const a = rnd() * TAU, sp = rr(3, 9); emit(x, .3, z, Math.sin(a) * sp, rr(3, 9), Math.cos(a) * sp, rr(.5, 1.1), C1.setRGB(1, .8, .5), 1, rr(.05, .09), 0, 6); }
    flashV = 1; if (api.onThunder) api.onThunder(1, true);
  }

  let wName = 'clear', wT = 0, wN = 0, wrathT = 0, wrathV = 0, wet = 0, flashV = 0, boltT = -1, nextStrike = 4, moonCover = 0, rainNow = 0;
  const thunder = [], RELIGHT = V3(), _c = COL(0);
  // how much of the moon a drifting cloud covers (the same noise as the backdrop's clouds), to dim the moonlight with it
  const hh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return lerp(lerp(hh(ix, iy), hh(ix + 1, iy), fx), lerp(hh(ix, iy + 1), hh(ix + 1, iy + 1), fx), fy); };
  const vf = (x, y) => vn(x, y) * .55 + vn(x * 2.03 + 7.1, y * 2.03 + 7.1) * .3 + vn(x * 4.01 + 3.3, y * 4.01 + 3.3) * .15;
  function cloudAtMoon() {
    const F = AIRU.uFlow.value, k = 1.6 / Math.max(.06, MOOND.y + .18), cx = MOOND.x * k - F.x * .008, cz = MOOND.z * k - F.y * .008;
    const n = vf(cx * .42, cz * .42) * .62 + vf(cx * 1.25 + 4, cz * 1.25 + 4) * .38, cv = BU.uCloud.value;
    return sm(1 - cv, 1.16 - cv, n);
  }
  function update(t, dt) {
    dt = dt > 0 ? Math.min(dt, .05) : 0;
    AIRU.uT.value = t;
    // weather and a wrath ease in and out: a storm rolls in over several seconds and clears again
    wN += (Math.max(wT, wrathT > .5 ? .9 : 0) - wN) * (1 - Math.exp(-dt * .45)); wrathV += (wrathT - wrathV) * (1 - Math.exp(-dt * 1.2));
    const rainK = sm(.32, .7, wN), storm = sm(.7, 1, wN); rainNow = rainK;
    wet = cl(wet + dt * (rainK > .1 ? .15 * rainK : -.025), 0, 1); AIRU.uWet.value = wet;
    // the wind wanders, and blows harder in rain, a storm and a wrath; the clouds drift with it and the gusts roll along it
    const W = AIRU.uWind.value, F = AIRU.uFlow.value, wa = .6 + .45 * Math.sin(t * .021) + .2 * Math.sin(t * .057 + 1);
    W.x = Math.cos(wa); W.y = Math.sin(wa); W.z = .3 + .6 * wN + .4 * wrathV; W.w = .5 + .5 * wN;
    F.x += W.x * (2 + 4 * W.z) * dt; F.y += W.y * (2 + 4 * W.z) * dt; F.z += dt * (.4 + .6 * W.z); F.w = .5 * (1 - sm(.3, .7, wN)) * (1 - moonCover);
    RING.forEach((R, i) => { const U = AIRU.uRings.value[i]; if (R.s > .002) { R.t += dt; R.r = 19 * (1 - Math.exp(-R.t * 1.15)); R.s = R.s0 * Math.exp(-R.t * 1.25); U.set(R.x, R.z, R.r, R.s); } else U.w = 0; });
    const VO = AIRU.uVortex.value; VO.x = VT.x; VO.y = VT.y; VO.z = VT.z; VO.w += (VT.w - VO.w) * (1 - Math.exp(-dt * 2.5));
    // lightning in a storm or a wrath, and the thunder after it
    if ((storm > .5 || wrathV > .6) && dt > 0 && (nextStrike -= dt) <= 0) {
      nextStrike = rr(3, 8) * (wrathV > .6 ? .7 : 1); const dist = skyBolt(); boltT = 0;
      SKYB.u.uC.value.copy(wrathV > .5 ? RED : FLASHC); BU.uBoltC.value.copy(SKYB.u.uC.value); thunder.push(.3 + dist / 90 * 1.6);
    }
    if (boltT >= 0) { boltT += dt; const f = boltT < .07 ? 1 : boltT < .13 ? .25 : boltT < .2 ? .85 : Math.max(0, 1 - (boltT - .2) * 4); SKYB.u.uO.value = f; SKYB.m.visible = f > .01; flashV = Math.max(flashV * Math.exp(-dt * 8), f * .8); if (boltT > .5) { boltT = -1; SKYB.m.visible = false; } }
    else flashV *= Math.exp(-dt * 6);
    if (gBoltT >= 0) { gBoltT += dt; const f = gBoltT < .09 ? 1 : gBoltT < .14 ? .3 : gBoltT < .24 ? .9 : Math.max(0, 1 - (gBoltT - .24) * 3.5); GNDB.u.uO.value = f * 1.4; GNDB.m.visible = f > .01; flashV = Math.max(flashV, f); if (gBoltT > .6) { gBoltT = -1; GNDB.m.visible = false; } }
    for (let i = thunder.length - 1; i >= 0; i--) if ((thunder[i] -= dt) <= 0) { thunder.splice(i, 1); if (api.onThunder) api.onThunder(.5 + .5 * storm, false); }
    // the sky's clouds, and how much they hide the moon
    BU.uCloud.value = lerp(.24, 1.04, wN) + .12 * wrathV; BU.uStorm.value = sm(.15, .9, wN); BU.uWrath.value = wrathV; BU.uFlash.value = flashV; BU.uRain.value = rainK;
    moonCover += (Math.max(cloudAtMoon(), storm) - moonCover) * (1 - Math.exp(-dt * 2));
    BU.uMoonC.value.copy(MOONC).lerp(RED, wrathV * .6);
    // the light: the Night square's moonlight, dimmed while a cloud crosses the moon, greyer in bad weather, reddened in a
    // wrath, and lightning's flash
    light.color.copy(NIGHT.lc).lerp(GREY, .55 * wN).lerp(RED, .45 * wrathV).lerp(FLASHC, .7 * flashV);
    light.I = NIGHT.li * (1 - .3 * storm) * (1 - .55 * moonCover) + 1.3 * flashV;
    light.hemiSky.copy(NIGHT.hs).lerp(GREY, .35 * wN).lerp(WRATHSKY, .4 * wrathV); light.hemiGround.copy(NIGHT.hg);
    light.hemiI = NIGHT.hi * (1 - .25 * wN) + 1.4 * flashV; light.fillI = NIGHT.fi * (1 - .25 * wN);
    irr(light, RELIGHT); BU.uRelight.value.set(cl(RELIGHT.x / IRR0.x, 0, 4), cl(RELIGHT.y / IRR0.y, 0, 4), cl(RELIGHT.z / IRR0.z, 0, 4));
    const haze = _c.copy(NIGHT.haze).lerp(STORMC, .45 * wN).lerp(RED, .12 * wrathV); BU.uHaze.value.copy(haze); FOG.color.copy(haze);
    MIST.uC.value.copy(haze).multiplyScalar(1.25 + .3 * flashV); MIST.uA.value = (.5 + .3 * rainK + .2 * storm) * .55;
    fliesU.uOn.value = 1 - rainK; RAIN.uRain.value = rainK; rain.visible = rainK > .01;
    RAIN.uRC.value.setRGB(.6, .66, .78).multiplyScalar(.55 + flashV);
    // the marks on the ground fade
    DECS.forEach((D, i) => { if (D.s > 0) { D.life -= dt; D.s = cl(D.life / Math.min(4, D.max), 0, 1); DECU.uDec.value[i].w = D.s; } });
    // the trees shake and shed leaves; the wind takes some at any time
    TREES.forEach((T, i) => {
      T.shake *= Math.exp(-dt * 2.2); AIRU.uShake.value[i] = T.shake;
      T.leaves += dt * (.2 + 1.2 * W.z * W.w + 40 * T.shake);
      while (T.leaves >= 1) { T.leaves -= 1; _q.set(rr(-1, 1), rr(-.6, .8), rr(-1, 1)).normalize(); const g = rnd(); emit(T.c.x + _q.x * T.R * .9, T.c.y + _q.y * T.R * .6, T.c.z + _q.z * T.R * .9, 0, -.5, 0, rr(5, 8), C1.setRGB(.3 + .35 * g, .42 + .1 * g, .2), 1, rr(.18, .28), rr(-4, 4)); }
    });
    if (dt > 0) {
      // embers in a wrath, splashes in the rain, and grass and dust torn up round a whirlwind
      for (let n = 0, m = (wrathV * 34 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(2, 18); emit(Math.sin(a) * r, rr(0, 2), Math.cos(a) * r + 4, 0, rr(.8, 1.6), 0, rr(2, 3.5), C1.setRGB(1, .45, .12), 1, rr(.06, .1), 0, 2); }
      for (let n = 0, m = (rainK * 170 * dt + rnd()) | 0; n < m; n++) { rayAt(rnd(), rr(.6, 1), _q); const tt = Math.min(-CP.y / Math.min(-.01, _q.y), 30); emit(CP.x + _q.x * tt, .03, CP.z + _q.z * tt, rr(-.4, .4), rr(1, 1.8), rr(-.4, .4), .32, C1.setRGB(.8, .86, .95), .6, .05, 0, 3); }
      for (let n = 0, m = (VO.w * 70 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(.5, 1.2) * VO.z; emit(VO.x + Math.sin(a) * r, .2, VO.y + Math.cos(a) * r, 0, rr(3, 6), 0, rr(2.5, 4), GRASSC[(rnd() * 3) | 0], 1, rr(.18, .32), rr(-9, 9), 1); }
      for (let n = 0, m = (VO.w * 16 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(.3, 1) * VO.z; emit(VO.x + Math.sin(a) * r, .3, VO.y + Math.cos(a) * r, 0, rr(.3, 1.2), 0, rr(2, 3.2), dust(), .2, rr(1, 1.8), 0, 4); }
      if (strikeAt && gBoltT >= 0 && gBoltT < .5) for (let n = 0; n < 2; n++) emit(strikeAt.x + rr(-.6, .6), .2, strikeAt.z + rr(-.6, .6), 0, rr(1, 2), 0, rr(1.5, 2.5), C1.setRGB(.12, .1, .12), .45, rr(.6, 1.1), rr(-1, 1), 5);
    }
    const vw = VO.w > .01;
    for (let i = 0; i < NPT; i++) {
      const P = PT[i];
      if (P.life <= 0) { if (pCol[i * 4 + 3]) { pCol[i * 4 + 3] = 0; pSize[i] = 0; } continue; }
      P.life -= dt; const age = 1 - Math.max(0, P.life) / P.max, V = P.v;
      if (P.k === 3 || P.k === 6) V.y -= 9.8 * dt;
      else if (P.k === 1) { V.y -= 7 * dt; V.multiplyScalar(Math.exp(-dt * 1.2)); if (V.y < -1.2) P.k = 0; }
      else if (P.k === 4) { const d = Math.exp(-dt * 1.4); V.x = V.x * d + W.x * W.z * .9 * (1 - d); V.z = V.z * d + W.y * W.z * .9 * (1 - d); V.y = V.y * d + .2 * (1 - d); }
      else if (P.k === 5) { const d = Math.exp(-dt * .8); V.x = V.x * d + W.x * W.z * 1.4 * (1 - d); V.z = V.z * d + W.y * W.z * 1.4 * (1 - d); V.y = V.y * d + .9 * (1 - d); }
      else { const kk = P.k ? .6 : .9, sp = P.k ? 1.2 : 2.4; V.x += (W.x * W.z * sp - V.x) * dt * kk; V.z += (W.y * W.z * sp - V.z) * dt * kk; if (!P.k) V.y = -.55 + .35 * Math.sin(t * 3 + i); }
      let x = pPos[i * 3] + V.x * dt, y = pPos[i * 3 + 1] + V.y * dt, z = pPos[i * 3 + 2] + V.z * dt;
      if (vw && P.k !== 3) { const dx = x - VO.x, dz = z - VO.y, d = Math.hypot(dx, dz) + .001, f = VO.w * sm(VO.z * 1.6, VO.z * .5, d) * sm(.5, 3, d) * dt; x += (-dz * 9 + dx * .6) / d * f; z += (dx * 9 + dz * .6) / d * f; y += 2.4 * f; }
      if (P.k === 6 && y < .02) { V.y = -V.y * .35; V.x *= .6; V.z *= .6; }
      pPos[i * 3] = x; pPos[i * 3 + 1] = Math.max(.02, y); pPos[i * 3 + 2] = z; pRot[i] += P.spin * dt;
      const fa = Math.min(1, age / .1) * (1 - age * age); pCol[i * 4] = P.c.r; pCol[i * 4 + 1] = P.c.g; pCol[i * 4 + 2] = P.c.b; pCol[i * 4 + 3] = P.a * fa;
      pSize[i] = P.k === 4 ? P.s * (1 + 1.8 * age) : P.k === 5 ? P.s * (1 + 2.6 * age) : P.s;
    }
    for (const k of ['position', 'aCol', 'aSize', 'aRot', 'aKind']) pG.attributes[k].needsUpdate = true;
    // the rocks and clods
    let any = false;
    for (let i = 0; i < NDB; i++) {
      const D = DBR[i]; if (!D.on) continue; any = true;
      D.life -= dt; if (D.life <= 0) { D.on = false; debris.setMatrixAt(i, _m4.makeScale(0, 0, 0)); continue; }
      if (D.rest < 1) {
        D.v.y -= 9.8 * dt; D.p.addScaledVector(D.v, dt);
        if (D.p.y < D.s * .6) { D.p.y = D.s * .6; if (D.v.y < -1.5) { D.v.y *= -.32; D.v.x *= .55; D.v.z *= .55; D.w.multiplyScalar(.5); } else { D.v.set(0, 0, 0); D.rest = 1; } }
        _qq.setFromEuler(new THREE.Euler(D.w.x * dt, D.w.y * dt, D.w.z * dt)); D.q.multiply(_qq);
      }
      const sc = D.s * Math.min(1, D.life / 1.2); debris.setMatrixAt(i, _m4.compose(D.p, D.q, _sv.set(sc, sc * .75, sc)));
    }
    if (any) debris.instanceMatrix.needsUpdate = true;
    // the birds: up and away when startled, back to roost later
    for (const B of BIRDS) {
      const bp = BP[B.i], bh = BH[B.i];
      if (B.st === 1) {
        B.t += dt; if (B.t < 0) { bp.w = 0; continue; }
        const c = Math.cos(B.turn * dt), s = Math.sin(B.turn * dt), vx = B.v.x * c - B.v.z * s; B.v.z = B.v.x * s + B.v.z * c; B.v.x = vx;
        B.v.y += ((B.p.y < 30 ? 3.5 : -.5) - B.v.y) * dt * .8; const hs = Math.hypot(B.v.x, B.v.z) || 1; B.v.x *= (8.5 / hs - 1) * dt + 1; B.v.z *= (8.5 / hs - 1) * dt + 1;
        B.p.addScaledVector(B.v, dt); B.flap += dt * (B.v.y > 1 ? 22 : 12 * (.5 + .5 * Math.sin(B.t * 1.3)));
        bp.set(B.p.x, B.p.y, B.p.z, 1); bh.set(B.v.x, B.v.y * .5, B.v.z, B.flap);
        if (B.t > B.dur) { B.st = 2; B.wait = rr(15, 35); bp.w = 0; }
      } else { bp.w = 0; if (B.st === 2 && (B.wait -= dt) <= 0) B.st = 0; }
    }
  }

  const api = {
    root, camera: cam, update, light, impact, roar, decal, glow, strike, onThunder: null, stats: STATS, fog: FOG,
    bake, get baked() { return !!painted; },
    get flash() { return flashV; }, get wet() { return wet; }, get rain() { return rainNow; }, get wrath() { return wrathV; }, get wind() { return AIRU.uWind.value; },
    get weather() { return wName; }, setWeather(n) { if (n === 'clear' || n === 'rain' || n === 'storm') { wName = n; wT = n === 'clear' ? 0 : n === 'rain' ? .55 : 1; } },
    setWrath(w) { wrathT = cl(+w || 0, 0, 1); },
    vortex(x, z, r, s) { VT.set(x, z, r, s); },
    emit, throwDebris,
    setDebug(on) { BU.uDebug.value = on ? 1 : 0; },
    // a painting to use instead of the one drawn in code (an image, or a canvas): it is fitted to the frame as a cover,
    // and the live shader treats it as it treats its own (the mask of what is sky, far things and ground stays the
    // painted one's, so a painting should keep the guide's horizon and forest line); null goes back to the code's own
    usePainting(img) {
      if (!img) { BU.uPaint.value = painted; return; }
      const c = cvs(FW, FH), g = c.getContext('2d'), iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(FW / iw, FH / ih);
      g.drawImage(img, (FW - iw * k) / 2, (FH - ih * k) / 2, iw * k, ih * k);
      const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      if (BU.uPaint.value && BU.uPaint.value !== painted) BU.uPaint.value.dispose();
      BU.uPaint.value = t;
    },
    // the painting as a picture (for saving, or to give an image generator as a guide to paint over)
    painting(which) {
      if (!painted) return null; const c = cvs(FW, FH), g = c.getContext('2d'), im = g.createImageData(FW, FH), a = (which === 'mask' ? maskT : painted).image.data;
      for (let y = 0; y < FH; y++) im.data.set(a.subarray((FH - 1 - y) * FW * 4, (FH - y) * FW * 4), y * FW * 4);
      for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255; g.putImageData(im, 0, 0); return c;
    },
  };
  update(0, 0);
  return api;
}
