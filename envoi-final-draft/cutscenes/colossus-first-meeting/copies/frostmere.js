// frostmere.js: the meadow below the frozen pass by Frostmere Lake, the Bramble Colossus's place in the game (band 4,
// the painting 05 Frostmere Lakeside Meadow), built in 3D for a camera that goes anywhere. A night of the longest-night
// season: the starless plum sky with the big moon (the stars come back only at the ending), snow-capped ranges, dark spruce
// forest, the lake half frozen at its edges and holding the moon, mist in the low ground, and a meadow white with frost,
// except in a ring round the colossus where its warm heart keeps it green and in flower (the "Thornheart" idea in
// docs/handoff.md: spring still holds there against Noctara's cold). three.js r128 (global THREE).
// Defines makeFrostmere(renderer, opts) only. It returns { scene, moon, moonDir, update(t, dt, camera), impact(x, z, k),
//   setWarm(r), set({ frost, wind }), heightAt(x, z), stats }.
// opts: { quality: 'medium' | 'high' | 'max' (grass and trees), shadows (default true) }
// cutscene: this copy (envoi-final-draft/cutscenes/colossus-first-meeting/) adds, each line marked "cutscene:": opts.grass
//   (the grass and flowers, times the quality's), opts.keepOff(x, z) (true where no grass, flower or stone may grow: the
//   frozen road), opts.reflect (false: no reflection in the lake; a number: its picture's width, 512 at first) and
//   opts.reflectEvery (draw it every n frames), opts.shadowSize (the moon's shadow map, 4096 at first), and shadowAt(x, z)
//   (the moon's shadow covers that spot instead of the warm ring's middle).
function makeFrostmere(renderer, opts) {
  'use strict';
  opts = opts || {};
  const QL = { medium: .45, high: 1, max: 1.8 }[opts.quality || 'high'] || 1;
  const TAU = Math.PI * 2, PI = Math.PI;
  let seed = 51713;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const lin = (v) => Math.pow(v, 2.2);
  const C3 = (r, g, b) => new THREE.Color(lin(r), lin(g), lin(b));
  const hexL = (h) => new THREE.Color(h).convertSRGBToLinear();
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // value noise and fbm, for the land
  const NP = new Uint8Array(512); { const p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; }
  const hsh = (x, y) => NP[(NP[x & 255] + y) & 511] / 255;
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hsh(xi, yi), hsh(xi + 1, yi), u), lerp(hsh(xi, yi + 1), hsh(xi + 1, yi + 1), u), v); }
  const fbm = (x, y, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < (o || 5); i++) { s += a * vnoise(x * f, y * f); a *= .5; f *= 2.03; } return s; };
  const ridged = (x, y, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < (o || 6); i++) { const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1); s += a * n * n; a *= .5; f *= 2.1; } return s; };

  const scene = new THREE.Scene();
  // the moon's place: high over the peaks to the north-west, as in the painting
  const moonDir = V3(-.42, .36, -.83).normalize();
  const FOG = { col: C3(.2, .16, .3), glow: C3(.46, .44, .6), density: .0042, haze: .00005, falloff: .11, base: -1 };
  scene.fog = new THREE.FogExp2(FOG.col.getHex(), FOG.density); scene.fog.color.copy(FOG.col);

  // ---------- the air: height fog for every lit thing, brighter toward the moon ----------
  // three.js r128's fog chunks are replaced (for every material compiled from now on): the fog thickens toward the ground
  // (an exponential height fog, integrated along the view), a thin haze fills the distance so the far ranges go blue, and
  // the fog glows where the view looks toward the moon.
  {
    const v3 = (v) => 'vec3(' + v.x.toFixed(4) + ',' + v.y.toFixed(4) + ',' + v.z.toFixed(4) + ')';
    THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying vec3 vFogOff;\n#endif';
    THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogOff = vec3(dot(viewMatrix[0].xyz, mvPosition.xyz), dot(viewMatrix[1].xyz, mvPosition.xyz), dot(viewMatrix[2].xyz, mvPosition.xyz));\n#endif';
    THREE.ShaderChunk.fog_pars_fragment = '#ifdef USE_FOG\n uniform vec3 fogColor;\n varying vec3 vFogOff;\n #ifdef FOG_EXP2\n  uniform float fogDensity;\n #else\n  uniform float fogNear;\n  uniform float fogFar;\n #endif\n#endif';
    THREE.ShaderChunk.fog_fragment = '#ifdef USE_FOG\n { vec3 fo = vFogOff; float fd = length(fo); vec3 fv = fo / max(fd, 1e-3);\n' +
      '  float k = ' + FOG.falloff.toFixed(4) + ', y0 = cameraPosition.y - (' + FOG.base.toFixed(2) + '), dy = fo.y;\n' +
      '  float hf = abs(dy * k) > 1e-3 ? (exp(-k * y0) - exp(-k * (y0 + dy))) / (k * dy) : exp(-k * y0);\n' +
      '  #ifdef FOG_EXP2\n  float dens = fogDensity;\n  #else\n  float dens = 1. / max(fogFar, 1.);\n  #endif\n' +
      '  float fa = 1. - exp(-dens * fd * max(hf, 0.));\n  fa = 1. - (1. - fa) * exp(-fd * ' + FOG.haze.toFixed(6) + ');\n' +
      '  float sa = pow(max(dot(fv, ' + v3(moonDir) + '), 0.), 10.) * .8;\n' +
      '  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, ' + v3(new THREE.Vector3(FOG.glow.r, FOG.glow.g, FOG.glow.b)) + ', sa), clamp(fa, 0., 1.)); }\n#endif';
  }

  // ---------- the sky ----------
  // A dome: plum overhead to lavender haze at the horizon, a pale glow round the moon, thin high cloud lit on its moon side,
  // and the moon itself, painted: its seas, its bright rays, its craters. No stars.
  const moonTex = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
    let q = g.createRadialGradient(h * .9, h * .85, 0, h, h, h); q.addColorStop(0, '#f4f2ec'); q.addColorStop(.8, '#e2ded6'); q.addColorStop(1, '#c8c2bc'); g.fillStyle = q; g.beginPath(); g.arc(h, h, h - 1, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(h, h, h - 1, 0, TAU); g.clip();
    for (const [x, y, r, a] of [[.36, .32, .2, .5], [.55, .4, .16, .45], [.45, .55, .22, .4], [.66, .6, .12, .45], [.3, .62, .13, .35], [.6, .25, .09, .4], [.72, .45, .1, .35]]) {
      for (let i = 0; i < 14; i++) { const xx = (x + rr(-.05, .05)) * S, yy = (y + rr(-.05, .05)) * S, rad = r * S * rr(.4, .8); q = g.createRadialGradient(xx, yy, 0, xx, yy, rad); q.addColorStop(0, 'rgba(120,118,128,' + (a * .35) + ')'); q.addColorStop(1, 'rgba(120,118,128,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); }
    }
    for (let i = 0; i < 260; i++) { const x = rnd() * S, y = rnd() * S, r = Math.pow(rnd(), 3) * 18 + 1.5; g.fillStyle = 'rgba(90,88,96,.18)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,250,.22)'; g.lineWidth = Math.max(.6, r * .2); g.beginPath(); g.arc(x - r * .15, y - r * .15, r, PI * .9, PI * 1.9); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,250,.08)'; g.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = rnd() * TAU; g.beginPath(); g.moveTo(S * .42, S * .78); g.lineTo(S * .42 + Math.cos(a) * S * rr(.2, .5), S * .78 + Math.sin(a) * S * rr(.2, .5)); g.stroke(); }
    g.restore();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  })();
  const SKYU = { uMoon: { value: moonDir.clone() }, uMoonTex: { value: moonTex }, uTime: { value: 0 }, uZen: { value: C3(.075, .055, .14) }, uHor: { value: C3(.3, .24, .42) }, uLow: { value: C3(.14, .12, .2) }, uGlow: { value: C3(.82, .8, .95) } };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: SKYU,
    vertexShader: 'varying vec3 vD;\nvoid main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader: 'uniform vec3 uMoon, uZen, uHor, uLow, uGlow; uniform sampler2D uMoonTex; uniform float uTime; varying vec3 vD;\n' +
      'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }\n' +
      'float fb(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.07 + 13.1; a *= .5; } return s; }\n' +
      'void main(){ vec3 d = normalize(vD); float y = d.y; float md = dot(d, uMoon);\n' +
      ' vec3 c = mix(uHor, uZen, pow(smoothstep(-.02, .75, y), .6)); c = mix(uLow, c, smoothstep(-.12, .02, y));\n' +
      ' c += uGlow * (pow(max(md, 0.), 9.) * .25 + pow(max(md, 0.), 60.) * .6 + pow(max(md, 0.), 600.) * 1.4);\n' +
      // high thin cloud: streaks across the sky, lit on the moon side
      ' if (y > -.05) { vec2 cp = d.xz / (y + .18) * 1.6; cp.x += uTime * .006; float cv = fb(cp * vec2(.7, 2.2)) ; cv = smoothstep(.52, .85, cv) * smoothstep(-.02, .2, y) * (1. - smoothstep(.55, .95, y));\n' +
      '  c = mix(c, c * .55 + uGlow * (.05 + .45 * pow(max(md, 0.), 6.)), cv * .75); }\n' +
      // the moon: a disc of 2.6 degrees, painted, with a soft limb
      ' float ang = acos(clamp(md, -1., 1.)); float R = .046; if (ang < R * 1.05) { vec3 up = abs(uMoon.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.); vec3 ax = normalize(cross(up, uMoon)), ay = cross(uMoon, ax);\n' +
      '  vec2 uv = vec2(dot(d, ax), dot(d, ay)) / R * .5 + .5; vec4 mt = texture2D(uMoonTex, uv); float edge = 1. - smoothstep(R * .97, R * 1.02, ang); c = mix(c, mt.rgb * 7.5, edge * mt.a); }\n' +
      ' gl_FragColor = vec4(c, 1.); gl_FragColor = linearToOutputTexel(gl_FragColor); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 32), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; sky.layers.enable(2); scene.add(sky);

  // ---------- lights ----------
  const moon = new THREE.DirectionalLight(C3(.8, .84, 1).getHex(), 3.4); moon.color.copy(C3(.8, .84, 1));
  moon.position.copy(moonDir).multiplyScalar(80); scene.add(moon); scene.add(moon.target);
  const SHADOWS = opts.shadows !== false;
  if (SHADOWS) {
    moon.castShadow = true; moon.shadow.mapSize.set(opts.shadowSize || 4096, opts.shadowSize || 4096); // cutscene: opts.shadowSize
    const sc = moon.shadow.camera; sc.left = sc.bottom = -24; sc.right = sc.top = 24; sc.near = 5; sc.far = 180;
    moon.shadow.bias = -.00025; moon.shadow.normalBias = .03; moon.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(C3(.42, .36, .62).getHex(), C3(.1, .1, .08).getHex(), .55); hemi.color.copy(C3(.42, .36, .62)); hemi.groundColor.copy(C3(.12, .11, .09)); scene.add(hemi);

  // ---------- the land ----------
  // flat where the colossus stands, rising gently to low knolls further out, and falling away into the lake to the
  // north-east; heightAt(x, z) is the ground's height
  const LAKE = { x: 190, z: -330, rx: 300, rz: 170 };
  const lakeK = (x, z) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);
  function heightAt(x, z) {
    const r = Math.hypot(x, z), k = sm(30, 120, r);
    let h = (fbm(x * .006 + 3, z * .006 + 7, 4) - .5) * 9 * k + (fbm(x * .03, z * .03, 3) - .5) * .6 * sm(8, 40, r);
    h += sm(400, 1400, r) * 25 * fbm(x * .002, z * .002, 3);
    const lk = lakeK(x, z); h = lerp(h, -3.2, sm(1.12, .9, lk));
    return h;
  }
  // ground textures: grass and soil at a few centimetres to the pixel, tiling; a height for its normal
  const groundTex = (() => {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d'), hc = cvs(S, S), h = hc.getContext('2d');
    g.fillStyle = '#2c3020'; g.fillRect(0, 0, S, S); h.fillStyle = '#808080'; h.fillRect(0, 0, S, S);
    const tl = (f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
    for (let i = 0; i < 9000; i++) { const x = rnd() * S, y = rnd() * S, r = 2 + rnd() * 9, c2 = rnd() < .5 ? 'rgba(20,18,12,.25)' : rnd() < .5 ? 'rgba(70,74,44,.2)' : 'rgba(90,70,48,.18)'; tl((ox, oy) => { g.fillStyle = c2; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }); }
    g.lineCap = 'round';
    for (let i = 0; i < 26000; i++) { const x = rnd() * S, y = rnd() * S, a = rnd() * TAU, l = 6 + rnd() * 16, dk = rnd() < .4; tl((ox, oy) => { g.strokeStyle = dk ? 'rgba(14,16,8,.35)' : rnd() < .5 ? 'rgba(96,110,60,.3)' : 'rgba(130,120,80,.22)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); h.strokeStyle = dk ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.25)'; h.lineWidth = 1.6; h.beginPath(); h.moveTo(x + ox, y + oy); h.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); h.stroke(); }); }
    for (let i = 0; i < 300; i++) { const x = rnd() * S, y = rnd() * S, r = 2 + rnd() * 5; tl((ox, oy) => { g.fillStyle = 'rgba(120,114,104,.6)'; g.beginPath(); g.ellipse(x + ox, y + oy, r, r * .7, rnd() * 3, 0, TAU); g.fill(); h.fillStyle = 'rgba(255,255,255,.5)'; h.beginPath(); h.arc(x + ox, y + oy, r, 0, TAU); h.fill(); }); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding;
    // normal from height
    const W = S, src = h.getImageData(0, 0, W, W).data, n = g.createImageData(W, W), d = n.data, at = (x, y) => src[(((y + W) % W) * W + (x + W) % W) * 4] / 255;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = at(x + 1, y) - at(x - 1, y), dy = at(x, y + 1) - at(x, y - 1), nx = -dx * 2.5, ny = dy * 2.5, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4; d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255; }
    const nc = cvs(W, W); nc.getContext('2d').putImageData(n, 0, 0); const tn = new THREE.CanvasTexture(nc); tn.wrapS = tn.wrapT = THREE.RepeatWrapping; tn.anisotropy = 8;
    return { map: t, normal: tn };
  })();
  // the warmth round the colossus: frost on the ground and grass fades out inside WR meters of WC (the warm ring), and the
  // grass there is green and in flower; FR is how hard the frost is tonight; WAVES are shockwaves running out through the
  // grass from blows (x, z, start time, strength)
  const WU = { uWC: { value: V3() }, uWR: { value: 20 }, uFR: { value: 1 }, uTime: { value: 0 }, uWind: { value: new THREE.Vector2(.6, .2) }, uWaves: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -99, 0)) } };
  const WARMGLSL = 'uniform vec3 uWC; uniform float uWR, uFR, uTime; uniform vec2 uWind; uniform vec4 uWaves[4];\n' +
    'float wh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }\nfloat wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wh(i), wh(i + vec2(1, 0)), f.x), mix(wh(i + vec2(0, 1)), wh(i + vec2(1, 1)), f.x), f.y); }\n' +
    'float frostAt(vec2 p){ float d = length(p - uWC.xz); float n = wn(p * .23) * 6. + wn(p * 1.3) * 1.5; return uFR * smoothstep(uWR - 3., uWR + 5., d + n - 3.); }\n';
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex.map, normalMap: groundTex.normal, normalScale: new THREE.Vector2(.8, .8), roughness: .95, color: new THREE.Color(1, 1, 1), vertexColors: true });
  groundMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, WU);
    sh.vertexShader = 'varying vec3 vGW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vGW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'varying vec3 vGW;\n' + WARMGLSL + sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\n { vec2 uv2 = vGW.xz * .21; vec4 t2 = texture2D(map, uv2 * .37 + .31); diffuseColor.rgb = mix(diffuseColor.rgb, mapTexelToLinear(t2).rgb, .45);\n  float gM1 = wn(vGW.xz * .045), gM2 = wn(vGW.xz * .21 + 9.); diffuseColor.rgb *= mix(vec3(.55, .72, .5), vec3(.85, .78, .55), gM1 * .7) * (.7 + .5 * gM2); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n float gFr = frostAt(vGW.xz); diffuseColor.rgb *= mix(vec3(.8, 1.25, .75), vec3(1.), clamp(gFr / max(uFR, .01), 0., 1.)); { float n = wn(vGW.xz * 3.1); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .23, .3) * (.75 + .35 * n), gFr * (.12 + .18 * n)); }')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .7, gFr * .5);');
  };
  {
    // a polar grid: fine near the middle, coarse far off, out to 2.4 km
    const NA = 256, NR = 150, pos = [], col = [], uv = [], idx = [];
    const rAt = (i) => i === 0 ? 0 : .35 * Math.pow(1.0445, i * 1.5) - .35 + i * .08;
    for (let i = 0; i <= NR; i++) { const r = Math.min(2400, rAt(i)); for (let j = 0; j <= NA; j++) { const a = j / NA * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r, y = heightAt(x, z), lk = lakeK(x, z); pos.push(x, y, z); uv.push(x * .45, z * .45); const shore = sm(1.05, .95, lk); col.push(lerp(1, .7, shore), lerp(1, .75, shore), lerp(1, .8, shore)); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, groundMat); m.receiveShadow = SHADOWS; m.name = 'ground'; scene.add(m);
  }

  // ---------- the grass ----------
  // Blades in clumps, densest round the colossus: each a curved strip that leans, sways in gusts that roll across the
  // meadow, bows out from a shockwave as it passes, and takes the moon's shadow. Out in the cold they are frosted at the
  // tips and half of them winter-straw; inside the warm ring they are green.
  const grass = (() => {
    const N = Math.round(130000 * QL * (opts.grass || 1)) /* cutscene: opts.grass */, SEGS = QL > 1.2 ? 4 : 3, pos = [], nrm = [], idx = [];
    for (let i = 0; i <= SEGS; i++) { const t = i / SEGS, w = .5 * (1 - t * .85); pos.push(-w, t, 0, w, t, 0); nrm.push(0, .4, 1, 0, .4, 1); }
    for (let i = 0; i < SEGS; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
    const off = new Float32Array(N * 4), prm = new Float32Array(N * 4);
    let n = 0;
    while (n < N) {
      // a clump: its place drawn densest near the middle, out to 70 m
      const r = 1.2 + Math.pow(rnd(), 1.7) * 70, a = rnd() * TAU, cx = Math.sin(a) * r, cz = Math.cos(a) * r, k = 4 + Math.floor(rnd() * 10), cr = rr(.08, .3);
      if (lakeK(cx, cz) < 1.08) continue;
      if (opts.keepOff && opts.keepOff(cx, cz)) continue; // cutscene: nothing grows on the road (and opts.grass, above)
      for (let q = 0; q < k && n < N; q++, n++) {
        const x = cx + rr(-cr, cr), z = cz + rr(-cr, cr), hgt = rr(.18, .55) * (r < 4 ? .7 : 1);
        off[n * 4] = x; off[n * 4 + 1] = heightAt(x, z) - .02; off[n * 4 + 2] = z; off[n * 4 + 3] = rnd() * TAU;
        prm[n * 4] = hgt; prm[n * 4 + 1] = rr(.022, .05); prm[n * 4 + 2] = rnd(); prm[n * 4 + 3] = rr(.15, .7);
      }
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); g.setAttribute('aPrm', new THREE.InstancedBufferAttribute(prm, 4)); g.instanceCount = N;
    const m = new THREE.MeshStandardMaterial({ roughness: .78, side: THREE.DoubleSide, color: 0xffffff });
    const GV = WARMGLSL + 'attribute vec4 aOff, aPrm; varying float vT; varying float vFr; varying float vStraw; varying vec3 vGW;\n' +
      'vec3 bladeP(vec3 p, out float fr){ float yaw = aOff.w, h = aPrm.x, w = aPrm.y, lean = aPrm.w; vec2 base = aOff.xz; fr = frostAt(base);\n' +
      ' float t = p.y; vec3 q = vec3(p.x * w, t * h, 0.); float cy = cos(yaw), sy = sin(yaw); q = vec3(q.x * cy, q.y, q.x * sy);\n' +
      ' vec2 dir = vec2(-sy, cy); float bend = lean * t * t;\n' +
      // wind: gusts rolling across the meadow
      ' float gust = wn(base * .06 - uWind * uTime * .09) * 1.4 + .3 * sin(uTime * 2.1 + base.x * .7 + base.y * .3); vec2 wd = normalize(uWind + 1e-4); bend += 0.;\n' +
      ' vec2 push = dir * lean * .6 + wd * gust * .55 * length(uWind);\n' +
      // shockwaves: a ring racing out at 14 m/s that flattens the grass outward as it passes
      ' for (int i = 0; i < 4; i++) { vec4 W = uWaves[i]; float age = uTime - W.z; if (age > 0. && age < 2.6) { vec2 dv = base - W.xy; float dd = length(dv); float front = age * 14.; float s = exp(-pow((dd - front) * .5, 2.)) * W.w * exp(-age * 1.1) * exp(-dd * .03); push += dv / max(dd, .01) * s * 1.6; } }\n' +
      ' float pl = length(push); vec2 pd = push / max(pl, 1e-4); float ang = min(pl, 1.35) * t * t; q.xz += pd * sin(ang) * h; q.y = q.y * cos(ang * .8);\n' +
      ' return vec3(base.x, aOff.y, base.y) + q; }\n';
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, WU);
      sh.vertexShader = GV + sh.vertexShader
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(vec3(-sin(aOff.w) * .55, .75, cos(aOff.w) * .55));')
        .replace('#include <begin_vertex>', 'float gfr; vec3 transformed = bladeP(position, gfr); vT = position.y; vFr = gfr; vStraw = step(.55 + .3 * (1. - gfr), aPrm.z) * gfr; vGW = transformed;');
      sh.fragmentShader = 'uniform float uFR; varying float vT; varying float vFr; varying float vStraw; varying vec3 vGW;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n { vec3 g0 = vec3(.012, .028, .01), g1 = vec3(.05, .1, .03); vec3 s0 = vec3(.06, .045, .025), s1 = vec3(.2, .16, .09);\n' +
          '  vec3 c = mix(mix(g0, g1, vT), mix(s0, s1, vT), vStraw); c *= .8 + .4 * fract(sin(dot(floor(vGW.xz * 3.), vec2(12.9, 78.2))) * 437.5);\n' +
          '  c = mix(c, vec3(.3, .34, .44), vFr * smoothstep(.45, 1., vT) * .5); c *= mix(1.5, 1., clamp(vFr / max(uFR, .01), 0., 1.)); diffuseColor.rgb = c; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(.004, .006, .003) * (1. - vFr) * vT;');
    };
    m.customProgramCacheKey = () => 'frost-grass';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = SHADOWS; mesh.name = 'grass';
    // its shadow pass uses the same blade shapes
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
    dm.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, WU); sh.vertexShader = GV + sh.vertexShader.replace('#include <begin_vertex>', 'float gfr; vec3 transformed = bladeP(position, gfr); vT = position.y; vFr = gfr; vStraw = 0.; vGW = transformed;'); };
    dm.customProgramCacheKey = () => 'frost-grass-d';
    mesh.customDepthMaterial = dm; mesh.castShadow = false;
    scene.add(mesh); return { mesh, n: N };
  })();
  // small white flowers, open and lit inside the warm ring; a few closed and frosted out beyond it
  const flowers = (() => {
    const N = Math.round(6500 * QL * (opts.grass || 1)), pos = [], col = [], idx = []; // cutscene: opts.grass
    // a five-petalled star on a stem: the stem a thin quad, the flower a fan
    pos.push(-.004, 0, 0, .004, 0, 0, -.003, 1, 0, .003, 1, 0); col.push(.1, .2, .06, .1, .2, .06, .14, .3, .08, .14, .3, .08); idx.push(0, 1, 2, 1, 3, 2);
    const c0 = 4; pos.push(0, 1.02, 0); col.push(1, .85, .4);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, r = k % 2 ? .012 : .042; pos.push(Math.cos(a) * r, 1.02 + (k % 2 ? 0 : .006), Math.sin(a) * r); col.push(1, 1, 1); }
    for (let k = 0; k < 10; k++) idx.push(c0, c0 + 1 + k, c0 + 1 + (k + 1) % 10, c0, c0 + 1 + (k + 1) % 10, c0 + 1 + k);
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col.map(lin), 3)); g.setIndex(idx); g.computeVertexNormals();
    const off = new Float32Array(N * 4); let n = 0;
    while (n < N) { const r = 2.5 + Math.pow(rnd(), 1.3) * 34, a = rnd() * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r; if (r > 17 && rnd() < .85) continue; if (opts.keepOff && opts.keepOff(x, z)) continue; /* cutscene: keepOff */ off[n * 4] = x; off[n * 4 + 1] = heightAt(x, z); off[n * 4 + 2] = z; off[n * 4 + 3] = rr(.14, .3); n++; }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); g.instanceCount = N;
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, WU);
      sh.vertexShader = WARMGLSL + 'attribute vec4 aOff; varying float vFr;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position; float fr = frostAt(aOff.xz); vFr = fr; transformed.y *= aOff.w; transformed.xz *= mix(1., .35, fr) * (1. + aOff.w); float sw = sin(uTime * 1.7 + aOff.x * 1.3) * .03 * position.y; transformed.x += sw; transformed += vec3(aOff.x, aOff.y, aOff.z);');
      sh.fragmentShader = 'varying float vFr;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .46, .56), vFr * .7);');
    };
    m.customProgramCacheKey = () => 'frost-flowers';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = SHADOWS; scene.add(mesh); return mesh;
  })();

  // ---------- stones ----------
  // a few erratics the ice left: grey, crusted with lichen, frosted on top
  {
    const geos = [], mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 });
    const spots = [[19, 11, 1.4], [-24, 6, .9], [-14, -26, 1.8], [31, -18, 1.1], [7, 33, .7], [-36, 22, 2.2], [44, 30, 1.3], [-8, 48, 1], [52, -40, 2.6], [-60, -12, 1.9], [12, -58, 1.5]];
    for (const [x, z, s] of spots) {
      if (opts.keepOff && opts.keepOff(x, z)) continue; // cutscene: keepOff
      const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, c = [];
      const sx = rr(.9, 1.6), sy = rr(.45, .75), sz = rr(.8, 1.3);
      for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = .78 + .44 * fbm(vx * 2.2 + x, vz * 2.2 + vy * 1.7 + z, 4); p.setXYZ(i, vx * k * sx * s, Math.max(vy * k * sy * s, -.15 * s), vz * k * sz * s); }
      g.computeVertexNormals(); const nn = g.attributes.normal;
      for (let i = 0; i < p.count; i++) { const up = nn.getY(i), li = fbm(p.getX(i) * 3, p.getZ(i) * 3, 3); let r = .3, gg = .29, b = .3; if (li > .55) { r = .42; gg = .45; b = .36; } if (up > .5) { const f = sm(.5, .9, up) * .8; r = lerp(r, .7, f); gg = lerp(gg, .74, f); b = lerp(b, .82, f); } c.push(lin(r), lin(gg), lin(b)); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.translate(x, heightAt(x, z) - .1 * s, z); g.deleteAttribute('uv'); geos.push(g);
    }
    const merged = mergeGeos(geos), m = new THREE.Mesh(merged, mat); m.castShadow = m.receiveShadow = SHADOWS; scene.add(m);
  }
  function mergeGeos(list) {
    let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const out = new THREE.BufferGeometry(), names = Object.keys(list[0].attributes);
    for (const k of names) { const sz = list[0].attributes[k].itemSize, a = new Float32Array(nv * sz); let o = 0; for (const g of list) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(a, sz)); }
    const I = new Uint32Array(ni); let io = 0, vo = 0; for (const g of list) { const c = g.attributes.position.count; if (g.index) { for (let i = 0; i < g.index.count; i++) I[io++] = g.index.array[i] + vo; } else for (let i = 0; i < c; i++) I[io++] = vo + i; vo += c; }
    out.setIndex(new THREE.BufferAttribute(I, 1)); return out;
  }

  // ---------- the forest ----------
  // Spruce and fir round the meadow and up the slopes: each a trunk and tiers of drooping branches with ragged edges,
  // their upper faces dusted with snow. Near ones in detail, far ones as a few cones; a gap opens toward the lake.
  const spruce = (tiers, rs, jag) => {
    const pos = [], col = [], idx = [], add = (x, y, z, c) => { pos.push(x, y, z); col.push(c[0], c[1], c[2]); return pos.length / 3 - 1; };
    const bark = [lin(.16), lin(.12), lin(.1)];
    for (let j = 0; j <= 5; j++) { const a = j / 5 * TAU; add(Math.cos(a) * .035, 0, Math.sin(a) * .035, bark); add(Math.cos(a) * .008, 1, Math.sin(a) * .008, bark); }
    for (let j = 0; j < 5; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    for (let t = 0; t < tiers; t++) {
      const f = t / tiers, y0 = .1 + Math.pow(f, .9) * .84, R = Math.pow(1 - f, 1.1) * .4 * (jag ? rr(.85, 1.15) : 1) + .025, drop = (.09 + .08 * (1 - f)) * (jag ? rr(.8, 1.3) : 1), top = y0 + .1 + .04 * (1 - f), rot = rnd() * TAU;
      const ci = add(0, top, 0, [lin(.04), lin(.07), lin(.05)]), ring = [], mid = [];
      for (let j = 0; j <= rs; j++) {
        const a = rot + j / rs * TAU, tip = jag ? (j % 2 ? .62 : 1) * rr(.8, 1.15) : 1, rj = R * tip, y = y0 - drop * (jag ? (j % 2 ? .45 : 1) * rr(.8, 1.2) : 1);
        const snow = jag ? (j % 2 ? .15 : .6) * rr(.3, 1) : .35, cc = [lin(lerp(.045, .62, snow * .7)), lin(lerp(.075, .65, snow * .7)), lin(lerp(.05, .74, snow * .7))];
        ring.push(add(Math.cos(a) * rj, y, Math.sin(a) * rj, cc));
        mid.push(add(Math.cos(a) * rj * .55, lerp(top, y, .62) + .015, Math.sin(a) * rj * .55, [lin(.05), lin(.09), lin(.06)]));
      }
      for (let j = 0; j < rs; j++) { idx.push(ci, mid[j + 1], mid[j]); idx.push(mid[j], mid[j + 1], ring[j]); idx.push(mid[j + 1], ring[j + 1], ring[j]); }
      const bi = add(0, y0 - .03, 0, [lin(.015), lin(.022), lin(.018)]);
      for (let j = 0; j < rs; j++) idx.push(bi, ring[j], ring[j + 1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const forest = (() => {
    const nearG = [spruce(12, 14, true), spruce(11, 12, true), spruce(13, 14, true)], farG = spruce(3, 6, false);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92 });
    mat.onBeforeCompile = (sh) => { sh.uniforms.uTime = WU.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n { vec3 ip = instanceMatrix[3].xyz; transformed.x += sin(uTime * .8 + ip.x * .05 + ip.z * .03) * .012 * position.y * position.y; }\n#endif'); };
    mat.customProgramCacheKey = () => 'frost-tree';
    const near = [], far = [];
    let tries = 0;
    const want = Math.round(620 * QL), wantFar = Math.round(3400 * Math.min(QL, 1.2));
    while ((near.length < want || far.length < wantFar) && tries++ < 200000) {
      const r = 62 + Math.pow(rnd(), .8) * 1500, a = rnd() * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (lakeK(x, z) < 1.18) continue;
      { const la = Math.atan2(LAKE.x, LAKE.z), ta = Math.atan2(x, z), dA = Math.abs(Math.atan2(Math.sin(ta - la), Math.cos(ta - la))); if (dA < .42 && r < 420) continue; }
      // the meadow opens toward the lake (north-east) and toward the camera's usual side (south)
      const open = Math.max(sm(.5, .1, Math.abs(Math.atan2(x - LAKE.x * .3, z - LAKE.z * .3) - Math.atan2(LAKE.x, LAKE.z))) * sm(400, 120, r), sm(160, 90, r) * sm(.9, .4, Math.abs(a)));
      if (rnd() < open) continue;
      // thicker in clusters
      if (fbm(x * .01, z * .01, 3) < .42 + .1 * sm(200, 60, r)) continue;
      const h = rr(14, 30) * (1 + .3 * sm(300, 900, r)), y = heightAt(x, z) - .3;
      const m4 = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), rnd() * TAU), V3(h * rr(.85, 1.15), h, h * rr(.85, 1.15)));
      if (r < 320) { if (near.length < want) near.push(m4); } else if (far.length < wantFar) far.push(m4);
    }
    const mk = (g, list) => { const im = new THREE.InstancedMesh(g, mat, Math.max(1, list.length)); list.forEach((m4, i) => im.setMatrixAt(i, m4)); im.count = list.length; im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; scene.add(im); return im; };
    const imN = nearG.map((g, k) => mk(g, near.filter((_, i) => i % 3 === k))), imF = mk(farG, far); imF.layers.enable(2);
    return { near: imN, far: imF, n: near.length + far.length };
  })();

  // ---------- the ranges ----------
  // three bands of mountains round the horizon, highest in the north behind the moon: ridged peaks, snow on everything not
  // too steep and above the tree line, bare rock on the cliffs, dark forest at their feet
  const ranges = (() => {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 });
    // (wound to face the meadow, so no back faces show through at a distance)
    // snow lit by the whole sky glows a little of itself, so the ranges read pale against the night as in the painting
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * smoothstep(.15, .55, diffuseColor.r) * .22;'); };
    const out = [];
    const nAz = (QL > 1.2 ? 900 : 640);
    for (const [R0, R1, H, rows, fq, sk] of [[2300, 3400, 300, 40, 1 / 600, 1], [2900, 4600, 900, 40, 1 / 1000, 2], [5000, 8200, 1900, 40, 1 / 1600, 3]]) {
      const pos = [], idx = [], NS = nAz;
      for (let i = 0; i <= rows; i++) for (let j = 0; j <= NS; j++) {
        const a = j / NS * TAU, v = i / rows, R = lerp(R0, R1, v), x = Math.sin(a) * R, z = Math.cos(a) * R;
        // highest to the north (behind the moon), lower round the sides, low hills to the south
        const north = Math.pow(.5 + .5 * Math.cos(a - PI), 1.3), env = Math.sin(PI * Math.pow(v, .8)) * (.3 + .9 * north);
        const rd = ridged(x * fq + sk * 31, z * fq + sk * 17, 7), y = -60 + H * env * (rd * 1.25 + .15 * fbm(x * fq * 4, z * fq * 4, 3));
        pos.push(x, y, z);
      }
      for (let i = 0; i < rows; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const p = g.attributes.position, nn = g.attributes.normal, col = [];
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), x = p.getX(i), z = p.getZ(i), up = Math.abs(nn.getY(i));
        const snowLine = 140 + 160 * fbm(x * .003, z * .003, 3), snow = sm(snowLine - 40, snowLine + 120, y) * sm(.35, .62, up + .2 * (fbm(x * .03, z * .03, 2) - .5));
        const tree = sm(snowLine * .6, snowLine * .25, y) * sm(.45, .7, up);
        let c = [.13, .12, .15]; c = c.map((v, k) => lerp(v, [.05, .07, .06][k], tree)); c = c.map((v, k) => lerp(v, [.82, .85, .94][k], snow));
        col.push(lin(c[0]), lin(c[1]), lin(c[2]));
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.enable(2); scene.add(m); out.push(m);
    }
    return out;
  })();

  // ---------- Frostmere ----------
  // The lake: black water holding the sky, the ranges and the moon's long path, rippling in the wind; ice along its
  // edges, and ice-skinned where the shallows reach out. A mirrored camera draws the far world into a picture for it
  // each frame (only the sky, the ranges and the far forest, at a third of the screen's size).
  const lake = (() => {
    const RW = typeof opts.reflect === 'number' ? opts.reflect : 512, RT = new THREE.WebGLRenderTarget(RW, RW / 2, { type: THREE.HalfFloatType }); let rN = 0; // cutscene: opts.reflect, opts.reflectEvery
    const mirror = new THREE.PerspectiveCamera(); mirror.layers.set(2);
    const LY = -1.15;
    const ripT = (() => { const S = 256, c = cvs(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4, n1 = Math.sin(x / S * TAU * 3 + Math.sin(y / S * TAU * 2) * 2), n2 = Math.sin(y / S * TAU * 5 + Math.sin(x / S * TAU * 4)); d[i] = 128 + n1 * 50 + (hsh(x, y) - .5) * 30; d[i + 1] = 128 + n2 * 50 + (hsh(y, x) - .5) * 30; d[i + 2] = 255; d[i + 3] = 255; } g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tRef: { value: RT.texture }, tRip: { value: ripT }, uTex: { value: new THREE.Matrix4() }, uTime: WU.uTime, uMoon: { value: moonDir.clone() }, uMoonC: { value: C3(.9, .92, 1) }, uDeep: { value: C3(.02, .022, .04) }, uLake: { value: new THREE.Vector4(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz) } }]),
      vertexShader: 'uniform mat4 uTex; varying vec4 vRef; varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vRef = uTex * w; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: 'uniform sampler2D tRef, tRip; uniform float uTime; uniform vec3 uMoon, uMoonC, uDeep; uniform vec4 uLake; varying vec4 vRef; varying vec3 vW;\n#include <fog_pars_fragment>\n' +
        'void main(){ vec2 p = vW.xz; vec3 n1 = texture2D(tRip, p * .021 + vec2(uTime * .006, uTime * .004)).rgb * 2. - 1.; vec3 n2 = texture2D(tRip, p * .057 - vec2(uTime * .009, -uTime * .005)).rgb * 2. - 1.;\n' +
        ' vec3 nrm = normalize(vec3((n1.x + n2.x) * .06, 1., (n1.y + n2.y) * .06)); vec3 V = normalize(cameraPosition - vW);\n' +
        ' vec2 ruv = vRef.xy / vRef.w + nrm.xz * .03; vec3 refl = texture2D(tRef, ruv).rgb; float fr = .02 + .98 * pow(1. - max(dot(V, nrm), 0.), 5.);\n' +
        ' vec3 H = normalize(V + uMoon); float spec = pow(max(dot(nrm, H), 0.), 900.) * 60. + pow(max(dot(nrm, H), 0.), 90.) * 1.5;\n' +
        ' vec3 c = mix(uDeep, refl, clamp(fr * 1.1, 0., 1.)) + uMoonC * spec;\n' +
        ' float k = length((p - uLake.xy) / uLake.zw); float ice = smoothstep(.8, .97, k + (texture2D(tRip, p * .011).r - .5) * .14); vec3 iceC = vec3(.32, .36, .46) * (.8 + .4 * texture2D(tRip, p * .2).g);\n' +
        ' c = mix(c, iceC + refl * .15, ice);\n' +
        ' gl_FragColor = vec4(c, 1.);\n#include <fog_fragment>\n}'
    });
    const shape = new THREE.Shape(); for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, wob = 1 + .06 * Math.sin(a * 3 + 1) + .04 * Math.sin(a * 7); shape[i ? 'lineTo' : 'moveTo'](LAKE.x + Math.cos(a) * LAKE.rx * 1.08 * wob, -(LAKE.z + Math.sin(a) * LAKE.rz * 1.08 * wob)); }
    const g = new THREE.ShapeGeometry(shape, 24); g.rotateX(-PI / 2); g.translate(0, LY, 0);
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; scene.add(mesh);
    const plane = new THREE.Plane(V3(0, 1, 0), -LY), _m = new THREE.Matrix4(), _p = V3(), _t = V3(), _u = V3();
    function update(cam) {
      // mirror the camera in the water's surface
      if (cam.position.y < LY + .05) return;
      if (opts.reflect === false || (rN++ % (opts.reflectEvery || 1)) !== 0) return; // cutscene: no reflection, or not every frame
      mirror.copy(cam); mirror.layers.set(2);
      cam.getWorldDirection(_t); _t.add(cam.position); _t.y = 2 * LY - _t.y;
      _p.copy(cam.position); _p.y = 2 * LY - _p.y; mirror.position.copy(_p);
      _u.set(0, 1, 0).applyQuaternion(cam.quaternion); _u.y = -_u.y; mirror.up.copy(_u); mirror.lookAt(_t);
      mirror.updateMatrixWorld(); mirror.projectionMatrix.copy(cam.projectionMatrix);
      _m.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1); _m.multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse); mat.uniforms.uTex.value.copy(_m);
      const vis = mesh.visible; mesh.visible = false;
      const prev = renderer.getRenderTarget(); renderer.setRenderTarget(RT); renderer.clear(); renderer.render(scene, mirror); renderer.setRenderTarget(prev);
      mesh.visible = vis;
      void plane;
    }
    return { mesh, update, RT }; // cutscene: RT
  })();

  // ---------- mist and ice in the air ----------
  // banks of mist lying in the low ground and along the forest's edge, drifting; and fine ice crystals turning in the air
  // that catch the moon
  const air = (() => {
    const mistT = (() => { const S = 256, c = cvs(S, S), g = c.getContext('2d'); for (let i = 0; i < 70; i++) { const x = 40 + rnd() * 176, y = 70 + rnd() * 116, r = 20 + rnd() * 60, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.12)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); } const m = g.createRadialGradient(128, 128, 60, 128, 128, 127); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, S, S); return new THREE.CanvasTexture(c); })();
    const NM = Math.round(300 * Math.min(QL, 1.4)), mpos = new Float32Array(NM * 3), msz = new Float32Array(NM), mph = new Float32Array(NM);
    for (let i = 0; i < NM; i++) { const r = 10 + Math.pow(rnd(), .7) * 260, a = rnd() * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r; mpos[i * 3] = x; mpos[i * 3 + 1] = heightAt(x, z) + rr(.2, 1.6) + sm(60, 260, r) * rr(0, 4); mpos[i * 3 + 2] = z; msz[i] = rr(9, 22) * (1 + sm(60, 260, r) * 1.5); mph[i] = rnd() * TAU; }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mpos, 3)); mg.setAttribute('aSize', new THREE.BufferAttribute(msz, 1)); mg.setAttribute('aPh', new THREE.BufferAttribute(mph, 1));
    const mm = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: mistT }, uScale: { value: 400 }, uTime: WU.uTime, uWind: WU.uWind, uC: { value: C3(.36, .33, .48) }, uGlow: { value: C3(.75, .74, .9) }, uMoon: { value: moonDir.clone() }, uA: { value: .2 } },
      vertexShader: 'attribute float aSize, aPh; uniform float uScale, uTime; uniform vec2 uWind; varying float vA; varying vec3 vW;\nvoid main(){ vec3 p = position; p.xz += uWind * uTime * .6 + vec2(sin(uTime * .05 + aPh), cos(uTime * .04 + aPh)) * 4.; p.xz = mod(p.xz + 300., 600.) - 300.; vW = p;\n' +
        ' vec4 mv = modelViewMatrix * vec4(p, 1.); float d = -mv.z; vA = smoothstep(2., 14., d) * (.6 + .4 * sin(uTime * .1 + aPh)); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale * projectionMatrix[1][1] / max(d, .1); }',
      fragmentShader: 'uniform sampler2D tMap; uniform vec3 uC, uGlow, uMoon; uniform float uA; varying float vA; varying vec3 vW;\nvoid main(){ vec4 t = texture2D(tMap, gl_PointCoord); vec3 v = normalize(vW - cameraPosition); float g = pow(max(dot(v, uMoon), 0.), 5.); float edge = 1. - smoothstep(.12, .5, abs(v.y)); gl_FragColor = vec4(mix(uC, uGlow, g), t.a * vA * uA * edge); }',
      transparent: true, depthWrite: false
    });
    const mist = new THREE.Points(mg, mm); mist.frustumCulled = false; mist.renderOrder = 4; scene.add(mist);
    // ice motes: a box of them that follows the camera
    const NI = Math.round(2400 * Math.min(QL, 1.4)), ipos = new Float32Array(NI * 3), iph = new Float32Array(NI);
    for (let i = 0; i < NI; i++) { ipos[i * 3] = rr(-14, 14); ipos[i * 3 + 1] = rr(0, 10); ipos[i * 3 + 2] = rr(-14, 14); iph[i] = rnd() * TAU; }
    const ig = new THREE.BufferGeometry(); ig.setAttribute('position', new THREE.BufferAttribute(ipos, 3)); ig.setAttribute('aPh', new THREE.BufferAttribute(iph, 1));
    const im = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 }, uTime: WU.uTime, uCam: { value: V3() }, uMoon: { value: moonDir.clone() }, uWind: WU.uWind },
      vertexShader: 'attribute float aPh; uniform float uScale, uTime; uniform vec3 uCam, uMoon; uniform vec2 uWind; varying float vA;\nvoid main(){ vec3 p = position; p.xz += uWind * uTime * .4; p.y -= uTime * .08; p += vec3(sin(uTime * .7 + aPh), sin(uTime * .5 + aPh * 2.), cos(uTime * .6 + aPh)) * .15;\n' +
        ' vec3 rel = mod(p - uCam + vec3(14., 5., 14.), vec3(28., 10., 28.)) - vec3(14., 5., 14.); vec3 w = uCam + rel; vec4 mv = viewMatrix * vec4(w, 1.); float d = -mv.z;\n' +
        ' float tw = pow(max(0., sin(uTime * 3. + aPh * 7.)), 6.); vec3 v = normalize(w - cameraPosition); float g = pow(max(dot(v, uMoon), 0.), 4.); vA = (.15 + 2.5 * tw * (.3 + g)) * smoothstep(.4, 2., d) * (1. - smoothstep(9., 14., d));\n' +
        ' gl_Position = projectionMatrix * mv; gl_PointSize = .02 * uScale * projectionMatrix[1][1] / max(d, .1) + 1.; }',
      fragmentShader: 'varying float vA;\nvoid main(){ vec2 c = gl_PointCoord - .5; float a = smoothstep(.5, .1, length(c)); gl_FragColor = vec4(vec3(.8, .86, 1.) * vA * a, 1.); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const ice = new THREE.Points(ig, im); ice.frustumCulled = false; ice.renderOrder = 9; scene.add(ice);
    return { mist, mm, ice, im };
  })();

  // ---------- the reflections' light ----------
  // the sky (with the ranges) baked into an environment for everything shiny: berries, wet bark, the ice
  let env = null;
  function bakeEnv() {
    const s2 = new THREE.Scene(); s2.add(new THREE.Mesh(sky.geometry, skyMat));
    const g = new THREE.Mesh(new THREE.CircleGeometry(8000, 32), new THREE.MeshBasicMaterial({ color: C3(.05, .05, .045) })); g.rotation.x = -PI / 2; g.position.y = -2; s2.add(g);
    const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(s2, 0, 1, 20000).texture; pm.dispose();
    if (env) env.dispose(); env = t; scene.environment = t;
  }
  bakeEnv();

  // ---------- each frame ----------
  let waveN = 0, shadowC = null; // cutscene: shadowC
  const _v2 = new THREE.Vector2();
  function update(t, dt, cam) {
    WU.uTime.value = t; SKYU.uTime.value = t;
    renderer.getDrawingBufferSize(_v2);
    const rt = renderer.getRenderTarget(), hh = rt ? rt.height : _v2.y;
    air.mm.uniforms.uScale.value = hh * .5; air.im.uniforms.uScale.value = hh * .5; air.im.uniforms.uCam.value.copy(cam.position);
    sky.position.copy(cam.position);
    // the shadow follows what the camera looks at, near the colossus
    if (SHADOWS) { const c = shadowC || WU.uWC.value; /* cutscene: shadowAt */ moon.target.position.set(c.x, 0, c.z); moon.position.copy(moonDir).multiplyScalar(90).add(moon.target.position); }
    lake.update(cam);
  }
  return {
    scene, moon, hemi, moonDir, update, heightAt, sky, lake: lake.mesh, grass: grass.mesh, flowers, forest, ranges, air, uniforms: WU, fogInfo: FOG, bakeEnv,
    // a blow on the ground: a ring of wind races out through the grass
    impact(x, z, k) { const W = WU.uWaves.value[waveN++ % 4]; W.set(x, z, WU.uTime.value, k === undefined ? 1 : k); },
    setWarm(center, r) { WU.uWC.value.copy(center); if (r !== undefined) WU.uWR.value = r; },
    shadowAt(x, z) { (shadowC || (shadowC = V3())).set(x, 0, z); }, // cutscene: the moon's shadow covers what the camera looks at
    lakeRT: lake.RT, // cutscene: its reflection's picture, freed with the rest
    set(o) { if (o.frost !== undefined) WU.uFR.value = o.frost; if (o.wind) WU.uWind.value.set(o.wind.x, o.wind.z); if (o.mist !== undefined) air.mm.uniforms.uA.value = o.mist; },
    stats: { grass: grass.n, trees: forest.n }
  };
}
