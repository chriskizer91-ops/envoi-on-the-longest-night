// moonwell.js: the dead Moonwell at the top of Misthollow, on the longest night, built in 3D for a camera that comes in
// from the sky, after the paintings the finale is fought on and planned on, and the walking maps:
//  - the court where the fight happens (reference/art/backdrops/battle-dead-moonwell.png): frosted flagstones laid in
//    rings round the well, the round well on a stepped dais with moths and crescents carved round its rim and an iron
//    arch over it with a crescent, black and empty inside, giving no light at all; crescent banners on iron poles; two
//    braziers burning low at the near corners, the only warm light; stairs on every side; towers all round;
//  - its layout from above (reference/art/walk/walk-misthollow-moonwell.png): the round court with the well at its heart,
//    round towers at its corners, and the stair coming up from the south, the way Io and Sol arrive;
//  - the far view (reference/art/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png): the court open toward the
//    snowy peaks to the north, and the eclipse over them;
//  - Misthollow below (reference/art/walk/walk-misthollow.png): pale towers, arches and bridges on the cliffs, stepping
//    down to the south, every window dark, mist rolling through its streets and its chasms;
//  - the Ironspire peaks beyond, snow on them; a sky with no stars (they come back only at the ending), and the moon with
//    a black disc biting into it, Noctara's eclipse, closing over the moon as the scene goes on.
// Snow drifts down; frost is on everything. three.js r128 (global THREE).
//
// Units are meters. The ground is laid as the finale's painting lays it (src/stage/dead-moonwell.js, the battle's own
// coordinates): the battle's origin is the court's middle, north is -z, the well at (0, -5.5), the braziers at the near
// corners (9, 12.8) and (-9, 12.8), the main stair going down south from z 16.
// Defines cutscenePlace(renderer, quality, data) only, for player.js. Returns { scene, moonDir, heightAt, update(t, dt,
// camera), shadowAt(x, z), set(o), dispose(), well, braziers }. data: { eclipse: [from, to] (how far the black disc has
// crossed the moon, 0 to 1), seconds (over how long) }.
function cutscenePlace(renderer, quality, data) {
  'use strict';
  data = data || {};
  const QL = { light: .5, phone: .72, laptop: 1 }[quality] || 1;
  const TAU = Math.PI * 2, PI = Math.PI;
  let seed = 7907;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const lin = (v) => Math.pow(v, 2.2);
  const C3 = (r, g, b) => new THREE.Color(lin(r), lin(g), lin(b));
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const NP = new Uint8Array(512); { const p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; }
  const hsh = (x, y) => NP[(NP[x & 255] + y) & 511] / 255;
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hsh(xi, yi), hsh(xi + 1, yi), u), lerp(hsh(xi, yi + 1), hsh(xi + 1, yi + 1), u), v); }
  const fbm = (x, y, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < (o || 5); i++) { s += a * vnoise(x * f, y * f); a *= .5; f *= 2.03; } return s; };
  const ridged = (x, y, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < (o || 6); i++) { const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1); s += a * n * n; a *= .5; f *= 2.1; } return s; };

  const scene = new THREE.Scene();
  // the moon: high over the peaks, a little west of north, as in the paintings
  const moonDir = V3(-.273, .469, -.84).normalize();
  const WELL = { x: 0, z: -5.5 }, BRAZ = [[-9.0, 12.8], [9.0, 12.8]];
  // Misthollow's terraces, stepping down to the south from the court: [height, from z, to z]
  const T = [[-6, 30, 64], [-15, 70, 108], [-26, 114, 150], [-38, 156, 190]];

  // ---------- the air: a height fog, thick in Misthollow's low streets and chasms, brighter toward the moon ----------
  const v3 = (v) => 'vec3(' + v.x.toFixed(4) + ',' + v.y.toFixed(4) + ',' + v.z.toFixed(4) + ')', v3c = (c) => 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')';
  const FOG = { col: C3(.12, .11, .2), glow: C3(.42, .4, .58), density: .0055, haze: .00006, falloff: .045, base: -8 };
  scene.fog = new THREE.FogExp2(FOG.col.getHex(), FOG.density); scene.fog.color.copy(FOG.col);
  {
    THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying vec3 vFogOff;\n#endif';
    THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogOff = vec3(dot(viewMatrix[0].xyz, mvPosition.xyz), dot(viewMatrix[1].xyz, mvPosition.xyz), dot(viewMatrix[2].xyz, mvPosition.xyz));\n#endif';
    THREE.ShaderChunk.fog_pars_fragment = '#ifdef USE_FOG\n uniform vec3 fogColor;\n varying vec3 vFogOff;\n #ifdef FOG_EXP2\n  uniform float fogDensity;\n #else\n  uniform float fogNear;\n  uniform float fogFar;\n #endif\n#endif';
    THREE.ShaderChunk.fog_fragment = '#ifdef USE_FOG\n { vec3 fo = vFogOff; float fd = length(fo); vec3 fv = fo / max(fd, 1e-3);\n' +
      '  float k = ' + FOG.falloff.toFixed(4) + ', y0 = cameraPosition.y - (' + FOG.base.toFixed(2) + '), dy = fo.y;\n' +
      '  float hf = abs(dy * k) > 1e-3 ? (exp(-k * y0) - exp(-k * (y0 + dy))) / (k * dy) : exp(-k * y0);\n' +
      '  #ifdef FOG_EXP2\n  float dens = fogDensity;\n  #else\n  float dens = 1. / max(fogFar, 1.);\n  #endif\n' +
      '  float fa = 1. - exp(-dens * fd * max(hf, 0.));\n  fa = 1. - (1. - fa) * exp(-fd * ' + FOG.haze.toFixed(6) + ');\n' +
      '  float sa = pow(max(dot(fv, ' + v3(moonDir) + '), 0.), 8.) * .7;\n' +
      '  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, ' + v3(new THREE.Vector3(FOG.glow.r, FOG.glow.g, FOG.glow.b)) + ', sa), clamp(fa, 0., 1.)); }\n#endif';
  }

  // ---------- the sky: no stars, thin high cloud, and the moon with a black disc crossing it ----------
  const moonTex = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
    let q = g.createRadialGradient(h * .9, h * .85, 0, h, h, h); q.addColorStop(0, '#f6f4ee'); q.addColorStop(.8, '#e4e0d8'); q.addColorStop(1, '#c9c3bd'); g.fillStyle = q; g.beginPath(); g.arc(h, h, h - 1, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(h, h, h - 1, 0, TAU); g.clip();
    for (const [x, y, r, a] of [[.36, .32, .2, .5], [.55, .4, .16, .45], [.45, .55, .22, .4], [.66, .6, .12, .45], [.3, .62, .13, .35], [.6, .25, .09, .4], [.72, .45, .1, .35]]) {
      for (let i = 0; i < 14; i++) { const xx = (x + rr(-.05, .05)) * S, yy = (y + rr(-.05, .05)) * S, rad = r * S * rr(.4, .8); q = g.createRadialGradient(xx, yy, 0, xx, yy, rad); q.addColorStop(0, 'rgba(118,116,128,' + (a * .35) + ')'); q.addColorStop(1, 'rgba(118,116,128,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); }
    }
    for (let i = 0; i < 260; i++) { const x = rnd() * S, y = rnd() * S, r = Math.pow(rnd(), 3) * 18 + 1.5; g.fillStyle = 'rgba(90,88,96,.18)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,250,.22)'; g.lineWidth = Math.max(.6, r * .2); g.beginPath(); g.arc(x - r * .15, y - r * .15, r, PI * .9, PI * 1.9); g.stroke(); }
    g.restore();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  })();
  const SKYU = { uMoon: { value: moonDir.clone() }, uMoonTex: { value: moonTex }, uTime: { value: 0 }, uBite: { value: 1.2 }, uLit: { value: 1 },
    uZen: { value: C3(.05, .04, .11) }, uHor: { value: C3(.25, .21, .37) }, uLow: { value: C3(.1, .09, .16) }, uGlow: { value: C3(.8, .78, .95) } };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: SKYU,
    vertexShader: 'varying vec3 vD;\nvoid main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader: 'uniform vec3 uMoon, uZen, uHor, uLow, uGlow; uniform sampler2D uMoonTex; uniform float uTime, uBite, uLit; varying vec3 vD;\n' +
      'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }\n' +
      'float fb(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.07 + 13.1; a *= .5; } return s; }\n' +
      'void main(){ vec3 d = normalize(vD); float y = d.y; float md = dot(d, uMoon);\n' +
      ' vec3 c = mix(uHor, uZen, pow(smoothstep(-.02, .72, y), .55)); c = mix(uLow, c, smoothstep(-.16, .03, y));\n' +
      ' c += uGlow * (.35 + .65 * uLit) * (pow(max(md, 0.), 8.) * .2 + pow(max(md, 0.), 70.) * .45 + pow(max(md, 0.), 600.) * .9 * uLit);\n' +
      ' if (y > -.05) { vec2 cp = d.xz / (y + .2) * 1.5; cp.x += uTime * .005; float cv = fb(cp * vec2(.8, 2.4)); cv = smoothstep(.58, .9, cv) * smoothstep(-.02, .22, y) * (1. - smoothstep(.55, .95, y));\n' +
      '  c = mix(c, c * .7 + uGlow * (.03 + .2 * pow(max(md, 0.), 6.) * uLit), cv * .55); }\n' +
      // the moon, a disc of about 6 degrees as the paintings draw it; the black disc crossing it from the east is darker
      // than the sky, over the moon and the sky alike: it gives no light at all
      ' float ang = acos(clamp(md, -1., 1.)); float R = .055; if (ang < R * 2.6) { vec3 ax = normalize(cross(vec3(0., 1., 0.), uMoon)), ay = cross(uMoon, ax);\n' +
      '  vec2 q = vec2(dot(d, ax), dot(d, ay)) / R; vec4 mt = texture2D(uMoonTex, vec2(-q.x, q.y) * .5 + .5);\n' +
      '  float disc = 1. - smoothstep(.97, 1.02, length(q)); vec2 oc = vec2(-uBite, .1); float lo = length(q - oc), occ = 1. - smoothstep(.985, 1.015, lo);\n' +
      '  c = mix(c, mt.rgb * 6.5, disc * (1. - occ));\n' +
      '  c = mix(c, vec3(.004, .0, .012), occ * .97);\n' +
      '  c += vec3(.5, .3, .9) * .05 * exp(-pow((lo - 1.) * 22., 2.)) * (1. - occ); }\n' +
      ' gl_FragColor = vec4(c, 1.); gl_FragColor = linearToOutputTexel(gl_FragColor); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 32), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
  // the eclipse: how far the black disc has crossed the moon (0 just touching, 1 as far as tonight goes) as an offset in
  // moon radii, and how much of the moon still shows
  const ECL = { from: (data.eclipse || [.38, .66])[0], to: (data.eclipse || [.38, .66])[1], secs: data.seconds || 72, k: 0 };
  function eclipseAt(k) {
    const d = lerp(1.62, .38, cl(k, 0, 1)); SKYU.uBite.value = d;
    const A = d < 2 ? 2 * Math.acos(d / 2) - (d / 2) * Math.sqrt(4 - d * d) : 0; // the covered area, of PI
    SKYU.uLit.value = 1 - A / PI; return SKYU.uLit.value;
  }

  // ---------- lights: the moon (cold, from the north), a cold fill from the sky, the braziers' warmth ----------
  const moon = new THREE.DirectionalLight(0xffffff, 2.6); moon.color.copy(C3(.8, .84, 1)); scene.add(moon); scene.add(moon.target);
  const SH = { light: 1024, phone: 2048, laptop: 4096 }[quality] || 2048;
  moon.castShadow = true; moon.shadow.mapSize.set(SH, SH); { const sc = moon.shadow.camera; sc.left = sc.bottom = -22; sc.right = sc.top = 22; sc.near = 5; sc.far = 200; }
  moon.shadow.bias = -.0003; moon.shadow.normalBias = .03; moon.shadow.radius = 2;
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, .62); hemi.color.copy(C3(.34, .32, .55)); hemi.groundColor.copy(C3(.1, .1, .13)); scene.add(hemi);
  // a cold fill from where the camera is, so faces turned to it read in the dark (a film's fill light); no shadow
  const fill = new THREE.DirectionalLight(0xffffff, .34); fill.color.copy(C3(.62, .68, .9)); scene.add(fill); scene.add(fill.target);

  // ---------- painted textures ----------
  const texOf = (c, rx, ry, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); t.anisotropy = 8; if (srgb) t.encoding = THREE.sRGBEncoding; return t; };
  function normalFrom(hc, k) {
    const W = hc.width, H = hc.height, src = hc.getContext('2d').getImageData(0, 0, W, H).data, out = cvs(W, H), g = out.getContext('2d'), n = g.createImageData(W, H), d = n.data;
    const at = (x, y) => src[(((y + H) % H) * W + (x + W) % W) * 4] / 255;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = at(x + 1, y) - at(x - 1, y), dy = at(x, y + 1) - at(x, y - 1), nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4; d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255; }
    g.putImageData(n, 0, 0); return out;
  }
  // ashlar: pale limestone blocks in courses, 2.4 m to the tile
  const ashlar = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), hc = cvs(S, S), h = hc.getContext('2d');
    g.fillStyle = '#5c5a66'; g.fillRect(0, 0, S, S); h.fillStyle = '#000'; h.fillRect(0, 0, S, S);
    let y = 0;
    while (y < S) {
      const ch = Math.min(S - y, Math.round(rr(.36, .55) / 2.4 * S)); let x = -rnd() * 90;
      while (x < S) {
        const w = rr(.55, 1.35) / 2.4 * S, v = rr(132, 170), wv = rr(-8, 8);
        for (const ox of [-S, 0, S]) {
          const x0 = x + ox + 2, y0 = y + 2, ww = w - 4, hh = ch - 4;
          const gr = g.createLinearGradient(x0, y0, x0, y0 + hh); gr.addColorStop(0, 'rgb(' + (v + 8 + wv) + ',' + (v + 6) + ',' + (v + 14) + ')'); gr.addColorStop(1, 'rgb(' + (v - 12 + wv) + ',' + (v - 14) + ',' + (v - 4) + ')');
          g.fillStyle = gr; g.fillRect(x0, y0, ww, hh);
          h.fillStyle = '#d8d8d8'; h.fillRect(x0 + 1, y0 + 1, ww - 2, hh - 2); h.fillStyle = '#ffffff'; h.fillRect(x0 + 4, y0 + 4, ww - 8, hh - 8);
        }
        x += w;
      }
      y += ch;
    }
    for (let i = 0; i < 9000; i++) { const x = rnd() * S, y2 = rnd() * S, r = .5 + rnd() * 1.8; g.fillStyle = rnd() < .5 ? 'rgba(30,28,40,.25)' : 'rgba(220,218,230,.12)'; g.beginPath(); g.arc(x, y2, r, 0, TAU); g.fill(); }
    // weathering: dark streaks run down from the joints
    for (let i = 0; i < 70; i++) { const x = rnd() * S, y2 = rnd() * S, l = 20 + rnd() * 90; const gr = g.createLinearGradient(x, y2, x, y2 + l); gr.addColorStop(0, 'rgba(20,18,30,.22)'); gr.addColorStop(1, 'rgba(20,18,30,0)'); g.fillStyle = gr; g.fillRect(x - 2, y2, 3 + rnd() * 5, l); }
    return { map: texOf(c, 0, 0, true), normal: texOf(normalFrom(hc, 2.4)) };
  })();
  // slate: dark roof tiles in rows, 1.6 m to the tile
  const slate = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d'), hc = cvs(S, S), h = hc.getContext('2d');
    g.fillStyle = '#1c1e2a'; g.fillRect(0, 0, S, S); h.fillStyle = '#000'; h.fillRect(0, 0, S, S);
    const rows = 10, rh = S / rows;
    for (let r = 0; r < rows; r++) { const off = (r % 2) * 13; for (let x = -26 + off; x < S + 26; x += 26) { const v = rr(36, 58), b = rr(4, 14); g.fillStyle = 'rgb(' + v + ',' + (v + 2) + ',' + (v + b + 10) + ')'; g.beginPath(); g.moveTo(x + 1, r * rh); g.lineTo(x + 25, r * rh); g.lineTo(x + 25, r * rh + rh - 3); g.quadraticCurveTo(x + 13, r * rh + rh + 2, x + 1, r * rh + rh - 3); g.closePath(); g.fill(); const hg = h.createLinearGradient(0, r * rh, 0, r * rh + rh); hg.addColorStop(0, '#333'); hg.addColorStop(1, '#fff'); h.fillStyle = hg; h.fill(); } }
    return { map: texOf(c, 0, 0, true), normal: texOf(normalFrom(hc, 3)) };
  })();
  // rock: the cliffs under the town, 6 m to the tile
  const rock = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), hc = cvs(S, S), h = hc.getContext('2d'), img = g.createImageData(S, S), hi = h.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S * 8, v = y / S * 8, n = fbm(u, v, 5), st = .5 + .5 * Math.sin(v * 2.6 + n * 3), r2 = ridged(u * .9, v * 1.7, 4), i = (y * S + x) * 4;
      const val = 60 + 50 * n + 20 * st - 30 * r2; img.data[i] = val * .95; img.data[i + 1] = val * .93; img.data[i + 2] = val * 1.05; img.data[i + 3] = 255;
      const hv = 255 * (n * .6 + st * .25 + (1 - r2) * .3); hi.data[i] = hi.data[i + 1] = hi.data[i + 2] = cl(hv, 0, 255); hi.data[i + 3] = 255;
    }
    // (tileable enough: the noise repeats every 8 cells across the tile)
    g.putImageData(img, 0, 0); h.putImageData(hi, 0, 0);
    return { map: texOf(c, 0, 0, true), normal: texOf(normalFrom(hc, 3)) };
  })();
  // the well's rim: moths with their wings spread and crescents, carved in a band, between mouldings
  const carving = (() => {
    const W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
    g.fillStyle = '#7d7b88'; g.fillRect(0, 0, W, H); h.fillStyle = '#808080'; h.fillRect(0, 0, W, H);
    // mouldings, top and bottom
    for (const [y0, y1] of [[0, 30], [H - 30, H]]) { const hg = h.createLinearGradient(0, y0, 0, y1); hg.addColorStop(0, '#606060'); hg.addColorStop(.5, '#e0e0e0'); hg.addColorStop(1, '#505050'); h.fillStyle = hg; h.fillRect(0, y0, W, y1 - y0); g.fillStyle = 'rgba(200,198,210,.25)'; g.fillRect(0, y0 + 3, W, 3); }
    const N = 8, cw = W / N;
    for (let i = 0; i < N; i++) {
      const cx = i * cw + cw / 2, cy = H / 2;
      const draw = (ctx, fill, stroke) => {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1.85, 1.85);
        if (i % 2 === 0) { // a moth, wings spread: four wings and a body
          ctx.fillStyle = fill;
          for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.bezierCurveTo(s * 18, -30, s * 52, -30, s * 54, -8); ctx.bezierCurveTo(s * 50, 2, s * 22, 4, 0, 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, 2); ctx.bezierCurveTo(s * 20, 6, s * 40, 16, s * 34, 28); ctx.bezierCurveTo(s * 24, 32, s * 8, 18, 0, 8); ctx.fill();
          }
          ctx.beginPath(); ctx.ellipse(0, 4, 4, 18, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.quadraticCurveTo(-10, -26, -16, -30); ctx.moveTo(2, -12); ctx.quadraticCurveTo(10, -26, 16, -30); ctx.stroke();
        } else { // a crescent
          ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(11, -5, 23, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
      };
      draw(h, '#ffffff', '#ffffff'); draw(g, 'rgba(150,148,165,.6)', 'rgba(150,148,165,.6)');
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(30,28,40,.2)' : 'rgba(220,220,235,.1)'; g.fillRect(rnd() * W, rnd() * H, 1.5, 1.5); }
    const blur = cvs(W, H), bg = blur.getContext('2d'); bg.filter = 'blur(3px)'; bg.drawImage(hc, 0, 0);
    return { map: texOf(c, 0, 0, true), normal: texOf(normalFrom(blur, 4)) };
  })();
  // a crescent banner: deep night blue, a pale crescent, a silver border and a fringe
  const bannerTex = (() => {
    const W = 128, H = 320, c = cvs(W, H), g = c.getContext('2d');
    g.fillStyle = '#161b3d'; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a9b0c8'; g.lineWidth = 4; g.strokeRect(9, 9, W - 18, H - 46);
    g.fillStyle = '#d6dbea'; g.beginPath(); g.arc(W / 2, H * .38, 30, 0, TAU); g.fill();
    g.fillStyle = '#161b3d'; g.beginPath(); g.arc(W / 2 + 13, H * .38 - 6, 27, 0, TAU); g.fill();
    g.fillStyle = '#a9b0c8'; for (let x = 6; x < W; x += 9) { g.fillRect(x, H - 36, 3, 30 + rnd() * 5); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.05)'; g.fillRect(rnd() * W, rnd() * (H - 36), 1, 2); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  })();
  // the braziers' coals: dark lumps with the glow in the cracks between them
  const emberTex = (() => {
    const S = 128, c = cvs(S, S), g = c.getContext('2d'); g.fillStyle = '#ff9a3c'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { const x = rnd() * S, y = rnd() * S, r = 6 + rnd() * 10; const q = g.createRadialGradient(x, y, r * .4, x, y, r); q.addColorStop(0, 'rgba(10,4,2,1)'); q.addColorStop(.8, 'rgba(40,10,4,.9)'); q.addColorStop(1, 'rgba(60,14,4,0)'); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  })();
  const softDot = (() => { const c = cvs(64, 64), g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.35, 'rgba(255,255,255,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  // ---------- materials: pale stone, dark slate, rock, iron; snow on whatever faces the sky, frost on the rest ----------
  const SNOWU = { uTime: { value: 0 } };
  // snow settles on surfaces turned up to the sky, thickest on the flattest, broken by a noise; frost greys the rest
  function snowy(m, key, amount, frostK) {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, SNOWU);
      sh.vertexShader = 'varying vec3 vSW; varying vec3 vSN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vSW = (modelMatrix * vec4(transformed, 1.)).xyz; vSN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = 'varying vec3 vSW; varying vec3 vSN;\nfloat sh2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }\nfloat sn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(sh2(i), sh2(i + vec2(1, 0)), f.x), mix(sh2(i + vec2(0, 1)), sh2(i + vec2(1, 1)), f.x), f.y); }\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n float sNz = sn2(vSW.xz * 3.1 + vSW.y * .5) * .6 + sn2(vSW.xz * 11.3) * .4;\n' +
          ' float snowK = smoothstep(.55, .86, vSN.y + (sNz - .5) * .18) * ' + amount.toFixed(2) + ';\n' +
          ' #ifdef USE_COLOR\n float sTint = .5 + .5 * vColor.r;\n #else\n float sTint = 1.;\n #endif\n' +
          ' diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.36, .39, .48) * sTint, ' + frostK.toFixed(2) + ' * (.35 + .65 * sNz) * (1. - snowK));\n' +
          ' diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.6, .63, .73) * (.9 + .12 * sNz) * sTint, snowK);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .62, snowK);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(mix(normal, normalize(vNormal), snowK * .8));');
    };
    m.customProgramCacheKey = () => 'mw-' + key;
    return m;
  }
  const M = {
    stone: snowy(new THREE.MeshStandardMaterial({ map: ashlar.map, normalMap: ashlar.normal, normalScale: new THREE.Vector2(.9, .9), roughness: .88, vertexColors: true }), 'stone', 1, .12),
    roof: snowy(new THREE.MeshStandardMaterial({ map: slate.map, normalMap: slate.normal, normalScale: new THREE.Vector2(1, 1), roughness: .7, vertexColors: true }), 'roof', 1, .1),
    rock: snowy(new THREE.MeshStandardMaterial({ map: rock.map, normalMap: rock.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: .95, vertexColors: true }), 'rock', 1, .1),
    iron: snowy(new THREE.MeshStandardMaterial({ color: new THREE.Color(0x1d1e25).convertSRGBToLinear(), metalness: .65, roughness: .48, vertexColors: true }), 'iron', .8, .25),
    dark: new THREE.MeshBasicMaterial({ color: 0x000000, fog: true }),
    carved: snowy(new THREE.MeshStandardMaterial({ map: carving.map, normalMap: carving.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: .85, vertexColors: true }), 'carved', .6, .14)
  };
  for (const k of ['stone', 'roof', 'rock', 'carved']) { const m = M[k]; m.map.repeat.set(1, 1); }

  // ---------- a kit of parts, laid in world meters and merged by material ----------
  const LIST = { stone: [], roof: [], rock: [], iron: [], dark: [], carved: [] };
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V3(), _p = V3(), _Y = V3(0, 1, 0);
  // UVs in meters for a box (BoxGeometry's faces: +x, -x, +y, -y, +z, -z), divided by the texture's size
  function boxUV(g, w, h, d, ts) {
    const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / ts, uv.getY(i) * dims[f][1] / ts); }
    return g;
  }
  function cylUV(g, r, h, ts) { const uv = g.attributes.uv, n = g.attributes.normal; for (let i = 0; i < uv.count; i++) { if (Math.abs(n.getY(i)) > .9) uv.setXY(i, (uv.getX(i) - .5) * 2 * r / ts, (uv.getY(i) - .5) * 2 * r / ts); else uv.setXY(i, uv.getX(i) * TAU * r / ts, uv.getY(i) * h / ts); } return g; }
  function put(mat, g, x, y, z, ry, tint, sx, sy, sz) {
    _q.setFromAxisAngle(_Y, ry || 0); _m4.compose(_p.set(x, y, z), _q, _s.set(sx || 1, sy || 1, sz || 1)); g.applyMatrix4(_m4);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), t = tint === undefined ? 1 : tint;
    for (let i = 0; i < n; i++) { col[i * 3] = t; col[i * 3 + 1] = t; col[i * 3 + 2] = t; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    LIST[mat].push(g); return g;
  }
  const TS = { stone: 2.4, roof: 1.6, rock: 6, iron: 1, dark: 1, carved: 1 };
  const box = (mat, w, h, d, x, y, z, ry, tint) => put(mat, boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, TS[mat]), x, y + h / 2, z, ry, tint);
  const cyl = (mat, rt, rb, h, seg, x, y, z, tint, open) => put(mat, cylUV(new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!open), Math.max(rt, rb), h, TS[mat]), x, y + h / 2, z, 0, tint);
  // a gabled roof over a w by d block, ridge along its length (d), from height y, rising rh
  function gable(w, d, rh, x, y, z, ry, tint) {
    const hw = w / 2 + .25, hd = d / 2 + .25, pos = [], uv = [], L = Math.hypot(hw, rh);
    const quad = (a, b, c, d2, ua) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d2); uv.push(...ua); };
    quad([-hw, 0, -hd], [-hw, 0, hd], [0, rh, hd], [0, rh, -hd], [0, 0, 2 * hd / TS.roof, 0, 2 * hd / TS.roof, L / TS.roof, 0, 0, 2 * hd / TS.roof, L / TS.roof, 0, L / TS.roof]);
    quad([hw, 0, hd], [hw, 0, -hd], [0, rh, -hd], [0, rh, hd], [0, 0, 2 * hd / TS.roof, 0, 2 * hd / TS.roof, L / TS.roof, 0, 0, 2 * hd / TS.roof, L / TS.roof, 0, L / TS.roof]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    put('roof', g, x, y, z, ry, tint);
    // the gable ends, in stone
    const tri = [], tuv = []; for (const s of [-1, 1]) { tri.push(-w / 2, 0, s * d / 2, w / 2, 0, s * d / 2, 0, rh - .15, s * d / 2); tuv.push(0, 0, w / TS.stone, 0, w / 2 / TS.stone, rh / TS.stone); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2)); tg.computeVertexNormals();
    // (both sides of each gable end: no back faces show through)
    const tg2 = tg.clone(); { const p = tg2.attributes.position; for (let i = 0; i < p.count; i += 3) { const ax = p.getX(i + 1), ay = p.getY(i + 1), az = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, ax, ay, az); } tg2.computeVertexNormals(); }
    put('stone', tg, x, y, z, ry, tint); put('stone', tg2, x, y, z, ry, tint);
  }
  // dark windows: tall narrow arched-top openings on a wall face (along its local x, facing local +z)
  function windows(n, w, y0, h, x, y, z, ry, depth, faceW) {
    for (let i = 0; i < n; i++) {
      const lx = (n === 1 ? 0 : (i / (n - 1) - .5) * (faceW - w * 2.2)), g = new THREE.PlaneGeometry(w, h);
      put('dark', g, x + Math.cos(ry) * lx + Math.sin(ry) * depth, y + y0 + h / 2, z - Math.sin(ry) * lx + Math.cos(ry) * depth, ry);
    }
  }
  // a house: a block with a steep slate roof and dark windows
  function house(x, y, z, w, d, h, ry, tint) {
    box('stone', w, h, d, x, y, z, ry, tint);
    gable(w, d, w * rr(.55, .8), x, y + h, z, ry, tint);
    const floors = Math.max(1, Math.floor(h / 3.2));
    for (let f = 0; f < floors; f++) for (const s of [-1, 1]) {
      const nw = Math.max(1, Math.floor(d / 2.4)); // windows down its long sides
      windows(nw, .55, 1.2 + f * 3.2, 1.25, x, y, z, ry + s * PI / 2, w / 2 + .02, d);
    }
    if (rnd() < .6) windows(1, .7, 1.4, 1.5, x, y, z, ry, d / 2 + .02, w);
  }
  // a round tower: stone, slit windows, a corbelled walk and a cone of slate (or battlements)
  function tower(x, y, z, r, h, cone, tint) {
    const seg = Math.max(10, Math.round(16 * QL + 4));
    cyl('stone', r, r * 1.04, h, seg, x, y, z, tint);
    cyl('stone', r * 1.12, r * 1.02, .7, seg, x, y + h - .7, z, tint * .96);
    if (cone) { const ch = r * rr(2.2, 3.1); cyl('roof', 0, r * 1.22, ch, seg, x, y + h, z, tint); cyl('iron', .03, .06, 1.6, 6, x, y + h + ch - .2, z); }
    else for (let i = 0; i < seg; i += 2) { const a = i / seg * TAU; box('stone', r * .42, .7, .45, x + Math.cos(a) * r * 1.05, y + h, z + Math.sin(a) * r * 1.05, -a + PI / 2, tint); }
    const floors = Math.max(1, Math.floor(h / 4));
    for (let f = 0; f < floors; f++) for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + f * .7 + rnd() * .3; const g = new THREE.PlaneGeometry(.38, 1.3); put('dark', g, x + Math.sin(a) * (r + .03), y + 2.4 + f * 4, z + Math.cos(a) * (r + .03), a); }
  }
  // a square tower with a pyramid roof
  function sqTower(x, y, z, w, h, ry, tint) {
    box('stone', w, h, w, x, y, z, ry, tint);
    const g = new THREE.ConeGeometry(w * .78, w * 1.5, 4, 1, true); g.rotateY(PI / 4); cylUV(g, w * .78, w * 1.5, TS.roof); put('roof', g, x, y + h + w * .75, z, ry, tint);
    for (let k = 0; k < 4; k++) windows(1, .5, h - 3.2, 1.4, x, y, z, ry + k * PI / 2, w / 2 + .02, w);
  }
  // a wall from (x0, z0) to (x1, z1), with battlements
  function wall(x0, z0, x1, z1, y, h, th, crenel, tint) {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) - PI / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    box('stone', L, h, th, cx, y, cz, ry, tint);
    if (crenel) for (let s = .6; s < L - .3; s += 1.5) { const lx = s - L / 2; box('stone', .8, .6, th + .06, cx + Math.cos(ry) * lx, y + h, cz - Math.sin(ry) * lx, ry, tint); }
  }
  // an arcade: a long span of stone on arches (a bridge, or an aqueduct along the cliffs), along local x, facing z
  function arcade(x0, z0, x1, z1, yTop, depth, n, archH, thick, tint) {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) - PI / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const H = depth, sp = L / n, shape = new THREE.Shape();
    shape.moveTo(-L / 2, 0); shape.lineTo(L / 2, 0); shape.lineTo(L / 2, -H); shape.lineTo(-L / 2, -H); shape.lineTo(-L / 2, 0);
    for (let i = 0; i < n; i++) {
      const ax = -L / 2 + sp * (i + .5), aw = sp * .62, top = -H * .22;
      const hole = new THREE.Path(); hole.moveTo(ax - aw / 2, -H); hole.lineTo(ax - aw / 2, top - aw / 2); hole.absarc(ax, top - aw / 2, aw / 2, PI, 0, true); hole.lineTo(ax + aw / 2, -H); hole.lineTo(ax - aw / 2, -H);
      shape.holes.push(hole);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: Math.max(4, Math.round(8 * QL)) });
    g.translate(0, 0, -thick / 2);
    { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TS.stone, uv.getY(i) / TS.stone); }
    put('stone', g, cx, yTop, cz, ry, tint);
    // a parapet along its top
    box('stone', L, .9, .35, cx + Math.sin(ry) * (thick / 2 - .17), yTop, cz + Math.cos(ry) * (thick / 2 - .17), ry, tint);
    box('stone', L, .9, .35, cx - Math.sin(ry) * (thick / 2 - .17), yTop, cz - Math.cos(ry) * (thick / 2 - .17), ry, tint);
  }
  // a flight of stairs, climbing toward local -z from (x, y, z): n steps of rise and run, w wide
  function stairs(x, y, z, w, n, rise, run, ry, tint) {
    for (let i = 0; i < n; i++) { const lz = -(i + .5) * run; box('stone', w, rise * (i + 1), run, x + Math.sin(ry) * lz, y, z + Math.cos(ry) * lz, ry, tint); }
  }
  // an outcrop: a mass of rock with cliff faces, its flat top at yTop, falling to yBot (lost in the mist)
  function outcrop(x, z, rx, rz, yTop, yBot, seed0, wallTop) {
    const seg = Math.max(18, Math.round(34 * QL)), rows = 8, pos = [], uv = [], idx = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, y = lerp(yTop, yBot, v), widen = 1 + .35 * Math.pow(v, 1.5);
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * TAU, n = fbm(Math.cos(a) * 2 + seed0, Math.sin(a) * 2 + v * 3, 4), k = (.82 + .4 * n) * widen * (j === 0 ? .98 : 1);
        pos.push(x + Math.cos(a) * rx * k, y + (j === 0 ? 0 : (n - .5) * 3), z + Math.sin(a) * rz * k);
        uv.push(i / seg * TAU * (rx + rz) / 2 / TS.rock, -y / TS.rock);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    put('rock', g, 0, 0, 0, 0, 1);
    // its top, in paving-grey stone, a fan over the same edge as its cliffs
    const tp = [x, yTop + .02, z], tuv = [x / TS.stone, z / TS.stone], tix = [];
    for (let i = 0; i <= seg; i++) { tp.push(pos[i * 3], yTop + .02, pos[i * 3 + 2]); tuv.push(pos[i * 3] / TS.stone, pos[i * 3 + 2] / TS.stone); }
    for (let i = 1; i <= seg; i++) tix.push(0, i + 1, i);
    const top = new THREE.BufferGeometry(); top.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); top.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2)); top.setIndex(tix); top.computeVertexNormals();
    put('stone', top, 0, 0, 0, 0, .62);
    // a wall with battlements round its edge (not across the town's street, nor where the court's own walls stand)
    if (wallTop) for (let i = 0; i < seg; i++) {
      const ax = pos[i * 3], az = pos[i * 3 + 2], bx = pos[(i + 1) * 3], bz = pos[(i + 1) * 3 + 2], mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (Math.abs(mx) < 6 && Math.abs(mz - z) > rz * .5) continue;
      const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az) - PI / 2, ix = (x - mx) / Math.hypot(x - mx, z - mz) * .5, iz = (z - mz) / Math.hypot(x - mx, z - mz) * .5;
      box('stone', L + .3, 1.1, .5, mx + ix, yTop, mz + iz, ry, .78);
      for (let k = .4; k < L - .2; k += 1.3) { const f = k / L; box('stone', .55, .45, .56, ax + (bx - ax) * f + ix, yTop + 1.1, az + (bz - az) * f + iz, ry, .78); }
    }
  }

  // ---------- the court ----------
  const COURT = { r: 16.5, x0: -18, x1: 18, z0: -23, z1: 16 };
  // the flagstones: laid in rings round the well out to the round court's edge, in courses beyond it, frosted, and
  // drawn in the shader so they stay crisp in a close-up
  const paveU = { uWell: { value: new THREE.Vector2(WELL.x, WELL.z) }, uR: { value: COURT.r } };
  const paveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .82, metalness: 0 });
  paveMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, paveU);
    sh.vertexShader = 'varying vec3 vPW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vPW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'uniform vec2 uWell; uniform float uR; varying vec3 vPW;\n' +
      'float ph(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat pn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(ph(i), ph(i + vec2(1, 0)), f.x), mix(ph(i + vec2(0, 1)), ph(i + vec2(1, 1)), f.x), f.y); }\n' +
      sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' +
          ' vec2 pq = vPW.xz - uWell; float pr = length(pq); float sid; float jd;\n' +
          ' if (pr < uR) { float rw = 1.15; float ring = floor(pr / rw); float fr = fract(pr / rw); float nseg = max(6., floor(6.2831 * (ring + .5) * rw / 1.1));\n' +
          '  float sa = (atan(pq.y, pq.x) / 6.2831 + .5) * nseg + ph(vec2(ring, 3.)) * 4.; float fa = fract(sa);\n' +
          '  jd = min(min(fr, 1. - fr) * rw, min(fa, 1. - fa) * 6.2831 * max(pr, .5) / nseg); sid = ph(vec2(ring, floor(sa)));\n' +
          '  if (pr < 4.4) { jd = 1.; sid = .5; } }\n' +
          ' else { vec2 g = vPW.xz / vec2(1.25, .9); float row = floor(g.y); g.x += ph(vec2(row, 7.)) * 3.; vec2 f = fract(g);\n' +
          '  jd = min(min(f.x, 1. - f.x) * 1.25, min(f.y, 1. - f.y) * .9); sid = ph(floor(g)); }\n' +
          ' float edge = smoothstep(.0, .05, abs(pr - uR) - .03);\n' +
          ' float joint = (1. - smoothstep(.012, .038, jd)) * edge + (1. - edge);\n' +
          ' float n1 = pn(vPW.xz * 2.3), n2 = pn(vPW.xz * 9.1), pa = pn(vPW.xz * .55) * .65 + pn(vPW.xz * 1.9) * .35;\n' +
          ' vec3 st = vec3(.105, .1, .128) * (.8 + .36 * sid) * (.86 + .28 * n1);\n' +
          // frost: white in the joints, in soft patches, and drifted toward the court's edges, as the painting has it
          ' float drift = smoothstep(10., 17.5, pr);\n' +
          ' float frost = clamp(joint * .7 + smoothstep(.6, .84, pa + drift * .16) * .42 + drift * .18, 0., 1.);\n' +
          ' diffuseColor.rgb = mix(st * (1. - .4 * joint), vec3(.4, .43, .53) * (.9 + .16 * n2), frost * .78);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(.86, .5, frost);');
  };
  paveMat.customProgramCacheKey = () => 'mw-pave';
  {
    const g = new THREE.PlaneGeometry(COURT.x1 - COURT.x0, COURT.z1 - COURT.z0, 1, 1); g.rotateX(-PI / 2); g.translate((COURT.x0 + COURT.x1) / 2, 0, (COURT.z0 + COURT.z1) / 2);
    const m = new THREE.Mesh(g, paveMat); m.receiveShadow = true; m.name = 'court'; scene.add(m);
  }
  // the well: a stepped dais, the carved rim, black inside, and an iron arch over it with a crescent
  const DAIS = [4.3, 3.65, 3.0], STEP = .2, RIM = { ro: 2.15, ri: 1.72, h: .9 };
  DAIS.forEach((r, i) => cyl('stone', r, r + .04, STEP * (i + 1), Math.round(48 * QL + 16), WELL.x, 0, WELL.z, .92 - i * .03));
  const yRim = STEP * DAIS.length;
  {
    // the carved band round the rim's outside
    const g = new THREE.CylinderGeometry(RIM.ro, RIM.ro * 1.02, RIM.h, Math.round(64 * QL + 24), 1, true); { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i)); }
    put('carved', g, WELL.x, yRim + RIM.h / 2, WELL.z, 0, 1);
    // its top, a ring of stone
    const top = new THREE.RingGeometry(RIM.ri, RIM.ro + .08, Math.round(64 * QL + 24), 1); top.rotateX(-PI / 2); { const uv = top.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4.6 / TS.stone, uv.getY(i) * 4.6 / TS.stone); }
    put('stone', top, WELL.x, yRim + RIM.h + .005, WELL.z, 0, .95);
    // the inside: stone for a hand's depth, then nothing: black, giving no light at all
    const inner = new THREE.CylinderGeometry(RIM.ri, RIM.ri, .5, Math.round(48 * QL + 16), 1, true); inner.scale(-1, 1, 1); cylUV(inner, RIM.ri, .5, TS.stone);
    put('stone', inner, WELL.x, yRim + RIM.h - .25, WELL.z, 0, .5);
    const pit = new THREE.CylinderGeometry(RIM.ri, RIM.ri, 6, 32, 1, true); pit.scale(-1, 1, 1); put('dark', pit, WELL.x, yRim + RIM.h - .5 - 3, WELL.z, 0);
    const floor = new THREE.CircleGeometry(RIM.ri, 32); floor.rotateX(-PI / 2); put('dark', floor, WELL.x, yRim + RIM.h - .52, WELL.z, 0);
    // the iron arch: two posts from the rim, a half circle over it, scrolls, chains and a crescent at the top
    const AR = RIM.ro - .12, postH = 3.9;
    for (const s of [-1, 1]) { cyl('iron', .07, .09, postH, 8, WELL.x + s * AR, yRim + RIM.h, WELL.z, 1); cyl('iron', .14, .14, .25, 8, WELL.x + s * AR, yRim + RIM.h, WELL.z, 1); }
    const arc = new THREE.TorusGeometry(AR, .085, 8, Math.round(36 * QL + 12), PI); put('iron', arc, WELL.x, yRim + RIM.h + postH, WELL.z, 0, 1);
    const arc2 = new THREE.TorusGeometry(AR * .78, .04, 6, Math.round(28 * QL + 10), PI); put('iron', arc2, WELL.x, yRim + RIM.h + postH, WELL.z, 0, 1);
    for (let k = 1; k < 6; k++) { const a = k / 6 * PI, x1 = Math.cos(a), y1 = Math.sin(a); const sp = new THREE.CylinderGeometry(.025, .025, AR * .22, 5); sp.rotateZ(PI / 2 - a); put('iron', sp, WELL.x + x1 * AR * .89, yRim + RIM.h + postH + y1 * AR * .89, WELL.z, 0, 1); }
    // the crescent at its top
    const cs = new THREE.Shape(), CR = .55, CI = [.25, .4766];
    for (let i = 0; i <= 24; i++) { const a = lerp(PI / 3, PI * 5 / 3, i / 24); const px = Math.cos(a) * CR, py = Math.sin(a) * CR; if (i) cs.lineTo(px, py); else cs.moveTo(px, py); }
    for (let i = 0; i <= 24; i++) { const a = lerp(4.766, 1.517, i / 24); cs.lineTo(CI[0] + Math.cos(a) * CI[1], Math.sin(a) * CI[1]); }
    const cg = new THREE.ExtrudeGeometry(cs, { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1, curveSegments: 18 }); cg.translate(0, 0, -.03); cg.rotateZ(.5);
    put('iron', cg, WELL.x, yRim + RIM.h + postH + AR + .62, WELL.z, 0, 1);
    // chains hanging from the arch, as the painting has them
    for (const s of [-1, 1]) for (let l = 0; l < 7; l++) { const ln = new THREE.TorusGeometry(.06, .016, 4, 8); if (l % 2) ln.rotateY(PI / 2); put('iron', ln, WELL.x + s * AR * .55, yRim + RIM.h + postH + AR * .82 - l * .12, WELL.z, 0, 1); }
  }
  // the court's edges: a balustrade along the north, open to the peaks; walls, towers and houses round the rest
  {
    // the north rim: a low parapet on an arc behind the round court, broken by a stair down at its middle
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const a = lerp(-1.02, 1.02, i / N), x = WELL.x + Math.sin(a) * 17.2, z = WELL.z - Math.cos(a) * 17.2;
      if (Math.abs(a) < .09) continue;
      box('stone', .5, 1.15, .5, x, 0, z, -a, .95); // a post
      if (i < N && Math.abs(lerp(-1.02, 1.02, (i + .5) / N)) > .09) { const a2 = lerp(-1.02, 1.02, (i + .5) / N); box('stone', 2.4, .22, .62, WELL.x + Math.sin(a2) * 17.2, 1.0, WELL.z - Math.cos(a2) * 17.2, -a2, 1); box('stone', 2.4, .5, .3, WELL.x + Math.sin(a2) * 17.2, 0, WELL.z - Math.cos(a2) * 17.2, -a2, .9); }
    }
    // the four great round towers at the court's corners (the walking map's), with crescent banners hung on them later
    for (const [x, z, r, h] of [[-15.5, -17, 3.4, 19], [15.5, -17, 3.4, 21], [-16.5, 13.5, 3.1, 15], [16.5, 13.5, 3.1, 16]]) tower(x, 0, z, r, h, true, rr(.9, 1.02));
    // between them, the walls and the houses of the court's sides, with stairs up through them
    for (const s of [-1, 1]) {
      wall(s * 18.6, -14, s * 18.6, -6.5, 0, 6.5, 1.2, true, .95);
      wall(s * 18.6, -1.5, s * 18.6, 10.5, 0, 6.5, 1.2, true, .95);
      // the stair up through the side, between the walls, to a terrace and its gate tower
      stairs(s * 17.5, 0, -1.2, 4.2, 16, .25, .38, s > 0 ? -PI / 2 : PI / 2, .92);
      house(s * 24.5, 4, -4.2, 7, 9, 7, 0, rr(.85, 1));
      sqTower(s * 23.5, 4, 5.5, 5, 14, 0, rr(.88, 1));
      house(s * 25, 0, 14, 6, 8, 9, PI / 2, rr(.85, 1));
      house(s * 24.5, 0, -14, 6, 7, 10, 0, rr(.85, 1));
      box('stone', 10, 4, 22, s * 24, 0, 1, 0, .8); // the terrace under them
    }
    // the near corners: low walls, and stairs going down beside the braziers
    for (const s of [-1, 1]) { wall(s * 18.6, 10.5, s * 13.6, 16.4, 0, 1.2, .7, false, .92); stairs(s * 12.8, -6, 26.6, 3.4, 22, .27, .45, s > 0 ? .333 : -.333, .9); }
    // the south front: a balustrade either side of the main stair, which goes down to the town
    for (const s of [-1, 1]) for (let x = 5.2; x < 13; x += 1.6) { box('stone', .38, 1.0, .38, s * x, 0, 16.1, 0, .95); box('stone', 1.6, .18, .5, s * (x + .8), .9, 16.1, 0, 1); }
    stairs(0, -6.0, 26.5, 9.6, 26, .23, .4, 0, .93); // (26 steps from the town's first terrace up to the court)
    for (const s of [-1, 1]) box('stone', .6, 1.4, 10.4, s * 5.1, -6.0, 21.3, 0, .9); // its side walls
  }
  // crescent banners on iron poles: two flanking the well, two by the braziers
  const banners = [];
  {
    const bm = new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: .85, metalness: 0 });
    const BU = { uTime: SNOWU.uTime };
    bm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, BU);
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n { float hang = 1. - uv.y; float ph = modelMatrix[3].x * .7 + modelMatrix[3].z * .3; transformed.z += hang * hang * (.18 * sin(uTime * 1.3 + ph + hang * 2.) + .07 * sin(uTime * 3.1 + ph * 2. + hang * 5.)); transformed.x += hang * hang * .04 * sin(uTime * 2.2 + ph); }');
    };
    bm.customProgramCacheKey = () => 'mw-banner';
    for (const [x, z, ry] of [[-4.9, -3.6, .25], [4.9, -3.6, -.25], [-12.2, 11.4, .55], [12.2, 11.4, -.55]]) {
      cyl('iron', .05, .065, 5.2, 8, x, 0, z, 1); cyl('iron', .13, .16, .3, 8, x, 0, z, 1);
      const bar = new THREE.CylinderGeometry(.03, .03, 1.25, 6); bar.rotateZ(PI / 2); put('iron', bar, x, 4.95, z, ry, 1);
      const sp = new THREE.SphereGeometry(.08, 8, 6); put('iron', sp, x, 5.25, z, 0, 1);
      const g = new THREE.PlaneGeometry(1.08, 2.7, 4, 12); g.translate(0, -1.35, 0);
      const mesh = new THREE.Mesh(g, bm); mesh.position.set(x, 4.92, z + .04); mesh.rotation.y = ry; mesh.receiveShadow = true; scene.add(mesh); banners.push(mesh);
    }
    // and one hung on each of the north towers' faces, toward the court
    for (const [x, z] of [[-15.5, -13.5], [15.5, -13.5]]) { const g = new THREE.PlaneGeometry(1.5, 4.2, 4, 12); g.translate(0, -2.1, 0); const mesh = new THREE.Mesh(g, bm); mesh.position.set(x, 13.5, z + .05); scene.add(mesh); banners.push(mesh); }
  }
  // the braziers: iron bowls on three legs, the coals burning low, a little flame, sparks; the only warm light
  const braziers = BRAZ.map(([x, z]) => {
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .4, g = new THREE.CylinderGeometry(.035, .05, 1.75, 6); g.translate(0, .875, 0); g.rotateX(.16); g.rotateY(a); put('iron', g, x + Math.sin(a) * .28, 0, z + Math.cos(a) * .28, 0, 1); }
    cyl('iron', .08, .08, .9, 6, x, .85, z, 1);
    const bowl = new THREE.SphereGeometry(.62, 16, 8, 0, TAU, PI / 2, PI / 2); bowl.scale(1, .55, 1); put('iron', bowl, x, 1.75, z, 0, 1);
    const rim = new THREE.TorusGeometry(.62, .05, 6, 20); rim.rotateX(PI / 2); put('iron', rim, x, 1.75, z, 0, 1);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, sp = new THREE.ConeGeometry(.05, .26, 4); put('iron', sp, x + Math.cos(a) * .64, 1.85, z + Math.sin(a) * .64, 0, 1); }
    // the coals: a glowing heap
    const coal = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 6, 0, TAU, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0x140806, emissive: new THREE.Color(1, .22, .04), emissiveMap: emberTex, emissiveIntensity: 1, roughness: .9 }));
    coal.scale.set(1, .26, 1); coal.position.set(x, 1.62, z); scene.add(coal);
    // low flames: soft sprites licking up, and the warm light
    const fl = []; for (let k = 0; k < 5; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: new THREE.Color(1, .45, .12), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); s.position.set(x, 1.95, z); scene.add(s); fl.push({ s, ph: rnd() * TAU, ox: rr(-.22, .22), oz: rr(-.22, .22) }); }
    const light = new THREE.PointLight(0xffffff, 5, 13, 2); light.color.copy(C3(1, .58, .26)); light.position.set(x, 2.5, z); scene.add(light);
    return { x, z, coal, fl, light, sparks: [] };
  });

  // ---------- Misthollow below: outcrops, terraces, houses and towers, bridges between, stepping down to the south ----------
  {
    // the court's own outcrop, and its retaining walls
    outcrop(0, -3, 26, 24, -.05, -95, 1.3);
    for (let a = 0; a < TAU; a += TAU / 24) { const x = Math.cos(a) * 25.5, z = -3 + Math.sin(a) * 23.5; if (z > 14 && Math.abs(x) < 7) continue; box('stone', 7, 6, 1.4, x, -6, z, -a + PI / 2, .85); }
    // the town's spine: the terraces down to the south, a street of houses each side, and the stairs between them
    T.forEach(([y, z0, z1], ti) => {
      outcrop(0, (z0 + z1) / 2, 17 + ti * 2, (z1 - z0) / 2 + 4, y, -110, 3.1 + ti, true);
      for (let z = z0 + 3; z < z1 - 3; z += rr(6.5, 9)) for (const s of [-1, 1]) {
        if (rnd() < .12 * QL + .05) continue;
        const w = rr(5, 7.5), d = rr(5.5, 8), h = rr(6, 12);
        house(s * rr(7.2, 9), y, z, w, d, h, s > 0 ? PI / 2 : -PI / 2, rr(.82, 1.02));
        if (rnd() < .45) house(s * rr(13.5, 16), y, z + rr(-1, 1), rr(5, 7), rr(5, 7), rr(8, 15), s > 0 ? PI / 2 : -PI / 2, rr(.8, 1));
      }
      for (const s of [-1, 1]) if (rnd() < .8) tower(s * rr(14, 18), y, lerp(z0, z1, rr(.2, .8)), rr(2.2, 3.2), rr(14, 24), rnd() < .75, rr(.88, 1.02));
      if (ti < T.length - 1) stairs(0, T[ti + 1][0], T[ti + 1][1] - 1, 7, Math.round((y - T[ti + 1][0]) / .25), .25, .42, 0, .9);
    });
    // side outcrops either side of the court and the spine, towers on cliffs, joined to them by arched bridges
    const SIDE = [[-62, -18, 13, -4], [62, -10, 12, 2], [-58, 46, 14, -12], [60, 58, 12, -9], [-50, 104, 11, -22], [52, 120, 12, -24], [-86, 10, 11, -14], [88, 40, 10, -10]];
    for (const [x, z, r, y] of SIDE) {
      outcrop(x, z, r, r * rr(.9, 1.2), y, -115, x * .1, true);
      const nT = Math.round(rr(1, 2.4) * QL + .4);
      for (let k = 0; k < nT; k++) tower(x + rr(-r * .45, r * .45), y, z + rr(-r * .45, r * .45), rr(2.2, 3.4), rr(16, 28), rnd() < .7, rr(.88, 1.02));
      for (let k = 0; k < Math.round(6 * QL + 2); k++) house(x + rr(-r * .6, r * .6), y, z + rr(-r * .6, r * .6), rr(4.5, 7), rr(5, 7.5), rr(6, 11), rr(0, PI), rr(.8, 1));
    }
    // the bridges and arcades
    arcade(-26, -14, -50, -16, -2, 26, 5, 18, 4, .92);
    arcade(26, -8, 51, -6, 0, 28, 5, 18, 4, .92);
    arcade(-18, 48, -45, 48, -11, 30, 4, 18, 3.6, .9);
    arcade(19, 60, 49, 58, -8, 30, 5, 18, 3.6, .9);
    arcade(-19, 108, -40, 106, -21, 30, 3, 18, 3.4, .9);
    arcade(19, 122, 41, 120, -23, 30, 3, 18, 3.4, .9);
    arcade(-73, -2, -78, 8, -13, 22, 2, 14, 3.2, .9);
  }

  // ---------- the Ironspire peaks: a great snowy massif to the north behind the court, a farther range behind it, and
  //            foothills all round going down into the sea of mist under the town ----------
  {
    // snow on the slopes that can hold it, above a snowline that wanders, streaked down the fall line into gullies; dark
    // rock on the crags; the moonlit snow glows a little, as the painting's does
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'varying vec3 vKW; varying vec3 vKN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vKW = (modelMatrix * vec4(transformed, 1.)).xyz; vKN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = 'varying vec3 vKW; varying vec3 vKN;\nfloat kh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat kn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(kh(i), kh(i + vec2(1, 0)), f.x), mix(kh(i + vec2(0, 1)), kh(i + vec2(1, 1)), f.x), f.y); }\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' +
          ' vec3 kN = normalize(vKN); vec2 xz = vKW.xz;\n' +
          // gullies: a noise drawn out up and down the slopes, seen on the faces turned east-west and north-south, its
          // fine part fading with distance so the far ranges stay calm
          ' float kw = abs(kN.z) / (abs(kN.x) + abs(kN.z) + 1e-4), kd = 1. - smoothstep(2200., 6500., length(vKW - cameraPosition));\n' +
          ' float gul = mix(kn(vec2(vKW.x / 30., vKW.y / 120.)), kn(vec2(vKW.z / 30. + 17., vKW.y / 120.)), kw) * .62\n' +
          '   + mix(.5, mix(kn(vec2(vKW.x / 9., vKW.y / 38.)), kn(vec2(vKW.z / 9. + 5., vKW.y / 38.)), kw), kd) * .38;\n' +
          ' float line = 120. + 260. * kn(xz / 900.);\n' +
          ' float hold = smoothstep(.4, .74, kN.y + (gul - .5) * .55);\n' +
          ' float snow = smoothstep(line - 90., line + 150., vKW.y) * hold;\n' +
          ' snow = max(snow, smoothstep(.8, .95, kN.y + (gul - .5) * .2) * smoothstep(line - 320., line - 60., vKW.y));\n' +
          ' vec3 rockC = vec3(.06, .058, .075) * (.75 + .5 * gul), snowC = vec3(.7, .73, .85) * (.86 + .16 * gul);\n' +
          ' diffuseColor.rgb = mix(rockC, snowC, snow);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * smoothstep(.3, .7, diffuseColor.r) * .12;')
        // (their feet are lost in the mist, which glows toward the moon as the sea of mist does)
        .replace('#include <dithering_fragment>', ' { vec3 kv = normalize(vKW - cameraPosition); float ks = pow(max(dot(kv, ' + v3(moonDir) + '), 0.), 5.);\n' +
          '  vec3 kc = mix(' + v3c(C3(.2, .19, .3)) + ', ' + v3c(C3(.58, .57, .76)) + ', clamp(ks * .9 + .18, 0., 1.)); gl_FragColor.rgb = mix(gl_FragColor.rgb, kc, (1. - smoothstep(-70., 170., vKW.y)) * .92); }\n#include <dithering_fragment>');
    };
    mat.customProgramCacheKey = () => 'mw-peaks';
    // the shape: the mass of each range is its envelope, a smooth swell along it with summits that vary; ridges that
    // meander (a warped ridged noise, crests sharpened) carve it
    const shapeAt = (x, z, fq, sk) => {
      const u = x * fq, v = z * fq, wu = u + 1.6 * (fbm(u * .45 + sk, v * .45, 3) - .5), wv = v + 1.6 * (fbm(u * .45, v * .45 + sk * 2.3, 3) - .5);
      return Math.min(1.2, Math.pow(ridged(wu, wv, 4), 1.4) * 1.5);
    };
    //    [from R, to R, height, rows, azimuths, arc (radians either side of north; PI: all round), feature size, seed, base,
    //     how much the north is weighted, the great peak]
    const RINGS = [
      [520, 1500, 210, 26, 380, PI, 1 / 380, 5, -175, 0, 0],
      [1700, 3900, 700, 40, 640, 1.75, 1 / 900, 1, -170, 1, .45],
      [4300, 8600, 1500, 30, 520, 2.1, 1 / 1500, 3, -160, 1, 0]
    ];
    for (const [R0, R1, H, rows, nA0, arc, fq, sk, base, nw, gp] of RINGS) {
      const nAz = Math.round(nA0 * (.45 + .55 * QL)), pos = [], idx = [];
      for (let i = 0; i <= rows; i++) for (let j = 0; j <= nAz; j++) {
        const a = PI - arc + 2 * arc * j / nAz, v = i / rows, R = lerp(R0, R1, Math.pow(v, 1.15)), x = Math.sin(a) * R, z = Math.cos(a) * R;
        const north = Math.pow(.5 + .5 * Math.cos(a - PI), 1.3), edge = arc < PI ? sm(0, .25, 1 - Math.abs(a - PI) / arc) : 1;
        // the great peak, a little east of north behind the court, where the paintings put it
        const great = gp * Math.exp(-Math.pow((a - PI - .1) / .15, 2)) * Math.exp(-Math.pow((v - .4) / .3, 2));
        const envA = lerp(.8, .3 + .9 * north, nw) + great, envR = Math.sin(PI * Math.pow(v, .85)), mass = .6 + .8 * fbm(x / 1400 + sk, z / 1400, 3);
        const y = base + H * envR * envA * mass * (.5 + .5 * shapeAt(x, z, fq, sk)) * edge;
        pos.push(x, y, z);
      }
      for (let i = 0; i < rows; i++) for (let j = 0; j < nAz; j++) { const q = i * (nAz + 1) + j, r = q + nAz + 1; idx.push(q, r, q + 1, q + 1, r, r + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'mw-peaks'; scene.add(m);
    }
  }
  // ---------- the sea of mist under Misthollow: moonlit cloud tops lapping at the cliffs and the foothills ----------
  const mistSea = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    // a tiling noise: the same value noise, its lattice wrapped at the tile's edge
    const P = 16, hw = (x, y) => NP[(NP[((x % P) + P) % P] + ((y % P) + P) % P) & 511] / 255;
    const tn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hw(xi, yi), hw(xi + 1, yi), u), lerp(hw(xi, yi + 1), hw(xi + 1, yi + 1), u), v); };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S * P, v = y / S * P; let n = 0, a = .5, f = 1; for (let o = 0; o < 4; o++) { n += a * tn(u * f, v * f); a *= .5; f *= 2; } const i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = cl(n / .94 * 255, 0, 255); img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const tN = new THREE.CanvasTexture(c); tN.wrapS = tN.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tN: { value: tN }, uTime: { value: 0 }, uMoon: { value: moonDir.clone() }, uC: { value: C3(.2, .19, .3) }, uGlow: { value: C3(.58, .57, .76) }, uFog: { value: FOG.col.clone() } },
      vertexShader: 'varying vec3 vW;\nvoid main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform sampler2D tN; uniform float uTime; uniform vec3 uMoon, uC, uGlow, uFog; varying vec3 vW;\n' +
        'void main(){ vec2 p = vW.xz; float n = texture2D(tN, p / 420. + vec2(uTime * .0015, 0.)).r * .55 + texture2D(tN, p / 140. - vec2(0., uTime * .0024)).r * .3 + texture2D(tN, p / 47. + uTime * .003).r * .15;\n' +
        ' vec3 v = normalize(vW - cameraPosition); float d = length(vW - cameraPosition); float sc = pow(max(dot(v, uMoon), 0.), 5.);\n' +
        ' float far = smoothstep(250., 1400., d), a = mix(smoothstep(.32, .72, n), .95, far) * (1. - smoothstep(2600., 3400., length(p))) * smoothstep(4., 40., d);\n' +
        ' vec3 c = mix(uC, uGlow, clamp(sc * .9 + (n - .4) * .55 * (1. - far) + far * .18, 0., 1.));\n' +
        ' gl_FragColor = vec4(c, a * .92); gl_FragColor = linearToOutputTexel(gl_FragColor); }',
      transparent: true, depthWrite: false
    });
    const geo = new THREE.CircleGeometry(3400, 48); geo.rotateX(-PI / 2);
    const sea = new THREE.Mesh(geo, mat); sea.position.y = -46; sea.frustumCulled = false; sea.renderOrder = 3; sea.name = 'mw-mistsea'; scene.add(sea);
    return { mat };
  })();

  // ---------- merge the kit by material ----------
  const meshes = {};
  for (const k in LIST) {
    const list = LIST[k]; if (!list.length) continue;
    let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const out = new THREE.BufferGeometry();
    for (const [name, size] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]]) {
      const a = new Float32Array(nv * size); let o = 0;
      for (const g of list) { const src = g.attributes[name]; if (src) a.set(src.array, o); o += g.attributes.position.count * size; }
      out.setAttribute(name, new THREE.BufferAttribute(a, size));
    }
    const I = new Uint32Array(ni); let io = 0, vo = 0;
    for (const g of list) { const c = g.attributes.position.count; if (g.index) { for (let i = 0; i < g.index.count; i++) I[io++] = g.index.array[i] + vo; } else for (let i = 0; i < c; i++) I[io++] = vo + i; vo += c; g.dispose(); }
    out.setIndex(new THREE.BufferAttribute(I, 1));
    const mesh = new THREE.Mesh(out, M[k]); mesh.castShadow = k !== 'dark' && k !== 'rock'; mesh.receiveShadow = k !== 'dark'; mesh.name = 'mw-' + k; scene.add(mesh); meshes[k] = mesh;
    list.length = 0;
  }

  // ---------- mist in the streets and the chasms, and snow drifting down ----------
  const air = (() => {
    const NM = Math.round(480 * QL), mpos = new Float32Array(NM * 3), msz = new Float32Array(NM), mph = new Float32Array(NM), mA = new Float32Array(NM);
    for (let i = 0; i < NM; i++) {
      let x, z, y; const street = i % 2 === 0;
      // along the town's street and its stairs, low over each terrace; or out in the chasms between the cliffs
      if (street) { z = rr(28, 190); x = rr(-12, 12); let ty = T[0][0]; for (const [t2, z0] of T) if (z >= z0 - 2) ty = t2; y = ty + rr(.6, 3.6); }
      else { const a = rnd() * TAU, r = rr(30, 220); x = Math.sin(a) * r; z = Math.cos(a) * r * .8 + 40; y = rr(-70, -14); }
      mpos[i * 3] = x; mpos[i * 3 + 1] = y; mpos[i * 3 + 2] = z; msz[i] = street ? rr(6, 12) : rr(24, 60); mph[i] = rnd() * TAU; mA[i] = street ? 2.2 : 1;
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mpos, 3)); mg.setAttribute('aSize', new THREE.BufferAttribute(msz, 1)); mg.setAttribute('aPh', new THREE.BufferAttribute(mph, 1)); mg.setAttribute('aA', new THREE.BufferAttribute(mA, 1));
    const mm = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: softDot }, uScale: { value: 400 }, uTime: { value: 0 }, uC: { value: C3(.3, .29, .42) }, uGlow: { value: C3(.68, .67, .85) }, uMoon: { value: moonDir.clone() }, uA: { value: .16 } },
      vertexShader: 'attribute float aSize, aPh, aA; uniform float uScale, uTime; varying float vA; varying vec3 vW;\nvoid main(){ vec3 p = position; p.x += sin(uTime * .04 + aPh) * 6. + uTime * .25; p.z += cos(uTime * .03 + aPh) * 4.; vW = p;\n' +
        ' vec4 mv = modelViewMatrix * vec4(p, 1.); float d = -mv.z; vA = aA * smoothstep(3., 22., d) * (.55 + .45 * sin(uTime * .09 + aPh)); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale * projectionMatrix[1][1] / max(d, .1); }',
      fragmentShader: 'uniform sampler2D tMap; uniform vec3 uC, uGlow, uMoon; uniform float uA; varying float vA; varying vec3 vW;\nvoid main(){ vec4 t = texture2D(tMap, gl_PointCoord); vec3 v = normalize(vW - cameraPosition); float g = pow(max(dot(v, uMoon), 0.), 5.); gl_FragColor = vec4(mix(uC, uGlow, g), t.a * t.a * vA * uA); }',
      transparent: true, depthWrite: false
    });
    const mist = new THREE.Points(mg, mm); mist.frustumCulled = false; mist.renderOrder = 4; scene.add(mist);
    // snowflakes: a box of them that follows the camera, falling slowly and drifting on the wind
    const NS = Math.round(1800 * QL), spos = new Float32Array(NS * 3), sph = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { spos[i * 3] = rr(-16, 16); spos[i * 3 + 1] = rr(-8, 8); spos[i * 3 + 2] = rr(-16, 16); sph[i] = rnd() * TAU; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(spos, 3)); sg.setAttribute('aPh', new THREE.BufferAttribute(sph, 1));
    const smt = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 }, uTime: { value: 0 }, uCam: { value: V3() }, uMoon: { value: moonDir.clone() }, uWind: { value: new THREE.Vector2(.5, .2) } },
      vertexShader: 'attribute float aPh; uniform float uScale, uTime; uniform vec3 uCam, uMoon; uniform vec2 uWind; varying float vA;\nvoid main(){ vec3 p = position; p.xz += uWind * uTime; p.y -= uTime * (.55 + .25 * fract(aPh * 3.7)); p += vec3(sin(uTime * .9 + aPh), 0., cos(uTime * .7 + aPh * 1.3)) * .3;\n' +
        ' vec3 rel = mod(p - uCam + vec3(16., 8., 16.), vec3(32., 16., 32.)) - vec3(16., 8., 16.); vec3 w = uCam + rel; vec4 mv = viewMatrix * vec4(w, 1.); float d = -mv.z;\n' +
        ' vec3 v = normalize(w - cameraPosition); float g = pow(max(dot(v, uMoon), 0.), 6.); vA = (.5 + 1.6 * g) * smoothstep(.3, 1.6, d) * (1. - smoothstep(11., 16., d));\n' +
        ' gl_Position = projectionMatrix * mv; gl_PointSize = .035 * uScale * projectionMatrix[1][1] / max(d, .1) + 1.; }',
      fragmentShader: 'varying float vA;\nvoid main(){ vec2 c = gl_PointCoord - .5; float a = smoothstep(.5, .15, length(c)); gl_FragColor = vec4(vec3(.82, .85, .95), a * vA * .8); }',
      transparent: true, depthWrite: false
    });
    const snow = new THREE.Points(sg, smt); snow.frustumCulled = false; snow.renderOrder = 9; scene.add(snow);
    return { mist, mm, snow, smt };
  })();

  // ---------- the reflections' light: the sky baked into an environment for the iron and the frost ----------
  let env = null;
  {
    const s2 = new THREE.Scene(); s2.add(new THREE.Mesh(sky.geometry, skyMat));
    const g = new THREE.Mesh(new THREE.CircleGeometry(8000, 32), new THREE.MeshBasicMaterial({ color: C3(.04, .04, .05) })); g.rotation.x = -PI / 2; g.position.y = -2; s2.add(g);
    const pm = new THREE.PMREMGenerator(renderer); env = pm.fromScene(s2, 0, 1, 20000).texture; pm.dispose(); scene.environment = env;
    g.geometry.dispose(); g.material.dispose();
  }

  // ---------- where the ground is: the court, the main stair down to the town's first terrace, the terraces ----------
  function heightAt(x, z) {
    if (z <= 16) return 0;
    if (Math.abs(x) < 4.8 && z < 26.4) return -(z - 16) * (6 / 10.4);
    if (z < 26.4) return 0;
    let y = T[0][0]; for (const [ty, z0] of T) if (z >= z0 - 2) y = ty;
    return y;
  }

  // ---------- each frame ----------
  const _v2 = new THREE.Vector2(), _f = V3(), shadowC = V3(0, 0, 4);
  let lastT = 0;
  // (t: the clock that moves the snow, the mist and the flames; ft: the film's own time, which closes the eclipse)
  function update(t, dt, cam, ft) {
    SNOWU.uTime.value = t; SKYU.uTime.value = t; air.mm.uniforms.uTime.value = t; air.smt.uniforms.uTime.value = t; mistSea.mat.uniforms.uTime.value = t;
    renderer.getDrawingBufferSize(_v2); air.mm.uniforms.uScale.value = _v2.y * .5; air.smt.uniforms.uScale.value = _v2.y * .5; air.smt.uniforms.uCam.value.copy(cam.position);
    sky.position.copy(cam.position);
    // the eclipse, closing over the moon as the scene goes on; the moonlight thins with it
    const lit = eclipseAt(lerp(ECL.from, ECL.to, cl((ft === undefined ? t : ft) / ECL.secs, 0, 1)));
    moon.intensity = 2.7 * (.5 + .5 * lit);
    moon.target.position.copy(shadowC); moon.position.copy(moonDir).multiplyScalar(100).add(shadowC);
    // the fill light comes from where the camera is
    cam.getWorldDirection(_f); fill.position.copy(cam.position).addScaledVector(_f, -2).y += 1.5; fill.target.position.copy(cam.position).addScaledVector(_f, 10);
    // the braziers burn low: the coals breathe, small flames lick up, the light flickers
    for (const B of braziers) {
      const fk = .82 + .12 * Math.sin(t * 7.1 + B.x) + .07 * Math.sin(t * 13.7 + B.z) + .05 * Math.sin(t * 23.3);
      B.light.intensity = 5.2 * fk; B.coal.material.emissiveIntensity = .75 + .35 * fk;
      for (const F of B.fl) { const k = (t * 1.6 + F.ph) % 1; F.s.position.set(B.x + F.ox * (1 - k), 1.85 + k * .55, B.z + F.oz * (1 - k)); const sz = (.42 + .25 * Math.sin(t * 9 + F.ph)) * (1 - k * .7); F.s.scale.set(sz * .75, sz, 1); F.s.material.opacity = (1 - k) * .55 * fk; }
    }
    lastT = t;
  }

  return {
    scene, moonDir, heightAt, well: { x: WELL.x, z: WELL.z, y: yRim + RIM.h }, braziers: BRAZ,
    update,
    shadowAt(x, z) { shadowC.set(x, 0, z); },
    set(o) { if (o.eclipse !== undefined) eclipseAt(o.eclipse); },
    dispose() { if (env) env.dispose(); }
  };
}
