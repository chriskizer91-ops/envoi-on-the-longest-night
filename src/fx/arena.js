// arena.js: the new battles' living ground (pass three: "Battles: 3D ground in front, a painting behind"). Every fight is
// fought the way Colossus in the Meadow is (living-battlefields/field.js, which this is made from): one locked camera,
// Chris's painting of the place far off, and live 3D ground in front that answers the fight. Each place
// (src/stage/arena-*.js) gives its painting, the camera fitted to it, the skyline and the ground line traced on it, its
// ground and its air. three.js r128 (global THREE). Defines makeArenaField(place), and makeArenaField.view(place): its
// locked camera's numbers without building it (at the end of this file).
//
// The camera never moves: a shot is a crop or a zoom of its frame, as the battle screen's shots are of a painting. The
// picture is made of three layers:
// - the painting, drawn sharp by the battle screen behind the 3D layer, as the flat battles draw theirs;
// - over it, the painting brought to life: a sheet in the 3D layer that is clear where nothing happens and changes the
//   painting where something does: clouds drift over the moon and a storm rolls in, lightning lights it, a boss's Wrath
//   turns its sky red, gusts and shockwaves sweep the far ground and cloud shadows cross it, the rain darkens it and its
//   puddles ripple, blows crack and scorch it, a fire or a spell lights the ground round it, and its lamps can go dark
//   and light again. It knows what each part of the painting is (sky, a far thing, or ground) from the traced lines;
// - the live layer, in front: the place's ground (grass, heather, frost, reeds, a boardwalk over black water), a tree
//   that frames the shot, mist, fireflies, frost glints, rain or snow, lightning, birds or bats, and every leaf, clod,
//   stone chip, splinter, splash, spark and puff of dust a blow throws up. The sky has no stars: they come back only at
//   the ending (lore answers 5 and 10), and the battle screen draws them then.
// Returns { root, camera (the locked camera: clone it to render, with setViewOffset for shots), frame: [w, h], fog,
//   light (what the scene's hemisphere, moonlight and fill should be), stats, setPainting(img), update(t, dt),
//   impact(x, z, s), roar(s), vortex(x, z, r, s), decal(kind, x, z, r, o), glow(i, x, y, z, r, color, intensity),
//   strike(x, z) (lightning into the ground), setWeather('clear' | 'rain' | 'storm'), weather, setWrath(0 to 1),
//   setLamps(0 to 1), onThunder(k, near), emit, throwDebris, setDebug(on), dispose() }.
function makeArenaField(P) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  // the same place is grown the same way every time
  let seed = 610091; for (let i = 0; i < P.id.length; i++) seed = (seed * 31 + P.id.charCodeAt(i)) % 2147483647;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0), V4 = () => new THREE.Vector4(0, 0, 0, 0), COL = (h) => new THREE.Color(h);
  const rgb = (r, g, b, a) => 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (a === undefined ? 1 : a) + ')';
  const keep = []; // what dispose() lets go of
  const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; keep.push(t); return t; };
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
  const root = new THREE.Group(); root.name = 'Arena';
  const AIRP = Object.assign({ mist: 0.5, fireflies: 0, ffColor: [0.85, 1, 0.45], snow: 0, sparks: 0, glints: 0, fly: 'birds', fall: 'leaf', leaf: [0.3, 0.42, 0.2] }, P.air || {});
  // what the arena holds (its tufts, frost glints), and what is up this frame (stones and clods, birds or bats in the air)
  const STATS = { liveTufts: 0, glints: 0, debris: 0, birds: 0 };

  // ---------- the locked camera and its frame ----------
  // (the frame's size, the camera's numbers and the fight's clearing come from makeArenaField.view, below)
  const AV = makeArenaField.view(P), FW = AV.frame[0], FH = AV.frame[1]; // the frame is the painting's own size, so its pixels are the painting's
  const CA = AV.camera;
  const cam = new THREE.PerspectiveCamera(CA.fov, FW / FH, 0.1, 900);
  cam.position.set(CA.x, CA.h, CA.z); cam.lookAt(CA.x, CA.h + Math.tan(CA.pitch * PI / 180) * 100, CA.z - 100);
  cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const CP = cam.position.clone(), FWD = cam.getWorldDirection(V3());
  const DLIVE = P.live || 40;
  const _p = V3(), _q = V3(), _r = V3();
  // the ray through a point of the frame (u across, v down, 0 to 1)
  const rayAt = (u, v, out) => out.set(u * 2 - 1, 1 - v * 2, 0.5).unproject(cam).sub(CP).normalize();
  // whether a thing standing at (x, z), h tall, shows in the frame (m: a margin, in halves of the frame)
  function shows(x, z, h, m) {
    m = m || 0;
    for (const f of [0, 0.5, 1]) { _p.set(x, h * f, z).project(cam); if (_p.z < 1 && _p.z > -1 && Math.abs(_p.x) <= 1 + m && Math.abs(_p.y) <= 1 + m) return true; }
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
  // the locked camera's view and projection, for shaders that find where a point falls in the frame
  const _vp = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  // where a point of the world falls in the frame (0 to 1)
  const frameOf = (x, y, z) => { _p.set(x, y, z).project(cam); return [(_p.x + 1) / 2, (1 - _p.y) / 2]; };
  // the moon hangs where every painting has it (31% across, 17% down); its light comes from its side, a little higher,
  // as the battle's moonlight comes from behind and to the left
  const MOOND = rayAt(0.31, 0.17, V3());
  const MOONL = V3(MOOND.x, 0, MOOND.z).normalize().multiplyScalar(Math.cos(0.62)).setY(Math.sin(0.62)).normalize();
  // the traced lines: where the sky ends and where the open ground begins, down the frame, at any point across
  const lineAt = (pts, u) => {
    if (!pts || !pts.length) return 0.5;
    if (u <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return lerp(a[1], b[1], (u - a[0]) / Math.max(1e-6, b[0] - a[0])); }
    return pts[pts.length - 1][1];
  };
  const groundV = (u) => lineAt(P.ground, u), skyV = (u) => lineAt(P.sky, u);

  // ---------- the air: one wind for everything, shockwaves (x, z, radius, strength) and a whirlwind (from the meadow) ----------
  const AIRU = {
    uT: { value: 0 }, uWind: { value: new THREE.Vector4(0.83, 0.55, 0.4, 0.7) }, uFlow: { value: V4() }, uRings: { value: [V4(), V4(), V4(), V4()] }, uVortex: { value: new THREE.Vector4(0, 0, 9, 0) },
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
  // lights that a fire, a spell or a boss's heart throw on the ground and the grass: up to four at once
  const GLOWU = { uGlowP: { value: [V4(), V4(), V4(), V4()] }, uGlowC: { value: [V3(), V3(), V3(), V3()] } };
  const GLOW = 'uniform vec4 uGlowP[4]; uniform vec3 uGlowC[4];\nvec3 glowAt(vec3 p){ vec3 s = vec3(0.); for (int i = 0; i < 4; i++) { vec4 g = uGlowP[i]; if (g.w > 0.) { vec3 v = p - g.xyz; float q = dot(v, v) / (g.w * g.w); s += uGlowC[i] * (1. - smoothstep(.5, 1., q)) / (1. + 7. * q); } } return s; }\n';
  // marks on the ground: cracks (a blow splitting the ground, glowing if its veins are in them) and scorches (fire),
  // fading. uDec: x, z, radius, strength; uDecK: kind (1 crack, 2 scorch), how much it glows, a seed, its glow's colour
  const DECU = { uDec: { value: Array.from({ length: 8 }, V4) }, uDecK: { value: Array.from({ length: 8 }, V4) } };
  const DECAL = [
    'uniform vec4 uDec[8]; uniform vec4 uDecK[8];',
    // x: how dark, y: how much it glows, z: how trampled, w: the glow's colour (0 vein, 1 ember)
    'vec4 decalAt(vec2 p){ vec4 o = vec4(0.); for (int i = 0; i < 8; i++) { vec4 D = uDec[i]; if (D.w > .002) { vec2 v = p - D.xy; float d = length(v) / D.z; if (d < 1.) { vec4 K = uDecK[i];',
    '  if (K.x < 1.5) { float a = atan(v.y, v.x) / 6.2832 + .5, w = .05 + .09 * (1. - d), f = abs(fract(a * 9. + (mn(vec2(d * 5., K.z)) - .5) * .7) - .5) * 2.;',
    '   float ring = abs(fract(d * 2.6 + mn(vec2(a * 30., K.z)) * .5) - .5) * 2., cr = max(1. - smoothstep(w * .6, w, f), (1. - smoothstep(.04, .1, ring)) * step(.3, d) * .7) * smoothstep(1., .5, d);',
    '   float pit = smoothstep(.3, 0., d); o.x = max(o.x, (cr * .75 + pit * .5) * D.w); if (cr * K.y * D.w > o.y) { o.y = cr * K.y * D.w * (1. - d * .6); o.w = K.w; } }',
    '  else { float e = smoothstep(1., .4 + .35 * mn(v * 2.4 / D.z + K.z), d); o.x = max(o.x, e * .78 * D.w); float em = e * K.y * D.w * smoothstep(.62, .8, mn(v * 7. / D.z + vec2(uT * .4, K.z))); if (em > o.y) { o.y = em; o.w = K.w; } }',
    '  o.z = max(o.z, smoothstep(1., .15, d) * D.w * .5); } } } return o; }'].join('\n');
  const DECC = 'vec3 decalC(float w){ return mix(vec3(1., .16, .42), vec3(1., .5, .12), w); }\n';

  // ---------- the night's colours: the battle screen's rig (each place may shade it), and what weather and a wrath do ----------
  const NP = Object.assign({ top: '#0b0816', mid: '#1d1634', hor: '#3f3058', haze: '#2c2344', lc: '#b8c0ff', li: 0.62, hs: '#756aa8', hg: '#33262f', hi: 1.1, fi: 0.42, fill: '#ffdcc0' }, P.night || {});
  const NIGHT = { haze: COL(NP.haze), lc: COL(NP.lc), li: NP.li, hs: COL(NP.hs), hg: COL(NP.hg), hi: NP.hi, fi: NP.fi, fill: COL(NP.fill) };
  const GREY = COL(0x9aa0aa), STORMC = COL(0x4a5064), RED = COL(0xff5a3a), WRATHSKY = COL(0xa85060), FLASHC = COL(0xdfe6ff), MOONC = COL(0xdfe4ff);
  const light = { hemiSky: NIGHT.hs.clone(), hemiGround: NIGHT.hg.clone(), hemiI: NIGHT.hi, dir: MOONL.clone(), color: NIGHT.lc.clone(), I: NIGHT.li, fillC: NIGHT.fill.clone(), fillI: NIGHT.fi };
  // how strongly the light falls on the ground, per colour: the painting is relit by how this changes from the calm night
  // it was painted in (a storm darkens it, lightning lights it, a wrath reddens it)
  const irr = (L, out) => out.set(
    L.hemiSky.r * L.hemiI * 0.62 + L.hemiGround.r * L.hemiI * 0.38 + L.color.r * L.I * 0.5 + L.fillC.r * L.fillI * 0.25,
    L.hemiSky.g * L.hemiI * 0.62 + L.hemiGround.g * L.hemiI * 0.38 + L.color.g * L.I * 0.5 + L.fillC.g * L.fillI * 0.25,
    L.hemiSky.b * L.hemiI * 0.62 + L.hemiGround.b * L.hemiI * 0.38 + L.color.b * L.I * 0.5 + L.fillC.b * L.fillI * 0.25);
  const IRR0 = irr(light, V3());
  // the scene should use it too, so the live ground fades into the painting's haze far off
  const FOG = new THREE.Fog(NIGHT.haze.getHex(), 26, 190);

  // ---------- painted textures ----------
  // the place's ground cover, an atlas of four tufts (base at the bottom), each blade a tapered leaf, dark at its root
  // and pale at its tip; each place has its own four (P.floor.kind)
  function blade(g, x, y0, h, lean, w, c0, c1) {
    const tx = x + lean, ty = y0 - h, cx = x + lean * 0.22, cy = y0 - h * 0.55, q = g.createLinearGradient(0, y0, 0, ty);
    q.addColorStop(0, c0); q.addColorStop(1, c1); g.fillStyle = q;
    g.beginPath(); g.moveTo(x - w / 2, y0); g.quadraticCurveTo(cx - w * 0.3, cy, tx, ty); g.quadraticCurveTo(cx + w * 0.3, cy, x + w / 2, y0); g.closePath(); g.fill();
  }
  // a blade frosted at its tip: its own colours up to `f` of its height, white with rime above
  const frosted = (g, x, y0, h, lean, w, c0, c1, f) => {
    const tx = x + lean, ty = y0 - h, cx = x + lean * 0.22, cy = y0 - h * 0.55, q = g.createLinearGradient(0, y0, 0, ty);
    q.addColorStop(0, c0); q.addColorStop(f, c1); q.addColorStop(1, 'rgb(236,242,255)'); g.fillStyle = q;
    g.beginPath(); g.moveTo(x - w / 2, y0); g.quadraticCurveTo(cx - w * 0.3, cy, tx, ty); g.quadraticCurveTo(cx + w * 0.3, cy, x + w / 2, y0); g.closePath(); g.fill();
  };
  const KIND = {
    // the meadow's own: grass, grass gone to seed, grass with pale moonflowers, low clover (the river glade)
    meadow: [
      (g, ox, H) => { for (let i = 0; i < 64; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(220, 490), rr(-120, 120), rr(7, 15), rgb(66 * sh, 92 * sh, 50 * sh), rgb(196 * sh, 224 * sh, 158 * sh)); } },
      (g, ox, H) => { for (let i = 0; i < 40; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(220, 490), rr(-120, 120), rr(7, 15), rgb(66 * sh, 92 * sh, 50 * sh), rgb(196 * sh, 224 * sh, 158 * sh)); } seeds(g, ox, H, 'rgb(150,160,104)', 'rgb(214,206,150)'); },
      (g, ox, H) => { for (let i = 0; i < 44; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(220, 490), rr(-120, 120), rr(7, 15), rgb(66 * sh, 92 * sh, 50 * sh), rgb(196 * sh, 224 * sh, 158 * sh)); } flowers(g, ox, H, ['#f2eefa', '#f2eefa', '#c9b4f0'], '#ffe07a'); },
      (g, ox, H) => { for (let i = 0; i < 30; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(120, 270), rr(-100, 100), rr(6, 12), rgb(66 * sh, 92 * sh, 50 * sh), rgb(196 * sh, 224 * sh, 158 * sh)); } clover(g, ox, H, [70, 110, 60]); },
    ],
    // the Warm Roads' moor: moor grass, heather in bloom, gorse with its yellow flowers, low heather
    moor: [
      (g, ox, H) => { for (let i = 0; i < 56; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(180, 420), rr(-110, 110), rr(5, 11), rgb(70 * sh, 74 * sh, 48 * sh), rgb(186 * sh, 182 * sh, 126 * sh)); } },
      (g, ox, H) => heather(g, ox, H, 40, [150, 300], ['#b06cc8', '#9a58b8', '#c886d8']),
      (g, ox, H) => { for (let i = 0; i < 60; i++) { const x = ox + rr(90, 422), h = rr(160, 380), sh = rr(0.5, 1); blade(g, x, H, h, rr(-90, 90), rr(4, 7), rgb(40 * sh, 60 * sh, 34 * sh), rgb(110 * sh, 140 * sh, 80 * sh)); } for (let i = 0; i < 70; i++) { g.fillStyle = rnd() < 0.7 ? '#f2c43a' : '#ffe27a'; g.beginPath(); g.ellipse(ox + rr(110, 402), H - rr(60, 340), rr(6, 10), rr(5, 8), rnd() * 3, 0, TAU); g.fill(); } },
      (g, ox, H) => heather(g, ox, H, 26, [90, 190], ['#8e5aa6', '#a46ab8', '#7a4a90']),
    ],
    // Eldergrove's clearing: woodland grass, a fern, clover with white flowers, short grass and moss
    wood: [
      (g, ox, H) => { for (let i = 0; i < 60; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(200, 470), rr(-120, 120), rr(7, 14), rgb(52 * sh, 84 * sh, 52 * sh), rgb(170 * sh, 212 * sh, 150 * sh)); } },
      (g, ox, H) => fern(g, ox, H),
      (g, ox, H) => { for (let i = 0; i < 26; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(46, 466), H, rr(120, 280), rr(-100, 100), rr(6, 12), rgb(52 * sh, 84 * sh, 52 * sh), rgb(170 * sh, 212 * sh, 150 * sh)); } clover(g, ox, H, [62, 104, 62]); flowers(g, ox, H, ['#f4f2fa', '#eef0ff'], '#f6e6a0', 8, 0.6); },
      (g, ox, H) => { moss(g, ox, H, [48, 82, 46]); for (let i = 0; i < 20; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(80, 432), H, rr(100, 220), rr(-80, 80), rr(6, 11), rgb(52 * sh, 84 * sh, 52 * sh), rgb(170 * sh, 212 * sh, 150 * sh)); } },
    ],
    // Frostmere's shore: meadow grass white with rime at the tips, frosted seed heads, short frosted grass, frosted clover
    frost: [
      (g, ox, H) => { for (let i = 0; i < 60; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(46, 466), H, rr(200, 460), rr(-110, 110), rr(7, 14), rgb(56 * sh, 78 * sh, 60 * sh), rgb(150 * sh, 180 * sh, 150 * sh), rr(0.45, 0.7)); } },
      (g, ox, H) => { for (let i = 0; i < 40; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(46, 466), H, rr(200, 460), rr(-110, 110), rr(7, 14), rgb(56 * sh, 78 * sh, 60 * sh), rgb(150 * sh, 180 * sh, 150 * sh), rr(0.45, 0.7)); } seeds(g, ox, H, 'rgb(170,180,170)', 'rgb(232,238,250)'); },
      (g, ox, H) => { for (let i = 0; i < 44; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(46, 466), H, rr(120, 300), rr(-100, 100), rr(6, 12), rgb(56 * sh, 78 * sh, 60 * sh), rgb(150 * sh, 180 * sh, 150 * sh), rr(0.3, 0.55)); } },
      (g, ox, H) => { clover(g, ox, H, [76, 104, 88]); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(230,238,255,.38)'; g.fillRect(ox, 0, 512, H); g.restore(); },
    ],
    // the northern crossroads: dead grass, a frosty tussock, moss, dead heather, all touched with frost
    dead: [
      (g, ox, H) => { for (let i = 0; i < 58; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(46, 466), H, rr(180, 440), rr(-140, 140), rr(6, 12), rgb(84 * sh, 76 * sh, 56 * sh), rgb(196 * sh, 182 * sh, 146 * sh), rr(0.55, 0.8)); } },
      (g, ox, H) => { for (let i = 0; i < 80; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(120, 392), H, rr(140, 340), rr(-160, 160), rr(5, 9), rgb(80 * sh, 74 * sh, 56 * sh), rgb(184 * sh, 172 * sh, 140 * sh), rr(0.4, 0.65)); } },
      (g, ox, H) => { moss(g, ox, H, [70, 86, 60]); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(230,238,255,.3)'; g.fillRect(ox, 0, 512, H); g.restore(); },
      (g, ox, H) => { heather(g, ox, H, 22, [100, 220], ['#7a6070', '#6a5464', '#8a7080']); const q = g.createLinearGradient(0, H, 0, H * 0.4); q.addColorStop(0, 'rgba(226,234,255,0)'); q.addColorStop(1, 'rgba(226,234,255,.45)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = q; g.fillRect(ox, 0, 512, H); g.restore(); },
    ],
    // Bogmire's water's edge: reeds, bulrushes, rushes and sedge
    reeds: [
      (g, ox, H) => { for (let i = 0; i < 46; i++) { const sh = rr(0.55, 1); blade(g, ox + rr(60, 452), H, rr(330, 500), rr(-60, 60), rr(6, 11), rgb(46 * sh, 58 * sh, 40 * sh), rgb(150 * sh, 160 * sh, 110 * sh)); } },
      (g, ox, H) => { for (let i = 0; i < 30; i++) { const sh = rr(0.55, 1); blade(g, ox + rr(60, 452), H, rr(260, 460), rr(-60, 60), rr(6, 11), rgb(46 * sh, 58 * sh, 40 * sh), rgb(150 * sh, 160 * sh, 110 * sh)); } for (let i = 0; i < 9; i++) { const x = ox + rr(110, 402), top = rr(30, 120); g.strokeStyle = 'rgb(84,96,60)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, H); g.lineTo(x + rr(-10, 10), top); g.stroke(); g.fillStyle = 'rgb(92,58,36)'; g.beginPath(); g.ellipse(x, top + 50, 10, 34, 0, 0, TAU); g.fill(); } },
      (g, ox, H) => { for (let i = 0; i < 90; i++) { const x = ox + rr(80, 432), sh = rr(0.55, 1); g.strokeStyle = rgb(70 * sh, 92 * sh, 56 * sh); g.lineWidth = rr(2.5, 4.5); g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + rr(-20, 20), H - 200, x + rr(-60, 60), H - rr(260, 480)); g.stroke(); } },
      (g, ox, H) => { for (let i = 0; i < 50; i++) { const sh = rr(0.55, 1); blade(g, ox + rr(60, 452), H, rr(140, 300), rr(-180, 180), rr(6, 12), rgb(50 * sh, 64 * sh, 44 * sh), rgb(140 * sh, 160 * sh, 108 * sh)); } },
    ],
    // weeds between the flagstones of Dawnroost's yard: short grass, a dandelion's leaves, clover, moss
    weeds: [
      (g, ox, H) => { for (let i = 0; i < 40; i++) { const sh = rr(0.6, 1); blade(g, ox + rr(120, 392), H, rr(120, 300), rr(-120, 120), rr(6, 12), rgb(62 * sh, 84 * sh, 48 * sh), rgb(176 * sh, 200 * sh, 136 * sh)); } },
      (g, ox, H) => { for (let i = 0; i < 12; i++) { const sh = rr(0.6, 1), a = rr(-1.2, 1.2); blade(g, ox + 256, H, rr(120, 220), Math.sin(a) * 220, rr(26, 40), rgb(54 * sh, 80 * sh, 44 * sh), rgb(130 * sh, 168 * sh, 100 * sh)); } },
      (g, ox, H) => { clover(g, ox, H, [64, 100, 58]); },
      (g, ox, H) => { moss(g, ox, H, [60, 82, 48]); },
    ],
    // the dead Moonwell's court: weeds in its cracks, white with rime
    rime: [
      (g, ox, H) => { for (let i = 0; i < 34; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(140, 372), H, rr(100, 260), rr(-120, 120), rr(5, 10), rgb(80 * sh, 86 * sh, 96 * sh), rgb(180 * sh, 188 * sh, 206 * sh), 0.3); } },
      (g, ox, H) => { for (let i = 0; i < 20; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(160, 352), H, rr(80, 180), rr(-140, 140), rr(5, 9), rgb(80 * sh, 86 * sh, 96 * sh), rgb(180 * sh, 188 * sh, 206 * sh), 0.2); } },
      (g, ox, H) => { moss(g, ox, H, [96, 104, 118]); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(232,240,255,.5)'; g.fillRect(ox, 0, 512, H); g.restore(); },
      (g, ox, H) => { for (let i = 0; i < 26; i++) { const sh = rr(0.6, 1); frosted(g, ox + rr(140, 372), H, rr(60, 140), rr(-160, 160), rr(5, 9), rgb(80 * sh, 86 * sh, 96 * sh), rgb(180 * sh, 188 * sh, 206 * sh), 0.15); } },
    ],
  };
  function seeds(g, ox, H, stem, head) { // seed heads on thin stems
    for (let i = 0; i < 12; i++) {
      const x = ox + rr(80, 432), top = rr(30, 140), lean = rr(-40, 40);
      g.strokeStyle = stem; g.lineWidth = 3; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * 0.3, (H + top) / 2, x + lean, top); g.stroke();
      g.fillStyle = head; for (let s = 0; s < 9; s++) { g.beginPath(); g.ellipse(x + lean + rr(-5, 5), top + s * 7, 5, 8, rr(-0.4, 0.4), 0, TAU); g.fill(); }
    }
  }
  function flowers(g, ox, H, petals, heart, n, sc) { // pale flowers on stems
    n = n || 11; sc = sc || 1;
    for (let i = 0; i < n; i++) {
      const x = ox + rr(60, 452), y = rr(70, 230) / sc;
      g.strokeStyle = 'rgb(84,120,66)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + rr(-20, 20), (H + y) / 2, x, y); g.stroke();
      g.fillStyle = petals[i % petals.length]; for (let p = 0; p < 6; p++) { const a = p / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 10 * sc, y + Math.sin(a) * 10 * sc, 10 * sc, 5.5 * sc, a, 0, TAU); g.fill(); }
      g.fillStyle = heart; g.beginPath(); g.arc(x, y, 5 * sc, 0, TAU); g.fill();
    }
  }
  function clover(g, ox, H, c) { // clover leaves low among the blades
    for (let i = 0; i < 26; i++) {
      const x = ox + rr(40, 472), y = H - rr(10, 150), s = rr(10, 18);
      g.fillStyle = rgb(c[0] + rr(0, 40), c[1] + rr(0, 40), c[2]); for (let p = 0; p < 3; p++) { const a = p / 3 * TAU - PI / 2; g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.7, s * 0.62, s * 0.5, a, 0, TAU); g.fill(); }
    }
  }
  function heather(g, ox, H, n, hs, bells) { // a mound of thin woody stems with tiny bells along their upper half
    for (let i = 0; i < n; i++) {
      const x = ox + rr(90, 422), h = rr(hs[0], hs[1]), lean = rr(-70, 70), sh = rr(0.5, 1);
      g.strokeStyle = rgb(70 * sh, 56 * sh, 44 * sh); g.lineWidth = rr(3, 5); g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * 0.4, H - h * 0.6, x + lean, H - h); g.stroke();
      for (let b = 0; b < 12; b++) { const f = rr(0.4, 1), bx = x + lean * f * f, by = H - h * f; g.fillStyle = bells[(rnd() * bells.length) | 0]; g.beginPath(); g.ellipse(bx + rr(-6, 6), by, rr(5, 8), rr(4, 6), 0, 0, TAU); g.fill(); }
    }
  }
  function fern(g, ox, H) { // fronds arching out of one crown
    for (let i = 0; i < 7; i++) {
      const a = rr(-1.1, 1.1), L = rr(260, 440), sh = rr(0.6, 1), x0 = ox + 256, pts = [];
      for (let s = 0; s <= 16; s++) { const f = s / 16; pts.push([x0 + Math.sin(a) * L * f + Math.sin(a) * f * f * 60, H - Math.cos(a) * L * f * (1 - 0.35 * f * f)]); }
      g.strokeStyle = rgb(60 * sh, 90 * sh, 50 * sh); g.lineWidth = 4; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke();
      for (let s = 2; s < 16; s++) {
        const [px, py] = pts[s], w = (1 - s / 16) * 60 + 8, sh2 = sh * rr(0.85, 1.1);
        for (const side of [-1, 1]) { g.fillStyle = rgb(72 * sh2, 118 * sh2, 62 * sh2); g.beginPath(); g.ellipse(px + side * w * 0.5 * Math.cos(a), py - side * w * 0.5 * Math.sin(a) * 0.3 - 6, w * 0.5, 7, -a + side * 0.5, 0, TAU); g.fill(); }
      }
    }
  }
  function moss(g, ox, H, c) { // a low, soft mound
    for (let i = 0; i < 160; i++) { const a = rr(0.1, PI - 0.1), r = rr(0, 1), x = ox + 256 + Math.cos(a) * r * 200, y = H - Math.sin(a) * r * 110; g.fillStyle = rgb(c[0] * rr(0.7, 1.3), c[1] * rr(0.7, 1.3), c[2] * rr(0.7, 1.2)); g.beginPath(); g.arc(x, y, rr(8, 20), 0, TAU); g.fill(); }
  }
  const FL = Object.assign({ kind: 'meadow', density: 1, short: [0.07, 0.2], tall: [0.62, 1.3], clear: AV.clear, cells: [0.04, 0.08, 0.12] }, P.floor || {});
  const grassTex = (() => {
    const W = 2048, H = 512, c = cvs(W, H), g = c.getContext('2d');
    (KIND[FL.kind] || KIND.meadow).forEach((draw, k) => draw(g, k * 512, H));
    return fullMips(c);
  })();
  // a cluster of leaves, a spray of needles, and bark, for the tree that frames the shot (from the meadow)
  const leafTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d'), kind = (P.tree && P.tree.kind) || 'oak';
    if (kind === 'pine') {
      // one tier's skirt of boughs, wrapped round the trunk: dark needles in streaks, its lower edge ragged with their
      // tips, and snow lying on it
      g.clearRect(0, 0, S, S);
      g.fillStyle = '#1e3328'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, 0);
      for (let x = S; x >= 0; x -= 8) g.lineTo(x, S - 10 - rr(0, 34) * (x % 16 ? 0.5 : 1));
      g.closePath(); g.fill();
      for (let i = 0; i < 900; i++) { const x = rnd() * S, y = rr(0, S - 30), sh = rr(0.5, 1.25); g.strokeStyle = rgb(30 * sh, 54 * sh, 42 * sh); g.lineWidth = rr(1.5, 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-6, 6), y + rr(10, 26)); g.stroke(); }
      if (P.tree.snow) { g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 46; i++) { g.fillStyle = 'rgba(232,240,255,.9)'; g.beginPath(); g.ellipse(rnd() * S, rr(10, S * 0.7), rr(14, 30), rr(5, 10), 0, 0, TAU); g.fill(); } g.restore(); }
    } else {
      const birch = kind === 'birch';
      for (let i = 0; i < 150; i++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * 100, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, s = rr(0.7, 1.3) * (birch ? 0.7 : 1), sh = rr(0.5, 1.05);
        g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = birch ? rgb(110 * sh, 130 * sh, 60 * sh) : rgb(60 * sh, 100 * sh, 45 * sh);
        g.beginPath(); g.ellipse(0, 0, 14 * s, 7 * s, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(20,40,14,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-13 * s, 0); g.lineTo(13 * s, 0); g.stroke(); g.restore();
      }
    }
    const t = fullMips(c); if (kind === 'pine') t.wrapS = THREE.RepeatWrapping; return t;
  })();
  const barkTex = (() => {
    const W = 128, H = 256, c = cvs(W, H), g = c.getContext('2d'), birch = P.tree && P.tree.kind === 'birch';
    g.fillStyle = birch ? '#cfc8bc' : '#4a3c32'; g.fillRect(0, 0, W, H);
    if (birch) { for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(20,16,14,.75)'; g.fillRect(rnd() * W, rnd() * H, rr(6, 26), rr(2, 5)); } }
    else {
      for (let i = 0; i < 70; i++) { const x = rnd() * W, w = rr(2, 7); g.fillStyle = rnd() < 0.5 ? 'rgba(20,14,10,.5)' : 'rgba(130,112,96,.25)'; for (const ox of [-W, 0, W]) g.fillRect(x + ox, 0, w, H); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(10,8,6,.35)'; g.fillRect(rnd() * W, rnd() * H, rr(3, 9), 1.5); }
    }
    return tex(c, 2, 3);
  })();
  // sprites: a soft dot, a leaf, a puff of dust or smoke, mist
  const dotTex = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.3, 'rgba(255,255,255,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
  const leafDot = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 26, 12, 0.5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 46); g.lineTo(54, 18); g.stroke(); return tex(c); })();
  const puffTex = (() => {
    const S = 128, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = rr(0, 26), x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = rr(16, 34), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.34)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); }
    return tex(c);
  })();
  const mistTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S, r = rr(18, 60), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; keep.push(t); return t;
  })();

  // ==================================================================================================================
  // the painting brought to life: a sheet over it, far off, filling the frame
  // ==================================================================================================================
  // what each part of the painting is, from the traced lines: R 0 sky, .5 a far thing, 1 ground; G a far thing's
  // distance / 900 (the mountains far, the trees nearer); the ground's distance the sheet works out itself
  const maskT = (() => {
    const W = 256, H = 192, c = cvs(W, H), g = c.getContext('2d'), im = g.createImageData(W, H), d = im.data;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W, ys = skyV(u) * H, yg = groundV(u) * H;
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4, yc = y + 0.5;
        if (yc < ys) { d[i] = 0; d[i + 1] = 0; }
        else if (yc < yg) { const f = (yc - ys) / Math.max(1, yg - ys); d[i] = 128; d[i + 1] = Math.round((600 - 470 * f) / 900 * 255); }
        else { d[i] = 255; d[i + 1] = 0; }
        d[i + 2] = 0; d[i + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; keep.push(t); return t;
  })();
  // the painting's own lamps (P.warm): its warm lights, found by their colour inside a box of the frame, can go dark and
  // light again (Bogmire's windows, which the great wraith has eaten), or pulse (Dawnroost's living node)
  const WARM = Object.assign({ box: [0, 0, 0, 0], pulse: 0, speed: 1.2 }, P.warm || {});
  const BU = Object.assign({
    uPaint: { value: null }, uMaskT: { value: maskT }, uCP: { value: CP }, uRelight: { value: V3(1, 1, 1) }, uStorm: { value: 0 }, uCloud: { value: 0.22 }, uWrath: { value: 0 }, uFlash: { value: 0 },
    uBolt: { value: V3(0, 1, 0) }, uBoltC: { value: COL(0xd8e0ff) }, uMoonD: { value: MOOND }, uMoonC: { value: MOONC.clone() }, uStormC: { value: COL('#2a2c3c') }, uHaze: { value: NIGHT.haze.clone() },
    uRain: { value: 0 }, uDebug: { value: 0 }, uLamps: { value: 1 }, uPulse: { value: 0 },
    uWarmBox: { value: new THREE.Vector4(WARM.box[0], 1 - WARM.box[3], WARM.box[2], 1 - WARM.box[1]) },
  }, AIRU, GLOWU, DECU);
  const DB = 700, BDH = 2 * DB * Math.tan(CA.fov / 2 * PI / 180);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(BDH * FW / FH, BDH), new THREE.ShaderMaterial({
    uniforms: BU, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vW;\nvoid main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      AIR, CSH, GLOW, DECAL, DECC,
      'uniform sampler2D uPaint, uMaskT; uniform vec3 uCP, uRelight, uBolt, uBoltC, uMoonD, uMoonC, uStormC, uHaze; uniform float uStorm, uCloud, uWrath, uFlash, uWet, uRain, uDebug, uLamps, uPulse; uniform vec4 uWarmBox; varying vec2 vUv; varying vec3 vW;',
      'void main(){',
      ' vec3 p = texture2D(uPaint, vUv).rgb, c = p; vec4 mk = texture2D(uMaskT, vUv); vec3 d = normalize(vW - uCP);',
      ' float sky = 1. - smoothstep(.12, .3, mk.r), gnd = smoothstep(.7, .85, mk.r), obj = max(0., 1. - sky - gnd), dist = mk.g * 900.;',
      // the painting's lamps: dark while they are out (uLamps 0), pulsing while they burn (uPulse)
      ' { float wb = step(uWarmBox.x, vUv.x) * step(vUv.x, uWarmBox.z) * step(uWarmBox.y, vUv.y) * step(vUv.y, uWarmBox.w);',
      '   float warm = wb * smoothstep(.03, .16, p.r - p.b) * smoothstep(.14, .4, max(p.r, p.g));',
      '   c = mix(c, vec3(dot(p, vec3(.3, .59, .11))) * vec3(.36, .34, .52), warm * (1. - uLamps)); c *= 1. + warm * uPulse; }',
      // the ground: where it is, then the wind and the shockwaves sweeping it, the clouds' shadows, the rain, the marks on
      // it and the light of fires and spells
      ' if (gnd > .01 && d.y < -.0005) {',
      '  float t = -uCP.y / d.y; vec3 P = uCP + d * t; vec2 q = P.xz; float near = 1. - smoothstep(30., 140., t);',
      '  float g = gustAt(q), push = length(pushAt(q));',
      '  c *= 1. + (.22 * g * uWind.z + .45 * min(push, 1.2)) * near;',
      '  c *= 1. - .35 * cshade(q) * (1. - uStorm);',
      // the rain's puddles, and its drops rippling them: worked out only while the ground is wet, and the drops only
      // while it rains (dry, both came to nothing; the whole frame takes the same way, so the skip is free)
      '  if (uWet > .001) { float pud = smoothstep(.6, .7, mf(q * .09)) * uWet; c *= 1. - .3 * uWet - .25 * pud;',
      '   c = mix(c, uStormC * 1.6 + uBoltC * uFlash * .6, pud * .45);',
      '   if (uRain > .001) { vec2 cc = floor(q * 1.4), fr = fract(q * 1.4) - .5, o = vec2(mh(cc + 3.1), mh(cc + 7.7)) - .5; float rp = fract(uT * 1.2 + mh(cc));',
      '    c += vec3(.4, .45, .5) * smoothstep(.06, 0., abs(length(fr - o * .5) - rp * .45)) * (1. - rp) * uRain * pud * step(mh(cc + 1.9), .6) * near; } }',
      '  vec4 dc = decalAt(q); c *= 1. - dc.x; c += decalC(dc.w) * dc.y * .8;',
      '  c *= uRelight; vec3 gl = glowAt(P); c += c * gl * 2.4 + gl * .03;',
      ' } else if (gnd > .01) { c *= uRelight; }',
      // far things: relit, and lost in the rain's haze far off
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
      // over the sharp painting the screen draws below, only the change: the sheet darkens by its alpha and adds its own
      // light, so where nothing happens it is clear
      ' vec3 r = c / max(p, vec3(.003)); float a = clamp(1. - min(min(r.r, r.g), r.b), 0., 1.);',
      ' gl_FragColor = vec4(max(c - p * (1. - a), 0.), a);',
      '}'].join('\n'),
  }));
  sheet.position.copy(CP).addScaledVector(FWD, DB); sheet.quaternion.copy(cam.quaternion);
  sheet.renderOrder = -100; sheet.frustumCulled = false; sheet.visible = false; root.add(sheet);

  // ==================================================================================================================
  // the live layer
  // ==================================================================================================================
  // the grass's material: it bends with the wind and the shockwaves, flattens and darkens where blows land, glows at its
  // tips with the moon behind it, and takes the light of fires and spells (from the meadow). Its colour is the painting's:
  // each tuft is the colour of the painted ground under its root, shaded by its own picture (dark at the root, pale at
  // the tip, its flowers their own colours against the rest), and relit as the sheet relights the painting, so the live
  // grass and the painted ground meet without a seam, near and far, in any weather
  const atlasAvg = (() => {
    const c = grassTex.image, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = [0, 0, 0]; let n = 0;
    for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 115) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; }
    return V3(s[0] / n / 255, s[1] / n / 255, s[2] / n / 255);
  })();
  function grassMat() {
    const m = new THREE.MeshBasicMaterial({ map: grassTex, side: THREE.DoubleSide, alphaTest: 0.45, fog: false });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, AIRU, GLOWU, DECU, { uMoonC: { value: light.color }, uMoonD: { value: light.dir }, uPaint: BU.uPaint, uVP: { value: _vp }, uRelight: BU.uRelight, uStorm: BU.uStorm, uAvg: { value: atlasAvg }, uLift: { value: FL.lift || 1 } });
      sh.vertexShader = AIR + '\n' + GLOW + DECAL + CSH + '\nattribute vec4 aRoot; attribute float aH; uniform mat4 uVP; varying float vB; varying float vHt; varying vec3 vGw; varying vec3 vGl; varying vec4 vDec; varying vec2 vPu; varying float vSh;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec2 w = windAt(aRoot.xy) + pushAt(aRoot.xy); vec2 off = w * aH * aH * aRoot.z; float L = length(off), mx = aRoot.z * .8; if (L > mx) off *= mx / L;\n' +
          ' vDec = decalAt(aRoot.xy); off *= 1. + vDec.z * 1.5;\n transformed.xz += off; transformed.y -= dot(off, off) / max(.1, aRoot.z) * .45 * aH; transformed.y *= 1. - vDec.x * .5 * aH; vB = min(1., length(w)); vHt = aH;\n' +
          ' vec4 gw = modelMatrix * vec4(transformed, 1.); vGw = gw.xyz; vGl = glowAt(gw.xyz);\n' +
          ' vec4 f = uVP * vec4(aRoot.x, 0., aRoot.y, 1.); vPu = clamp(f.xy / f.w * .5 + .5, vec2(.001), vec2(.999)); vSh = cshade(aRoot.xy);');
      sh.fragmentShader = 'uniform vec3 uMoonC, uMoonD, uRelight, uAvg; uniform sampler2D uPaint; uniform float uStorm, uWet, uLift;\nvarying float vB; varying float vHt; varying vec3 vGw; varying vec3 vGl; varying vec4 vDec; varying vec2 vPu; varying float vSh;\n' + DECC + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n vec3 pc = texture2D(uPaint, vPu).rgb * uLift;\n' +
          // its own picture as light and shade against its average, and a little of its own colour (flowers, heather);
          // far off it fades into the painted ground's own texture
          ' float far = smoothstep(24., 40., distance(vGw, cameraPosition)), la = dot(uAvg, vec3(.3, .59, .11)), lt = dot(diffuseColor.rgb, vec3(.3, .59, .11));\n' +
          ' float shade = mix(clamp(lt / la, .3, 1.7), 1., far * .6); vec3 hue = mix(vec3(1.), clamp((diffuseColor.rgb / max(lt, .01)) / (uAvg / la), .4, 2.), .55 * (1. - far));\n' +
          ' diffuseColor.rgb = pc * shade * hue * mix(.68, 1.06, vHt) * (1. + .4 * vB * vHt) * (1. - vDec.x * .85) * (1. - .35 * vSh * (1. - uStorm)) * (1. - .25 * uWet) * uRelight;\n' +
          ' vec3 vdir = normalize(vGw - cameraPosition); float bl = pow(max(dot(vdir, normalize(uMoonD)), 0.), 3.);\n' +
          ' vec3 gAdd = diffuseColor.rgb * (uMoonC * bl * vHt * vHt * .55 + vGl * 1.6) + decalC(vDec.w) * vDec.y * .9;')
        .replace('vec3 outgoingLight = reflectedLight.indirectDiffuse;', 'vec3 outgoingLight = reflectedLight.indirectDiffuse + gAdd;')
        // the 3D layer sits over the painting: a cut-out edge is solid, never half see-through
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a = 1.;');
    };
    m.customProgramCacheKey = () => 'arena-grass';
    return m;
  }
  // tufts, each on one card turned to face the camera (it never moves, so the card always shows its full face), with its
  // root, height and how tall it bends from, drawn nearest first so that grass hidden behind grass costs little
  function tufts(list, segs) {
    const Pp = [], UV = [], N = [], R = [], Hh = [], I = [];
    list.sort((a, b) => a.d - b.d);
    for (const t of list) {
      const ang = Math.atan2(t.x - CP.x, t.z - CP.z) + t.yaw, dx = Math.cos(ang) * t.W / 2, dz = -Math.sin(ang) * t.W / 2, b = Pp.length / 3, S = t.d > 26 ? 1 : segs;
      for (let j = 0; j <= S; j++) for (let s = 0; s <= 1; s++) { const h = j / S; Pp.push(t.x + (s ? dx : -dx), t.H * h, t.z + (s ? dz : -dz)); UV.push((t.cell + s) * 0.25, h); N.push(0, 1, 0); R.push(t.x, t.z, t.H, 0); Hh.push(h); }
      for (let j = 0; j < S; j++) { const c = b + j * 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aRoot', new THREE.Float32BufferAttribute(R, 4)); g.setAttribute('aH', new THREE.Float32BufferAttribute(Hh, 1)); g.setIndex(I);
    return g;
  }
  // the fight's clearing (FL.clear: its middle x, z, its half-width, and its depth toward the camera and away): short,
  // trampled ground where the fight is, so nothing hides the fighters' feet; the place's full growth round it
  const CLR = FL.clear;
  const tallAt = (x, z) => { const dz = z - CLR[1], r = Math.hypot((x - CLR[0]) / CLR[2], dz / (dz > 0 ? CLR[3] : CLR[4])); return sm(0.85, 1.3, r); };
  function tuftAt(x, z, d) {
    const tall = tallAt(x, z), fl = rnd(), Cw = FL.cells;
    const H = lerp(rr(FL.short[0], FL.short[1]), rr(FL.tall[0], FL.tall[1]), tall) * (0.75 + 0.25 * sm(0, 0.4, Math.abs(tall - 0.5)));
    return { x, z, d, H, W: H * rr(0.9, 1.5) + 0.12, yaw: rr(-0.5, 0.5), cell: fl < Cw[0] ? 2 : fl < Cw[0] + Cw[1] ? 1 : fl < (Cw[0] + Cw[1] + Cw[2]) * (1 - 0.5 * tall) + 0.05 ? 3 : 0 };
  }
  // where the place lets its ground cover grow (P.floor.where: anywhere, or only round the water's edges, as at Bogmire)
  const WATER = P.water || null, DECK = (P.water && P.water.deck) || null;
  const onDeck = (x, z, m) => { if (!DECK) return false; m = m || 0; for (const b of DECK) if (x > b[0] - m && x < b[1] + m && z > b[2] - m && z < b[3] + m) return true; return false; };
  function grows(x, z, d) {
    if (FL.where === 'edges') { const e = WATER.edges; return (Math.abs(x - CLR[0]) > e[0] || z < e[1] || d > e[2]) && !onDeck(x, z, 1.2); }
    return true;
  }
  {
    const list = [], box = groundBox(DLIVE, 0.02), step = 0.24;
    for (let x = box[0]; x < box[1]; x += step) for (let z = box[2]; z < box[3]; z += step) {
      const px = x + rr(0, step), pz = z + rr(0, step), d = dCam(px, pz);
      if (d > DLIVE || d < 3.5 || !grows(px, pz, d)) continue;
      // sparse near the camera, where a tuft would stand big in front of the fight; fuller in the middle distance
      const t0 = tallAt(px, pz), keep2 = (t0 < 0.5 ? 0.3 : 0.7 * (1 - 0.35 * sm(16, DLIVE, d))) * (0.3 + 0.7 * sm(8, 13, d)) * FL.density;
      if (rnd() > keep2) continue;
      const t = tuftAt(px, pz, d);
      t.H *= 0.55 + 0.45 * sm(8, 14, d);
      t.H *= lerp(1, 0.6, sm(24, DLIVE, d)); // shorter far off, where they meet the painted grass
      if (!shows(px, pz, t.H, 0.02)) continue;
      list.push(t);
    }
    if (list.length) { const grass = new THREE.Mesh(tufts(list, 3), grassMat()); grass.frustumCulled = false; root.add(grass); }
    STATS.liveTufts = list.length;
  }

  // ---------- the tree that frames the shot (P.tree: an oak, a pine, a birch or a dead tree), at an edge of the frame ----------
  const TREES = [];
  if (P.tree) {
    const TK = P.tree, kind = TK.kind;
    const tP = [], tN = [], tU = [], tT = [], tI = [], cP = [], cN = [], cU = [], cT = [], cC = [], cI = [];
    const tube = (pts, rFn, k, top, rx, rz) => {
      const curve = new THREE.CatmullRomCurve3(pts), segs = 10, rs = 8, fr = curve.computeFrenetFrames(segs, false), Pt = V3(), D = V3(), b = tP.length / 3;
      for (let i = 0; i <= segs; i++) { const t = i / segs; curve.getPointAt(t, Pt); for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); tP.push(Pt.x + D.x * r, Pt.y + D.y * r, Pt.z + D.z * r); tN.push(D.x, D.y, D.z); tU.push(j / rs, t * 3); tT.push(k, cl(Pt.y / top, 0, 1), rx, rz); } }
      for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; tI.push(a, c, a + 1, a + 1, c, c + 1); }
    };
    // a card of leaves or needles at P, facing out from C
    const n = V3(), m2 = V3(), t1 = V3(), t2 = V3(), YUP = V3(0, 1, 0);
    const card = (Pq, C, s, tint, k, top, x, z) => {
      n.subVectors(Pq, C).normalize(); m2.copy(n);
      t1.crossVectors(n, YUP); if (t1.lengthSq() < 1e-3) t1.set(1, 0, 0); t1.normalize(); t2.crossVectors(n, t1).normalize();
      const ro = rnd() * TAU, ca = Math.cos(ro), sa = Math.sin(ro), e1 = t1.clone().multiplyScalar(ca).addScaledVector(t2, sa), e2 = t2.clone().multiplyScalar(ca).addScaledVector(t1, -sa), b = cP.length / 3;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const py = Pq.y + (e1.y * sx + e2.y * sy) * s / 2; cP.push(Pq.x + (e1.x * sx + e2.x * sy) * s / 2, py, Pq.z + (e1.z * sx + e2.z * sy) * s / 2); cN.push(m2.x, m2.y, m2.z); cU.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); cT.push(k, cl(py / top, 0, 1), x, z); cC.push(tint[0], tint[1], tint[2]); }
      cI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    };
    // where: just past an edge of the frame (TK.u across, on the ground at TK.v down, brought nearer by TK.near)
    rayAt(TK.u === undefined ? 1.09 : TK.u, TK.v || 0.8, _q);
    const tt = -CP.y / _q.y * (TK.near || 0.82), x = CP.x + _q.x * tt + (TK.dx || 0), z = CP.z + _q.z * tt, sc = TK.scale || 1, k = 0;
    if (kind === 'pine') {
      const H = 13 * sc, top = H;
      tube([V3(x, -0.3, z), V3(x + 0.1, H * 0.5, z), V3(x, H, z)], (f) => lerp(0.42, 0.06, f) * sc, k, top, x, z);
      // tiers of drooping boughs: open skirts round the trunk, wider below, each a little turned from the last
      for (let i = 0; i < 9; i++) {
        const f = i / 8, y0 = lerp(1.4, H - 2.6, f), R = lerp(3.9, 1.0, f) * sc * rr(0.92, 1.08), hT = lerp(2.5, 1.9, f) * sc, segs = 16, rT = R * 0.18, b = cP.length / 3, tw = rnd() * TAU;
        for (let s = 0; s <= segs; s++) {
          const a = s / segs * TAU + tw, ca = Math.cos(a), sa = Math.sin(a), droop = rr(-0.18, 0.18), nn = V3(ca * hT, R - rT, sa * hT).normalize(), sh = rr(0.85, 1.05);
          for (const [rad, yy, vv] of [[rT, y0 + hT, 1], [R, y0 + droop, 0]]) { cP.push(x + ca * rad, yy, z + sa * rad); cN.push(nn.x, nn.y, nn.z); cU.push(s / segs * 3, vv); cT.push(k, cl(yy / top, 0, 1), x, z); cC.push(sh, sh, sh); }
        }
        for (let s = 0; s < segs; s++) { const a = b + s * 2; cI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      TREES.push({ x, z, c: V3(x, H * 0.55, z), R: 2.6 * sc, shake: 0, leaves: 0 });
    } else {
      // an oak (from the meadow), a birch (slender, small leaves) or a dead tree (bare limbs, no crown)
      const birch = kind === 'birch', dead = kind === 'dead';
      const H = (birch ? rr(8, 9.5) : rr(6.5, 8)) * sc, lx = rr(-0.4, 0.4) - 0.8 * (TK.lean || 1), lz = rr(-0.4, 0.4), R = (birch ? rr(2.4, 3) : rr(3.6, 4.4)) * sc, top = H + R;
      const pts = []; for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(V3(x + lx * f + Math.sin(f * 3) * 0.25, -0.3 + f * H * 0.55, z + lz * f + Math.cos(f * 2.5) * 0.2)); }
      tube(pts, (f) => lerp(birch ? 0.3 : 0.62, birch ? 0.16 : 0.34, f) * sc * (1 + 0.7 * Math.exp(-f * 9)), k, top, x, z);
      const fork = pts[4], lobes = [], nl = dead ? 6 : 5, a0 = rnd() * TAU;
      for (let b = 0; b <= nl; b++) {
        const lead = b === nl, ba = a0 + b / nl * TAU + rr(-0.4, 0.4), sp = lead ? rr(0, 0.3) : rr(0.6, 0.95), up = lead ? rr(2.6, 3.4) : rr(1.4, 2.8);
        const e = V3(fork.x + Math.cos(ba) * R * sp, fork.y + up, fork.z + Math.sin(ba) * R * sp), p0 = pts[3].clone().lerp(fork, rr(0.4, 1));
        tube([p0, V3(lerp(p0.x, e.x, 0.45), lerp(p0.y, e.y, 0.6) + 0.3, lerp(p0.z, e.z, 0.45)), e], (f) => lerp(lead ? 0.32 : 0.26, 0.07, f) * sc * (birch ? 0.6 : 1), k, top, x, z);
        if (dead) { for (let tw = 0; tw < 2; tw++) { const e2 = V3(e.x + rr(-1.4, 1.4), e.y + rr(0.6, 1.6), e.z + rr(-1.4, 1.4)); tube([e, V3(lerp(e.x, e2.x, 0.5), lerp(e.y, e2.y, 0.5) + 0.1, lerp(e.z, e2.z, 0.5)), e2], (f) => lerp(0.08, 0.02, f) * sc, k, top, x, z); } }
        lobes.push([e.x, e.y + 0.5, e.z, R * (lead ? rr(0.5, 0.62) : rr(0.42, 0.56))]);
      }
      const C = V3(); for (const L of lobes) C.add(V3(L[0], L[1], L[2])); C.divideScalar(lobes.length);
      if (!dead) lobes.forEach((L) => {
        for (let i = 0; i < (birch ? 16 : 22); i++) {
          const u = rnd() * TAU, v = Math.acos(rr(-0.7, 1)), dd = rr(0.5, 1.05), s = rr(1.5, 2.3) * sc * (birch ? 0.8 : 1);
          const Pq = V3(L[0] + Math.sin(v) * Math.cos(u) * L[3] * dd, L[1] + Math.cos(v) * L[3] * 0.75 * dd, L[2] + Math.sin(v) * Math.sin(u) * L[3] * dd);
          const tint = rr(0.8, 1.1) * (0.75 + 0.25 * dd); card(Pq, C, s, [tint * rr(0.9, 1.05), tint, tint * rr(0.85, 1)], k, top, x, z);
        }
      });
      TREES.push({ x, z, c: C, R: R, shake: 0, leaves: 0, dead });
    }
    const mk = (Pp, N, U, T, I, Cc) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aTree', new THREE.Float32BufferAttribute(T, 4)); if (Cc) g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); return g; };
    const airyTree = (m, leafy) => {
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, AIRU, GLOWU, { uMoonC: { value: light.color }, uMoonD: { value: light.dir } });
        sh.vertexShader = AIR + '\n' + GLOW + 'attribute vec4 aTree; uniform float uShake[6]; varying vec3 vGl; varying vec3 vTw; varying float vTh;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
          ' { float h = aTree.y * aTree.y, s = 0.; int ti = int(aTree.x + .5); for (int k = 0; k < 6; k++) { if (k == ti) s = uShake[k]; }\n   vec2 w = windAt(aTree.zw) * .5 + pushAt(aTree.zw) * .2;\n' +
          '   transformed.xz += w * h * 1.5 + vec2(sin(uT * 23. + aTree.x * 3.), cos(uT * 19. + aTree.x)) * s * h * .4 + vec2(sin(uT * 2.1 + position.y * .9 + position.x), cos(uT * 1.7 + position.z * .8)) * .04 * aTree.y * (.4 + uWind.z); }\n' +
          ' vec4 tw = modelMatrix * vec4(transformed, 1.); vTw = tw.xyz; vGl = glowAt(tw.xyz); vTh = aTree.y;');
        sh.fragmentShader = 'uniform vec3 uMoonC, uMoonD; varying vec3 vGl; varying vec3 vTw; varying float vTh;\n' + sh.fragmentShader
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float bl = pow(max(dot(normalize(vTw - cameraPosition), normalize(uMoonD)), 0.), 4.);\n totalEmissiveRadiance += diffuseColor.rgb * (vGl * 1.4 + uMoonC * bl * .35 * vTh);')
          .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a = 1.;');
      };
      m.customProgramCacheKey = () => 'arena-tree-' + (leafy ? 'leaf' : 'bark');
      return m;
    };
    const trunks = new THREE.Mesh(mk(tP, tN, tU, tT, tI), airyTree(new THREE.MeshLambertMaterial({ map: barkTex, color: kind === 'birch' ? 0xb8b4ac : 0x9a8e84 }), false));
    trunks.frustumCulled = false; root.add(trunks);
    if (cP.length) {
      const crowns = new THREE.Mesh(mk(cP, cN, cU, cT, cI, cC), airyTree(new THREE.MeshLambertMaterial({ map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide, vertexColors: true, color: TK.tint || 0x8c98a4 }), true));
      crowns.frustumCulled = false; root.add(crowns);
    }
  }

  // ---------- Bogmire: the boardwalk the fight is on, on stilts over black water that mirrors the painting ----------
  if (WATER) {
    const WY = WATER.y === undefined ? -0.34 : WATER.y, box = groundBox(160, 0.06);
    const geo = new THREE.PlaneGeometry(box[1] - box[0] + 20, box[3] - box[2] + 20); geo.rotateX(-PI / 2); geo.translate((box[0] + box[1]) / 2, WY, (box[2] + box[3]) / 2);
    const WU = Object.assign({ uPaint: BU.uPaint, uMaskT: BU.uMaskT, uVP: { value: _vp }, uCP: { value: CP }, uDeep: { value: COL(WATER.color || '#07060c') }, uFlash: BU.uFlash, uRain: BU.uRain, uHaze: BU.uHaze, uWrath: BU.uWrath }, AIRU, GLOWU);
    const water = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: WU, transparent: true, depthWrite: true, fog: false,
      vertexShader: 'varying vec3 vW;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [AIR, GLOW,
        'uniform sampler2D uPaint, uMaskT; uniform mat4 uVP; uniform vec3 uCP, uDeep, uHaze; uniform float uFlash, uRain, uWrath; varying vec3 vW;',
        'void main(){',
        // only where the painting has ground: beyond it are its own reeds and its far water
        ' vec4 f = uVP * vec4(vW, 1.); vec2 fu = f.xy / f.w * .5 + .5; float gnd = smoothstep(.7, .95, texture2D(uMaskT, fu).r); if (gnd < .01) discard;',
        ' vec3 d = normalize(vW - uCP); float dist = length(vW - uCP);',
        // ripples: the wind's small waves, the shockwaves' rings, and the rain
        ' vec2 q = vW.xz; vec2 n = (vec2(mn(q * 1.7 + uT * vec2(.31, .22)), mn(q * 1.3 - uT * vec2(.24, .37))) - .5) * (.05 + .05 * uWind.z) + pushAt(q) * .06;',
        // (the rain's rings only while it rains)
        ' if (uRain > .001) { vec2 cc = floor(q * 1.6), fr = fract(q * 1.6) - .5, o = vec2(mh(cc + 3.1), mh(cc + 7.7)) - .5; float rp = fract(uT * 1.3 + mh(cc)); n += (fr - o * .4) * smoothstep(.08, 0., abs(length(fr - o * .4) - rp * .45)) * (1. - rp) * uRain * step(mh(cc + 1.9), .55) * .5; }',
        // the reflection: the painting seen in the mirrored direction
        ' vec3 r = normalize(vec3(d.x + n.x, -d.y + abs(n.x + n.y) * .3, d.z + n.y)); vec4 rq = uVP * vec4(uCP + r * 600., 1.); vec2 ru = clamp(rq.xy / rq.w * .5 + .5, vec2(.002), vec2(.998));',
        ' vec3 refl = texture2D(uPaint, ru).rgb; float fres = .03 + .97 * pow(1. - clamp(-d.y, 0., 1.), 5.);',
        ' vec3 c = uDeep + refl * fres * .95 + vec3(.55, .6, .75) * uFlash * fres * .35;',
        ' c = mix(c, c * vec3(1.25, .6, .55), uWrath * .5);',
        ' vec3 gl = glowAt(vec3(vW.x, 0., vW.z)); c += gl * .25 * (.3 + fres);',
        ' c = mix(c, uHaze * .9, smoothstep(30., 80., dist) * .55);',
        ' gl_FragColor = vec4(c, gnd * smoothstep(0., .3, gnd));',
        '}'].join('\n'),
    }));
    water.renderOrder = -50; water.frustumCulled = false; root.add(water);
  }
  if (DECK) {
    // weathered planks, grey-brown, with dark gaps between them and the odd darker board
    const plankTex = (() => {
      const W = 512, H = 512, c = cvs(W, H), g = c.getContext('2d'), n = 8;
      g.fillStyle = '#100c0c'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const y0 = i * H / n, sh = rr(0.75, 1.1);
        let x = -rr(0, 200);
        while (x < W) {
          const L = rr(180, 320), base = [92 * sh, 80 * sh, 70 * sh];
          const q = g.createLinearGradient(0, y0, 0, y0 + H / n); q.addColorStop(0, rgb(base[0] * 1.1, base[1] * 1.1, base[2] * 1.1)); q.addColorStop(1, rgb(base[0] * 0.8, base[1] * 0.8, base[2] * 0.8));
          g.fillStyle = q; g.fillRect(x + 2, y0 + 3, L - 4, H / n - 6);
          for (let k = 0; k < 40; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(20,14,12,.25)' : 'rgba(170,160,150,.08)'; g.fillRect(x + rr(4, L - 4), y0 + rr(5, H / n - 6), rr(10, 60), 1.4); }
          g.fillStyle = 'rgba(16,12,10,.8)'; g.beginPath(); g.arc(x + 12, y0 + H / n / 2, 3, 0, TAU); g.arc(x + L - 12, y0 + H / n / 2, 3, 0, TAU); g.fill();
          x += L;
        }
      }
      return tex(c, 1, 1);
    })();
    plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
    const deckMat = new THREE.MeshLambertMaterial({ map: plankTex, color: DECK.tint || 0x8a8090 });
    deckMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, AIRU, GLOWU, DECU);
      sh.vertexShader = 'varying vec3 vDw;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDw = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = AIR + '\n' + GLOW + DECAL + DECC + 'varying vec3 vDw;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n vec4 dcl = decalAt(vDw.xz); diffuseColor.rgb *= 1. - dcl.x * .8;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * glowAt(vDw) * 1.6 + decalC(dcl.w) * dcl.y * .8;');
    };
    deckMat.customProgramCacheKey = () => 'arena-deck';
    // each rectangle of deck [x0, x1, z0, z1] is a slab of planks, its boards running across the frame
    const Pp = [], UV = [], N = [], I = [];
    const quad = (a, b, c2, d2, n2, u0, v0, u1, v1) => { const s = Pp.length / 3; Pp.push(...a, ...b, ...c2, ...d2); N.push(...n2, ...n2, ...n2, ...n2); UV.push(u0, v0, u1, v0, u1, v1, u0, v1); I.push(s, s + 1, s + 2, s, s + 2, s + 3); };
    const TH = 0.22, PL = 4; // its thickness, and how many metres one tile of the planks covers
    for (const b of DECK) {
      const [x0, x1, z0, z1] = b;
      quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [0, 1, 0], x0 / PL, z1 / PL, x1 / PL, z0 / PL);
      quad([x0, -TH, z1], [x1, -TH, z1], [x1, 0, z1], [x0, 0, z1], [0, 0, 1], x0 / PL, 0, x1 / PL, TH / PL);
      quad([x1, -TH, z1], [x1, -TH, z0], [x1, 0, z0], [x1, 0, z1], [1, 0, 0], z1 / PL, 0, z0 / PL, TH / PL);
      quad([x0, -TH, z0], [x0, -TH, z1], [x0, 0, z1], [x0, 0, z0], [-1, 0, 0], z0 / PL, 0, z1 / PL, TH / PL);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
    const deck = new THREE.Mesh(g, deckMat); deck.frustumCulled = false; root.add(deck);
    // the stilts under it and the posts along its edges, down into the water
    const posts = [];
    for (const b of DECK) {
      const [x0, x1, z0, z1] = b, nx = Math.max(1, Math.round((x1 - x0) / 2.6)), nz = Math.max(1, Math.round((z1 - z0) / 2.6));
      for (let i = 0; i <= nx; i++) for (const zz of [z0, z1]) posts.push([lerp(x0, x1, i / nx), zz, i === 0 || i === nx ? 0.9 : 0.25]);
      for (let j = 1; j < nz; j++) for (const xx of [x0, x1]) posts.push([xx, lerp(z0, z1, j / nz), 0.25]);
    }
    const postG = new THREE.CylinderGeometry(0.13, 0.15, 1, 7); postG.translate(0, 0.5, 0);
    const postM = new THREE.InstancedMesh(postG, new THREE.MeshLambertMaterial({ color: 0x4a3e3a }), posts.length);
    const _m = new THREE.Matrix4();
    posts.forEach(([px, pz, up], i) => { const h = 1.6 + up; _m.makeScale(1, h, 1).setPosition(px, -1.6, pz); postM.setMatrixAt(i, _m); });
    postM.instanceMatrix.needsUpdate = true; postM.frustumCulled = false; root.add(postM);
  }
  // lanterns on posts (P.lanterns: [x, z] each): they light the fighters warmly, low while the place's lamps are out
  const LANTERNS = [];
  if (P.lanterns && P.lanterns.length) {
    const n = P.lanterns.length, postG = new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6); postG.translate(0, 1.2, 0);
    const posts = new THREE.InstancedMesh(postG, new THREE.MeshLambertMaterial({ color: 0x2e2622 }), n), heads = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.17, 0), new THREE.MeshBasicMaterial({ color: 0xffc070 }), n);
    const _m = new THREE.Matrix4(), halo = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,214,150,1)'); q.addColorStop(0.25, 'rgba(255,170,80,.45)'); q.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
    P.lanterns.forEach(([x, z], i) => {
      posts.setMatrixAt(i, _m.makeTranslation(x, 0, z)); heads.setMatrixAt(i, _m.makeScale(1, 1.4, 1).setPosition(x, 2.25, z));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(x, 2.25, z); s.scale.setScalar(1.6); s.renderOrder = 6; root.add(s);
      const L = new THREE.PointLight(0xffb45a, 1.4, 9, 2); L.position.set(x, 2.1, z); root.add(L);
      LANTERNS.push({ s, L, ph: rnd() * TAU });
    });
    posts.frustumCulled = heads.frustumCulled = false; root.add(posts, heads);
  }
  // the place's own lights (P.lights): `dir`, a warm or cold light from far off in that direction (a node's glow), or
  // `at`, a light at a point, with its reach `d`
  for (const L of P.lights || []) {
    if (L.dir) { const d = new THREE.DirectionalLight(COL(L.c), L.i); d.position.set(L.dir[0], L.dir[1], L.dir[2]).normalize().multiplyScalar(50); root.add(d, d.target); }
    else { const p = new THREE.PointLight(COL(L.c), L.i, L.d || 10, 2); p.position.set(L.at[0], L.at[1], L.at[2]); root.add(p); }
  }

  // ---------- ground mist: soft layers drifting with the wind, thin over the clearing; shockwaves blow holes in it ----------
  const MIST = { uC: { value: COL(0) }, uA: { value: 0.4 } };
  if (AIRP.mist > 0) {
    const ctr = V3(FWD.x, 0, FWD.z).normalize().multiplyScalar(26).add(V3(CP.x, 0, CP.z));
    for (const [y, k, sp] of [[0.18, 1, 0.6], [0.6, 0.75, -0.4], [1.3, 0.5, 0.3]]) {
      const u = Object.assign({ uMap: { value: mistTex }, uK: { value: k * AIRP.mist }, uSp: { value: sp }, uClear: { value: Math.max(2, CLR[2] - 3) }, uCtr: { value: new THREE.Vector2(CLR[0], CLR[1]) } }, MIST, AIRU);
      const m = new THREE.Mesh(new THREE.CircleGeometry(34, 48), new THREE.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, fog: false,
        vertexShader: 'varying vec2 vP; varying float vCam;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; vCam = distance(w.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: AIR + '\nuniform sampler2D uMap; uniform vec3 uC; uniform vec2 uCtr; uniform float uA, uK, uSp, uClear; varying vec2 vP; varying float vCam;\n' +
          'void main(){ float r = length(vP - uCtr); vec2 dr = uFlow.xy * uSp * .3;\n float n = texture2D(uMap, vP / 9. - dr * .06).r * texture2D(uMap, vP / 23. - dr * .025).r * 3.;\n' +
          ' float a = uA * uK * min(n, 1.2) * (.35 + .65 * smoothstep(uClear, uClear + 5., r)) * smoothstep(4., 14., vCam) * (1. - smoothstep(30., 44., vCam)) * (1. - clamp(length(pushAt(vP)) * .6, 0., 1.));\n gl_FragColor = vec4(uC, a); }',
      }));
      m.rotation.x = -PI / 2; m.position.set(ctr.x, y, ctr.z); m.renderOrder = 4; m.frustumCulled = false; root.add(m);
    }
  }

  // ---------- fireflies over the grass (or green marsh lights over the water), scattering from a shockwave; frost glints ----------
  const _db = new THREE.Vector2();
  function lights(n, near, far, y0, y1, avoid) {
    const pos = new Float32Array(n * 3), ph = new Float32Array(n * 4), box = groundBox(far, 0); let k = 0;
    for (let i = 0; i < n * 40 && k < n; i++) {
      const x = rr(box[0], box[1]), z = rr(box[2], box[3]), y = rr(y0, y1), d = dCam(x, z);
      if (d < near || d > far || !shows(x, z, y, 0) || (avoid && Math.hypot(x - CLR[0], z - CLR[1]) < CLR[2] - 2)) continue;
      pos.set([x, y, z], k * 3); ph.set([rnd() * TAU, rr(0.5, 1.4), rr(0.15, 0.5), rr(0.6, 1.6)], k * 4); k++;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 4)); g.setDrawRange(0, k);
    return g;
  }
  const fliesU = Object.assign({ uScale: { value: 400 }, uOn: { value: 1 }, uFC: { value: new THREE.Vector3().fromArray(AIRP.ffColor) } }, AIRU);
  if (AIRP.fireflies > 0) {
    const flies = new THREE.Points(lights(AIRP.fireflies, 6, 34, 0.25, 2.6, true), new THREE.ShaderMaterial({
      uniforms: fliesU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: AIR + '\nattribute vec4 aPh; uniform float uScale, uOn; varying float vA;\n' +
        'void main(){ vec3 p = position + vec3(sin(uT * aPh.y * .5 + aPh.x) * 1.2, sin(uT * aPh.y * .7 + aPh.x * 2.) * .35, cos(uT * aPh.y * .4 + aPh.x * 1.3) * 1.2);\n' +
        ' vec2 w = pushAt(p.xz); p.xz += w * 1.6 + windAt(p.xz) * .8; p.y += length(w) * .8;\n' +
        ' vA = uOn * pow(max(0., sin(uT * aPh.w + aPh.x * 3.)), 3.); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = vA > .01 ? aPh.z * .22 * uScale * projectionMatrix[1][1] * .35 / -mv.z : 0.; }',
      fragmentShader: 'uniform vec3 uFC; varying float vA;\nvoid main(){ float d = length(gl_PointCoord - .5) * 2.; float k = smoothstep(1., 0., d); gl_FragColor = vec4(uFC * (k * k + .6 * smoothstep(.35, 0., d)) * vA, 1.); }',
    }));
    flies.frustumCulled = false; flies.renderOrder = 9; root.add(flies);
    flies.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); fliesU.uScale.value = _db.y; };
  }
  // frost glints: the rime on the ground catching the moon, each one now and then
  const glintU = { uScale: fliesU.uScale, uT: AIRU.uT, uOn: { value: 1 } };
  if (AIRP.glints > 0) {
    const pos = new Float32Array(AIRP.glints * 3), ph = new Float32Array(AIRP.glints * 4), box = groundBox(30, 0); let k = 0;
    for (let i = 0; i < AIRP.glints * 30 && k < AIRP.glints; i++) { const x = rr(box[0], box[1]), z = rr(box[2], box[3]), d = dCam(x, z); if (d < 5 || d > 30 || !shows(x, z, 0, 0) || onDeck(x, z)) continue; pos.set([x, 0.03, z], k * 3); ph.set([rnd() * TAU, rr(0.3, 1.2), rr(0.05, 0.12), rr(0.6, 1)], k * 4); k++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 4)); g.setDrawRange(0, k);
    const gl = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: glintU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute vec4 aPh; uniform float uScale, uT, uOn; varying float vA;\nvoid main(){ vA = uOn * aPh.w * pow(max(0., sin(uT * aPh.y + aPh.x)), 12.); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = vA > .01 ? aPh.z * uScale * projectionMatrix[1][1] * .35 / -mv.z : 0.; }',
      fragmentShader: 'varying float vA;\nvoid main(){ vec2 q = gl_PointCoord - .5; float k = max(smoothstep(.08, 0., abs(q.x)) * smoothstep(.5, 0., abs(q.y)), smoothstep(.08, 0., abs(q.y)) * smoothstep(.5, 0., abs(q.x))) + smoothstep(.25, 0., length(q)); gl_FragColor = vec4(vec3(.85, .92, 1.) * k * vA, 1.); }',
    }));
    gl.frustumCulled = false; gl.renderOrder = 8; root.add(gl);
    STATS.glints = k;
  }

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

  // ---------- snow: flakes drifting down through the frame on the wind; a blizzard in a frozen place's storm ----------
  const SNOWY = AIRP.snow > 0 || !!P.frozen, NSN = SNOWY ? 2200 : 0;
  const SNOW = { uSnow: { value: AIRP.snow }, uFast: { value: 0 }, uCtr: { value: RC }, uScale: fliesU.uScale, uT: AIRU.uT, uWind: AIRU.uWind, uFlow: AIRU.uFlow, uSC: { value: COL(0xe8eeff) } };
  if (NSN) {
    const sp = new Float32Array(NSN * 3), sa = new Float32Array(NSN * 4);
    for (let i = 0; i < NSN; i++) { sp.set([rr(-26, 26), rnd(), rr(-26, 18)], i * 3); sa.set([rnd(), rr(0.6, 1.3), rr(0.03, 0.07), rnd() * TAU], i * 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sa, 4));
    const snow = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: SNOW, transparent: true, depthWrite: false,
      vertexShader: 'attribute vec4 aS; uniform float uT, uSnow, uFast, uScale; uniform vec4 uWind, uFlow; uniform vec3 uCtr; varying float vA;\n' +
        'void main(){ float sp = aS.y * (1. + 2.2 * uFast), H = 16.; float y = H * (1. - fract(position.y + uT * sp / H));\n' +
        ' vec2 drift = uWind.xy * (uFlow.z * (1.4 + 5. * uFast)) + vec2(sin(uT * .9 + aS.w), cos(uT * .7 + aS.w * 1.3)) * .6;\n' +
        ' vec2 xz = mod(position.xz + drift + 26., 52.) - 26.;\n' +
        ' vec3 p = vec3(uCtr.x + xz.x, y, uCtr.z + xz.y); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;\n' +
        ' vA = step(aS.x, uSnow) * smoothstep(0., 1., y) * smoothstep(1., 4., -mv.z); gl_PointSize = vA > .01 ? aS.z * uScale * projectionMatrix[1][1] * .5 / -mv.z * (1. + uFast * .6) : 0.; }',
      fragmentShader: 'uniform vec3 uSC; varying float vA;\nvoid main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(uSC, vA * smoothstep(1., .2, d) * .9); }',
    }));
    snow.frustumCulled = false; snow.renderOrder = 10; root.add(snow);
    snow.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); SNOW.uScale.value = _db.y; };
  }

  // ---------- lightning: bolts in the sky beyond the trees (hidden behind them: they read the painting's mask), and
  // bolts that come down into the clearing ----------
  const NBQ = 72;
  function boltMesh(masked2) {
    const bP = new Float32Array(NBQ * 12), bI = []; for (let i = 0; i < NBQ; i++) { const b = i * 4; bI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(bP, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(bI);
    const u = { uC: { value: COL(0xe4eaff) }, uO: { value: 0 }, uMaskT: BU.uMaskT, uVP: { value: _vp } };
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
        const f = 1 / (n - i), ny = Math.max(0, y - y * f * rr(0.7, 1.3)), nx = lerp(x, tx, f) + rr(-1, 1) * jag * (w + 0.3), nz = lerp(z, tz, f) + rr(-1, 1) * jag * (w + 0.3);
        seg(x, y, z, nx, i === n - 1 && main ? 0 : ny, nz, w);
        if (rnd() < 0.16 && w > 0.2) path(nx, ny, nz, nx + rr(-8, 8), nz + rr(-8, 8), 4 + (rnd() * 4 | 0), w * 0.45, false);
        x = nx; y = ny; z = nz;
      }
    };
    path(x0, y0, z0, x1, z1, 26, w0, true);
    B.g.attributes.position.needsUpdate = true; B.g.computeBoundingSphere();
  }
  function skyBolt() {
    // somewhere over the far trees the frame sees, beyond the clearing
    rayAt(rr(0.05, 0.95), rr(0.2, 0.45), _q); const r = rr(90, 160), x = CP.x + _q.x * r, z = CP.z + _q.z * r;
    drawBolt(SKYB, x + rr(-10, 10), rr(60, 80), z + rr(-6, 6), x, z, 0.9, 4);
    BU.uBolt.value.set(x - CP.x, 40, z - CP.z).normalize();
    return r;
  }

  // ---------- birds or bats: they sit in the far trees and the framing tree until a roar or a blow puts them up ----------
  const NBD = 28, BAT = AIRP.fly === 'bats', BP = Array.from({ length: NBD }, () => new THREE.Vector4(0, -60, 0, 0)), BH = Array.from({ length: NBD }, () => new THREE.Vector4(0, 0, 1, 0));
  let birds = null; // drawn only while some are in the air (update(): an empty draw range while none are)
  {
    const Pp = [], A = [], I = [];
    const tri = (b, pts) => { const s = Pp.length / 3; for (const p of pts) { Pp.push(p[0], p[1], p[2]); A.push(b); } I.push(s, s + 1, s + 2); };
    for (let b = 0; b < NBD; b++) {
      tri(b, [[0, 0, 0.3], [0.06, 0, 0], [-0.06, 0, 0]]); tri(b, [[0.06, 0, 0], [0, 0, -0.22], [-0.06, 0, 0]]);
      // a bird's long pointed wings, or a bat's short scalloped ones
      if (BAT) { tri(b, [[0.05, 0, 0.08], [0.34, 0, 0.06], [0.05, 0, -0.12]]); tri(b, [[0.34, 0, 0.06], [0.42, 0, -0.1], [0.2, 0, -0.08]]); tri(b, [[-0.05, 0, 0.08], [-0.05, 0, -0.12], [-0.34, 0, 0.06]]); tri(b, [[-0.34, 0, 0.06], [-0.2, 0, -0.08], [-0.42, 0, -0.1]]); }
      else { tri(b, [[0.05, 0, 0.06], [0.48, 0, -0.06], [0.05, 0, -0.1]]); tri(b, [[-0.05, 0, 0.06], [-0.05, 0, -0.1], [-0.48, 0, -0.06]]); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pp, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
    birds = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uBP: { value: BP }, uBH: { value: BH }, uC: { value: COL(BAT ? 0x0c0810 : 0x0e0b14) } }, side: THREE.DoubleSide,
      vertexShader: 'attribute float aB; uniform vec4 uBP[' + NBD + ']; uniform vec4 uBH[' + NBD + '];\n' +
        'void main(){ int i = int(aB + .5); vec4 P = vec4(0.), H = vec4(0., 0., 1., 0.); for (int k = 0; k < ' + NBD + '; k++) { if (k == i) { P = uBP[k]; H = uBH[k]; } }\n' +
        ' vec3 f = normalize(H.xyz + vec3(0., 0., 1e-4)), r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), u = cross(r, f); vec3 l = position;\n' +
        ' l.y += sin(H.w) * .5 * abs(l.x) * step(.07, abs(l.x)); vec3 w = P.xyz + (r * l.x + u * l.y + f * l.z) * P.w;\n gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }',
      fragmentShader: 'uniform vec3 uC;\nvoid main(){ gl_FragColor = vec4(uC, 1.); }',
    }));
    birds.frustumCulled = false; birds.renderOrder = 2; root.add(birds);
  }
  // their roosts: along the far tree line in the frame
  const ROOST = [];
  for (let i = 0; i < 60 && ROOST.length < 22; i++) { const u = rr(0.05, 0.95); rayAt(u, lerp(skyV(u), groundV(u), 0.5), _q); const r = 60; const x = CP.x + _q.x * r, y = CP.y + _q.y * r, z = CP.z + _q.z * r; if (y > 3) ROOST.push(V3(x, y, z)); }
  const BIRDS = Array.from({ length: NBD }, (_, i) => ({ i, st: 0, p: V3(), v: V3(), t: 0, wait: 0, turn: 0, flap: rnd() * TAU, dur: 10 }));

  // ---------- drifting things: leaves, petals, turf, dust, smoke, embers, sparks, splashes, stone chips, splinters ----------
  // how each moves (k): 0 a leaf or petal fluttering down, 1 thrown up (it flies, then flutters down), 2 a mote drifting on
  // the wind (pollen, an ember), 3 a splash, 4 dust billowing out and settling, 5 smoke rising and spreading, 6 a spark
  // (it flies and falls fast); how each draws: a leaf (0), a glowing dot (1), a soft puff (2)
  const NPT = 1100, pPos = new Float32Array(NPT * 3), pCol = new Float32Array(NPT * 4), pSize = new Float32Array(NPT), pRot = new Float32Array(NPT), pKind = new Float32Array(NPT);
  const PT = Array.from({ length: NPT }, () => ({ life: 0, max: 1, v: V3(), c: COL(0), a: 1, s: 0.1, spin: 0, k: 0 })); let ptN = 0;
  const pG = new THREE.BufferGeometry(); for (const [k, a, n] of [['position', pPos, 3], ['aCol', pCol, 4], ['aSize', pSize, 1], ['aRot', pRot, 1], ['aKind', pKind, 1]]) pG.setAttribute(k, new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage));
  const pScale = { value: 400 };
  [[leafDot, THREE.NormalBlending], [dotTex, THREE.AdditiveBlending], [puffTex, THREE.NormalBlending]].forEach(([map, blending], kind) => {
    const m = new THREE.Points(pG, new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: pScale }, transparent: true, depthWrite: false, blending,
      vertexShader: 'attribute vec4 aCol; attribute float aSize; attribute float aRot; attribute float aKind; uniform float uScale; varying vec4 vC; varying float vR;\n' +
        'void main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > .002 && abs(aKind - ' + kind + '.) < .5 ? min(aSize * uScale * projectionMatrix[1][1] / -mv.z, 512.) : 0.; }',
      fragmentShader: 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1. - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }',
    }));
    m.frustumCulled = false; m.renderOrder = 9 - kind * 0.1; root.add(m);
    if (!kind) m.onBeforeRender = (r) => { r.getDrawingBufferSize(_db); pScale.value = _db.y * 0.5; };
  });
  function emit(x, y, z, vx, vy, vz, life, c, a, s, spin, k) {
    const Q = PT[ptN], i = ptN; ptN = (ptN + 1) % NPT; k = k || 0; Q.life = Q.max = life; Q.v.set(vx, vy, vz); Q.c.copy(c); Q.a = a; Q.s = s; Q.spin = spin || 0; Q.k = k;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pRot[i] = rnd() * TAU; pKind[i] = k === 0 || k === 1 ? 0 : k === 4 || k === 5 ? 2 : 1;
  }

  // ---------- rocks and clods, stone chips or splinters thrown up by the big blows: they fly, tumble, bounce and settle ----------
  // (drawn only while any are up or lying there: most of a fight, none are; update() sets the count to 0 then)
  const NDB = 140;
  const debris = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), NDB);
  debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage); debris.frustumCulled = false; debris.count = NDB; root.add(debris);
  const DBR = Array.from({ length: NDB }, () => ({ on: false, p: V3(), v: V3(), q: new THREE.Quaternion(), w: V3(), s: 0.1, life: 0, rest: 0, wet: false }));
  const _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _sv = V3(), _eu = new THREE.Euler();
  // what a blow throws up here (P.floor.debris): turf and stones, stone chips, frozen clods, or splinters
  const DEBRIS = {
    turf: [0x4b4a52, 0x3c3428, 0x5a5560, 0x46562e], stone: [0x6a6670, 0x585460, 0x7a7680, 0x4a4650], frost: [0xb8c0d0, 0x6a7080, 0x9aa4b4, 0x56604e],
    wood: [0x5a4a40, 0x4a3c34, 0x6a5a4c, 0x3c3028], ice: [0xc8d4e8, 0x8890a4, 0xb0bccc, 0x707888],
  }[FL.debris || 'turf'].map(COL);
  let dbN = 0;
  { const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < NDB; i++) { debris.setMatrixAt(i, z); debris.setColorAt(i, DEBRIS[i % 4]); } debris.instanceMatrix.needsUpdate = true; if (debris.instanceColor) debris.instanceColor.needsUpdate = true; }
  // the floor under a point: the deck's planks, the water, or the ground
  const floorAt = (x, z) => (onDeck(x, z) ? 'deck' : WATER ? 'water' : 'ground');
  function throwDebris(x, z, s, n) {
    for (let k = 0; k < n; k++) {
      const D = DBR[dbN], a = rnd() * TAU, r = rr(0.3, 1.6) * Math.sqrt(s), sp = rr(2, 6.5) * s; dbN = (dbN + 1) % NDB;
      D.on = true; D.p.set(x + Math.sin(a) * r, 0.1, z + Math.cos(a) * r); D.v.set(Math.sin(a) * sp, rr(4, 9) * Math.sqrt(s), Math.cos(a) * sp);
      D.q.setFromEuler(_eu.set(rnd() * TAU, rnd() * TAU, 0)); D.w.set(rr(-9, 9), rr(-9, 9), rr(-9, 9)); D.s = rr(0.06, 0.2) * (0.7 + 0.5 * s); D.life = rr(4, 7); D.rest = 0; D.wet = false;
    }
  }

  // ==================================================================================================================
  // what happens in it, and every frame
  // ==================================================================================================================
  const RING = [0, 1, 2, 3].map(() => ({ x: 0, z: 0, r: 0, s: 0, s0: 0, t: 0 })), VT = new THREE.Vector4(0, 0, 9, 0);
  let ringN = 0, decN = 0;
  const DECS = Array.from({ length: 8 }, () => ({ s: 0, life: 0, max: 1 }));
  const GRASSC = (FL.bits || [0x7a9048, 0x5e7c36, 0xa09858, 0x5e4e36]).map(COL), DUST = COL(FL.dust || 0x8a7e66), C1 = COL(0), WATERC = COL(0x9aa8c8);
  const dust = () => C1.copy(DUST).lerp(NIGHT.haze, 0.35).multiplyScalar(0.55);
  function startle(ox, oz, s) {
    for (const B of BIRDS) {
      if (B.st !== 0 || rnd() > s * 1.3) continue;
      const R = ROOST[B.i % ROOST.length] || V3(0, 12, -48); B.p.set(R.x + rr(-3, 3), R.y + rr(-2, 2), R.z + rr(-2, 2));
      _q.set(B.p.x - ox, 0, B.p.z - oz).normalize(); B.v.set(_q.x * rr(3, 6) + rr(-2, 2), rr(4, 7), _q.z * rr(2, 4));
      B.st = 1; B.t = -rr(0, 0.5); B.dur = 9; B.turn = rr(-0.6, 0.6);
    }
    for (const T of TREES) if (rnd() < s) T.leaves += 6 * s;
  }
  // water thrown up where a blow lands in it, and a ring running out over it
  function splash(x, z, s) {
    for (let n = 0, m = Math.round(40 * s); n < m; n++) { const a = rnd() * TAU, sp = rr(0.6, 3) * s; emit(x + Math.sin(a) * rr(0.2, 1), 0, z + Math.cos(a) * rr(0.2, 1), Math.sin(a) * sp, rr(2, 6) * Math.sqrt(s), Math.cos(a) * sp, rr(0.6, 1.1), WATERC, 0.8, rr(0.05, 0.1), 0, 3); }
    for (let n = 0, m = Math.round(10 * s); n < m; n++) { const a = rnd() * TAU; emit(x + Math.sin(a) * rr(0.3, 1.5), 0.2, z + Math.cos(a) * rr(0.3, 1.5), Math.sin(a) * rr(1, 3) * s, rr(0.2, 0.8), Math.cos(a) * rr(1, 3) * s, rr(1.4, 2.4), C1.setRGB(0.6, 0.64, 0.72), 0.25, rr(0.8, 1.4), 0, 4); }
  }
  function impact(x, z, s) {
    const R = RING[ringN++ % 4]; Object.assign(R, { x, z, r: 0, s, s0: s, t: 0 });
    for (const T of TREES) T.shake = Math.max(T.shake, s * 0.9 * cl(1.5 - Math.hypot(T.x - x, T.z - z) / 30, 0, 1));
    const on = floorAt(x, z);
    if (on === 'water') { splash(x, z, s); if (s > 0.4) startle(x, z, s); return; }
    // turf and grass (or stone chips, or splinters) thrown up, then dust billowing out in a ring round where it landed
    for (let n = 0, m = Math.round(34 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(0.6, 2.6), sp = rr(2, 5) * s;
      emit(x + Math.sin(a) * r, 0.1, z + Math.cos(a) * r, Math.sin(a) * sp, rr(3, 7) * Math.sqrt(s), Math.cos(a) * sp, rr(1.6, 2.6), GRASSC[(rnd() * 4) | 0], 1, rr(0.16, 0.3) * (FL.chip || 1), rr(-9, 9), 1);
    }
    for (let n = 0, m = Math.round(22 * s); n < m; n++) {
      const a = rnd() * TAU, r = rr(0.4, 2.2), sp = rr(3, 8) * s;
      emit(x + Math.sin(a) * r, rr(0.2, 0.6), z + Math.cos(a) * r, Math.sin(a) * sp, rr(0.3, 1.2), Math.cos(a) * sp, rr(2.2, 3.6), dust(), 0.36, rr(1, 1.8) * (0.6 + 0.5 * s), rr(-0.6, 0.6), 4);
    }
    if (s > 0.45) throwDebris(x, z, s, Math.round(10 * s));
    if (s > 0.4) startle(x, z, s);
  }
  function roar(s) {
    for (const T of TREES) { T.shake = Math.max(T.shake, s * 0.7); T.leaves += 10 * s; }
    startle(CLR[0], CLR[1], s);
  }
  // a shockwave through the grass and the mist alone, nothing thrown up (a spell's ring on the ground)
  function ripple(x, z, s) {
    const R = RING[ringN++ % 4]; Object.assign(R, { x, z, r: 0, s, s0: s, t: 0 });
    for (const T of TREES) T.shake = Math.max(T.shake, s * 0.5 * cl(1.5 - Math.hypot(T.x - x, T.z - z) / 30, 0, 1));
  }
  // a mark on the ground: kind 'crack' or 'scorch', with o: { glow (0 to 1), color: 'vein' | 'ember', life (seconds) }
  function decal(kind, x, z, r, o) {
    o = o || {}; const i = decN++ % 8, D = DECS[i];
    DECU.uDec.value[i].set(x, z, r, 1); DECU.uDecK.value[i].set(kind === 'scorch' ? 2 : 1, o.glow || 0, rnd() * 50, o.color === 'ember' ? 1 : 0);
    D.s = 1; D.life = D.max = o.life || 14;
  }
  const GL = GLOWU.uGlowP.value, GC = GLOWU.uGlowC.value;
  function glow(i, x, y, z, r, color, intensity) { if (r <= 0 || !intensity || !color) { GL[i].w = 0; return; } GL[i].set(x, y, z, r); GC[i].set(color.r, color.g, color.b).multiplyScalar(intensity); }
  // lightning straight down into the clearing (a wrath's red bolts): a blinding flash, a scorch, sparks and burning grass
  let gBoltT = -1, strikeAt = null;
  function strike(x, z) {
    drawBolt(GNDB, x + rr(-6, 6), 46, z + rr(-4, 4), x, z, 0.55, 2.4); gBoltT = 0; strikeAt = V3(x, 0, z);
    GNDB.u.uC.value.copy(wrathV > 0.5 ? RED : FLASHC).lerp(FLASHC, 0.35);
    if (floorAt(x, z) !== 'water') decal('scorch', x, z, 2.4, { glow: 1, color: 'ember', life: 16 });
    impact(x, z, 0.7);
    for (let n = 0; n < 40; n++) { const a = rnd() * TAU, sp = rr(3, 9); emit(x, 0.3, z, Math.sin(a) * sp, rr(3, 9), Math.cos(a) * sp, rr(0.5, 1.1), C1.setRGB(1, 0.8, 0.5), 1, rr(0.05, 0.09), 0, 6); }
    flashV = 1; if (api.onThunder) api.onThunder(1, true);
  }

  // the place's weather: 'clear', 'rain' or 'storm' (in a frozen place a storm is a blizzard, without rain)
  let wName = 'clear', wT = 0, wN = 0, wrathT = 0, wrathV = 0, wet = 0, flashV = 0, boltT = -1, nextStrike = 4, moonCover = 0, rainNow = 0, lampsT = 1;
  const thunder = [], RELIGHT = V3(), _c = COL(0);
  // how much of the moon a drifting cloud covers (the same noise as the sheet's clouds), to dim the moonlight with it
  const hh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return lerp(lerp(hh(ix, iy), hh(ix + 1, iy), fx), lerp(hh(ix, iy + 1), hh(ix + 1, iy + 1), fx), fy); };
  const vf = (x, y) => vn(x, y) * 0.55 + vn(x * 2.03 + 7.1, y * 2.03 + 7.1) * 0.3 + vn(x * 4.01 + 3.3, y * 4.01 + 3.3) * 0.15;
  function cloudAtMoon() {
    const F = AIRU.uFlow.value, k = 1.6 / Math.max(0.06, MOOND.y + 0.18), cx = MOOND.x * k - F.x * 0.008, cz = MOOND.z * k - F.y * 0.008;
    const n = vf(cx * 0.42, cz * 0.42) * 0.62 + vf(cx * 1.25 + 4, cz * 1.25 + 4) * 0.38, cv = BU.uCloud.value;
    return sm(1 - cv, 1.16 - cv, n);
  }
  const SPARK = AIRP.sparks || 0; let sparkT = 0;
  function update(t, dt) {
    dt = dt > 0 ? Math.min(dt, 0.05) : 0;
    AIRU.uT.value = t;
    // weather and a wrath ease in and out: a storm rolls in over several seconds and clears again
    wN += (Math.max(wT, wrathT > 0.5 ? 0.9 : 0) - wN) * (1 - Math.exp(-dt * 0.45)); wrathV += (wrathT - wrathV) * (1 - Math.exp(-dt * 1.2));
    const frozen = !!P.frozen, rainK = frozen && wrathV < 0.5 ? 0 : sm(0.32, 0.7, wN), storm = sm(0.7, 1, wN); rainNow = rainK;
    wet = cl(wet + dt * (rainK > 0.1 ? 0.15 * rainK : -0.025), 0, 1); AIRU.uWet.value = wet;
    // the wind wanders, and blows harder in rain, a storm and a wrath; the clouds drift with it and the gusts roll along it
    const W = AIRU.uWind.value, F = AIRU.uFlow.value, wa = 0.6 + 0.45 * Math.sin(t * 0.021) + 0.2 * Math.sin(t * 0.057 + 1);
    W.x = Math.cos(wa); W.y = Math.sin(wa); W.z = 0.3 + 0.6 * wN + 0.4 * wrathV; W.w = 0.5 + 0.5 * wN;
    F.x += W.x * (2 + 4 * W.z) * dt; F.y += W.y * (2 + 4 * W.z) * dt; F.z += dt * (0.4 + 0.6 * W.z); F.w = 0.5 * (1 - sm(0.3, 0.7, wN)) * (1 - moonCover);
    RING.forEach((R, i) => { const U = AIRU.uRings.value[i]; if (R.s > 0.002) { R.t += dt; R.r = 19 * (1 - Math.exp(-R.t * 1.15)); R.s = R.s0 * Math.exp(-R.t * 1.25); U.set(R.x, R.z, R.r, R.s); } else U.w = 0; });
    const VO = AIRU.uVortex.value; VO.x = VT.x; VO.y = VT.y; VO.z = VT.z; VO.w += (VT.w - VO.w) * (1 - Math.exp(-dt * 2.5));
    // lightning in a storm (not in a blizzard) or a wrath, and the thunder after it
    if (((storm > 0.5 && !frozen) || wrathV > 0.6) && dt > 0 && (nextStrike -= dt) <= 0) {
      nextStrike = rr(3, 8) * (wrathV > 0.6 ? 0.7 : 1); const dist = skyBolt(); boltT = 0;
      SKYB.u.uC.value.copy(wrathV > 0.5 ? RED : FLASHC); BU.uBoltC.value.copy(SKYB.u.uC.value); thunder.push(0.3 + dist / 90 * 1.6);
    }
    if (boltT >= 0) { boltT += dt; const f = boltT < 0.07 ? 1 : boltT < 0.13 ? 0.25 : boltT < 0.2 ? 0.85 : Math.max(0, 1 - (boltT - 0.2) * 4); SKYB.u.uO.value = f; SKYB.m.visible = f > 0.01; flashV = Math.max(flashV * Math.exp(-dt * 8), f * 0.8); if (boltT > 0.5) { boltT = -1; SKYB.m.visible = false; } }
    else flashV *= Math.exp(-dt * 6);
    if (gBoltT >= 0) { gBoltT += dt; const f = gBoltT < 0.09 ? 1 : gBoltT < 0.14 ? 0.3 : gBoltT < 0.24 ? 0.9 : Math.max(0, 1 - (gBoltT - 0.24) * 3.5); GNDB.u.uO.value = f * 1.4; GNDB.m.visible = f > 0.01; flashV = Math.max(flashV, f); if (gBoltT > 0.6) { gBoltT = -1; GNDB.m.visible = false; } }
    for (let i = thunder.length - 1; i >= 0; i--) if ((thunder[i] -= dt) <= 0) { thunder.splice(i, 1); if (api.onThunder) api.onThunder(0.5 + 0.5 * storm, false); }
    // the sky's clouds, and how much they hide the moon
    BU.uCloud.value = lerp(0.24, 1.04, wN) + 0.12 * wrathV; BU.uStorm.value = sm(0.15, 0.9, wN); BU.uWrath.value = wrathV; BU.uFlash.value = flashV; BU.uRain.value = rainK;
    moonCover += (Math.max(cloudAtMoon(), storm) - moonCover) * (1 - Math.exp(-dt * 2));
    BU.uMoonC.value.copy(MOONC).lerp(RED, wrathV * 0.6);
    // the painting's lamps come back as their light flies home; a living node pulses
    BU.uLamps.value += (lampsT - BU.uLamps.value) * (1 - Math.exp(-dt * 2.5));
    BU.uPulse.value = WARM.pulse ? WARM.pulse * (0.55 + 0.45 * Math.sin(t * WARM.speed) * Math.sin(t * WARM.speed * 0.37 + 1)) : 0;
    for (const Ln of LANTERNS) { const k = (0.35 + 0.65 * BU.uLamps.value) * (0.88 + 0.08 * Math.sin(t * 7.3 + Ln.ph) + 0.04 * Math.sin(t * 13 + Ln.ph * 2)); Ln.L.intensity = 1.4 * k; Ln.s.material.opacity = k; }
    // the light: the battle's moonlight, dimmed while a cloud crosses the moon, greyer in bad weather, reddened in a
    // wrath, and lightning's flash
    light.color.copy(NIGHT.lc).lerp(GREY, 0.55 * wN).lerp(RED, 0.45 * wrathV).lerp(FLASHC, 0.7 * flashV);
    light.I = NIGHT.li * (1 - 0.3 * storm) * (1 - 0.55 * moonCover) + 1.3 * flashV;
    light.hemiSky.copy(NIGHT.hs).lerp(GREY, 0.35 * wN).lerp(WRATHSKY, 0.4 * wrathV); light.hemiGround.copy(NIGHT.hg);
    light.hemiI = NIGHT.hi * (1 - 0.25 * wN) + 1.4 * flashV; light.fillI = NIGHT.fi * (1 - 0.25 * wN);
    irr(light, RELIGHT); BU.uRelight.value.set(cl(RELIGHT.x / IRR0.x, 0, 4), cl(RELIGHT.y / IRR0.y, 0, 4), cl(RELIGHT.z / IRR0.z, 0, 4));
    const haze = _c.copy(NIGHT.haze).lerp(STORMC, 0.45 * wN).lerp(RED, 0.12 * wrathV); BU.uHaze.value.copy(haze); FOG.color.copy(haze);
    MIST.uC.value.copy(haze).multiplyScalar(1.25 + 0.3 * flashV); MIST.uA.value = (0.5 + 0.3 * rainK + 0.2 * storm) * 0.55;
    fliesU.uOn.value = 1 - Math.max(rainK, frozen ? storm : 0); RAIN.uRain.value = rainK; rain.visible = rainK > 0.01;
    RAIN.uRC.value.setRGB(0.6, 0.66, 0.78).multiplyScalar(0.55 + flashV);
    // snow: the place's own, heavier and wind-driven in a blizzard
    if (NSN) { SNOW.uSnow.value = cl(AIRP.snow + (frozen ? 0.35 * sm(0.3, 0.6, wN) + 0.5 * storm : 0), 0, 1); SNOW.uFast.value = frozen ? storm : 0; SNOW.uSC.value.setRGB(0.9, 0.93, 1).multiplyScalar(0.8 + flashV * 0.8).lerp(RED, wrathV * 0.3); }
    // the marks on the ground fade
    DECS.forEach((D, i) => { if (D.s > 0) { D.life -= dt; D.s = cl(D.life / Math.min(4, D.max), 0, 1); DECU.uDec.value[i].w = D.s; } });
    // the tree shakes and sheds its leaves (or snow, or needles); the wind takes some at any time
    TREES.forEach((T, i) => {
      T.shake *= Math.exp(-dt * 2.2); AIRU.uShake.value[i] = T.shake;
      if (T.dead) return;
      T.leaves += dt * (0.2 + 1.2 * W.z * W.w + 40 * T.shake);
      while (T.leaves >= 1) {
        T.leaves -= 1; _q.set(rr(-1, 1), rr(-0.6, 0.8), rr(-1, 1)).normalize(); const g = rnd();
        const lc = AIRP.fall === 'snow' ? C1.setRGB(0.9, 0.93, 1) : C1.setRGB(AIRP.leaf[0] + 0.3 * g, AIRP.leaf[1] + 0.1 * g, AIRP.leaf[2]);
        emit(T.c.x + _q.x * T.R * 0.9, T.c.y + _q.y * T.R * 0.6, T.c.z + _q.z * T.R * 0.9, 0, -0.5, 0, rr(5, 8), lc, 1, rr(0.18, 0.28) * (AIRP.fall === 'snow' ? 0.6 : 1), rr(-4, 4), AIRP.fall === 'snow' ? 2 : 0);
      }
    });
    if (dt > 0) {
      // embers in a wrath, splashes in the rain, warm sparks off an Ember Line or a node, and grass and dust torn up
      // round a whirlwind
      for (let n = 0, m = (wrathV * 34 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(2, 18); emit(CLR[0] + Math.sin(a) * r, rr(0, 2), CLR[1] + Math.cos(a) * r, 0, rr(0.8, 1.6), 0, rr(2, 3.5), C1.setRGB(1, 0.45, 0.12), 1, rr(0.06, 0.1), 0, 2); }
      for (let n = 0, m = (rainK * 170 * dt + rnd()) | 0; n < m; n++) { rayAt(rnd(), rr(0.6, 1), _q); const tt = Math.min(-CP.y / Math.min(-0.01, _q.y), 30); emit(CP.x + _q.x * tt, 0.03, CP.z + _q.z * tt, rr(-0.4, 0.4), rr(1, 1.8), rr(-0.4, 0.4), 0.32, C1.setRGB(0.8, 0.86, 0.95), 0.6, 0.05, 0, 3); }
      if (SPARK) { sparkT += dt * SPARK * 0.25; while (sparkT > 1) { sparkT -= 1; const a = rnd() * TAU, r = rr(1, 16); emit(CLR[0] + Math.sin(a) * r, rr(0, 0.4), CLR[1] + Math.cos(a) * r - 2, rr(-0.2, 0.2), rr(0.4, 1.1), rr(-0.2, 0.2), rr(2.5, 4), C1.setRGB(1, rr(0.45, 0.7), 0.2), 1, rr(0.05, 0.08), 0, 2); } }
      for (let n = 0, m = (VO.w * 70 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(0.5, 1.2) * VO.z; emit(VO.x + Math.sin(a) * r, 0.2, VO.y + Math.cos(a) * r, 0, rr(3, 6), 0, rr(2.5, 4), GRASSC[(rnd() * 3) | 0], 1, rr(0.18, 0.32), rr(-9, 9), 1); }
      for (let n = 0, m = (VO.w * 16 * dt + rnd()) | 0; n < m; n++) { const a = rnd() * TAU, r = rr(0.3, 1) * VO.z; emit(VO.x + Math.sin(a) * r, 0.3, VO.y + Math.cos(a) * r, 0, rr(0.3, 1.2), 0, rr(2, 3.2), dust(), 0.2, rr(1, 1.8), 0, 4); }
      if (strikeAt && gBoltT >= 0 && gBoltT < 0.5) for (let n = 0; n < 2; n++) emit(strikeAt.x + rr(-0.6, 0.6), 0.2, strikeAt.z + rr(-0.6, 0.6), 0, rr(1, 2), 0, rr(1.5, 2.5), C1.setRGB(0.12, 0.1, 0.12), 0.45, rr(0.6, 1.1), rr(-1, 1), 5);
    }
    const vw = VO.w > 0.01;
    for (let i = 0; i < NPT; i++) {
      const Q = PT[i];
      if (Q.life <= 0) { if (pCol[i * 4 + 3]) { pCol[i * 4 + 3] = 0; pSize[i] = 0; } continue; }
      Q.life -= dt; const age = 1 - Math.max(0, Q.life) / Q.max, Vv = Q.v;
      if (Q.k === 3 || Q.k === 6) Vv.y -= 9.8 * dt;
      else if (Q.k === 1) { Vv.y -= 7 * dt; Vv.multiplyScalar(Math.exp(-dt * 1.2)); if (Vv.y < -1.2) Q.k = 0; }
      else if (Q.k === 4) { const d = Math.exp(-dt * 1.4); Vv.x = Vv.x * d + W.x * W.z * 0.9 * (1 - d); Vv.z = Vv.z * d + W.y * W.z * 0.9 * (1 - d); Vv.y = Vv.y * d + 0.2 * (1 - d); }
      else if (Q.k === 5) { const d = Math.exp(-dt * 0.8); Vv.x = Vv.x * d + W.x * W.z * 1.4 * (1 - d); Vv.z = Vv.z * d + W.y * W.z * 1.4 * (1 - d); Vv.y = Vv.y * d + 0.9 * (1 - d); }
      else { const kk = Q.k ? 0.6 : 0.9, sp = Q.k ? 1.2 : 2.4; Vv.x += (W.x * W.z * sp - Vv.x) * dt * kk; Vv.z += (W.y * W.z * sp - Vv.z) * dt * kk; if (!Q.k) Vv.y = -0.55 + 0.35 * Math.sin(t * 3 + i); }
      let x = pPos[i * 3] + Vv.x * dt, y = pPos[i * 3 + 1] + Vv.y * dt, z = pPos[i * 3 + 2] + Vv.z * dt;
      if (vw && Q.k !== 3) { const dx = x - VO.x, dz = z - VO.y, d = Math.hypot(dx, dz) + 0.001, f = VO.w * sm(VO.z * 1.6, VO.z * 0.5, d) * sm(0.5, 3, d) * dt; x += (-dz * 9 + dx * 0.6) / d * f; z += (dx * 9 + dz * 0.6) / d * f; y += 2.4 * f; }
      if (Q.k === 6 && y < 0.02) { Vv.y = -Vv.y * 0.35; Vv.x *= 0.6; Vv.z *= 0.6; }
      pPos[i * 3] = x; pPos[i * 3 + 1] = Math.max(0.02, y); pPos[i * 3 + 2] = z; pRot[i] += Q.spin * dt;
      const fa = Math.min(1, age / 0.1) * (1 - age * age); pCol[i * 4] = Q.c.r; pCol[i * 4 + 1] = Q.c.g; pCol[i * 4 + 2] = Q.c.b; pCol[i * 4 + 3] = Q.a * fa;
      pSize[i] = Q.k === 4 ? Q.s * (1 + 1.8 * age) : Q.k === 5 ? Q.s * (1 + 2.6 * age) : Q.s;
    }
    for (const k of ['position', 'aCol', 'aSize', 'aRot', 'aKind']) pG.attributes[k].needsUpdate = true;
    // the rocks and clods (they sink into water)
    let any = false, up = 0;
    for (let i = 0; i < NDB; i++) {
      const D = DBR[i]; if (!D.on) continue; any = true;
      D.life -= dt; if (D.life <= 0) { D.on = false; debris.setMatrixAt(i, _m4.makeScale(0, 0, 0)); continue; }
      up++;
      if (D.rest < 1) {
        D.v.y -= 9.8 * dt; D.p.addScaledVector(D.v, dt);
        const fl = WATER && !onDeck(D.p.x, D.p.z) ? (WATER.y === undefined ? -0.34 : WATER.y) : 0;
        if (D.p.y < fl + D.s * 0.6) {
          if (fl < 0 && !D.wet) { D.wet = true; splash(D.p.x, D.p.z, 0.15); D.life = Math.min(D.life, 0.5); }
          if (fl < 0) { D.v.multiplyScalar(0.8); }
          else { D.p.y = D.s * 0.6; if (D.v.y < -1.5) { D.v.y *= -0.32; D.v.x *= 0.55; D.v.z *= 0.55; D.w.multiplyScalar(0.5); } else { D.v.set(0, 0, 0); D.rest = 1; } }
        }
        _qq.setFromEuler(_eu.set(D.w.x * dt, D.w.y * dt, D.w.z * dt)); D.q.multiply(_qq);
      }
      const sc = D.s * Math.min(1, D.life / 1.2); debris.setMatrixAt(i, _m4.compose(D.p, D.q, _sv.set(sc, sc * 0.75, sc)));
    }
    if (any) debris.instanceMatrix.needsUpdate = true;
    // none up, none drawn: a count of 0 issues no draw call. Never .visible = false instead: three builds a mesh's shader
    // for the lights of the first frame that draws it (the start's renderer.compile() counted Lunara's and Envoi's lights,
    // hidden straight after), so stones hidden until the first heavy blow would build theirs then, a stall in that frame
    // of every arena fight; left in the scene, theirs is built in the opening frames with everything else. (Their colours
    // were all set at the start, while count was NDB: r128 sizes the colour buffer from count at the first setColorAt.)
    debris.count = up > 0 ? NDB : 0; STATS.debris = up;
    // the birds or bats: up and away when startled, back to roost later
    let aloft = 0;
    for (const B of BIRDS) {
      const bp = BP[B.i], bh = BH[B.i];
      if (B.st === 1) {
        B.t += dt; if (B.t < 0) { bp.w = 0; continue; }
        const c = Math.cos(B.turn * dt), s = Math.sin(B.turn * dt), vx = B.v.x * c - B.v.z * s; B.v.z = B.v.x * s + B.v.z * c; B.v.x = vx;
        B.v.y += ((B.p.y < 30 ? 3.5 : -0.5) - B.v.y) * dt * 0.8; const hs = Math.hypot(B.v.x, B.v.z) || 1; B.v.x *= (8.5 / hs - 1) * dt + 1; B.v.z *= (8.5 / hs - 1) * dt + 1;
        B.p.addScaledVector(B.v, dt); B.flap += dt * (BAT ? 26 : B.v.y > 1 ? 22 : 12 * (0.5 + 0.5 * Math.sin(B.t * 1.3)));
        bp.set(B.p.x, B.p.y, B.p.z, 1); bh.set(B.v.x, B.v.y * 0.5, B.v.z, B.flap);
        if (B.t > B.dur) { B.st = 2; B.wait = rr(15, 35); bp.w = 0; } else aloft++;
      } else { bp.w = 0; if (B.st === 2 && (B.wait -= dt) <= 0) B.st = 0; }
    }
    // none aloft, none drawn: a draw range of 0 issues no draw call, and keeps them in the scene (why: the stones', above)
    birds.geometry.setDrawRange(0, aloft > 0 ? Infinity : 0); STATS.birds = aloft;
  }

  const api = {
    root, camera: cam, frame: [FW, FH], update, light, impact, ripple, roar, decal, glow, strike, splash, onThunder: null, stats: STATS, fog: FOG, place: P,
    floorAt, frameOf, skyV, groundV,
    // how many of the frame's pixels a metre is, where the fight is (the battle screen scales its zooms by it)
    ppm: AV.ppm,
    get flash() { return flashV; }, get wet() { return wet; }, get rain() { return rainNow; }, get wrath() { return wrathV; }, get wind() { return AIRU.uWind.value; },
    get weather() { return wName; }, setWeather(n) { if (n === 'clear' || n === 'rain' || n === 'storm') { wName = n; wT = n === 'clear' ? 0 : n === 'rain' ? 0.55 : 1; } },
    setWrath(w) { wrathT = cl(+w || 0, 0, 1); },
    // the painting's lamps: 0 dark (at once when `now`), 1 burning
    setLamps(v, now) { lampsT = cl(+v, 0, 1); if (now) BU.uLamps.value = lampsT; },
    vortex(x, z, r, s) { VT.set(x, z, r, s); },
    emit, throwDebris,
    setDebug(on) { BU.uDebug.value = on ? 1 : 0; },
    // the painting, once it has loaded: the sheet reads it to know what it changes, and the black water mirrors it
    setPainting(img) {
      const t = new THREE.Texture(img); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; keep.push(t);
      BU.uPaint.value = t; sheet.visible = true;
    },
    dispose() {
      root.traverse((o) => {
        // an instanced mesh's own buffers (where each stone or post stands, and its colour) are freed only by its own
        // dispose() in three r128, not by its geometry's
        if (o.isInstancedMesh) o.dispose();
        if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      // the textures, and the canvases they were painted on, emptied: a canvas keeps its pixels until it is collected,
      // which on a phone can be a while after the fight (if the canvases are ever kept per place, so that a fight starts
      // sooner, those must be left out of this)
      for (const t of keep) {
        t.dispose();
        for (const c of [t.image].concat(t.mipmaps || [])) if (c && c.nodeName === 'CANVAS') { c.width = 0; c.height = 0; }
      }
    },
  };
  update(0, 0);
  return api;
}
// The arena's locked camera without building the arena: its frame (the painting's own size), the camera (the place's
// own numbers over these), the fight's clearing (where the place's floor puts it) and how many of the frame's pixels
// a metre is there (ppm: the battle screen scales its zooms by it). makeArenaField builds from it, and the game gives it
// to a cutscene that ends on its fight's opening frame (src/game/game.js, arenaFor).
makeArenaField.view = function (P) {
  const FW = 1448, FH = 1086, CA = Object.assign({ x: 0, h: 2, z: 18, pitch: 4.2, fov: 38 }, P.camera || {});
  const clear = (P.floor && P.floor.clear) || [0.8, -2.8, 8, 9.5, 7];
  return { place: P.id, frame: [FW, FH], camera: CA, clear, ppm: FH / (2 * Math.hypot(clear[0] - CA.x, 1 - CA.h, clear[1] - CA.z) * Math.tan(CA.fov / 2 * Math.PI / 180)) };
};
