// meadow.js: a wild meadow at the edge of the forest for a model bench to stand a creature in, as alive as it can be made.
// three.js r128 (global THREE). Defines makeMeadow(opts) only. Tall grass that waves as gusts of wind roll across it; a
// sky that turns through the day and the night (sun, moon, drifting clouds and their shadows on the grass; no stars: the
// sky has none until the ending, when opts.stars may light them), the
// sun setting through an opening in the forest; weather from clear to rain to a thunderstorm (rain, puddles, lightning
// and thunder); mist, fireflies, falling leaves and pollen; birds in the trees and bats round two lanterns that swing on
// their posts. And it answers what happens in it: shockwaves roll out through the grass and the mist, throwing up turf
// and dust; a whirlwind swirls them; a roar sends the birds up out of the trees and shakes the leaves down; and a
// creature's wrath turns the sky into a red storm. Everything is painted in code; most of it moves on the GPU.
// opts: { radius (of the clear middle, where the grass is short; default 11 m), rings (how far the metre rings run; 12 m),
//   lamps (where the two lanterns stand and how bright they are: [[x, z, strength], [x, z, strength]]), grass (its size; 1) }
// Returns { root, update(t, dt, camera), setTime(hours), time, timeRate (hours per second; 0 holds it), day (whether the
//   sun is up), setDay(on) (noon or 10 pm), setWeather('clear' | 'rain' | 'storm'), weather, setWrath(0 to 1),
//   impact(x, z, strength), roar(strength), vortex(x, z, radius, strength), light (the lights the bench should set:
//   hemiSky, hemiGround, hemiI, dir, color, I, fillC, fillI), flash (lightning, 0 to 1), onThunder (called with a strength
//   when thunder rolls), setRings(on), setScenery(on) }.
// Its two lanterns are point lights of its own; the bench's hemisphere and directional lights follow `light`, which at
// night is the battle screen's Night square rig.
function makeMeadow(opts) {
  'use strict';
  opts = opts || {};
  const CLEAR = opts.radius || 11, RM = opts.rings || 12, GS = opts.grass || 1, TAU = Math.PI * 2, PI = Math.PI, STARS = !!opts.stars;
  let seed = 7717;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0), V4 = () => new THREE.Vector4(0, 0, 0, 0), COL = (h) => new THREE.Color(h), YUP = V3(0, 1, 0);
  const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
  // mipmaps that keep their cover: each smaller level is drawn from the one before with its alpha raised, so grass and
  // leaves seen from far off stay full instead of thinning away to their darkest roots
  const fullMips = (c) => {
    const t = tex(c), m = [c]; let p = c;
    while (p.width > 1 || p.height > 1) {
      const q = cvs(Math.max(1, p.width >> 1), Math.max(1, p.height >> 1)), g = q.getContext('2d'); g.drawImage(p, 0, 0, q.width, q.height);
      const d = g.getImageData(0, 0, q.width, q.height), a = d.data; for (let i = 3; i < a.length; i += 4) a[i] = Math.min(255, a[i] * 1.3);
      g.putImageData(d, 0, 0); m.push(q); p = q;
    }
    t.mipmaps = m; t.generateMipmaps = false; return t;
  };
  const root = new THREE.Group(); root.name = 'Meadow';
  const scenery = new THREE.Group(); root.add(scenery);

  // ---------- the air: one wind for everything, shockwaves (x, z, radius, strength) and a whirlwind ----------
  // uWind: its direction (x, z), its strength and how gusty it is; uFlow: how far the clouds have drifted (x, z), how far
  // the gusts have rolled, and how dark the clouds' shadows are on the ground
  const AIRU = {
    uT: { value: 0 }, uWind: { value: new THREE.Vector4(.83, .55, .4, .7) }, uFlow: { value: V4() }, uRings: { value: [V4(), V4(), V4(), V4()] }, uVortex: { value: new THREE.Vector4(0, 0, 9, 0) },
    uWet: { value: 0 }, uShake: { value: [0, 0, 0, 0, 0, 0] },
  };
  // GLSL for everything that moves with the air: value noise, the wind at a place on the ground (a slow sway everywhere and
  // gusts that roll across in the wind's direction), and how far the shockwaves and the whirlwind push it
  const AIR = [
    'uniform float uT; uniform vec4 uWind; uniform vec4 uFlow; uniform vec4 uRings[4]; uniform vec4 uVortex;',
    'float mh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float mn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(mh(i), mh(i + vec2(1., 0.)), f.x), mix(mh(i + vec2(0., 1.)), mh(i + vec2(1., 1.)), f.x), f.y); }',
    'float mf(vec2 p){ return mn(p) * .55 + mn(p * 2.03 + 7.1) * .3 + mn(p * 4.01 + 3.3) * .15; }',
    'vec2 windAt(vec2 p){ vec2 d = uWind.xy; float a = dot(p, d), c = dot(p, vec2(-d.y, d.x));',
    ' float g = smoothstep(.38, .82, mf(vec2(a * .06 - uFlow.z, c * .045))) * uWind.w;',
    ' return d * (uWind.z * (.22 + 1.3 * g) + .05 * sin(uT * 1.9 + a * .35 + c * .2)); }',
    'vec2 pushAt(vec2 p){ vec2 o = vec2(0.);',
    ' for (int i = 0; i < 4; i++) { vec4 R = uRings[i]; if (R.w > .002) { vec2 v = p - R.xy; float d = length(v) + .001;',
    '  o += v / d * R.w * (exp(-pow((d - R.z) / 1.8, 2.)) * 2.2 + .5 * step(d, R.z) * smoothstep(0., 4., R.z - d) * exp(-(R.z - d) * .25)); } }',
    ' vec2 v = p - uVortex.xy; float d = length(v) + .001;',
    ' o += (vec2(-v.y, v.x) * 1.6 + v * .3) / d * uVortex.w * smoothstep(uVortex.z * 1.6, uVortex.z * .5, d) * smoothstep(.5, 3., d);',
    ' return o; }'].join('\n');
  // the clouds' shadows on the ground, drifting with the wind (the same sum of waves as cloudAt below, so the bench's light
  // can dim when one passes over the middle)
  const CSH = 'uniform vec4 uFlow;\nfloat cshade(vec2 p){ vec2 q = (p - uFlow.xy) * .05; return smoothstep(.3, .7, sin(q.x + 1.3 * sin(q.y * .7 + 1.1)) * sin(q.y * .83 + 1.1 * sin(q.x * .6 + 1.7))) * uFlow.w; }\n';
  const cloudAt = (x, z) => { const F = AIRU.uFlow.value, qx = (x - F.x) * .05, qz = (z - F.y) * .05; return sm(.3, .7, Math.sin(qx + 1.3 * Math.sin(qz * .7 + 1.1)) * Math.sin(qz * .83 + 1.1 * Math.sin(qx * .6 + 1.7))) * F.w; };

  // ---------- painted textures ----------
  // grass: an atlas of four cards, a tuft of blades and three tufts in flower (white, gold and violet), base at the bottom
  const grassTex = (() => {
    const W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d'); g.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const ox = k * 256;
      for (let i = 0; i < (k ? 22 : 44); i++) {
        const x = ox + rr(30, 226), h = rr(110, 250), lean = rr(-55, 55), w = rr(2.5, 6), sh = rr(.7, 1);
        const q = g.createLinearGradient(0, H, 0, H - h); q.addColorStop(0, 'rgb(' + (92 * sh | 0) + ',' + (118 * sh | 0) + ',' + (58 * sh | 0) + ')'); q.addColorStop(1, 'rgb(' + (200 * sh | 0) + ',' + (230 * sh | 0) + ',' + (150 * sh | 0) + ')');
        g.strokeStyle = q; g.lineWidth = w; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * .25, H - h * .6, x + lean, H - h); g.stroke();
      }
      if (k) for (let i = 0; i < 9; i++) { // flowers on thin stalks
        const x = ox + rr(50, 206), y = rr(30, 120), col = ['', '#f4f0f6', '#ffd23e', '#b07ae8'][k];
        g.strokeStyle = 'rgb(80,120,60)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + rr(-12, 12), (H + y) / 2, x, y); g.stroke();
        g.fillStyle = col; for (let p = 0; p < 6; p++) { const a = p / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 3.5, a, 0, TAU); g.fill(); }
        g.fillStyle = k === 2 ? '#c88a10' : '#f0c040'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
      }
    }
    return fullMips(c);
  })();
  // the ground: meadow turf, clover and dry patches, little flowers; the clearing is trampled (see the ground's shader)
  const groundTex = (() => {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = '#58693c'; g.fillRect(0, 0, S, S);
    const wrapFill = (x, y, r, col) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, col); q.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); };
    for (let i = 0; i < 80; i++) wrapFill(rnd() * S, rnd() * S, rr(40, 150), ['rgba(40,58,30,.4)', 'rgba(110,128,60,.35)', 'rgba(128,110,60,.3)', 'rgba(70,96,46,.4)'][(rnd() * 4) | 0]);
    for (let i = 0; i < 26000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(20,34,14,.25)' : 'rgba(190,220,140,.1)'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 2 + rnd() * 4); }
    for (let i = 0; i < 500; i++) { const x = rnd() * S, y = rnd() * S; g.fillStyle = ['rgba(240,240,250,.8)', 'rgba(255,214,70,.8)', 'rgba(180,130,230,.75)'][(rnd() * 3) | 0]; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.arc(x + ox, y + oy, 1.5 + rnd() * 1.5, 0, TAU); g.fill(); } }
    const t = tex(c, 16, 16); t.anisotropy = 8; return t;
  })();
  // a cluster of leaves, for the near trees' crowns
  const leafTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 150; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 100, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, s = rr(.7, 1.3), sh = rr(.5, 1.05);
      g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = 'rgb(' + (60 * sh | 0) + ',' + (100 * sh | 0) + ',' + (45 * sh | 0) + ')';
      g.beginPath(); g.ellipse(0, 0, 14 * s, 7 * s, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,40,14,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-13 * s, 0); g.lineTo(13 * s, 0); g.stroke(); g.restore();
    }
    return fullMips(c);
  })();
  // bark for the near trees: grey-brown, furrowed
  const barkTex = (() => {
    const W = 128, H = 256, c = cvs(W, H), g = c.getContext('2d'); g.fillStyle = '#4a3c32'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = rnd() * W, w = rr(2, 7); g.fillStyle = rnd() < .5 ? 'rgba(20,14,10,.5)' : 'rgba(130,112,96,.25)'; for (const ox of [-W, 0, W]) g.fillRect(x + ox, 0, w, H); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(10,8,6,.35)'; g.fillRect(rnd() * W, rnd() * H, rr(3, 9), 1.5); }
    return tex(c, 2, 3);
  })();
  // sprites: a soft dot and a falling leaf (pale, tinted per particle)
  const dotTex = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.3, 'rgba(255,255,255,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
  const leafDot = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 26, 12, .5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 46); g.lineTo(54, 18); g.stroke(); return tex(c); })();

  // ---------- the sky: the hour's colors, the sun and the moon, stars, and clouds that drift with the wind ----------
  const NOISE2 = AIR.split('\n').slice(1, 4).join('\n') + '\n';
  const SKY = {
    uTop: { value: COL(0) }, uMid: { value: COL(0) }, uHor: { value: COL(0) }, uSunDir: { value: V3(0, 1, 0) }, uSunC: { value: COL(0) }, uSunUp: { value: 0 },
    uMoonDir: { value: V3(0, 1, 0) }, uMoonC: { value: COL(0xdfe4ff) }, uMoonUp: { value: 0 }, uStars: { value: 1 }, uCloud: { value: .3 }, uCloudC: { value: COL(0) }, uCloudL: { value: COL(0) },
    uLDir: { value: V3(0, 1, 0) }, uFlash: { value: 0 }, uBolt: { value: V3(0, 1, 0) }, uBoltC: { value: COL(0xd8e0ff) }, uWrath: { value: 0 }, uT: AIRU.uT, uWind: AIRU.uWind, uFlow: AIRU.uFlow,
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(95, 48, 24), new THREE.ShaderMaterial({
    uniforms: SKY, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD;\nvoid main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform vec3 uTop, uMid, uHor, uSunDir, uSunC, uMoonDir, uMoonC, uCloudC, uCloudL, uLDir, uBolt, uBoltC; uniform float uSunUp, uMoonUp, uStars, uCloud, uFlash, uWrath, uT; uniform vec4 uWind, uFlow; varying vec3 vD;',
      'float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
      NOISE2,
      'void main(){',
      ' vec3 d = normalize(vD); float y = d.y;',
      ' vec3 c = mix(uHor, uMid, smoothstep(-.02, .22, y)); c = mix(c, uTop, smoothstep(.22, .85, y));',
      ' float s = max(dot(d, uSunDir), 0.), m = max(dot(d, uMoonDir), 0.);',
      ' c += uSunC * uSunUp * (pow(s, 6.) * .3 + pow(s, 60.) * .7 + smoothstep(.9993, .9996, s) * 2.5);',
      ' c += uMoonC * uMoonUp * (pow(m, 8.) * .16 + pow(m, 50.) * .35 + smoothstep(.99935, .9996, m) * 1.4);',
      ' vec2 cu = d.xz / max(.08, y + .2) * 1.7 - uFlow.xy * .008;',
      ' float n = mf(cu * .42) * .62 + mf(cu * 1.25 + 4.) * .38, cov = smoothstep(1. - uCloud, 1.16 - uCloud, n) * smoothstep(-.03, .16, y);',
      ' vec3 p = d * 140., i = floor(p), f = fract(p); vec3 q = vec3(h3(i), h3(i + 1.7), h3(i + 3.1));',
      ' float st = step(.982, h3(i + 9.3)) * smoothstep(.16, 0., length(f - q)) * (.55 + .45 * sin(uT * (1.3 + q.x * 2.) + q.y * 30.));',
      ' c += vec3(.85, .88, 1.) * st * uStars * smoothstep(.04, .3, y) * (1. - smoothstep(.97, .999, m)) * (1. - cov);',
      ' vec3 cc = uCloudC + uCloudL * pow(max(dot(d, uLDir), 0.), 3.) * (1.2 - n);',
      ' cc += uBoltC * uFlash * (.25 + 2.4 * pow(max(dot(d, uBolt), 0.), 6.));',
      ' c = mix(c, cc, cov * .95);',
      ' c = mix(c, c * vec3(1.3, .5, .42) + vec3(.1, 0., 0.), uWrath * .65);',
      ' gl_FragColor = vec4(c + uBoltC * uFlash * .16, 1.);',
      '}'].join('\n'),
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; scenery.add(sky);

  // ---------- far hills, soft silhouettes in the haze, and the forest: two rings of trees with an opening to the west ----------
  const hillsU = { uC: { value: COL(0) }, uHaze: { value: COL(0) } };
  const hillGeo = new THREE.CylinderGeometry(84, 84, 26, 180, 1, true); hillGeo.translate(0, 10, 0);
  const hills = new THREE.Mesh(hillGeo, new THREE.ShaderMaterial({
    uniforms: hillsU, side: THREE.BackSide, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uC, uHaze; varying vec2 vUv;\n' + NOISE2 +
      'void main(){ float a = vUv.x * 6.2832; vec2 o = vec2(cos(a), sin(a)); float h = .17 + .3 * mf(o * 2.4 + 3.) + .1 * mf(o * 8. + 9.);\n if (vUv.y > h) discard; gl_FragColor = vec4(mix(uC, uHaze, (1. - vUv.y / h) * .55), 1.); }',
  }));
  hills.renderOrder = -10; hills.frustumCulled = false; scenery.add(hills);
  // the trees are painted as a white mask (oaks, thorny dead trees, conifers and bramble mounds), as the wild glade's are
  // gap: where the forest opens (a fraction across the mask, its half width, and how far the trees round it shrink); sx
  // squashes the drawing across, for a mask stretched further round its ring
  function treeMask(W0, H, n, near, gap, sx) {
    const c = cvs(W0, H), g = c.getContext('2d'), W = W0 / sx; g.setTransform(sx, 0, 0, 1, 0, 0); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
    const wrap = (fn) => { for (const ox of [-W, 0, W]) { g.save(); g.translate(ox, 0); fn(); g.restore(); } };
    const blob = (x, y, rx, ry, a) => wrap(() => { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); });
    const limb = (x, y, x2, y2, w) => wrap(() => { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + rr(-6, 6), (y + y2) / 2 + rr(-6, 6), x2, y2); g.stroke(); });
    const clump = (x, y, r) => { for (let k = 0; k < 16; k++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; blob(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, r * rr(.22, .42), r * rr(.16, .3), rnd() * 3); } };
    const branch = (x, y, a, l, w, d, leafy) => {
      const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l; limb(x, y, x2, y2, w);
      if (d > 0) { const k = 2 + (rnd() < .35 ? 1 : 0); for (let i = 0; i < k; i++) branch(x2, y2, a + rr(-.75, .75), l * rr(.58, .78), w * .64, d - 1, leafy); }
      else if (leafy) clump(x2, y2, l * rr(.9, 1.4));
    };
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, kind = rnd(), base = H, dg = Math.abs(((x / W - gap[0]) % 1 + 1.5) % 1 - .5);
      if (dg < gap[1]) continue;
      const h = H * rr(.5, .97) * (near ? 1 : .9) * (.25 + .75 * sm(gap[1], gap[1] + gap[2], dg));
      if (kind < .55) {
        const w0 = h * rr(.03, .045), top = base - h * rr(.38, .5), lean = rr(-.06, .06) * h;
        wrap(() => { g.beginPath(); g.moveTo(x - w0 * 2.2, base); g.quadraticCurveTo(x - w0, base - h * .08, x - w0 * .8 + lean * .5, base - h * .25); g.lineTo(x - w0 * .55 + lean, top); g.lineTo(x + w0 * .55 + lean, top); g.lineTo(x + w0 * .8 + lean * .5, base - h * .25); g.quadraticCurveTo(x + w0, base - h * .08, x + w0 * 2.3, base); g.fill(); });
        const nl = 3 + (rnd() < .5 ? 1 : 0); for (let k = 0; k < nl; k++) branch(x + lean, top, PI / 2 + (k / (nl - 1) - .5) * rr(1.3, 1.9), h * rr(.16, .24), w0 * 1.1, 2, true);
        clump(x + lean, top - h * .32, h * .12);
      } else if (kind < .7) branch(x, base, PI / 2 + rr(-.1, .1), h * .36, h * rr(.022, .032), 4, false);
      else {
        const L = 9 + ((rnd() * 4) | 0), tw = h * rr(.14, .2);
        wrap(() => { g.lineWidth = h * .02; g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - h); g.stroke(); });
        for (let k = 0; k < L; k++) { const f = (k + 1) / L, y = base - h + h * f * .9, wv = tw * f * rr(.8, 1.1); wrap(() => { g.beginPath(); g.moveTo(x, y - h * .09); g.quadraticCurveTo(x + wv * .5, y - h * .02, x + wv, y + h * .015); g.lineTo(x, y - h * .015); g.lineTo(x - wv, y + h * .015); g.quadraticCurveTo(x - wv * .5, y - h * .02, x, y - h * .09); g.fill(); }); }
      }
    }
    for (let i = 0; i < n * 4; i++) blob(rnd() * W, H - rr(0, H * .05), rr(H * .03, H * .07), rr(H * .02, H * .05));
    g.fillRect(0, H - H * .04, W, H * .04);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  // the forest opens to the west, toward the sunset, and (the masks go twice round) to the east, toward the sunrise
  const treeU = [], GAP = [.3188, .2 / PI, .3 / PI];
  function treeRing(R, H, y0, n, rep, near) {
    const u = { uMap: { value: treeMask(2048, 512, n, near, GAP, .5) }, uTree: { value: COL(0) }, uMist: { value: COL(0) }, uRim: { value: COL(0) }, uLDir: { value: V3() }, uRep: { value: rep }, uMistH: { value: near ? .3 : .45 }, uT: AIRU.uT, uWind: AIRU.uWind };
    treeU.push({ u, near });
    const geo = new THREE.CylinderGeometry(R, R, H, 128, 1, true); geo.translate(0, y0 + H / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: u, side: THREE.BackSide, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vP;\nvoid main(){ vUv = uv; vP = normalize(vec3(position.x, 0., position.z)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D uMap; uniform vec3 uTree, uMist, uRim, uLDir; uniform float uRep, uMistH, uT; uniform vec4 uWind; varying vec2 vUv; varying vec3 vP;',
        'void main(){',
        ' float sway = (uWind.z * .005 + .0015 * sin(uT * .8 + vUv.x * 70.)) * vUv.y * vUv.y;',
        ' float a = texture2D(uMap, vec2(vUv.x * uRep + sway, vUv.y)).r; if (a < .02) discard;',
        ' float lit = pow(max(dot(vP, normalize(vec3(uLDir.x, 0., uLDir.z) + 1e-4)), 0.), 3.);',
        ' gl_FragColor = vec4(mix(uTree, uMist, 1. - smoothstep(0., uMistH, vUv.y)) + uRim * lit * smoothstep(.2, .9, vUv.y) * .35, a);',
        '}'].join('\n'),
    }));
    m.renderOrder = -9 + (near ? 1 : 0); m.frustumCulled = false; scenery.add(m);
  }
  treeRing(62, 26, -2, 39, 2, false);
  treeRing(46, 19, -1, 30, 2, true);

  // ---------- the ground: meadow turf, the trampled clearing, puddles and rings of rain on them, hazy far off ----------
  const GU = { uHaze: { value: COL(0) }, uRain: { value: 0 } };
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: .95 });
  groundMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uT: AIRU.uT, uWet: AIRU.uWet, uFlow: AIRU.uFlow, uHaze: GU.uHaze, uRain: GU.uRain });
    sh.vertexShader = 'varying vec2 vGp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGp = vec2(position.x, -position.y);');
    sh.fragmentShader = 'varying vec2 vGp;\nuniform float uT, uWet, uRain;\nuniform vec3 uHaze;\n' + NOISE2 + CSH + sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\n float gr = length(vGp), clr = 1. - smoothstep(' + (CLEAR - 2.5).toFixed(1) + ', ' + (CLEAR + 1.5).toFixed(1) + ', gr);\n' +
        ' diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .35, .25) * (.8 + .4 * mn(vGp * .9)), clr * (.3 + .35 * mn(vGp * .3))) * (1. - .4 * smoothstep(40., 50., gr));\n' +
        ' float pud = smoothstep(.62, .7, mf(vGp * .1)) * uWet; diffuseColor.rgb *= (1. - .4 * uWet - .3 * pud) * (1. - .55 * cshade(vGp));')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .3, uWet * .5 + pud * .5);')
      .replace('#include <dithering_fragment>', ' { vec2 cc = floor(vGp * 1.4), fr = fract(vGp * 1.4) - .5, o = vec2(mh(cc + 3.1), mh(cc + 7.7)) - .5; float rp = fract(uT * 1.2 + mh(cc));\n' +
        '  gl_FragColor.rgb += vec3(.45, .5, .55) * smoothstep(.05, 0., abs(length(fr - o * .5) - rp * .45)) * (1. - rp) * uRain * (.35 + .65 * pud) * step(mh(cc + 1.9), .6); }\n' +
        ' gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, smoothstep(40., 75., gr) * .5);\n#include <dithering_fragment>');
  };
  const ground = new THREE.Mesh(new THREE.CircleGeometry(75, 128), groundMat); ground.rotation.x = -PI / 2; ground.renderOrder = -8; scenery.add(ground);

  // a material that bends with the air: grass (each tuft bends from its root), and the near trees (trunks and crowns sway)
  function airy(m, grass) {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, AIRU);
      sh.vertexShader = AIR + '\n' + (grass ? 'attribute vec3 aRoot; attribute float aH; varying float vB; varying float vHt; varying vec3 vRt;\n' : 'attribute vec4 aTree; uniform float uShake[6];\n') +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (grass
          ? ' { vec2 w = windAt(aRoot.xy) + pushAt(aRoot.xy); vec2 off = w * aH * aH * aRoot.z; float L = length(off), mx = aRoot.z * .8; if (L > mx) off *= mx / L;\n   transformed.xz += off; transformed.y -= dot(off, off) / max(.1, aRoot.z) * .45 * aH; vB = min(1., length(w)); vHt = aH; vRt = aRoot; }'
          : ' { float h = aTree.y * aTree.y, s = 0.; int ti = int(aTree.x + .5); for (int k = 0; k < 6; k++) { if (k == ti) s = uShake[k]; }\n   vec2 w = windAt(aTree.zw) * .5 + pushAt(aTree.zw) * .2;\n' +
            '   transformed.xz += w * h * 1.5 + vec2(sin(uT * 23. + aTree.x * 3.), cos(uT * 19. + aTree.x)) * s * h * .4 + vec2(sin(uT * 2.1 + position.y * .9 + position.x), cos(uT * 1.7 + position.z * .8)) * .04 * aTree.y * (.4 + uWind.z); }'));
      sh.fragmentShader = 'uniform float uWet;\n' + (grass ? 'varying float vB; varying float vHt; varying vec3 vRt;\n' + CSH : '') + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + (grass ? ' diffuseColor.rgb *= mix(.62, 1.06, vHt) * (1. + .55 * vB * vHt) * (1. - .5 * cshade(vRt.xy)) * mix(vec3(1.04, 1.04, .9), vec3(1.), smoothstep(' + (.3 * GS).toFixed(3) + ', ' + (.6 * GS).toFixed(3) + ', vRt.z));' : ''))
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .58, uWet);');
    };
    m.customProgramCacheKey = () => 'meadow-' + (grass ? 'grass' : 'tree');
    return m;
  }
  // ---------- grass: short in the clearing, tall all round it, some tufts in flower ----------
  {
    const P = [], UV = [], N = [], R = [], Hh = [], I = [];
    // [count, inner and outer radius, height range, width range, how it crowds toward the inner edge, share in flower]
    for (const [n, r0, r1, h0, h1, w0, w1, pw, fl] of [[2000, 1.2, CLEAR + 1.6, .13, .3, .36, .62, .8, .04], [3600, CLEAR + .8, CLEAR + 13, .65, 1.35, .8, 1.35, 1.3, .1], [1500, CLEAR + 11, CLEAR + 30, .8, 1.5, 1.4, 2.2, 1, .12]]) {
      for (let i = 0; i < n; i++) {
        const a = rnd() * TAU, r = lerp(r0, r1, Math.pow(rnd(), pw)), x = Math.sin(a) * r, z = Math.cos(a) * r, H = rr(h0, h1) * (.4 + .6 * sm(r0, r0 + 3.5, r)) * GS, W = rr(w0, w1) * GS, rot = rnd() * PI, cell = rnd() < fl ? 1 + ((rnd() * 3) | 0) : 0;
        for (let k = 0; k < 2; k++) {
          const q = rot + k * PI / 2, dx = Math.cos(q) * W / 2, dz = Math.sin(q) * W / 2, b = P.length / 3;
          for (let j = 0; j <= 3; j++) for (let s = 0; s <= 1; s++) { const h = j / 3; P.push(x + (s ? dx : -dx), H * h, z + (s ? dz : -dz)); UV.push((cell + s) * .25, h); N.push(0, 1, 0); R.push(x, z, H); Hh.push(h); }
          for (let j = 0; j < 3; j++) { const c = b + j * 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); }
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aRoot', new THREE.Float32BufferAttribute(R, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(Hh, 1)); g.setIndex(I);
    const grass = new THREE.Mesh(g, airy(new THREE.MeshStandardMaterial({ map: grassTex, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, color: 0xd8e4c4 }), true)); grass.frustumCulled = false; scenery.add(grass);
  }

  // ---------- six old trees round the meadow: trunks and crowns that sway, shake when the ground does, and shed leaves ----------
  const TREES = [];
  {
    const tP = [], tN = [], tU = [], tT = [], tI = [], cP = [], cN = [], cU = [], cT = [], cC = [], cI = [];
    const tube = (pts, rFn, k, top, rx, rz) => { // a tapering tube along pts, its bend weight by height (for the sway)
      const curve = new THREE.CatmullRomCurve3(pts), segs = 10, rs = 7, fr = curve.computeFrenetFrames(segs, false), Pt = V3(), D = V3(), b = tP.length / 3;
      for (let i = 0; i <= segs; i++) { const t = i / segs; curve.getPointAt(t, Pt); for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); tP.push(Pt.x + D.x * r, Pt.y + D.y * r, Pt.z + D.z * r); tN.push(D.x, D.y, D.z); tU.push(j / rs, t * 3); tT.push(k, cl(Pt.y / top, 0, 1), rx, rz); } }
      for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; tI.push(a, c, a + 1, a + 1, c, c + 1); }
    };
    [[-2.35, 25], [-2.95, 28.5], [2.75, 24.5], [-1.55, 27], [2.1, 29], [-.5, 31]].forEach(([a, r], k) => {
      const x = Math.sin(a) * r, z = Math.cos(a) * r, H = rr(6.5, 8.5), lx = rr(-.6, .6), lz = rr(-.6, .6), R = rr(3.3, 4.3), top = H + R;
      // a short, flared trunk that forks into four or five limbs spreading up and out, and a lobe of leaves at each limb's end
      const pts = []; for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(V3(x + lx * f + Math.sin(f * 3 + k) * .2, -.3 + f * H * .55, z + lz * f + Math.cos(f * 2.5 + k) * .2)); }
      tube(pts, (f) => lerp(.55, .32, f) * (1 + .6 * Math.exp(-f * 9)), k, top, x, z);
      const fork = pts[4], lobes = [], nl = 4 + (rnd() < .5 ? 1 : 0), a0 = rnd() * TAU;
      for (let b = 0; b <= nl; b++) {
        const lead = b === nl, ba = a0 + b / nl * TAU + rr(-.4, .4), sp = lead ? rr(0, .3) : rr(.55, .85), up = lead ? rr(2.6, 3.4) : rr(1.6, 2.8);
        const e = V3(fork.x + Math.cos(ba) * R * sp, fork.y + up, fork.z + Math.sin(ba) * R * sp), p0 = pts[3].clone().lerp(fork, rr(.4, 1));
        tube([p0, V3(lerp(p0.x, e.x, .45), lerp(p0.y, e.y, .6) + .3, lerp(p0.z, e.z, .45)), e], (f) => lerp(lead ? .3 : .24, .07, f), k, top, x, z);
        lobes.push([e.x, e.y + .5, e.z, R * (lead ? rr(.5, .62) : rr(.42, .56))]);
      }
      const C = V3(); for (const L of lobes) C.add(V3(L[0], L[1], L[2])); C.divideScalar(lobes.length);
      const n = V3(), m2 = V3(), t1 = V3(), t2 = V3(), Pq = V3();
      lobes.forEach((L) => {
        for (let i = 0; i < 17; i++) {
          const u = rnd() * TAU, v = Math.acos(rr(-.7, 1)), d = rr(.5, 1.05), s = rr(1.5, 2.2);
          n.set(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)); Pq.set(L[0] + n.x * L[3] * d, L[1] + n.y * L[3] * .75 * d, L[2] + n.z * L[3] * d);
          m2.subVectors(Pq, C).normalize().add(n).normalize(); // lit as one crown, not as five balls
          t1.crossVectors(n, YUP); if (t1.lengthSq() < 1e-3) t1.set(1, 0, 0); t1.normalize(); t2.crossVectors(n, t1).normalize();
          const ro = rnd() * TAU, ca = Math.cos(ro), sa = Math.sin(ro), e1 = t1.clone().multiplyScalar(ca).addScaledVector(t2, sa), e2 = t2.clone().multiplyScalar(ca).addScaledVector(t1, -sa), b = cP.length / 3;
          const tint = rr(.8, 1.12) * (.5 + .5 * (m2.y * .5 + .5)) * (.75 + .25 * d); // darker underneath and deep inside
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const py = Pq.y + (e1.y * sx + e2.y * sy) * s / 2; cP.push(Pq.x + (e1.x * sx + e2.x * sy) * s / 2, py, Pq.z + (e1.z * sx + e2.z * sy) * s / 2); cN.push(m2.x, m2.y, m2.z); cU.push(sx * .5 + .5, sy * .5 + .5); cT.push(k, cl(py / top, 0, 1), x, z); cC.push(tint * rr(.9, 1.05), tint, tint * rr(.85, 1)); }
          cI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
      });
      TREES.push({ x, z, c: C, R, shake: 0, leaves: 0 });
    });
    const mk = (P, N, U, T, I, C) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aTree', new THREE.Float32BufferAttribute(T, 4)); if (C) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); return g; };
    const trunks = new THREE.Mesh(mk(tP, tN, tU, tT, tI), airy(new THREE.MeshStandardMaterial({ map: barkTex, roughness: .9, color: 0xb8aa9c }), false));
    const crowns = new THREE.Mesh(mk(cP, cN, cU, cT, cI, cC), airy(new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: .45, side: THREE.DoubleSide, roughness: .8, vertexColors: true, color: 0xc4ccb8 }), false));
    trunks.frustumCulled = crowns.frustumCulled = false; scenery.add(trunks, crowns);
  }

  // ---------- ground mist: soft layers drifting with the wind, clear in the middle; shockwaves blow holes in it ----------
  const mistTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S, r = rr(18, 60), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const MIST = { uC: { value: COL(0) }, uA: { value: .4 } };
  for (const [y, k, sp] of [[.15, 1, .6], [.5, .8, -.4], [1.15, .55, .3]]) {
    const u = Object.assign({ uMap: { value: mistTex }, uK: { value: k }, uSp: { value: sp }, uClear: { value: CLEAR + .5 } }, MIST, AIRU);
    const m = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vP; varying float vCam;\nvoid main(){ vP = vec2(position.x, -position.y); vec4 w = modelMatrix * vec4(position, 1.0); vCam = distance(w.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: AIR + '\nuniform sampler2D uMap; uniform vec3 uC; uniform float uA, uK, uSp, uClear; varying vec2 vP; varying float vCam;\n' +
        'void main(){ float r = length(vP); vec2 dr = uFlow.xy * uSp * .3;\n float n = texture2D(uMap, vP / 9. - dr * .06).r * texture2D(uMap, vP / 23. - dr * .025).r * 3.;\n' +
        ' float a = uA * uK * min(n, 1.2) * smoothstep(uClear, uClear + 4., r) * (1. - smoothstep(28., 40., r)) * smoothstep(5., 16., vCam) * (1. - clamp(length(pushAt(vP)) * .6, 0., 1.));\n gl_FragColor = vec4(uC, a); }',
    }));
    m.rotation.x = -PI / 2; m.position.y = y; m.renderOrder = 4; m.frustumCulled = false; scenery.add(m);
  }

  // ---------- fireflies: drifting, blinking motes over the grass at night, scattering from a shockwave ----------
  const NF = 90, fpos = new Float32Array(NF * 3), fph = new Float32Array(NF * 4);
  for (let i = 0; i < NF; i++) { const a = rnd() * TAU, r = rr(CLEAR, CLEAR + 12); fpos.set([Math.sin(a) * r, rr(.25, 2.6), Math.cos(a) * r], i * 3); fph.set([rnd() * TAU, rr(.5, 1.4), rr(.15, .5), rr(.6, 1.6)], i * 4); }
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
  flies.frustumCulled = false; flies.renderOrder = 9; scenery.add(flies);
  flies.onBeforeRender = (r) => { const v = new THREE.Vector2(); r.getDrawingBufferSize(v); fliesU.uScale.value = v.y; };

  // ---------- rain: thin streaks round the middle of the view, slanting with the wind ----------
  const NRN = 2800, rP = new Float32Array(NRN * 12), rQ = new Float32Array(NRN * 8), rI = [];
  for (let i = 0; i < NRN; i++) { const x = rr(-32, 32), z = rr(-32, 32), y = rnd(); for (let k = 0; k < 4; k++) { rP.set([x, y, z], (i * 4 + k) * 3); rQ.set([k & 1 ? 1 : -1, k >> 1], (i * 4 + k) * 2); } const b = i * 4; rI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const rainG = new THREE.BufferGeometry(); rainG.setAttribute('position', new THREE.BufferAttribute(rP, 3)); rainG.setAttribute('aQ', new THREE.BufferAttribute(rQ, 2)); rainG.setIndex(rI);
  const RAIN = { uRain: { value: 0 }, uCtr: { value: V3() }, uRC: { value: COL(0xb8c4d8) }, uT: AIRU.uT, uWind: AIRU.uWind };
  const rain = new THREE.Mesh(rainG, new THREE.ShaderMaterial({
    uniforms: RAIN, transparent: true, depthWrite: false,
    vertexShader: 'attribute vec2 aQ; uniform float uT, uRain; uniform vec4 uWind; uniform vec3 uCtr; varying float vA; varying float vS;\n' +
      'void main(){ vec3 b = position; float sp = 11. + 5. * fract(b.y * 7.3); vec2 rel = mod(b.xz - uCtr.xz + 32., 64.) - 32.;\n' +
      ' vec3 v = normalize(vec3(uWind.x * uWind.z * 7., -sp, uWind.y * uWind.z * 7.)); float y = 26. * (1. - fract(b.y + uT * sp / 26.));\n' +
      ' vec3 p = vec3(uCtr.x + rel.x, y, uCtr.z + rel.y) - v * aQ.y * 1.1; vec4 mv = modelViewMatrix * vec4(p, 1.), m2 = modelViewMatrix * vec4(p + v, 1.);\n' +
      ' vec2 dir = normalize(m2.xy - mv.xy + 1e-5); mv.xy += vec2(-dir.y, dir.x) * aQ.x * .0011 * -mv.z;\n' +
      ' gl_Position = projectionMatrix * mv; vA = step(fract(b.y * 13.7 + b.x * .1), uRain) * uRain * smoothstep(0., 1.5, y); vS = aQ.y; }',
    fragmentShader: 'uniform vec3 uRC; varying float vA; varying float vS;\nvoid main(){ if (vA < .01) discard; gl_FragColor = vec4(uRC, vA * .4 * (.3 + .7 * vS)); }',
  }));
  rain.frustumCulled = false; rain.renderOrder = 10; rain.visible = false; scenery.add(rain);

  // ---------- lightning: a jagged bolt far off over the forest, lit for a moment, with a branch or two ----------
  const NBQ = 64, bP = new Float32Array(NBQ * 12), bI = [];
  for (let i = 0; i < NBQ; i++) { const b = i * 4; bI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const boltG = new THREE.BufferGeometry(); boltG.setAttribute('position', new THREE.BufferAttribute(bP, 3).setUsage(THREE.DynamicDrawUsage)); boltG.setIndex(bI);
  const boltM = new THREE.MeshBasicMaterial({ color: 0xe4eaff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0 });
  const bolt = new THREE.Mesh(boltG, boltM); bolt.frustumCulled = false; bolt.renderOrder = -9.5; bolt.visible = false; scenery.add(bolt); // beyond the forest
  const _e = V3(), _f = V3(), _s = V3();
  function makeBolt(cam) {
    const toCam = cam ? Math.atan2(cam.position.x, cam.position.z) : 1, a = toCam + PI + rr(-1.3, 1.3), r = rr(50, 72); // over the forest beyond the scene
    let q = 0; bP.fill(0);
    const seg = (x0, y0, z0, x1, y1, z1, w) => {
      if (q >= NBQ) return; _e.set(x1 - x0, y1 - y0, z1 - z0); _f.set(x0 - (cam ? cam.position.x : 0), 0, z0 - (cam ? cam.position.z : 0)); _s.crossVectors(_e, _f).normalize().multiplyScalar(w);
      bP.set([x0 - _s.x, y0 - _s.y, z0 - _s.z, x0 + _s.x, y0 + _s.y, z0 + _s.z, x1 - _s.x, y1 - _s.y, z1 - _s.z, x1 + _s.x, y1 + _s.y, z1 + _s.z], q * 12); q++;
    };
    const path = (x, y, z, n, w) => { for (let i = 0; i < n && y > 0; i++) { const nx = x + rr(-2.4, 2.4) * (w + .4), ny = Math.max(0, y - rr(1.6, 3.4)), nz = z + rr(-2.4, 2.4) * (w + .4); seg(x, y, z, nx, ny, nz, w); if (rnd() < .14 && w > .25) path(nx, ny, nz, 5 + (rnd() * 4 | 0), w * .45); x = nx; y = ny; z = nz; } };
    path(Math.sin(a) * r, rr(34, 44), Math.cos(a) * r, 40, .45);
    boltG.attributes.position.needsUpdate = true; boltG.computeBoundingSphere();
    SKY.uBolt.value.set(Math.sin(a), .45, Math.cos(a)).normalize();
    return r;
  }

  // ---------- birds (and bats at night): they roost in the near trees until something startles them up ----------
  const NBD = 24, BP = Array.from({ length: NBD }, () => new THREE.Vector4(0, -60, 0, 0)), BH = Array.from({ length: NBD }, () => new THREE.Vector4(0, 0, 1, 0));
  {
    const P = [], A = [], I = [];
    const tri = (b, pts) => { const s = P.length / 3; for (const p of pts) { P.push(p[0], p[1], p[2]); A.push(b); } I.push(s, s + 1, s + 2); };
    for (let b = 0; b < NBD; b++) { tri(b, [[0, 0, .3], [.06, 0, 0], [-.06, 0, 0]]); tri(b, [[.06, 0, 0], [0, 0, -.22], [-.06, 0, 0]]); tri(b, [[.05, 0, .06], [.48, 0, -.06], [.05, 0, -.1]]); tri(b, [[-.05, 0, .06], [-.05, 0, -.1], [-.48, 0, -.06]]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
    const birds = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uBP: { value: BP }, uBH: { value: BH }, uC: { value: COL(0x16121c) } }, side: THREE.DoubleSide,
      vertexShader: 'attribute float aB; uniform vec4 uBP[' + NBD + ']; uniform vec4 uBH[' + NBD + '];\n' +
        'void main(){ int i = int(aB + .5); vec4 P = vec4(0.), H = vec4(0., 0., 1., 0.); for (int k = 0; k < ' + NBD + '; k++) { if (k == i) { P = uBP[k]; H = uBH[k]; } }\n' +
        ' vec3 f = normalize(H.xyz + vec3(0., 0., 1e-4)), r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), u = cross(r, f); vec3 l = position;\n' +
        ' l.y += sin(H.w) * .5 * abs(l.x) * step(.07, abs(l.x)); vec3 w = P.xyz + (r * l.x + u * l.y + f * l.z) * P.w;\n gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }',
      fragmentShader: 'uniform vec3 uC;\nvoid main(){ gl_FragColor = vec4(uC, 1.); }',
    }));
    birds.frustumCulled = false; birds.renderOrder = 2; scenery.add(birds);
  }
  // each bird: where it roosts, whether it is there or up and flying (st 0 roosting, 1 flying, 2 away) or a bat round a lantern
  const BIRDS = Array.from({ length: NBD }, (_, i) => ({ i, tree: i % 6, st: 0, p: V3(), v: V3(), t: 0, wait: 0, turn: 0, flap: rnd() * TAU, bat: i >= NBD - 6, lamp: i % 2, ph: rnd() * TAU }));

  // ---------- drifting things: leaves off the trees, grass and dust thrown up, pollen by day, embers in a wrath, splashes ----------
  // k is how one moves: 0 a leaf fluttering down on the wind, 1 thrown up (it flies, then flutters down), 2 a mote drifting on
  // the wind, 3 a splash, 4 dust billowing out and settling. Leaves and turf draw as leaves, motes and splashes as glowing
  // dots, dust as soft puffs.
  const NPT = 480, pPos = new Float32Array(NPT * 3), pCol = new Float32Array(NPT * 4), pSize = new Float32Array(NPT), pRot = new Float32Array(NPT), pKind = new Float32Array(NPT);
  const PT = Array.from({ length: NPT }, () => ({ life: 0, max: 1, v: V3(), c: COL(0), a: 1, s: .1, spin: 0, k: 0 })); let ptN = 0;
  const pG = new THREE.BufferGeometry(); for (const [k, a, n] of [['position', pPos, 3], ['aCol', pCol, 4], ['aSize', pSize, 1], ['aRot', pRot, 1], ['aKind', pKind, 1]]) pG.setAttribute(k, new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage));
  const pScale = { value: 400 }, _db = new THREE.Vector2();
  [[leafDot, THREE.NormalBlending], [dotTex, THREE.AdditiveBlending], [dotTex, THREE.NormalBlending]].forEach(([map, blending], kind) => {
    const m = new THREE.Points(pG, new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: pScale }, transparent: true, depthWrite: false, blending,
      vertexShader: 'attribute vec4 aCol; attribute float aSize; attribute float aRot; attribute float aKind; uniform float uScale; varying vec4 vC; varying float vR;\n' +
        'void main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > .002 && abs(aKind - ' + kind + '.) < .5 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.; }',
      fragmentShader: 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1. - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }',
    }));
    m.frustumCulled = false; m.renderOrder = 9 - kind * .1; scenery.add(m);
    if (!kind) m.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); pScale.value = _db.y * .5; };
  });
  function emit(x, y, z, vx, vy, vz, life, c, a, s, spin, k) {
    const P = PT[ptN], i = ptN; ptN = (ptN + 1) % NPT; k = k || 0; P.life = P.max = life; P.v.set(vx, vy, vz); P.c.copy(c); P.a = a; P.s = s; P.spin = spin || 0; P.k = k;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pRot[i] = rnd() * TAU; pKind[i] = k < 2 ? 0 : k < 4 ? 1 : 2;
  }

  // ---------- two lanterns on posts, swinging in the wind, lit from dusk till dawn (their lights are the meadow's own) ----------
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: .9 }), iron = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: .5, metalness: .6 });
  const glowTex = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,240,200,1)'); q.addColorStop(.25, 'rgba(255,180,100,.7)'); q.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
  const LAMPS = (opts.lamps || [[11, -.4, 1.4], [-8.6, 9.6, 1.1]]).map(([x, z, I0]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(z, -x); scenery.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 3.5, 8), wood); post.position.y = 1.75; g.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.95, .08, .08), wood); arm.position.set(.42, 3.38, 0); g.add(arm);
    const pivot = new THREE.Group(); pivot.position.set(.84, 3.34, 0); g.add(pivot);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .3, 4), iron); chain.position.y = -.15; pivot.add(chain);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, .34, 6, 1, true), iron); cage.position.y = -.48; pivot.add(cage);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.17, .14, 6), iron); cap.position.y = -.25; pivot.add(cap);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.position.y = -.48; glow.scale.setScalar(1.1); pivot.add(glow);
    const light = new THREE.PointLight(0xffb46a, 0, 16, 2); light.position.y = -.48; pivot.add(light);
    return { g, pivot, glow, light, I0, ax: 0, az: 0, vx: 0, vz: 0, p: V3(x, 2.9, z) };
  });

  // ---------- metre rings, to judge the size by, and the bare floor for when the scenery is off ----------
  function ringsTex() {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d'), h = S / 2, ppm = h / (RM + 1);
    g.strokeStyle = 'rgba(214,222,255,.2)'; g.lineWidth = 2; g.fillStyle = 'rgba(214,222,255,.45)'; g.font = '22px sans-serif';
    for (let m = 1; m <= RM; m++) { g.beginPath(); g.arc(h, h, m * ppm, 0, TAU); g.stroke(); if (RM <= 8 || m % 2 === 0) g.fillText(m + ' m', h + m * ppm + 6, h - 6); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const rings = new THREE.Mesh(new THREE.CircleGeometry(RM + 1, 72), new THREE.MeshBasicMaterial({ map: ringsTex(), transparent: true, depthWrite: false }));
  rings.rotation.x = -PI / 2; rings.position.y = .004; rings.renderOrder = -7; root.add(rings);
  const bare = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), h = S / 2, q = g.createRadialGradient(h, h, 0, h, h, h);
    q.addColorStop(0, 'rgba(43,35,50,1)'); q.addColorStop(.62, 'rgba(43,35,50,.85)'); q.addColorStop(1, 'rgba(43,35,50,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S);
    const m = new THREE.Mesh(new THREE.CircleGeometry(RM + 1, 72), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), transparent: true, roughness: .95, depthWrite: false }));
    m.rotation.x = -PI / 2; m.renderOrder = -8; m.visible = false; root.add(m); return m;
  })();

  // ---------- the hours ----------
  // stops through the day: [hour, sky top, middle and horizon, haze, the sun's (or moon's) light and its strength, the
  // hemisphere's sky and ground and its strength, the front fill's strength, stars, fireflies, lanterns, mist]. The night
  // is the battle screen's Night square rig, so a creature looks at night as it does in battle.
  const NIGHT = ['#0a0712', '#1b1430', '#3a2d50', '#2a2140', '#b8c0ff', .62, '#756aa8', '#33262f', 1.1, .42, 1, 1, 1, .5];
  const HOURS = [[0].concat(NIGHT), [4.8].concat(NIGHT.slice(0, 11), [.8, 1, .6]),
    [5.9, '#17122f', '#3e2f5b', '#8e5e7c', '#4c3c5c', '#d8a8b8', .4, '#8a7ab0', '#3a2c34', 1, .38, .45, .2, .6, .85],
    [7, '#3a5590', '#c48ea2', '#ffb67a', '#c4968a', '#ffc088', .85, '#c8c4e0', '#4a3c36', 1, .3, 0, 0, 0, .6],
    [9, '#5b8fd2', '#a8c8e8', '#e8e2cc', '#b8c4c8', '#fff0d6', 1.05, '#e2ebff', '#5c4a36', 1, .25, 0, 0, 0, .25],
    [12, '#4a86d8', '#9cc4ec', '#dce8ee', '#c4d0d4', '#fff4e0', 1.15, '#e2ebff', '#5c4a36', 1.05, .25, 0, 0, 0, .15],
    [16, '#4f86cc', '#a4c0e0', '#e8dcc0', '#c8c8bc', '#fff0d0', 1.1, '#e6e8f8', '#5c4a36', 1, .25, 0, 0, 0, .2],
    [18.2, '#2e3c7a', '#b0627c', '#ff9c54', '#c07c68', '#ffa060', .85, '#d0b0c8', '#4c3a34', .95, .3, 0, 0, .15, .35],
    [19.3, '#151236', '#4a2e5c', '#a05a62', '#503a58', '#c8a8d0', .45, '#8a7ab0', '#3a2c34', 1, .38, .55, .6, .8, .5],
    [20.5].concat(NIGHT), [24].concat(NIGHT)].map((r) => r.map((v) => (typeof v === 'string' ? COL(v) : v)));
  const HK = ['top', 'mid', 'hor', 'haze', 'lc', 'li', 'hs', 'hg', 'hi', 'fi', 'stars', 'flies', 'lamps', 'mist'], H = {};
  HK.forEach((k, j) => { H[k] = HOURS[0][j + 1].isColor ? COL(0) : 0; });
  function hourLook(h) {
    let i = 0; while (i < HOURS.length - 2 && h > HOURS[i + 1][0]) i++;
    const A = HOURS[i], B = HOURS[i + 1], f = sm(0, 1, (h - A[0]) / (B[0] - A[0]));
    HK.forEach((k, j) => { const a = A[j + 1], b = B[j + 1]; if (a.isColor) H[k].copy(a).lerp(b, f); else H[k] = lerp(a, b, f); });
  }
  // the sun rises behind the bench's camera and sets in front of it, through the opening in the forest; the moonlight comes
  // from where the Night square's does, behind and to the left, the moon low over the trees there
  const EAST = V3(.84, 0, .54), SOUTH = V3(-.54, 0, .84), MOONL = V3(-5, 9, -12).normalize(), MOOND = V3(-5, 0, -12).normalize().setY(.24).normalize();
  const sunDir = (h, out) => { const u = (h - 6) / 12 * PI; return out.copy(EAST).multiplyScalar(Math.cos(u)).addScaledVector(YUP, Math.sin(u) * .85).addScaledVector(SOUTH, Math.sin(u) * .45).normalize(); };
  const light = { hemiSky: COL(0), hemiGround: COL(0), hemiI: 1, dir: V3(0, 1, 0), color: COL(0), I: 1, fillC: COL(0xffdcc0), fillI: .4 };
  const GREY = COL(0x9aa0aa), STORMC = COL(0x5a6070), RED = COL(0xff5a3a), WRATHSKY = COL(0xa85060), FLASHC = COL(0xdfe6ff), C0 = COL(0), C1 = COL(0), NEARD = COL(0x3c4a36), NEARN = COL(0x140f1f), _v = V3(), _w = V3();
  const GRASSC = [COL(0x8aa04e), COL(0x6a8a3c), COL(0xb0a860), COL(0x6e5a3e)], DUST = COL(0x9a8a6a);
  let dayNow = 0; const dust = () => C1.copy(DUST).lerp(H.haze, .4).multiplyScalar(.4 + .8 * dayNow); // unlit: darker by night

  // ---------- what happens in it: shockwaves, a whirlwind, roars ----------
  const RING = [0, 1, 2, 3].map(() => ({ x: 0, z: 0, r: 0, s: 0, s0: 0, t: 0 })), VT = new THREE.Vector4(0, 0, 9, 0);
  let ringN = 0;
  function startle(ox, oz, s) {
    for (const B of BIRDS) {
      if (B.bat || B.st !== 0 || rnd() > s * 1.4) continue;
      const T = TREES[B.tree]; _v.set(rr(-1, 1), rr(-.2, 1), rr(-1, 1)).normalize();
      B.p.set(T.c.x + _v.x * T.R * .8, T.c.y + _v.y * T.R * .6, T.c.z + _v.z * T.R * .8);
      _w.set(B.p.x - ox, 0, B.p.z - oz).normalize(); B.v.set(_w.x * rr(4, 6.5), rr(4, 7), _w.z * rr(4, 6.5));
      B.st = 1; B.t = -rr(0, .45); B.dur = 10; B.turn = rr(-.6, .6);
    }
  }
  function impact(x, z, s) {
    const R = RING[ringN++ % 4]; Object.assign(R, { x, z, r: 0, s: s, s0: s, t: 0 });
    for (const T of TREES) T.shake = Math.max(T.shake, s * .9 * cl(1.5 - Math.hypot(T.x - x, T.z - z) / 30, 0, 1));
    for (const L of LAMPS) { const d = Math.max(3, Math.hypot(L.p.x - x, L.p.z - z)); L.vx += rr(-1, 1) * s * 9 / d; L.vz += rr(-1, 1) * s * 9 / d; }
    // turf and grass thrown up round where it lands
    for (let n = 0, m = Math.round(26 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(.6, 2.6), sp = rr(2, 5) * s;
      emit(x + Math.sin(a) * r, .1, z + Math.cos(a) * r, Math.sin(a) * sp, rr(3, 7) * Math.sqrt(s), Math.cos(a) * sp, rr(1.6, 2.6), GRASSC[(rnd() * 4) | 0], 1, rr(.16, .3), rr(-9, 9), 1);
    }
    for (let n = 0, m = Math.round(12 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(.4, 2), sp = rr(3, 7) * s;
      emit(x + Math.sin(a) * r, .3, z + Math.cos(a) * r, Math.sin(a) * sp, rr(.3, 1), Math.cos(a) * sp, rr(2, 3.2), dust(), .32, rr(.9, 1.5) * (.6 + .4 * s), 0, 4);
    }
    if (s > .4) startle(x, z, s);
  }
  function roar(s) {
    for (const T of TREES) T.shake = Math.max(T.shake, s * .7);
    for (const L of LAMPS) { L.vx += rr(-1, 1) * s * 2; L.vz += rr(-1, 1) * s * 2; }
    startle(0, 0, s);
  }

  // ---------- every frame ----------
  let hours = 19, wName = 'clear', wT = 0, wN = 0, wrathT = 0, wrathV = 0, wet = 0, flashV = 0, boltT = -1, nextStrike = 3, nextFly = 12, shadeV = 0;
  const thunder = [];
  function update(t, dt, cam) {
    dt = dt > 0 ? Math.min(dt, .05) : 0;
    AIRU.uT.value = t;
    if (dt > 0) hours = (hours + dt * api.timeRate + 24) % 24;
    hourLook(hours);
    const dayW = 1 - H.stars; dayNow = dayW;
    // the weather and a wrath ease in and out: a storm rolls in over several seconds and clears again
    wN += (Math.max(wT, wrathT > .5 ? .85 : 0) - wN) * (1 - Math.exp(-dt * .35)); wrathV += (wrathT - wrathV) * (1 - Math.exp(-dt * 1.2));
    const rainK = sm(.32, .7, wN), storm = sm(.75, 1, wN);
    wet = cl(wet + dt * (rainK > .1 ? .15 * rainK : -.025), 0, 1); AIRU.uWet.value = wet;
    // the wind wanders, and blows harder in rain, in a storm and in a creature's wrath; the clouds drift with it and the
    // gusts roll along it
    const W = AIRU.uWind.value, F = AIRU.uFlow.value, wa = .6 + .45 * Math.sin(t * .021) + .2 * Math.sin(t * .057 + 1);
    W.x = Math.cos(wa); W.y = Math.sin(wa); W.z = .3 + .55 * wN + .35 * wrathV; W.w = .5 + .5 * wN;
    F.x += W.x * (2 + 4 * W.z) * dt; F.y += W.y * (2 + 4 * W.z) * dt; F.z += dt * (.4 + .6 * W.z);
    // shockwaves race out and fade; the whirlwind eases in and out
    RING.forEach((R, i) => { const U = AIRU.uRings.value[i]; if (R.s > .002) { R.t += dt; R.r = 19 * (1 - Math.exp(-R.t * 1.15)); R.s = R.s0 * Math.exp(-R.t * 1.25); U.set(R.x, R.z, R.r, R.s); } else U.w = 0; });
    const VO = AIRU.uVortex.value; VO.x = VT.x; VO.y = VT.y; VO.z = VT.z; VO.w += (VT.w - VO.w) * (1 - Math.exp(-dt * 2.5));
    // lightning in a storm or a wrath, and the thunder after it
    if ((storm > .5 || wrathV > .6) && dt > 0 && (nextStrike -= dt) <= 0) {
      nextStrike = rr(3.5, 9) * (wrathV > .6 ? .7 : 1); const dist = makeBolt(cam); boltT = 0;
      boltM.color.copy(wrathV > .5 ? RED : FLASHC); SKY.uBoltC.value.copy(boltM.color); thunder.push(.3 + dist / 70 * 1.4);
    }
    if (boltT >= 0) { boltT += dt; const f = boltT < .07 ? 1 : boltT < .13 ? .25 : boltT < .2 ? .85 : Math.max(0, 1 - (boltT - .2) * 4); boltM.opacity = f; bolt.visible = f > .01; flashV = Math.max(flashV * Math.exp(-dt * 8), f * .9); if (boltT > .5) { boltT = -1; bolt.visible = false; } }
    else flashV *= Math.exp(-dt * 6);
    for (let i = thunder.length - 1; i >= 0; i--) if ((thunder[i] -= dt) <= 0) { thunder.splice(i, 1); if (api.onThunder) api.onThunder(.5 + .5 * storm); }
    // the sky
    const cloud = lerp(.22, 1.02, wN) + .15 * wrathV;
    const dim = 1 - .45 * storm - .12 * rainK;
    for (const [u, c] of [[SKY.uTop, H.top], [SKY.uMid, H.mid], [SKY.uHor, H.hor]]) u.value.copy(c).lerp(C0.copy(STORMC).multiplyScalar(.3 + .5 * dayW), .55 * wN).multiplyScalar(dim);
    const sd = sunDir(hours, SKY.uSunDir.value); SKY.uSunC.value.copy(H.lc); SKY.uSunUp.value = sm(-.1, .06, sd.y) * (1 - .9 * wN);
    SKY.uMoonDir.value.copy(MOOND); SKY.uMoonUp.value = H.stars * (1 - .9 * wN); SKY.uMoonC.value.set(0xdfe4ff).lerp(RED, wrathV * .7);
    SKY.uStars.value = STARS ? H.stars : 0; SKY.uCloud.value = cloud; SKY.uWrath.value = wrathV; SKY.uFlash.value = flashV;
    SKY.uCloudC.value.copy(H.hor).multiplyScalar(.6).add(C0.copy(H.mid).multiplyScalar(.4)).lerp(C1.setRGB(.86, .86, .9), dayW * .65).multiplyScalar(1 - .55 * storm - .2 * rainK);
    SKY.uCloudL.value.copy(H.lc).multiplyScalar((.25 + .5 * dayW) * (1 - .7 * wN));
    // the clouds' shadows: only on a fair day, while the sun is up
    F.w = .55 * dayW * sm(.02, .2, sd.y) * (1 - sm(.3, .7, wN));
    // the light, for the bench: the sun by day and the Night square's moonlight by night, dimmer and greyer in bad weather,
    // reddened in a wrath, dimmed while a cloud's shadow is over the middle, and the lightning's flash
    shadeV += (cloudAt(0, 0) - shadeV) * (1 - Math.exp(-dt * 3));
    light.dir.copy(sd); light.dir.y = Math.max(light.dir.y, .2); light.dir.normalize().lerp(MOONL, H.stars).normalize(); SKY.uLDir.value.copy(light.dir);
    light.color.copy(H.lc).lerp(GREY, .55 * wN).lerp(RED, .45 * wrathV).lerp(FLASHC, .7 * flashV);
    light.I = H.li * (1 - .5 * wN * dayW - .25 * storm) * (1 - .75 * shadeV) + 1.3 * flashV;
    light.hemiSky.copy(H.hs).lerp(GREY, .35 * wN).lerp(WRATHSKY, .4 * wrathV); light.hemiGround.copy(H.hg);
    light.hemiI = H.hi * (1 - .22 * wN) + 1.4 * flashV; light.fillI = H.fi * (1 - .25 * wN);
    // the forest, the hills, the ground, the mist, the fireflies and the rain take their colors from the hour
    const haze = C0.copy(H.haze).lerp(STORMC, .45 * wN).multiplyScalar(dim).lerp(RED, .12 * wrathV);
    for (const { u, near } of treeU) { u.uTree.value.copy(NEARN).lerp(NEARD, dayW).multiplyScalar(dim); if (!near) u.uTree.value.lerp(haze, .45); u.uMist.value.copy(haze); u.uRim.value.copy(light.color).multiplyScalar(.6); u.uLDir.value.copy(light.dir); }
    hillsU.uC.value.copy(treeU[0].u.uTree.value).lerp(haze, .35); hillsU.uHaze.value.copy(haze); GU.uHaze.value.copy(haze); GU.uRain.value = rainK;
    MIST.uC.value.copy(haze).multiplyScalar(1.15 + .2 * flashV); MIST.uA.value = (H.mist + .3 * rainK + .2 * storm) * .55;
    fliesU.uOn.value = H.flies * (1 - rainK); RAIN.uRain.value = rainK; rain.visible = rainK > .01;
    RAIN.uRC.value.setRGB(.66, .72, .82).multiplyScalar(.55 + .45 * dayW + flashV);
    if (cam) RAIN.uCtr.value.set(cam.position.x * .5, 0, cam.position.z * .5);
    // the trees shake and shed leaves; the wind takes some at any time, and gusts carry more across the meadow
    TREES.forEach((T, i) => {
      T.shake *= Math.exp(-dt * 2.2); AIRU.uShake.value[i] = T.shake;
      T.leaves += dt * (.15 + 1.1 * W.z * W.w + 40 * T.shake);
      while (T.leaves >= 1) { T.leaves -= 1; _v.set(rr(-1, 1), rr(-.6, .8), rr(-1, 1)).normalize(); const g = rnd(); emit(T.c.x + _v.x * T.R * .9, T.c.y + _v.y * T.R * .6, T.c.z + _v.z * T.R * .9, 0, -.5, 0, rr(5, 8), C1.setRGB(.36 + .4 * g, .5 + .1 * g, .2), 1, rr(.18, .28), rr(-4, 4)); }
    });
    if (dt > 0) {
      if (rnd() < dt * (.3 + 3 * W.z * W.w)) { const a = Math.atan2(W.y, W.x) + PI + rr(-.8, .8), r = rr(10, 20), g = rnd(); emit(Math.cos(a) * r, rr(2, 6), Math.sin(a) * r, 0, 0, 0, rr(6, 9), C1.setRGB(.4 + .45 * g, .48 + .1 * g, .18), 1, rr(.18, .26), rr(-5, 5)); }
      // pollen by day, embers in a wrath, splashes in the rain, and grass torn up round a whirlwind
      if (dayW > .5 && rainK < .1 && rnd() < dt * 8) { const a = rnd() * TAU, r = rr(CLEAR, CLEAR + 12); emit(Math.sin(a) * r, rr(.3, 1.6), Math.cos(a) * r, 0, .05, 0, rr(3, 5), C1.setRGB(1, .95, .7), .7, rr(.05, .08), 0, 2); }
      for (let n = 0, m = (wrathV * 30 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(2, 16); emit(Math.sin(a) * r, rr(0, 2), Math.cos(a) * r, 0, rr(.8, 1.6), 0, rr(2, 3.5), C1.setRGB(1, .45, .12), 1, rr(.06, .1), 0, 2); }
      for (let n = 0, m = (rainK * 150 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 16; emit(Math.sin(a) * r, .03, Math.cos(a) * r, rr(-.4, .4), rr(1, 1.8), rr(-.4, .4), .32, C1.setRGB(.8, .86, .95), .6, .05, 0, 3); }
      for (let n = 0, m = (VO.w * 70 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(.5, 1.2) * VO.z; emit(VO.x + Math.sin(a) * r, .2, VO.y + Math.cos(a) * r, 0, rr(3, 6), 0, rr(2.5, 4), GRASSC[(rnd() * 3) | 0], 1, rr(.18, .32), rr(-9, 9), 1); }
      for (let n = 0, m = (VO.w * 16 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(.3, 1) * VO.z; emit(VO.x + Math.sin(a) * r, .3, VO.y + Math.cos(a) * r, 0, rr(.3, 1.2), 0, rr(2, 3.2), dust(), .2, rr(1, 1.8), 0, 4); }
    }
    const vw = VO.w > .01;
    for (let i = 0; i < NPT; i++) {
      const P = PT[i];
      if (P.life <= 0) { if (pCol[i * 4 + 3]) { pCol[i * 4 + 3] = 0; pSize[i] = 0; } continue; }
      P.life -= dt; const age = 1 - Math.max(0, P.life) / P.max, V = P.v;
      if (P.k === 3) V.y -= 9.8 * dt;
      else if (P.k === 1) { V.y -= 7 * dt; V.multiplyScalar(Math.exp(-dt * 1.2)); if (V.y < -1.2) P.k = 0; }
      else if (P.k === 4) { const d = Math.exp(-dt * 1.4); V.x = V.x * d + W.x * W.z * .9 * (1 - d); V.z = V.z * d + W.y * W.z * .9 * (1 - d); V.y = V.y * d + .2 * (1 - d); }
      else { const kk = P.k ? .6 : .9, sp = P.k ? 1.2 : 2.4; V.x += (W.x * W.z * sp - V.x) * dt * kk; V.z += (W.y * W.z * sp - V.z) * dt * kk; if (!P.k) V.y = -.55 + .35 * Math.sin(t * 3 + i); }
      let x = pPos[i * 3] + V.x * dt, y = pPos[i * 3 + 1] + V.y * dt, z = pPos[i * 3 + 2] + V.z * dt;
      if (vw && P.k !== 3) { const dx = x - VO.x, dz = z - VO.y, d = Math.hypot(dx, dz) + .001, f = VO.w * sm(VO.z * 1.6, VO.z * .5, d) * sm(.5, 3, d) * dt; x += (-dz * 9 + dx * .6) / d * f; z += (dx * 9 + dz * .6) / d * f; y += 2.4 * f; }
      pPos[i * 3] = x; pPos[i * 3 + 1] = Math.max(.02, y); pPos[i * 3 + 2] = z; pRot[i] += P.spin * dt;
      const fa = Math.min(1, age / .1) * (1 - age * age); pCol[i * 4] = P.c.r; pCol[i * 4 + 1] = P.c.g; pCol[i * 4 + 2] = P.c.b; pCol[i * 4 + 3] = P.a * fa; pSize[i] = P.k === 4 ? P.s * (1 + 1.8 * age) : P.s;
    }
    for (const k of ['position', 'aCol', 'aSize', 'aRot', 'aKind']) pG.attributes[k].needsUpdate = true;
    // the birds: up and away when startled, back to roost later; small flocks cross the sky by day; bats round the lanterns
    if (dt > 0 && (nextFly -= dt) <= 0) {
      nextFly = rr(20, 45);
      if (dayW > .6 && wN < .6) { const a = rnd() * TAU, n = 3 + (rnd() * 5 | 0); let c = 0; for (const B of BIRDS) if (!B.bat && B.st === 0 && c < n) { c++; B.st = 1; B.t = -c * .3; B.dur = 18; B.p.set(Math.sin(a) * 70 + rr(-3, 3), rr(24, 34), Math.cos(a) * 70 + rr(-3, 3)); B.v.set(-Math.sin(a) * 9, 0, -Math.cos(a) * 9); B.turn = rr(-.05, .05); } }
    }
    for (const B of BIRDS) {
      const bp = BP[B.i], bh = BH[B.i];
      if (B.bat) {
        const L = LAMPS[B.lamp], on = H.lamps > .3 && wN < .6;
        if (!on) { bp.w = 0; continue; }
        B.ph += dt * (2.1 + (B.i % 3) * .5); const r = 1.3 + .5 * Math.sin(B.ph * .7 + B.i);
        bp.set(L.p.x + Math.cos(B.ph) * r, L.p.y + .5 + .5 * Math.sin(B.ph * 1.9 + B.i), L.p.z + Math.sin(B.ph) * r, .55); bh.set(-Math.sin(B.ph), .15 * Math.cos(B.ph * 1.9), Math.cos(B.ph), (B.flap += dt * 26));
        continue;
      }
      if (B.st === 1) {
        B.t += dt; if (B.t < 0) { bp.w = 0; continue; }
        const c = Math.cos(B.turn * dt), s = Math.sin(B.turn * dt), vx = B.v.x * c - B.v.z * s; B.v.z = B.v.x * s + B.v.z * c; B.v.x = vx;
        B.v.y += ((B.p.y < 28 ? 3.5 : -.5) - B.v.y) * dt * .8; const hs = Math.hypot(B.v.x, B.v.z) || 1; B.v.x *= (8.5 / hs - 1) * dt + 1; B.v.z *= (8.5 / hs - 1) * dt + 1;
        B.p.addScaledVector(B.v, dt); B.flap += dt * (B.v.y > 1 ? 22 : 12 * (.5 + .5 * Math.sin(B.t * 1.3)));
        bp.set(B.p.x, B.p.y, B.p.z, 1); bh.set(B.v.x, B.v.y * .5, B.v.z, B.flap);
        if (B.t > B.dur || Math.hypot(B.p.x, B.p.z) > 88) { B.st = 2; B.wait = rr(15, 35); bp.w = 0; }
      } else { bp.w = 0; if (B.st === 2 && (B.wait -= dt) <= 0) B.st = 0; }
    }
    // the lanterns swing on their hooks and glow from dusk till dawn
    for (const L of LAMPS) {
      const gx = W.x * W.z * (.5 + .9 * Math.sin(t * 1.3 + L.p.x) * Math.sin(t * .47 + L.p.z)), gz = W.y * W.z * (.5 + .9 * Math.sin(t * 1.1 + L.p.z) * Math.sin(t * .53));
      L.vx += (-20 * L.ax - 1.1 * L.vx + gz * 3) * dt; L.vz += (-20 * L.az - 1.1 * L.vz - gx * 3) * dt; L.ax = cl(L.ax + L.vx * dt, -.8, .8); L.az = cl(L.az + L.vz * dt, -.8, .8);
      L.pivot.rotation.set(L.ax, 0, L.az);
      const on = H.lamps * (1 - .2 * storm); L.light.intensity = on * L.I0 * (.92 + .08 * Math.sin(t * 13 + L.p.x) * Math.sin(t * 7.3)); L.glow.material.opacity = on; L.glow.visible = on > .02;
    }
  }

  const api = {
    root, update, light, impact, roar, timeRate: .07, onThunder: null,
    get flash() { return flashV; },
    get time() { return hours; }, setTime(h) { hours = ((+h % 24) + 24) % 24; },
    get weather() { return wName; }, setWeather(n) { if (n === 'clear' || n === 'rain' || n === 'storm') { wName = n; wT = n === 'clear' ? 0 : n === 'rain' ? .55 : 1; } },
    setWrath(w) { wrathT = cl(+w || 0, 0, 1); },
    vortex(x, z, r, s) { VT.set(x, z, r, s); },
    setRings(on) { rings.visible = !!on; }, setScenery(on) { scenery.visible = !!on; bare.visible = !on; },
    setDay(on) { hours = on ? 12 : 22; },
    get day() { return H.stars < .5; },
  };
  update(0, 0, null);
  return api;
}
