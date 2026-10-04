// colossus-first-meeting.js: the cutscene "The Colossus, first met", for the game: window.CUTSCENES['colossus-first-meeting'] = { title, seconds, play(container, opts), prepare(container, opts) }.
// Built by tools/build.mjs from copies/ and src/ (edit those, not this). Needs three.js r128 (global THREE). See README.md.
(function () {

/* ---------- copies/cinema.js ---------- */
// cinema.js: the field study's camera, as a film camera sees: the scene rendered in high dynamic range with 4x
// multisampling, then depth of field with round bokeh (focus, aperture), bloom from everything bright, shafts of
// moonlight through the mist, and a film grade (an ACES curve, lift and gain, a cool-shadow / warm-light split, a
// vignette, a touch of lens fringing, and grain). three.js r128 (global THREE). Defines makeCinema(renderer, opts) only.
// Returns { render(scene, camera, dt), setSize(w, h), set({ focus, aperture, exposure, ... }), params, sun(dir) }.
// opts: { scale (the 3D's resolution against the canvas, default 1), msaa (default 4), quality: 'high' | 'max' }.
function makeCinema(renderer, opts) {
  'use strict';
  opts = opts || {};
  const gl2 = renderer.capabilities.isWebGL2;
  const HF = THREE.HalfFloatType, LIN = THREE.LinearFilter;
  const P = {
    focus: 12, aperture: 1, maxBlur: 14, exposure: 1.25, bloom: .45, bloomRadius: 1, rays: .3, grain: .035, vignette: .32,
    fringe: .0016, lift: new THREE.Vector3(-.012, -.012, -.004), gain: new THREE.Vector3(1.03, 1.02, 1), saturation: .95, split: .1,
    bars: 0, fade: 1, flash: 0, flashC: new THREE.Color(1, 1, 1), dof: true, scale: opts.scale || 1
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false; qs.add(quad);
  const VS = 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const mat = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
  const rt = (w, h, o) => new THREE.WebGLRenderTarget(w, h, Object.assign({ type: HF, minFilter: LIN, magFilter: LIN, depthBuffer: false, stencilBuffer: false }, o));
  function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qs, qc); }

  // ---------- targets ----------
  let W = 2, H = 2, main = null, half = [], blm = [], rays = [];
  const depthTex = () => { const d = new THREE.DepthTexture(2, 2, THREE.UnsignedIntType); d.format = THREE.DepthFormat; return d; };
  function build(w, h) {
    for (const t of [main, ...half, ...blm, ...rays]) if (t) { if (t.depthTexture) t.depthTexture.dispose(); t.dispose(); }
    W = Math.max(2, Math.round(w)); H = Math.max(2, Math.round(h));
    if (gl2 && (opts.msaa === undefined || opts.msaa > 0)) { main = new THREE.WebGLMultisampleRenderTarget(W, H, { type: HF, minFilter: LIN, magFilter: LIN, stencilBuffer: false }); main.samples = opts.msaa || 4; }
    else main = new THREE.WebGLRenderTarget(W, H, { type: HF, minFilter: LIN, magFilter: LIN, stencilBuffer: false });
    main.depthTexture = depthTex(); main.depthTexture.image.width = W; main.depthTexture.image.height = H;
    const hw = Math.max(2, W >> 1), hh = Math.max(2, H >> 1);
    half = [rt(hw, hh), rt(hw, hh), rt(W, H)];        // CoC prefiltered, bokeh, composited full size
    blm = []; let bw = hw, bh = hh; for (let i = 0; i < 6; i++) { blm.push(rt(bw, bh)); bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); }
    blm.up = blm.map((t) => rt(t.width, t.height));
    rays = [rt(Math.max(2, W >> 2), Math.max(2, H >> 2)), rt(Math.max(2, W >> 2), Math.max(2, H >> 2))];
  }

  // ---------- shaders ----------
  const DEPTH = 'uniform sampler2D tDepth; uniform float uNear, uFar;\nfloat linZ(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }\n';
  // the circle of confusion, signed (negative in front of focus), in half-resolution pixels; the colour premultiplied
  const cocM = mat('uniform sampler2D tColor; uniform float uFocus, uAp, uMax; uniform vec2 uTx;\n' + DEPTH +
    'varying vec2 vUv;\nfloat coc(vec2 uv){ float z = linZ(uv); return clamp(uAp * (z - uFocus) / max(z, .001) * 12., -uMax, uMax); }\n' +
    'void main(){ vec3 c = vec3(0.); float cc = 0.; vec2 o = uTx * .5;\n' +
    ' vec2 s[4]; s[0] = vec2(-o.x, -o.y); s[1] = vec2(o.x, -o.y); s[2] = vec2(-o.x, o.y); s[3] = vec2(o.x, o.y);\n' +
    ' float mn = 1e4, mx = -1e4; for (int i = 0; i < 4; i++) { vec3 t = texture2D(tColor, vUv + s[i]).rgb; float k = coc(vUv + s[i]); c += t / (1. + max(max(t.r, t.g), t.b) * .1); mn = min(mn, k); mx = max(mx, k); cc += k; }\n' +
    ' cc *= .25; float k = abs(mn) > abs(mx) ? mn : cc; gl_FragColor = vec4(c * .25, k); }',
    { tColor: { value: null }, tDepth: { value: null }, uNear: { value: .1 }, uFar: { value: 1000 }, uFocus: { value: 10 }, uAp: { value: 1 }, uMax: { value: 14 }, uTx: { value: new THREE.Vector2() } });
  // the bokeh: a golden-angle spiral of samples, each counted where its own blur reaches this pixel (Dennis Gustafsson's
  // single-pass method), so blur from in front spills over sharp things behind and never the other way
  const bokM = mat('uniform sampler2D tCoc; uniform vec2 uTx; uniform float uMax;\nvarying vec2 vUv;\n' +
    'void main(){ vec4 cen = texture2D(tCoc, vUv); float cs = abs(cen.a); vec3 col = cen.rgb; float tot = 1.; float r = 1.1; float a = 0.;\n' +
    ' for (int i = 0; i < 110; i++) { if (r > uMax) break; vec2 tc = vUv + vec2(cos(a), sin(a)) * uTx * r; vec4 s = texture2D(tCoc, tc); float ss = abs(s.a);\n' +
    '  if (s.a > cen.a) ss = clamp(ss, 0., cs * 2.); float m = smoothstep(r - .5, r + .5, ss); col += mix(col / tot, s.rgb, m); tot += 1.; r += 1.1 / r; a += 2.39996323; }\n' +
    ' col /= tot; col = col / max(1. - max(max(col.r, col.g), col.b) * .1, .1); gl_FragColor = vec4(col, cen.a); }',
    { tCoc: { value: null }, uTx: { value: new THREE.Vector2() }, uMax: { value: 14 } });
  // composite: sharp where in focus, the bokeh where blurred
  const dofM = mat('uniform sampler2D tColor, tBok; uniform float uOn; uniform vec2 uTxH;\nvarying vec2 vUv;\n' +
    'void main(){ vec3 c = texture2D(tColor, vUv).rgb; vec4 b = texture2D(tBok, vUv); float k = smoothstep(.6, 1.8, abs(b.a)) * uOn; gl_FragColor = vec4(mix(c, b.rgb, k), 1.); }',
    { tColor: { value: null }, tBok: { value: null }, uOn: { value: 1 }, uTxH: { value: new THREE.Vector2() } });
  // bloom: a soft threshold, then down (13 taps) and up (a tent) through a chain of halving targets
  const preM = mat('uniform sampler2D tSrc; uniform float uThr, uKnee; uniform vec2 uTx;\nvarying vec2 vUv;\n' +
    'void main(){ vec3 c = texture2D(tSrc, vUv).rgb * .5 + (texture2D(tSrc, vUv + uTx * vec2(1., 1.)).rgb + texture2D(tSrc, vUv - uTx).rgb + texture2D(tSrc, vUv + uTx * vec2(1., -1.)).rgb + texture2D(tSrc, vUv + uTx * vec2(-1., 1.)).rgb) * .125;\n' +
    ' float br = max(max(c.r, c.g), c.b); float rq = clamp(br - uThr + uKnee, 0., 2. * uKnee); rq = rq * rq / (4. * uKnee + 1e-4); float w = max(rq, br - uThr) / max(br, 1e-4);\n' +
    ' gl_FragColor = vec4(min(c * w, vec3(60.)), 1.); }',
    { tSrc: { value: null }, uThr: { value: .9 }, uKnee: { value: .6 }, uTx: { value: new THREE.Vector2() } });
  const downM = mat('uniform sampler2D tSrc; uniform vec2 uTx;\nvarying vec2 vUv;\n#define S(x,y) texture2D(tSrc, vUv + uTx * vec2(x,y)).rgb\n' +
    'void main(){ vec3 a = S(-2.,-2.), b = S(0.,-2.), c = S(2.,-2.), d = S(-1.,-1.), e = S(1.,-1.), f = S(-2.,0.), g = S(0.,0.), h = S(2.,0.), i = S(-1.,1.), j = S(1.,1.), k = S(-2.,2.), l = S(0.,2.), m = S(2.,2.);\n' +
    ' vec3 o = (d + e + i + j) * .125 + (a + b + g + f) * .03125 + (b + c + h + g) * .03125 + (f + g + l + k) * .03125 + (g + h + m + l) * .03125; gl_FragColor = vec4(o, 1.); }',
    { tSrc: { value: null }, uTx: { value: new THREE.Vector2() } });
  const upM = mat('uniform sampler2D tSrc, tLow; uniform vec2 uTx; uniform float uR;\nvarying vec2 vUv;\n#define S(x,y) texture2D(tLow, vUv + uTx * uR * vec2(x,y)).rgb\n' +
    'void main(){ vec3 t = (S(-1.,-1.) + S(1.,-1.) + S(-1.,1.) + S(1.,1.)) + (S(0.,-1.) + S(-1.,0.) + S(1.,0.) + S(0.,1.)) * 2. + S(0.,0.) * 4.; gl_FragColor = vec4(texture2D(tSrc, vUv).rgb + t / 16., 1.); }',
    { tSrc: { value: null }, tLow: { value: null }, uTx: { value: new THREE.Vector2() }, uR: { value: 1 } });
  // moonlight shafts: what of the sky shows near the moon, smeared out from it in a long radial blur
  const rayMaskM = mat('uniform sampler2D tColor; uniform vec2 uSun; uniform float uAsp;\n' + DEPTH + 'varying vec2 vUv;\n' +
    'void main(){ float d = texture2D(tDepth, vUv).x; float sky = step(.9999995, d); vec3 c = texture2D(tColor, vUv).rgb; vec2 q = (vUv - uSun) * vec2(uAsp, 1.);\n' +
    ' float near = exp(-dot(q, q) * 9.); gl_FragColor = vec4(min(c, vec3(4.)) * sky * near, 1.); }',
    { tColor: { value: null }, tDepth: { value: null }, uNear: { value: .1 }, uFar: { value: 1000 }, uSun: { value: new THREE.Vector2(.5, .5) }, uAsp: { value: 1 } });
  const rayM = mat('uniform sampler2D tSrc; uniform vec2 uSun; uniform float uLen;\nvarying vec2 vUv;\n' +
    'void main(){ vec2 d = (uSun - vUv) * uLen / 40.; vec2 p = vUv; vec3 s = vec3(0.); float w = 1.; for (int i = 0; i < 40; i++) { s += texture2D(tSrc, p).rgb * w; w *= .955; p += d; } gl_FragColor = vec4(s / 14., 1.); }',
    { tSrc: { value: null }, uSun: { value: new THREE.Vector2(.5, .5) }, uLen: { value: .8 } });
  // the grade, to the screen
  const finM = mat('uniform sampler2D tSrc, tBloom, tRays; uniform float uExp, uBloom, uRays, uGrain, uVig, uFringe, uSat, uSplit, uTime, uBars, uFade, uFlash; uniform vec3 uLift, uGain, uFlashC; uniform vec2 uRes;\nvarying vec2 vUv;\n' +
    'vec3 aces(vec3 x){ const mat3 A = mat3(.59719,.07600,.02840,.35458,.90834,.13383,.04823,.01566,.83777); const mat3 B = mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);\n' +
    ' x = A * x; vec3 a = x * (x + .0245786) - .000090537; vec3 b = x * (.983729 * x + .4329510) + .238081; return clamp(B * (a / b), 0., 1.); }\n' +
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'void main(){ vec2 c = vUv - .5; float r2 = dot(c, c); vec2 f = c * uFringe * (1. + r2 * 4.);\n' +
    ' vec3 col = vec3(texture2D(tSrc, vUv + f).r, texture2D(tSrc, vUv).g, texture2D(tSrc, vUv - f).b);\n' +
    ' col += texture2D(tBloom, vUv).rgb * uBloom * .055 + texture2D(tRays, vUv).rgb * uRays;\n' +
    ' col = mix(col, uFlashC * 3., uFlash);\n' +
    ' col *= uExp; col = aces(col);\n' +
    ' float l = dot(col, vec3(.2126, .7152, .0722)); col = mix(vec3(l), col, uSat);\n' +
    ' col = col + (vec3(-.03, -.006, .04) * (1. - smoothstep(0., .45, l)) + vec3(.03, .012, -.03) * smoothstep(.35, 1., l)) * uSplit * 3.;\n' +
    ' col = uLift + col * (uGain - uLift);\n' +
    ' col *= mix(1., smoothstep(1.15, .25, sqrt(r2) * 1.4), uVig);\n' +
    ' col = pow(max(col, 0.), vec3(1. / 2.2));\n' +
    ' float g = hash(vUv * uRes + fract(uTime * 7.3) * 91.) - .5; col += g * uGrain * (1.2 - l);\n' +
    ' col += (hash(vUv * uRes + 3.1) - .5) / 255.;\n' +
    ' col *= uFade; if (abs(vUv.y - .5) > .5 - uBars) col = vec3(0.);\n' +
    ' gl_FragColor = vec4(col, 1.); }',
    { tSrc: { value: null }, tBloom: { value: null }, tRays: { value: null }, uExp: { value: 1 }, uBloom: { value: 1 }, uRays: { value: .5 }, uGrain: { value: .03 }, uVig: { value: .3 }, uFringe: { value: .002 },
      uSat: { value: 1 }, uSplit: { value: .1 }, uTime: { value: 0 }, uBars: { value: 0 }, uFade: { value: 1 }, uFlash: { value: 0 }, uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uFlashC: { value: new THREE.Color() }, uRes: { value: new THREE.Vector2() } });

  // ---------- frame ----------
  const sunDir = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), size = new THREE.Vector2();
  let time = 0;
  function render(scene, camera, dt) {
    time += dt || 0;
    renderer.getDrawingBufferSize(size);
    const tw = Math.round(size.x * P.scale), th = Math.round(size.y * P.scale);
    if (!main || tw !== W || th !== H) build(tw, th);
    const tm = renderer.toneMapping, enc = renderer.outputEncoding; renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(main); renderer.clear(); renderer.render(scene, camera);
    const near = camera.near, far = camera.far;
    // depth of field
    let src = main.texture;
    if (P.dof && P.aperture > .01) {
      const u = cocM.uniforms; u.tColor.value = main.texture; u.tDepth.value = main.depthTexture; u.uNear.value = near; u.uFar.value = far; u.uFocus.value = P.focus; u.uAp.value = P.aperture; u.uMax.value = P.maxBlur; u.uTx.value.set(1 / W, 1 / H);
      pass(cocM, half[0]);
      bokM.uniforms.tCoc.value = half[0].texture; bokM.uniforms.uTx.value.set(1 / half[0].width, 1 / half[0].height); bokM.uniforms.uMax.value = P.maxBlur; pass(bokM, half[1]);
      dofM.uniforms.tColor.value = main.texture; dofM.uniforms.tBok.value = half[1].texture; dofM.uniforms.uOn.value = 1; pass(dofM, half[2]);
      src = half[2].texture;
    }
    // bloom
    preM.uniforms.tSrc.value = src; preM.uniforms.uTx.value.set(1 / W, 1 / H); pass(preM, blm[0]);
    for (let i = 1; i < blm.length; i++) { downM.uniforms.tSrc.value = blm[i - 1].texture; downM.uniforms.uTx.value.set(1 / blm[i - 1].width, 1 / blm[i - 1].height); pass(downM, blm[i]); }
    let low = blm[blm.length - 1];
    for (let i = blm.length - 2; i >= 0; i--) { const u = upM.uniforms; u.tSrc.value = blm[i].texture; u.tLow.value = low.texture; u.uTx.value.set(1 / low.width, 1 / low.height); u.uR.value = P.bloomRadius; pass(upM, blm.up[i]); low = blm.up[i]; }
    // moonlight shafts, when the moon is in front
    let raysOn = 0;
    _v.copy(sunDir).multiplyScalar(far * .5).add(camera.position).project(camera);
    const behind = new THREE.Vector3().copy(sunDir).dot(camera.getWorldDirection(new THREE.Vector3())) < .05;
    if (P.rays > 0 && !behind) {
      const sx = _v.x * .5 + .5, sy = _v.y * .5 + .5; raysOn = P.rays * (1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(_v.x), Math.abs(_v.y)), .9, 1.8));
      if (raysOn > .01) {
        const m = rayMaskM.uniforms; m.tColor.value = main.texture; m.tDepth.value = main.depthTexture; m.uNear.value = near; m.uFar.value = far; m.uSun.value.set(sx, sy); m.uAsp.value = W / H; pass(rayMaskM, rays[0]);
        rayM.uniforms.tSrc.value = rays[0].texture; rayM.uniforms.uSun.value.set(sx, sy); pass(rayM, rays[1]);
      }
    }
    const u = finM.uniforms;
    u.tSrc.value = src; u.tBloom.value = low.texture; u.tRays.value = rays[1].texture; u.uRays.value = raysOn;
    u.uExp.value = P.exposure; u.uBloom.value = P.bloom; u.uGrain.value = P.grain; u.uVig.value = P.vignette; u.uFringe.value = P.fringe; u.uSat.value = P.saturation; u.uSplit.value = P.split;
    u.uTime.value = time; u.uBars.value = P.bars; u.uFade.value = P.fade; u.uFlash.value = P.flash; u.uFlashC.value.copy(P.flashC); u.uLift.value.copy(P.lift); u.uGain.value.copy(P.gain); u.uRes.value.set(size.x, size.y);
    pass(finM, null);
    renderer.toneMapping = tm; renderer.outputEncoding = enc;
  }
  return {
    render, params: P,
    set(o) {
      for (const k in o) {
        if (!(k in P)) continue;
        const v = o[k], cur = P[k];
        if (cur && cur.isVector3 && Array.isArray(v)) cur.fromArray(v); else if (cur && cur.isColor && Array.isArray(v)) cur.setRGB(v[0], v[1], v[2]);
        else if (cur && cur.copy && v && v.copy) cur.copy(v); else P[k] = v;
      }
    },
    sun(dir) { sunDir.copy(dir).normalize(); },
    get size() { return { w: W, h: H }; },
    dispose() { for (const t of [main, ...half, ...blm, ...(blm.up || []), ...rays]) if (t) t.dispose(); }
  };
}

/* ---------- copies/frostmere.js ---------- */
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

/* ---------- copies/colossus.js ---------- */
// colossus.js: the Bramble Colossus, field-study version (the reference model). three.js r128 (global THREE).
// Defines makeBrambleColossus(opts) only, with the same interface, moves, hit times and anchors as the game's model
// (3d-model-new-character-ideas/bramble-colossus/colossus.js), so it can stand in for it unchanged.
//
// What it is: a blackberry thicket that hunts, grown as big as a house over a century or more. A mound of twisted roots,
// a spire of three old canes braided round each other, and on top a thorned bud taller than a person that opens into a
// five-petalled flower round its heart, a glowing blackberry the size of a barrel. Four great canes grow from the spire:
// the two in front are its arms, the two behind arch back like a mane. Six more arch out over the soil as its legs. It has
// no face: the bud turns toward its prey, gapes and feeds, and each heartbeat runs down the spire into its roots.
//
// This version keeps that body, its rig and every move, and rebuilds how it looks at the level of detail a laptop can
// draw, thinking about what it is in the world: it lives where Noctara's cold comes down off the frozen pass, and its
// heart is warm. So its breath steams in the night air, frost furs the tips of its outermost canes and leaves but never
// the ones near its heart, and its roots run on far under the meadow (state.xray shows them, with the heartbeat running
// out along them). Everything is built from what a real blackberry is made of: five-angled canes with a waxy bloom and
// hooked prickles flattened at the base, compound leaves of three and five toothed leaflets that are paler and felted
// underneath and glow when the moon is behind them, fruit at every stage from hard green to glossy black with the dry
// styles still on each drupelet, old grey dead canes tangled through the mound, and a flower with crinkled petals and a
// crowd of stamens.
//
// opts: { detail .25 to 1 (1, the default, is the laptop reference; .5 is about a third of its triangles; .25 is near the
//         game's budget), level 1 to 20 (bigger, darker, longer thorns, veins that glow at rest), size (an extra overall
//         scale; 1 = about 7.5 m tall and 11 m across at rest, its arms reaching 9 m), shadows (true: it casts and takes
//         shadows, with depth materials that match its cuts and fades), linear (default true: colours are painted for a
//         linear, tone-mapped renderer; false for the game's plain one) }
function makeBrambleColossus(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, the mound on the ground at the origin. Its right side is -X; the lead arm (the one
 // that lances) is the front great cane on its right.
 opts = opts || {};
 const DET = Math.max(.25, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 90217;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 let seed2 = 4471;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 let seed3 = 31337; // a third stream for the fine detail (prickles, drupelets, hairs), so its counts never shift the rest
 const rnd3 = () => (seed3 = (seed3 * 16807) % 2147483647) / 2147483647;
 const r3 = (a, b) => a + (b - a) * rnd3();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const YAX = V3(0, 1, 0);
 // colour: everything is painted and listed in sRGB as an artist would pick it; LIN turns vertex colours linear for a
 // tone-mapped renderer, and marks painted colour maps as sRGB so the renderer decodes them
 const LIN = opts.linear !== false;
 const lin1 = (v) => (LIN ? Math.pow(cl(v, 0, 8), 2.2) : v);
 const lc = (c) => [lin1(c[0]), lin1(c[1]), lin1(c[2])];
 const C3 = (r, g, b) => new THREE.Color(lin1(r), lin1(g), lin1(b));
 const tex = (c, rx, ry, data) => {
  const t = new THREE.CanvasTexture(c);
  if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); }
  t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding;
  return t;
 };
 const dataTex = (c, rx, ry) => tex(c, rx, ry, true);

 // ---------- its size and the level look ----------
 const LEVEL = cl(opts.level === undefined ? 1 : Math.round(+opts.level) || 1, 1, 20), TIER = (LEVEL - 1) / 19;
 const SZ = (1 + .1 * TIER) * (opts.size > 0 ? +opts.size : 1);
 const CR = 2.1, CH = 1.4, MOSS = .4;                  // the root mound: radius, height, moss
 const NS = 10;                                        // a cane's segments: NS + 1 bones
 const SPN = 6, SPH = CH * .55, SPL = 4.3, SPS = SPL / SPN, BY = SPH + SPL + .1; // the spire: segments, where it starts, its length; BY the bud's base
 const DARK = 1 - .16 * TIER, THS = 1 + .3 * TIER, VEIN = .3 + .5 * sm(.3, 1, TIER);
 const REACH = 8.2;                                    // where its prey stands, from its middle
 const WARM = 4.5, COLD = 9.5;                         // frost: none within WARM of its middle, full past COLD (body meters)

 const root = new THREE.Group(); root.name = 'BrambleColossus';
 const base = new THREE.Group(); root.add(base);       // everything of the body, scaled by SZ
 const fx = new THREE.Group(); fx.name = root.name + 'FX';
 // ---------- painted textures ----------
 // Each surface is painted twice in step: its colour, and a height field (white stands up, black sinks) that becomes its
 // normal map, so ridges, fissures and veins catch the moonlight where they really are.
 const TS = DET > .6 ? 1 : .5;                         // texture size: halved below detail .6
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hgt = (v, a) => css(v * 255, v * 255, v * 255, a === undefined ? 1 : a);
 function pair(W, H, col, h0) {
  const c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H); h.fillStyle = hgt(h0 === undefined ? .5 : h0); h.fillRect(0, 0, W, H);
  return { c, g, hc, h, W, H };
 }
 // draw f(ctx, ox, oy) once per neighbouring tile, so marks that cross an edge come back on the other side
 const tiled = (W, H, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) f(ox, oy); };
 // a tiling normal map from a height canvas (k: how deep)
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = s[i * 4] / 255;
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const at = (x, y) => h[((y + H) % H) * W + (x + W) % W];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
   const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
   const nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 const blur = (cv, px) => { const c = cvs(cv.width, cv.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; tiled(cv.width, cv.height, (ox, oy) => g.drawImage(cv, ox, oy)); g.filter = 'none'; return c; };

 // young cane bark: wine-plum, streaked along its length, with the bluish waxy bloom blackberry canes wear (rubbed thin on
 // the ridges), pale lenticels across it and a few healed splits. u runs round the cane (its five ridges are geometry),
 // v along it
 const BARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(60 * DARK, 23 * DARK, 31 * DARK)), g = P.g, h = P.h, k = TS;
  const streak = (x, w, col, a, hv, ha) => tiled(W, H, (ox) => {
   const gr = g.createLinearGradient(x + ox - w, 0, x + ox + w, 0); gr.addColorStop(0, css(...col, 0)); gr.addColorStop(.5, css(...col, a)); gr.addColorStop(1, css(...col, 0)); g.fillStyle = gr; g.fillRect(x + ox - w, 0, w * 2, H);
   if (ha) { const hr = h.createLinearGradient(x + ox - w, 0, x + ox + w, 0); hr.addColorStop(0, hgt(hv, 0)); hr.addColorStop(.5, hgt(hv, ha)); hr.addColorStop(1, hgt(hv, 0)); h.fillStyle = hr; h.fillRect(x + ox - w, 0, w * 2, H); }
  });
  const tones = [[86, 34, 40], [34, 12, 18], [70, 58, 40], [104, 48, 44], [50, 18, 32], [62, 30, 50]];
  for (let i = 0; i < 70; i++) streak(rnd() * W, (1 + rnd() * 7) * k, tones[i % 6].map((v) => v * DARK), .12 + rnd() * .22, rnd() < .5 ? .6 : .4, .2);
  // mottling, so no streak runs too evenly
  for (let i = 0; i < 500 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 30) * k, c = rnd() < .5 ? 'rgba(20,6,12,.12)' : 'rgba(110,60,60,.07)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.ellipse(x + ox, y + oy, r * .5, r * 1.6, 0, 0, TAU); g.fill(); }); }
  // the waxy bloom: long soft bluish-grey bands
  for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H, w = (10 + rnd() * 40) * k, l = (80 + rnd() * 380) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); q.addColorStop(0, css(126, 116, 140, .12)); q.addColorStop(1, css(126, 116, 140, 0)); g.save(); g.translate(x + ox, y + oy); g.scale(1, l / w); g.translate(-x - ox, -y - oy); g.fillStyle = q; g.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); g.restore(); }); }
  // fine fibres
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
   const x = rnd() * W, y = rnd() * H, l = (20 + rnd() * 120) * k, dk = rnd() < .55, w = (.5 + rnd() * 1.1) * k;
   tiled(W, H, (ox, oy) => {
    g.strokeStyle = dk ? 'rgba(24,8,14,.22)' : 'rgba(150,96,96,.08)'; g.lineWidth = w; g.beginPath(); g.moveTo(x + ox, y + oy); g.bezierCurveTo(x + ox + (rnd() - .5) * 3, y + oy + l * .3, x + ox + (rnd() - .5) * 3, y + oy + l * .7, x + ox, y + oy + l); g.stroke();
    h.strokeStyle = dk ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.12)'; h.lineWidth = w * 1.4; h.beginPath(); h.moveTo(x + ox, y + oy); h.lineTo(x + ox, y + oy + l); h.stroke();
   });
  }
  // lenticels: short pale dashes across the cane, raised, each with a dark lip below
  for (let i = 0; i < 420 * TS; i++) {
   const x = rnd() * W, y = rnd() * H, w = (3 + rnd() * 7) * k, t = (1 + rnd() * 1.2) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(176,140,120,.45)'; g.beginPath(); g.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,6,10,.3)'; g.fillRect(x + ox - w * .8, y + oy + t, w * 1.6, t * .8); h.fillStyle = hgt(.9, .8); h.beginPath(); h.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); h.fill(); });
  }
  // healed splits: short dark lens-shaped cracks with paler lips
  for (let i = 0; i < 26; i++) {
   const x = rnd() * W, y = rnd() * H, l = (30 + rnd() * 70) * k, w = (2 + rnd() * 3) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(150,110,96,.35)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(16,6,8,.85)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); g.fill(); h.fillStyle = hgt(.7, .6); h.beginPath(); h.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); h.fill(); h.fillStyle = hgt(.05, 1); h.beginPath(); h.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); h.fill(); });
  }
  // nodes: faint rings where a leaf once grew
  for (const ny of [.1, .43, .77]) { const y = ny * H, gr = g.createLinearGradient(0, y - 14 * k, 0, y + 14 * k); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(28,8,16,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 14 * k, W, 28 * k); h.fillStyle = hgt(.62, .5); h.fillRect(0, y - 4 * k, W, 8 * k); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .7 * k), 3.2), 1, 1) };
 })();
 // old bark, for the spire, the great canes' bases and the dead canes: grey-brown, split into long plates by deep
 // fissures, the plates' edges lifting and flaking, with crusts of grey-green lichen
 const OLDBARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(92 * DARK, 78 * DARK, 70 * DARK), .62), g = P.g, h = P.h, k = TS;
  for (let i = 0; i < 1600 * TS; i++) { const x = rnd() * W, y = rnd() * H, s = (2 + rnd() * 9) * k, c = rnd() < .5 ? 'rgba(60,46,40,.25)' : 'rgba(150,134,120,.16)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.fillRect(x + ox, y + oy, s * .4, s * 2.5); }); }
  // fissures: long wandering dark grooves, each drawn as a dark core in a soft groove
  g.lineCap = h.lineCap = 'round'; g.lineJoin = h.lineJoin = 'round';
  for (let i = 0; i < 46; i++) {
   const pts = []; let x = rnd() * W, y = -40 * k; const w = (2 + rnd() * 5) * k;
   while (y < H + 40 * k) { pts.push([x, y]); y += (10 + rnd() * 26) * k; x += (rnd() - .5) * 14 * k; }
   const line = (ctx, ox, wd) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0] + ox, p[1]) : ctx.moveTo(p[0] + ox, p[1]))); ctx.lineWidth = wd; ctx.stroke(); };
   for (const ox of [-W, 0, W]) { g.strokeStyle = 'rgba(40,30,26,.5)'; line(g, ox, w * 2.6); g.strokeStyle = 'rgba(14,10,9,.95)'; line(g, ox, w); h.strokeStyle = hgt(.3, .7); line(h, ox, w * 3.2); h.strokeStyle = hgt(0, 1); line(h, ox, w * 1.1); }
  }
  // the plates' lifted edges (a light rim on one side) and crossing cracks
  for (let i = 0; i < 260 * TS; i++) { const x = rnd() * W, y = rnd() * H, l = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { g.strokeStyle = 'rgba(186,170,150,.4)'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + l, y + oy + (rnd() - .5) * 4 * k); g.stroke(); g.strokeStyle = 'rgba(12,8,8,.6)'; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(x + ox, y + oy + 2 * k); g.lineTo(x + ox + l, y + oy + 2 * k); g.stroke(); h.strokeStyle = hgt(.12, .9); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x + ox, y + oy + 2 * k); h.lineTo(x + ox + l, y + oy + 2 * k); h.stroke(); }); }
  // lichen: pale grey-green crusts with a darker ring
  for (let i = 0; i < 70 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 22) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, r * .2, x + ox, y + oy, r); q.addColorStop(0, 'rgba(150,160,124,.55)'); q.addColorStop(.75, 'rgba(118,130,96,.45)'); q.addColorStop(1, 'rgba(118,130,96,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); h.fillStyle = hgt(.7, .3); h.beginPath(); h.arc(x + ox, y + oy, r * .8, 0, TAU); h.fill(); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 4), 1, 1) };
 })();
 // root wood: grey-brown fibres twisting round old roots, soil in the crevices, moss here and there
 const WOOD = (() => {
  const W = 512 * TS, H = 512 * TS, P = pair(W, H, '#4c3a2c', .5), g = P.g, h = P.h, k = TS;
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
   const x = rnd() * W, col = rnd(), wd = (1 + rnd() * 5) * k, hv = col < .45 ? .15 : .8;
   g.strokeStyle = col < .45 ? 'rgba(22,15,10,.32)' : col < .8 ? 'rgba(112,88,64,.22)' : 'rgba(150,128,100,.16)';
   h.strokeStyle = hgt(hv, .5);
   // a 45-degree twist with a wobble that repeats every H, so the texture tiles both ways
   for (const ox of [-2 * W, -W, 0, W]) for (const ctx of [g, h]) { ctx.lineWidth = ctx === h ? wd * 1.3 : wd; ctx.beginPath(); for (let y = 0; y <= H; y += 4 * k) { const xx = x + ox + y + Math.sin(y * TAU / H * 3 + i) * 5 * k; if (y) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); }
  }
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = rnd() < .6 ? 'rgba(0,0,0,.2)' : 'rgba(170,140,110,.1)'; g.fillRect(rnd() * W, rnd() * H, k, (2 + rnd() * 5) * k); }
  for (let i = 0; i < 160; i++) { const x = rnd() * W, y = rnd() * H, r = (10 + rnd() * 40) * k, c = rnd() < .5 ? 'rgba(18,12,8,.18)' : 'rgba(120,100,80,.1)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }); }
  for (let i = 0; i < 70 * MOSS; i++) { const x = rnd() * W, y = rnd() * H, r = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, 'rgba(78,100,44,.6)'); q.addColorStop(1, 'rgba(78,100,44,0)'); g.fillStyle = q; g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 3.4), 1, 1) };
 })();

 // leaflets: an atlas of four, each in its own square with its base at the bottom middle and its tip at the top, the shape
 // in the alpha (doubly toothed, the long point blackberry leaflets have): 0 a dark glossy winter-green one, 1 one turned
 // wine-red by the cold, 2 a young bronze one, 3 a dead brown one with holes. The underside is the shader's (paler, felted)
 const LEAF = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S * 2), g = c.getContext('2d'), hc = cvs(S * 2, S * 2), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S * 2);
  const PAL = [
   { d: [18, 36, 20], m: [34, 64, 32], l: [66, 104, 48], v: [118, 156, 86], e: [60, 30, 40] },
   { d: [52, 12, 26], m: [92, 24, 40], l: [128, 52, 58], v: [166, 104, 96], e: [40, 8, 20] },
   { d: [64, 30, 14], m: [104, 58, 26], l: [146, 98, 50], v: [188, 150, 96], e: [80, 34, 20] },
   { d: [54, 38, 22], m: [88, 64, 36], l: [120, 92, 56], v: [150, 122, 80], e: [60, 40, 24] }];
  for (let cell = 0; cell < 4; cell++) {
   const P = PAL[cell], ox = (cell % 2) * S, oy = Math.floor(cell / 2) * S, len = S * .94, wid = S * .6, x0 = ox + S / 2, y0 = oy + S - S * .03;
   const teeth = 22, half = (f) => .5 * wid * Math.pow(Math.sin(PI * Math.pow(f, .72)), .8) * (1 - .3 * Math.pow(f, 4)) * (f > .86 ? 1 - .55 * sm(.86, 1, f) : 1);
   const tooth = (f, sd) => { const q = f * teeth + (sd > 0 ? 0 : .5), fr = q - Math.floor(q), big = Math.floor(q) % 2 === 0; return f < .05 || f > .97 ? 0 : wid * (big ? .05 : .028) * Math.pow(fr, 1.8); };
   const pts = []; const N = 220;
   for (let i = 0; i <= N; i++) { const f = i / N; pts.push([half(f) + tooth(f, 1), f * len]); }
   for (let i = N; i >= 0; i--) { const f = i / N; pts.push([-half(f) - tooth(f, -1), f * len]); }
   const path = (ctx) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(x0 + p[0], y0 - p[1]) : ctx.moveTo(x0 + p[0], y0 - p[1]))); ctx.closePath(); };
   g.save(); h.save(); path(g); g.clip(); path(h); h.clip();
   const gr = g.createLinearGradient(0, y0, 0, y0 - len); gr.addColorStop(0, css(...P.d)); gr.addColorStop(.3, css(...P.m)); gr.addColorStop(1, css(...P.m.map((v, i) => lerp(v, P.l[i], .3))));
   g.fillStyle = gr; g.fillRect(ox, oy, S, S);
   // blistered tissue between the veins: each panel bulges (light in colour, high in height) and creases at the veins
   const nv = 10, lat = [];
   for (let q = 0; q < nv; q++) { const f = .06 + q / nv * .84; lat.push(f); }
   for (const f of lat) for (const sd of [-1, 1]) {
    const hw = half(f + .04), bx = x0 + sd * hw * .5, by = y0 - (f + .05) * len, r = Math.max(4, hw * .5);
    let q = g.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, css(...P.l, .4)); q.addColorStop(1, css(...P.l, 0)); g.fillStyle = q; g.fillRect(bx - r, by - r, r * 2, r * 2);
    q = h.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, hgt(.85, .8)); q.addColorStop(1, hgt(.5, 0)); h.fillStyle = q; h.fillRect(bx - r, by - r, r * 2, r * 2);
   }
   // mottling, and the cold's wine-dark blotches on the green
   for (let i = 0; i < 260; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (2 + rnd() * 9) * k; g.fillStyle = rnd() < .5 ? css(...P.d, .16) : css(...P.l, .1); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
   if (cell === 0) for (let i = 0; i < 9; i++) { const x = ox + rr(.2, .8) * S, y = oy + rr(.1, .7) * S, r = rr(30, 90) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(86,20,50,.45)'); q.addColorStop(1, 'rgba(86,20,50,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   if (cell === 1) for (let i = 0; i < 6; i++) { const x = ox + rr(.25, .75) * S, y = oy + rr(.2, .8) * S, r = rr(40, 100) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(60,52,24,.35)'); q.addColorStop(1, 'rgba(60,52,24,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   // the vein net: a midrib, ten pairs of laterals running out to the big teeth, and a fine net between them
   g.lineCap = h.lineCap = 'round';
   const lateral = (ctx, sd, f, w) => { const yb = y0 - f * len, hw = half(Math.min(.98, f + .1)); ctx.beginPath(); ctx.moveTo(x0, yb); ctx.quadraticCurveTo(x0 + sd * hw * .5, yb - len * .04, x0 + sd * hw * .97, yb - len * .13); ctx.lineWidth = w; ctx.stroke(); };
   ctx2(g, h, (ctx, isH) => {
    ctx.strokeStyle = isH ? hgt(.2, .9) : css(...P.d, .7); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, (isH ? 9 : 7) * k);
    ctx.strokeStyle = isH ? hgt(.62, 1) : css(...P.v, .75); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, 2.4 * k);
    ctx.strokeStyle = isH ? hgt(.15, 1) : css(...P.d, .75); ctx.lineWidth = 12 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
    ctx.strokeStyle = isH ? hgt(.72, 1) : css(...P.v, .92); ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
   });
   for (let i = 0; i < 700 * TS; i++) { // the fine net: short crooked links between laterals
    const f = rr(.08, .92), sd = rnd() < .5 ? -1 : 1, hw = half(f), x = x0 + sd * hw * rr(.1, .9), y = y0 - f * len, a = rr(-1, 1) + (rnd() < .5 ? 0 : PI / 2), l = rr(6, 18) * k;
    g.strokeStyle = css(...P.d, .3); g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    h.strokeStyle = hgt(.35, .5); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke();
   }
   // a glossy band along one side of the midrib, and a dark, then pale, rim round the edge
   const sh = g.createLinearGradient(x0 - wid * .5, 0, x0 + wid * .5, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.6, 'rgba(230,255,220,.08)'); sh.addColorStop(.72, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(ox, oy, S, S);
   if (cell === 3) { // dead: dark rot spreading from the edges, and holes eaten through it
    for (let i = 0; i < 60; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (8 + rnd() * 40) * k; g.fillStyle = rnd() < .6 ? 'rgba(46,30,16,.35)' : 'rgba(170,140,90,.18)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 14; i++) { const f = rr(.15, .85), x = x0 + (rnd() - .5) * half(f) * 1.4, y = y0 - f * len, r = rr(6, 22) * k; g.beginPath(); g.ellipse(x, y, r, r * rr(.6, 1.2), rnd() * 3, 0, TAU); g.fill(); } g.globalCompositeOperation = 'source-over';
   }
   g.restore(); h.restore();
   path(g); g.strokeStyle = css(...P.e, .9); g.lineWidth = 5 * k; g.stroke(); g.strokeStyle = css(...P.l, .5); g.lineWidth = 1.6 * k; g.stroke();
  }
  function ctx2(a, b, f) { f(a, false); f(b, true); }
  const t = tex(c); t.generateMipmaps = true;
  return { map: t, normal: dataTex(normalFrom(blur(hc, 1.2 * k), 2.6)) };
 })();

 // the flower: an atlas of two halves, each with its base at the bottom and its shape in the alpha. Left, a petal: broad,
 // crinkled like tissue, rose at its edge deepening to crimson and a near-black throat, veins fanning out of the throat.
 // Right, a sepal: felted wine-plum, a pale midrib, drawn out to a long point (its inside is the shader's crimson)
 const BLOOM = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S), g = c.getContext('2d'), hc = cvs(S * 2, S), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S);
  const shape = (ctx, cx, wf) => { ctx.beginPath(); for (let i = 0; i <= 256; i++) { const f = i <= 128 ? i / 128 : (256 - i) / 128, sd = i <= 128 ? 1 : -1, x = cx + sd * wf(f, sd), y = S - 3 - f * (S - 8); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
  const petal = (f, sd) => S * .47 * Math.pow(Math.sin(PI * (.06 + .94 * f)), .45) * (.35 + .65 * Math.sqrt(f)) + S * .008 * Math.sin(f * 60 + sd) + S * .012 * Math.sin(f * 17 + sd * 2);
  const sepal = (f) => S * .41 * Math.pow(Math.sin(PI * Math.min(1, .05 + f * .97)), .9) * (1 - .45 * Math.pow(f, 1.4));
  g.save(); shape(g, S / 2, petal); g.clip(); h.save(); shape(h, S / 2, petal); h.clip();
  let q = g.createRadialGradient(S / 2, S, 0, S / 2, S, S * .98); q.addColorStop(0, '#10010a'); q.addColorStop(.16, '#420516'); q.addColorStop(.42, '#801232'); q.addColorStop(.78, '#b23a5a'); q.addColorStop(1, '#d87892');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  // crinkles: long soft wavy ridges across the petal, like crumpled tissue
  for (let i = 0; i < 700; i++) { const x = rnd() * S, y = rnd() * S, a = (rnd() - .5) * .8, l = (30 + rnd() * 120) * k, w = (3 + rnd() * 9) * k, dk = rnd() < .5; g.fillStyle = dk ? 'rgba(60,6,24,.07)' : 'rgba(255,210,220,.06)'; g.beginPath(); g.ellipse(x, y, l, w, a, 0, TAU); g.fill(); h.fillStyle = hgt(dk ? .32 : .7, .25); h.beginPath(); h.ellipse(x, y, l, w, a, 0, TAU); h.fill(); }
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const a = (i / 89 - .5) * 2.7, l = S * rr(.45, .97), w = rr(1.4, 3.6) * k, al = rr(.2, .5); const pts = []; for (let j = 0; j <= 12; j++) pts.push([S / 2 + Math.sin(a) * l * j / 12 + rr(-3, 3) * k, S - 4 - Math.cos(a * .72) * l * j / 12]);
   g.strokeStyle = 'rgba(56,2,18,' + al.toFixed(2) + ')'; g.lineWidth = w; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
   h.strokeStyle = hgt(.66, .6); h.lineWidth = w * 1.5; h.beginPath(); pts.forEach((p, j) => (j ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1]))); h.stroke(); }
  g.restore(); h.restore();
  g.save(); shape(g, S * 1.5, sepal); g.clip(); h.save(); shape(h, S * 1.5, sepal); h.clip();
  q = g.createLinearGradient(S, 0, S * 2, 0); q.addColorStop(0, '#3a1020'); q.addColorStop(.5, '#5e2236'); q.addColorStop(1, '#3a1020'); g.fillStyle = q; g.fillRect(S, 0, S, S);
  for (let i = 0; i < 9000 * TS; i++) { const x = S + rnd() * S, y = rnd() * S, l = (2 + rnd() * 6) * k, a = rnd() * TAU, dk = rnd() < .5; g.strokeStyle = dk ? 'rgba(16,4,8,.35)' : 'rgba(200,140,150,.15)'; g.lineWidth = k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); h.fillStyle = hgt(dk ? .4 : .62, .4); h.fillRect(x, y, k * 1.5, k * 1.5); }
  g.strokeStyle = 'rgba(206,160,140,.55)'; g.lineWidth = 14 * k; g.beginPath(); g.moveTo(S * 1.5, S); g.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); g.stroke();
  h.strokeStyle = hgt(.8, .8); h.lineWidth = 18 * k; h.beginPath(); h.moveTo(S * 1.5, S); h.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); h.stroke();
  g.restore(); h.restore();
  shape(g, S * 1.5, sepal); g.strokeStyle = 'rgba(154,88,100,.7)'; g.lineWidth = 18 * k; g.stroke();
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, 1 * k), 2.4)) };
 })();

 // the soil under the mound: dark earth fading out, crumbs, pebbles, fallen leaves and bits of dead cane
 const soilMap = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S, S), g = c.getContext('2d'), hh = S / 2;
  const q = g.createRadialGradient(hh, hh, 0, hh, hh, hh); q.addColorStop(0, 'rgba(30,22,16,.97)'); q.addColorStop(.42, 'rgba(40,30,20,.85)'); q.addColorStop(.78, 'rgba(48,36,24,.35)'); q.addColorStop(1, 'rgba(48,36,24,0)');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 9000 * TS; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r; g.fillStyle = rnd() < .5 ? 'rgba(12,8,5,.5)' : 'rgba(100,80,56,.32)'; g.fillRect(x, y, (1 + rnd() * 2.5) * k, (1 + rnd() * 2.5) * k); }
  for (let i = 0; i < 120; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh * .85, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (2 + rnd() * 6) * k; g.fillStyle = 'rgba(124,112,100,.7)'; g.beginPath(); g.ellipse(x, y, s, s * .7, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(18,12,8,.5)'; g.beginPath(); g.ellipse(x + k, y + 1.5 * k, s, s * .5, 0, 0, Math.PI); g.fill(); }
  for (let i = 0; i < 110; i++) { const a = rnd() * TAU, r = (.3 + .6 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (8 + rnd() * 12) * k; g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = rnd() < .5 ? 'rgba(112,80,44,.7)' : rnd() < .5 ? 'rgba(96,30,40,.6)' : 'rgba(60,78,40,.55)'; g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = k; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore(); }
  for (let i = 0; i < 60; i++) { const a = rnd() * TAU, r = (.25 + .65 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, l = (14 + rnd() * 40) * k, b = rnd() * TAU; g.strokeStyle = rnd() < .5 ? 'rgba(120,108,96,.6)' : 'rgba(74,52,38,.7)'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); }
  return tex(c);
 })();
 // sprites: a soft dot, a dust puff, a curl of steam, a single falling leaflet and a tongue of flame (painted pale so
 // each particle can be tinted)
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.6)'], [.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']], 64);
 const softPuff = (n, a, seedK) => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < n; i++) { const x = 30 + rnd() * 68, y = 30 + rnd() * 68, r = 10 + rnd() * 26, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 24, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); };
 const puffT = softPuff(30, .24), steamT = softPuff(46, .14);
 const leafT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 62); g.bezierCurveTo(6, 44, 10, 14, 32, 2); g.bezierCurveTo(54, 14, 58, 44, 32, 62); g.fill(); g.strokeStyle = 'rgba(150,150,150,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 6); g.stroke(); return tex(c); })();
 const flameT = (() => {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  for (const [w, a] of [[30, .35], [20, .6], [11, 1]]) {
   g.beginPath(); g.moveTo(64, 6); g.bezierCurveTo(64 + w * .5, 40, 64 + w, 78, 64 + w * .7, 104); g.quadraticCurveTo(64, 128, 64 - w * .7, 104); g.bezierCurveTo(64 - w, 78, 64 - w * .5, 40, 64, 6);
   const q = g.createLinearGradient(0, 0, 0, S); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.55, 'rgba(255,255,255,' + a * .7 + ')'); q.addColorStop(.85, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,' + a * .5 + ')');
   g.fillStyle = q; g.fill();
  }
  return tex(c);
 })();
 // the ground splitting, painted into three channels: red the fissure and the cracks off it, green the glowing root that
 // runs along the bottom of it, blue the lips of torn-up earth either side (the strip is about 1 m wide)
 const crackT = (() => {
  const W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = g.lineJoin = 'round';
  const line = [], fork = [];
  for (let x = 0, y = H / 2; x <= W; x += 12) { y = cl(y + r2(-12, 12), H * .38, H * .62); line.push([x, y]); if (x > 60 && x < W - 100 && rnd2() < .3) fork.push([x, y]); }
  const stroke = (pts, col, w, oy) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + (oy || 0)) : g.moveTo(p[0], p[1] + (oy || 0)))); g.stroke(); };
  stroke(line, 'rgba(0,0,255,.35)', 44, -34); stroke(line, 'rgba(0,0,255,.35)', 44, 34);
  for (const [x, y] of fork) { const pts = [[x, y]]; let px = x, py = y; const a = (rnd2() < .5 ? -1 : 1) * r2(.6, 1.2); for (let i = 0; i < 6; i++) { px += 14 + rnd2() * 12; py += Math.sin(a) * (10 + rnd2() * 10); pts.push([px, py]); } stroke(pts, 'rgba(255,0,0,.75)', 10); stroke(pts, 'rgba(0,0,255,.2)', 22); }
  stroke(line, 'rgba(255,0,0,.6)', 56); stroke(line, 'rgba(255,0,0,.95)', 30);
  stroke(line, 'rgba(0,255,0,.45)', 20); stroke(line, 'rgba(0,255,0,1)', 7);
  return dataTex(c);
 })();
 // ---------- materials ----------
 // Shader additions shared by the body: a dissolve that burns away with a glowing edge, a clean break through a severed
 // cane, leaves that rustle, thin out (state.wilt) and wither, a faint cool rim, veins that glow from the crevices (uVein:
 // x feeding, y where a pulse has run to, z its strength, w the glow at rest), char from fire, a cut at the ground it
 // rises through (uClip), leaves that redden in its wrath, sepals and petals lit from inside by the heart, and the heart
 // glowing through its drupelets. New in this version:
 //  - light through leaves and petals: moonlight (or the heart's light) from behind a leaf passes through it, warmed and
 //    tinted by it, and a leaf seen against the moon glows; shadowed leaves stay dark, since the shadowed light is used;
 //  - frost: rime on the upper faces of everything far enough from its warm heart (uFrost; none within WARM meters of its
 //    middle, full past COLD), glinting as the camera moves;
 //  - old bark: the spire, the great canes' bases and the dead canes blend into grey fissured bark (aOld);
 //  - the leaves' undersides are paler, matte and felted, as a bramble's are;
 //  - depth materials for shadows that match every cut, fade, sway and leaf shape.
 const MAXC = 10;
 const U = {
  time: { value: 0 }, flut: { value: 1 }, dis: { value: 0 }, disCol: { value: new THREE.Color(0xffa040) }, with: { value: 0 }, thin: { value: 0 },
  rim: { value: .16 }, rimC: { value: new THREE.Color(0x8c8ab8) }, cut: { value: Array.from({ length: MAXC }, () => new THREE.Vector4(2, 2, 0, 0)) },
  vein: { value: new THREE.Vector4(0, -1, 0, VEIN) }, veinC: { value: new THREE.Color(1, .14, .42) }, char: { value: 0 }, burn: { value: 0 },
  clip: { value: -1e4 }, wrath: { value: 0 }, hb: { value: .5 }, heartC: { value: new THREE.Color(1, .16, .36) },
  frost: { value: opts.frost === undefined ? .55 : +opts.frost }, ctr: { value: V3() }, warm: { value: V3(WARM, COLD, 1) }, trans: { value: 1 }
 };
 const NOISE = 'float brH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float brN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(brH(i),brH(i+vec3(1,0,0)),f.x),mix(brH(i+vec3(0,1,0)),brH(i+vec3(1,1,0)),f.x),f.y),mix(mix(brH(i+vec3(0,0,1)),brH(i+vec3(1,0,1)),f.x),mix(brH(i+vec3(0,1,1)),brH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 const UNI = (sh, extra) => Object.assign(sh.uniforms, { uTime: U.time, uFlut: U.flut, uDis: U.dis, uDisCol: U.disCol, uWith: U.with, uThin: U.thin, uRim: U.rim, uRimC: U.rimC, uCut: U.cut,
  uVein: U.vein, uVeinC: U.veinC, uChar: U.char, uBurn: U.burn, uClip: U.clip, uWrath: U.wrath, uHB: U.hb, uHeartC: U.heartC, uFrost: U.frost, uCtr: U.ctr, uWarm: U.warm, uTrans: U.trans }, extra || {});
 // the vertex side shared by colour and depth: bind-pose position for noise, world height, world position and normal,
 // the severing cut's lookup and the leaves' flutter
 function vsPatch(vs, o, depth) {
  vs = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uFlut;\n' + (o.cut ? 'attribute vec2 aCn;\nuniform vec4 uCut[' + MAXC + '];\nvarying float vCs;\nvarying vec4 vCut;\n' : '') +
   (o.flut ? 'attribute vec4 aFl;\nvarying float vThinR;\n' : '') + (o.vein && !depth ? 'attribute vec2 aVn;\nvarying vec2 vVn;\n' : '') + (o.old && !depth ? 'attribute float aOld;\nvarying float vOld;\n' : '') + (o.heart && !depth ? 'attribute vec2 aHt;\nvarying vec2 vHt;\n' : '') + vs;
  vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;\n' + (o.vein && !depth ? ' vVn = aVn;\n' : '') + (o.old && !depth ? ' vOld = aOld;\n' : '') + (o.heart && !depth ? ' vHt = aHt;\n' : '') +
   (o.cut ? ' vCs = aCn.y; vCut = vec4(2., 2., 0., 0.); if (aCn.x > -.5) { int ci = int(aCn.x + .5); for (int i = 0; i < ' + MAXC + '; i++) { if (i == ci) vCut = uCut[i]; } }\n' : '') +
   (o.flut ? ' { float a = aFl.x * uFlut; transformed += objectNormal * a * (.035 * sin(uTime * 2.3 + aFl.y) + .02 * sin(uTime * 5.3 + aFl.y * 1.7) + .01 * sin(uTime * 9.1 + aFl.y * 2.9)); vThinR = aFl.z; }\n' : ''));
  vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
  return vs;
 }
 // the discards shared by colour and depth: below the ground it rises through, the dissolve, the severing cut, thinning
 function discards(o) {
  return ' if (vWP.y < uClip) discard;\n float brE = 0.0, brCh = 0.0; float brNz = .72 * brN(vDP * 9.) + .28 * brN(vDP * 23.);\n' +
   ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (brNz < th) discard; brE = 1. - smoothstep(0., .055, brNz - th); }\n' +
   (o.cut ? ' if (vCut.x < 1.5) { float e = .035 * (brNz - .5), s = vCs - e; if (s > vCut.x && s < vCut.y) discard;\n' +
    '  brE = max(brE, vCut.w * (1. - smoothstep(0., .02, min(abs(s - vCut.x), abs(s - vCut.y)))));\n' +
    '  if (s >= vCut.y && vCut.z > 0.) { float th = vCut.z * 1.1 - .05; if (brNz < th) discard; brE = max(brE, 1. - smoothstep(0., .055, brNz - th)); } }\n' : '') +
   (o.flut ? ' if (vThinR < uThin) discard;\n' : '');
 }
 const FS_HEAD = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uDis;\nuniform vec3 uDisCol;\nuniform float uWith;\nuniform vec3 uWithC;\nuniform float uThin;\nuniform float uRim;\nuniform float uRimS;\nuniform vec3 uRimC;\n' +
  'uniform vec4 uVein;\nuniform vec3 uVeinC;\nuniform float uChar;\nuniform float uBurn;\nuniform float uClip;\nuniform float uWrath;\nuniform float uHB;\nuniform vec3 uHeartC;\nuniform float uFrost;\nuniform vec3 uCtr;\nuniform vec3 uWarm;\nuniform float uTrans;\nuniform float uTransS;\nuniform float uFrostS;\n';
 const KEYS_P = ['flut', 'cut', 'rim', 'vein', 'bloom', 'heart', 'crev', 'char', 'frost', 'trans', 'old', 'back'];
 function patch(m, o) {
  const key = 'brc2-' + KEYS_P.map((k) => (o[k] ? k + o[k] : '')).join('');
  const extra = { uRimS: { value: o.rim || 0 }, uWithC: { value: o.withC || new THREE.Color(.4, .3, .2) }, uTransS: { value: o.trans || 0 }, uFrostS: { value: o.frost || 0 } };
  if (o.old) Object.assign(extra, { uOldMap: { value: OLDBARK.map }, uOldN: { value: OLDBARK.normal } });
  m.onBeforeCompile = (sh) => {
   UNI(sh, extra);
   let vs = vsPatch(sh.vertexShader, o, false), fs = sh.fragmentShader;
   fs = FS_HEAD + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + (o.vein ? 'varying vec2 vVn;\n' : '') +
    (o.old ? 'varying float vOld;\nuniform sampler2D uOldMap;\nuniform sampler2D uOldN;\n' : '') + (o.heart ? 'varying vec2 vHt;\n' : '') + NOISE + fs;
   // light through a leaf or petal: what arrives on its far side passes through, strongest looking toward the light
   if (o.trans) {
    fs = fs.replace('#include <common>', '#include <common>\nvec3 brTrans(IncidentLight dl, GeometricContext g) { float b = max(0., -dot(g.normal, dl.direction)); float f = pow(max(0., dot(g.viewDir, -dl.direction)), 3.); return dl.color * (b * .55 + b * f * 1.6) * uTrans * uTransS; }\n');
    fs = fs.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );\n\t\treflectedLight.directDiffuse += brTrans( directLight, geometry ) * material.diffuseColor;');
   }
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
   // the old bark, sampled at its own scale and blended in by aOld
   if (o.old) {
    fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n { vec4 ob = texture2D(uOldMap, vUv * vec2(1., .6)); ob = mapTexelToLinear(ob); diffuseColor.rgb = mix(diffuseColor.rgb, ob.rgb, vOld); }');
    fs = fs.replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;', 'vec3 mapN = mix(texture2D( normalMap, vUv ).xyz, texture2D( uOldN, vUv * vec2(1., .6) ).xyz, vOld) * 2.0 - 1.0;');
   }
   fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n { float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, uWithC * (.4 + lum * 1.5), uWith); }\n' +
    // the leaves' undersides: paler, greyer and felted
    (o.back ? ' if (!gl_FrontFacing) { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * .9, l * 1.05, l * .85) * 1.25, .45); }\n diffuseColor.rgb *= mix(vec3(1.), vec3(1.55, .5, .42), uWrath * .6);\n' : '') +
    (o.bloom ? ' if (gl_FrontFacing) { if (vUv.x < .5) diffuseColor.rgb *= .62; } else if (vUv.x > .5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .02, .07), .65);\n' : '') +
    (o.char ? ' if (uChar > 0.0) { float n3 = brN(vDP * 3.1); brCh = clamp((uChar * ' + o.char.toFixed(2) + ' * 1.7 - (' + (o.flut ? 'vThinR * .5 + n3 * .3 + brNz * .2' : 'n3 * .7 + brNz * .3') + ')) * 5., 0., 1.); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.012, .008, .006), brCh); }\n' : '') +
    // frost: rime on the upper faces, from WARM to COLD meters out from its middle, gathering more in the creases of noise
    (o.frost ? ' float brFr = 0.0; { float d = length(vWP.xz - uCtr.xz) / max(uWarm.z, .01); float up = (gl_FrontFacing ? 1. : -1.) * vWN.y; float nz = brN(vWP * 7.) * .6 + brN(vWP * 31.) * .4;\n' +
     '  brFr = uFrost * uFrostS * smoothstep(uWarm.x, uWarm.y, d) * smoothstep(-.2, .7, up + (nz - .5) * .9); brFr = clamp(brFr * 1.25, 0., 1.);\n' +
     '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .68, .8) * (.85 + .3 * nz), brFr * .7); }\n' : ''));
   if (o.frost) fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .55, brFr);');
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * brE * 1.6;\n' +
    (o.char ? ' totalEmissiveRadiance += vec3(1., .42, .12) * brCh * (1. - brCh) * 3. * uBurn;\n' : '') +
    (o.vein ? ' { float l = pow(max(dot(texelColor.rgb, vec3(.3, .59, .11)), 1e-4), .4545), crev = 1. - smoothstep(' + (o.crev || '.06, .16') + ', l);\n' +
     '  float vg = vVn.x * (uVein.w * (.55 + .45 * sin(uTime * 1.3 - vVn.y * 6.)) + uVein.x * (.6 + .4 * sin(uTime * 6. - vVn.y * 15.)) + uVein.z * exp(-pow((vVn.y - uVein.y) * 4.5, 2.)));\n' +
     '  totalEmissiveRadiance += uVeinC * vg * (.06 + 1.4 * crev); }\n' : '') +
    (o.bloom ? ' totalEmissiveRadiance += uHeartC * uHB * .22 * (1. - smoothstep(0., .5, vUv.y)) * (gl_FrontFacing ? .6 : 1.);\n' : '') +
    (o.heart ? ' { float fr = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 1.5); totalEmissiveRadiance = uHeartC * uHB * (.1 + vHt.x * 2.6) * (.35 + .65 * vHt.y) * (.3 + 1.7 * fr); }\n' : '') +
    (o.frost ? ' if (brFr > .05) { vec3 vd = normalize(cameraPosition - vWP); float gl = brH(floor(vWP * 260.)); float tw = pow(max(0., sin(dot(vd, vec3(41.3, 27.1, 33.7)) + gl * 90.)), 40.); totalEmissiveRadiance += vec3(.75, .85, 1.) * step(.93, gl) * tw * brFr * .9; }\n' : ''));
   if (o.rim) fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  m.userData.patch = o;
  return m;
 }
 // the shadow pass's version of a material: the same discards, sway and leaf shapes
 function depthOf(m) {
  const o = m.userData.patch || {}, d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, skinning: true, map: m.alphaTest > 0 ? m.map : null, alphaTest: m.alphaTest || 0, side: m.side });
  d.onBeforeCompile = (sh) => {
   UNI(sh);
   sh.vertexShader = vsPatch(sh.vertexShader.replace('#include <begin_vertex>', '#include <beginnormal_vertex>\n#include <begin_vertex>'), o, true);
   sh.fragmentShader = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uDis;\nuniform float uThin;\nuniform float uClip;\n' + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + NOISE +
    sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
  };
  d.customProgramCacheKey = () => 'brc2d-' + (o.cut ? 'c' : '') + (o.flut ? 'f' : '') + (m.alphaTest > 0 ? 'a' : '');
  return d;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  bark: patch(phys({ map: BARK.map, normalMap: BARK.normal, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, roughness: .6, sheen: new THREE.Color(.05, .045, .065), envMapIntensity: .55, skinning: true }), { cut: true, rim: 1, char: .45, vein: true, crev: '.07, .17', frost: .9, old: true, withC: new THREE.Color(.3, .26, .22) }),
  wood: patch(std({ map: WOOD.map, normalMap: WOOD.normal, normalScale: new THREE.Vector2(1.2, 1.2), vertexColors: true, roughness: .92, envMapIntensity: .5, skinning: true }), { cut: true, rim: .8, vein: true, crev: '.07, .17', frost: .6, withC: new THREE.Color(.32, .28, .24) }),
  vc: patch(std({ vertexColors: true, roughness: .42, skinning: true }), { cut: true, rim: .8, char: .4, frost: .7, trans: .25, withC: new THREE.Color(.36, .3, .24) }),
  leaf: patch(std({ map: LEAF.map, normalMap: LEAF.normal, normalScale: new THREE.Vector2(.9, .9), vertexColors: true, alphaTest: .45, side: THREE.DoubleSide, roughness: .52, skinning: true }), { cut: true, flut: true, rim: .55, char: 1, frost: 1, trans: 1, back: true, withC: new THREE.Color(.46, .33, .18) }),
  berry: patch(phys({ vertexColors: true, roughness: .3, clearcoat: .9, clearcoatRoughness: .12, emissive: 0x000000, skinning: true }), { cut: true, rim: .5, frost: .8, trans: .35, withC: new THREE.Color(.13, .09, .08) }),
  bloom: patch(phys({ map: BLOOM.map, normalMap: BLOOM.normal, normalScale: new THREE.Vector2(.8, .8), vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .7, sheen: new THREE.Color(.22, .06, .1), envMapIntensity: .5, skinning: true }), { rim: .6, char: .8, bloom: true, trans: 1.2, frost: .5, withC: new THREE.Color(.42, .32, .24) }),
  heart: patch(phys({ vertexColors: true, roughness: .28, clearcoat: .6, clearcoatRoughness: .2, metalness: .02, skinning: true }), { rim: .4, heart: true }),
  soil: new THREE.MeshStandardMaterial({ map: soilMap, transparent: true, depthWrite: false, roughness: 1, color: new THREE.Color(1, 1, 1).lerp(new THREE.Color(.75, .95, .7), MOSS * .4), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
 };
 // the roots under the meadow, seen only in x-ray: lines of light the heartbeat runs out along
 const XRAY = { value: 0 };
 M.xray = new THREE.ShaderMaterial({
  uniforms: { uX: XRAY, uVein: U.vein, uVeinC: U.veinC, uTime: U.time },
  vertexShader: 'attribute vec2 aVn;\nvarying vec2 vVn;\nvarying float vF;\nvoid main(){ vVn = aVn; vec4 mv = modelViewMatrix * vec4(position, 1.0); vF = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float uX; uniform vec4 uVein; uniform vec3 uVeinC; uniform float uTime; varying vec2 vVn; varying float vF;\n' +
   'void main(){ float p = exp(-pow((vVn.y - uVein.y) * 3.2, 2.)) * (uVein.z + .35); float rest = .22 + .1 * sin(uTime * 1.3 - vVn.y * 5.);\n' +
   ' vec3 c = mix(vec3(.55, .32, .5), uVeinC * 2.4, clamp(p * 1.4, 0., 1.)) * (rest + p * 1.6) * vVn.x; gl_FragColor = vec4(c * uX, 1.); }',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
 });
 // ---------- skeleton ----------
 // ground (stays put), crown (the whole body: rise, lean, twist), mass (the mound: pulse and squash), SPN + 1 bones up the
 // spire, and the bud on top with its heart, its stamens and a chain for each sepal and petal. Each cane is a chain of
 // NS + 1 bones running straight out along its azimuth in the bind pose: the arms and the mane grow from the spire, the
 // legs from the mound. Berry bunches hang from pendulum bones.
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const ground = bone('ground', base, 0, 0, 0), crown = bone('crown', ground, 0, 0, 0, 'YXZ'), mass = bone('mass', crown, 0, 0, 0);
 const SP = []; for (let i = 0; i <= SPN; i++) SP.push(bone('sp' + i, i ? SP[i - 1] : crown, 0, i ? SPS : SPH, 0, 'YXZ'));
 const bud = bone('bud', SP[SPN], 0, .1, 0, 'YXZ'), heart = bone('heart', bud, 0, .12, 0), stam = bone('stam', bud, 0, 0, 0);
 // sepals and petals: chains standing straight up in the bind pose; animate() folds them into a bud or opens them out
 const SEL = 2.5, PEL = 1.85, SEP = [], PET = [];
 function flap(nm, a, r, y, n, len) {
  const b0 = bone(nm + '_0', bud, Math.sin(a) * r, y, Math.cos(a) * r, 'YXZ'); b0.rotation.set(-PI / 2, a, 0);
  const ch = [b0]; for (let i = 1; i <= n; i++) ch.push(bone(nm + '_' + i, ch[i - 1], 0, 0, len / n));
  return { ch, a, r, y, n, len, seg: len / n, ph: rnd() * TAU };
 }
 for (let i = 0; i < 5; i++) { SEP.push(flap('se' + i, (i + .5) / 5 * TAU, .5, 0, 3, SEL)); PET.push(flap('pe' + i, i / 5 * TAU, .36, .06, 2, PEL)); }
 // the canes: g its group (L the lead arm, on its right; M the other arm; H the mane; F, S and B the legs at the front,
 // the sides and the back), a its azimuth, j the spire bone it grows from (-1: the mound), its length, base and tip radius
 const CSPEC = [['L', -.55, 4, 9, .27, .05], ['M', .55, 4, 8.6, .26, .05], ['H', -2.45, 3, 7.4, .23, .045], ['H', 2.45, 3, 7.4, .23, .045]];
 for (let k = 0; k < 6; k++) { const a = -PI + (k + .5) * TAU / 6 + (rnd() - .5) * .14; CSPEC.push([Math.abs(a) < 1.05 ? 'F' : Math.abs(a) < 2.1 ? 'S' : 'B', a, -1, rr(6, 6.6), .18, .032]); }
 const CANES = [];
 for (const [g, a, j, len, rB, rT] of CSPEC) {
  const k = CANES.length, great = j >= 0, rb = great ? .44 : CR * .5, hb = great ? 0 : CH * .5, pb = great ? SP[j] : crown;
  const b0 = bone('cb' + k, pb, Math.sin(a) * rb, hb, Math.cos(a) * rb, 'YXZ'); b0.rotation.y = a;
  const chain = [b0]; for (let i = 1; i <= NS; i++) chain.push(bone('c' + k + '_' + i, chain[i - 1], 0, 0, len / NS));
  CANES.push({ k, g, a, len, seg: len / NS, rB, rT, great, pb, B: V3(Math.sin(a) * rb, great ? SPH + j * SPS : hb, Math.cos(a) * rb), chain, ph: rnd() * TAU, sgn: a < 0 ? -1 : 1,
   dl: (rnd() - .5) * .12, dc: (rnd() - .5) * .25, cutJ: -1, piece: null, cm: .55 + .8 * rnd(), jb: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .12), jy: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .09),
   theta: new Float32Array(NS + 1), bend: new Float32Array(NS + 1), yawW: new Float32Array(NS + 1) });
 }
 const NC = CANES.length, LEAD = CANES[0], MATE = CANES[1];
 root.updateMatrixWorld(true);
 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function geo(pos, idx, extra) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  for (const k in extra || {}) if (extra[k]) g.setAttribute(k, new THREE.Float32BufferAttribute(extra[k][0], extra[k][1]));
  g.setIndex(idx); return g;
 }
 function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v) : [u, 1 - v]; uv.push(t[0], t[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); return g;
 }
 // a tube along a curve with a radius that may vary along it and around it (Frenet frames, for roots and stems)
 function tube(pts, segs, rs, rFn, uvK) {
  const curve = pts.getPointAt ? pts : new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))));
  const fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [], P = V3(), D = V3();
  for (let i = 0; i <= segs; i++) {
   const t = i / segs; curve.getPointAt(t, P);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t, th); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); nor.push(D.x, D.y, D.z); uv.push(j / rs, t * (uvK || 1)); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  return geo(pos, idx, { normal: [nor, 3], uv: [uv, 2] });
 }
 // a near-straight tube along d from s0 to s1 in the bind pose, rings held square to d by a fixed frame (e1, e2):
 // canes, shoots and horns. wob(s, out) nudges the axis sideways and up a little. Normals come from the surface itself,
 // so ridges and knots shade.
 function rodTube(B, d, e1, e2, s0, s1, nu, rs, rFn, wob, uvLen, uvRound) {
  const pos = [], uv = [], idx = [], S = [], TH = [], w = [0, 0];
  for (let i = 0; i <= nu; i++) {
   const s = lerp(s0, s1, i / nu); w[0] = w[1] = 0; if (wob) wob(s, w);
   const cx = B.x + d.x * s + e1.x * w[0] + e2.x * w[1], cy = B.y + d.y * s + e1.y * w[0] + e2.y * w[1], cz = B.z + d.z * s + e1.z * w[0] + e2.z * w[1];
   for (let j = 0; j <= rs; j++) {
    const th = j / rs * TAU, r = rFn(s, th), c = Math.cos(th), sn = Math.sin(th);
    pos.push(cx + (e1.x * c + e2.x * sn) * r, cy + (e1.y * c + e2.y * sn) * r, cz + (e1.z * c + e2.z * sn) * r); uv.push(j / rs * (uvRound || 1), (s - s0) / (uvLen || .5)); S.push(s); TH.push(th);
   }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); seamNormals(g, nu, rs);
  g.userData.S = S; g.userData.TH = TH; return g;
 }
 // a tube's first and last column of vertices share a seam: give both the same normal
 function seamNormals(g, nu, rs) { const n = g.attributes.normal; for (let i = 0; i <= nu; i++) { const a = i * (rs + 1), b = a + rs; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
 function skinW(g, fn) {
  const p = g.attributes.position, n = p.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(p.getX(i), p.getY(i), p.getZ(i), i).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g;
 }
 const rigid = (g, b) => skinW(g, () => [[BI[b.name], 1]]);
 function attr(g, name, size, fn) { const n = g.attributes.position.count, a = new Float32Array(n * size), o = new Array(size); for (let i = 0; i < n; i++) { fn(i, o); for (let k = 0; k < size; k++) a[i * size + k] = o[k]; } g.setAttribute(name, new THREE.BufferAttribute(a, size)); return g; }
 // vertex colours, given in sRGB (made linear here when LIN)
 const colorAll = (g, c) => { const q = lc(c); return attr(g, 'color', 3, (i, o) => { o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }); };
 const shadeBy = (g, f) => attr(g, 'color', 3, (i, o) => { const p = g.attributes.position, c = f(p.getX(i), p.getY(i), p.getZ(i), i); o[0] = lin1(c[0]); o[1] = lin1(c[1]); o[2] = lin1(c[2]); });
 // which cane a vertex belongs to and how far along it (for the severing cut); -1 for everything else
 const cnAll = (g, k, f) => attr(g, 'aCn', 2, (i, o) => { o[0] = k; o[1] = f; });
 const oldAll = (g, v) => attr(g, 'aOld', 1, (i, o) => { o[0] = v; });
 // a chain's skin weights at distance s along it: a linear blend between neighbouring bones, centred on each joint
 function chainW(chain, seg, n, s) {
  const f = s / seg - .5, i0 = Math.floor(f), t = f - i0;
  if (s <= seg * .5) return [[BI[chain[0].name], 1]];
  if (s >= (n + .5) * seg) return [[BI[chain[n].name], 1]];
  return [[BI[chain[i0].name], 1 - t], [BI[chain[i0 + 1].name], t]];
 }
 const caneW = (C, s) => chainW(C.chain, C.seg, NS, s);
 const DEF = { color: 1, skinWeight: [1, 0, 0, 0], aCn: [-1, 0], aFl: [0, 0, 1, 0] };
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size);
    else if (DEF[k] === 1) arr.fill(1, vo * size, (vo + c) * size);
    else if (DEF[k]) for (let i = 0; i < c; i++) for (let q = 0; q < size; q++) arr[(vo + i) * size + q] = DEF[k][q];
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 const _m4 = new THREE.Matrix4();

 // ---------- prickles ----------
 // A blackberry prickle: broad and flattened where it grows from the cane (its base runs along the cane, not round it),
 // narrowing fast and hooking back toward the cane's base; wine-red at the root like the bark, then red-brown, then
 // straw at the hard point. S the surface point, n out of the surface, d along the cane toward its tip.
 const PR_C = [[.3, .1, .13], [.4, .13, .1], [.78, .64, .46]];
 function prickle(S, n, d, len, rb, hk, dead) {
  const nu = DET > .6 ? 6 : 3, rs = DET > .6 ? 7 : 4, pos = [], col = [], idx = [], T = V3(), P = V3(), e1 = V3(), e2 = V3();
  const hook = hk === undefined ? .5 + .25 * rnd3() : hk;
  for (let i = 0; i <= nu; i++) {
   const t = i / nu; P.copy(S).addScaledVector(n, len * t - rb * .35).addScaledVector(d, -len * hook * t * t);
   T.copy(n).multiplyScalar(len).addScaledVector(d, -2 * len * hook * t).normalize();
   e1.copy(d).addScaledVector(T, -d.dot(T)).normalize(); e2.crossVectors(T, e1).normalize(); // e1 along the cane, e2 across it
   const r = rb * Math.pow(1 - t, 1.25), along = r * (1 + 1.6 * Math.pow(1 - t, 2.2)), across = r * .62;
   let c = t < .4 ? PR_C[0].map((v, k) => lerp(v, PR_C[1][k], t / .4)) : PR_C[1].map((v, k) => lerp(v, PR_C[2][k], sm(.4, .92, t)));
   if (dead) c = c.map((v, k) => lerp(v, [.5, .46, .42][k], .7));
   const q = lc(c.map((v) => v * DARK));
   for (let j = 0; j < rs; j++) { const th = j / rs * TAU, cx = Math.cos(th) * along, sx = Math.sin(th) * across; pos.push(P.x + e1.x * cx + e2.x * sx, P.y + e1.y * cx + e2.y * sx, P.z + e1.z * cx + e2.z * sx); col.push(q[0], q[1], q[2]); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * rs + j, b = i * rs + (j + 1) % rs; idx.push(a, a + rs, b, b, a + rs, b + rs); }
  const g = geo(pos, idx, { color: [col, 3] }); g.computeVertexNormals(); return g;
 }

 // ---------- leaves ----------
 // A compound leaf: a prickly stalk from O along Ly, and on it three leaflets (a long terminal one and two to the sides)
 // or five (two more, smaller, lower down, swept back), each a curved surface folded along its midrib, drooping and
 // twisting a little, with the atlas's toothed leaflet on it. Ln is the leaf's face. kind: 0 winter-green, 1 wine-red,
 // 2 young bronze, 3 dead. Returns { leaf (M.leaf), stalk (M.vc) } geometries in the body's bind space.
 const leafTint = () => [r3(.84, 1.1), r3(.88, 1.12), r3(.8, 1.04)];
 function compoundLeaf(O, Ly, Ln, size, kind, five, fl) {
  const ny = DET > .6 ? 7 : 4, nx = DET > .6 ? 4 : 2, Lx = V3().crossVectors(Ly, Ln).normalize(), Nn = V3().crossVectors(Lx, Ly).normalize();
  const pl = size * r3(.22, .32), tip = O.clone().addScaledVector(Ly, pl).addScaledVector(Nn, pl * .12);
  const stalk = tube([O, O.clone().lerp(tip, .5).addScaledVector(Nn, pl * .1), tip], 3, DET > .6 ? 5 : 3, (t) => size * .016 * (1 - .35 * t));
  colorAll(stalk, kind === 3 ? [.42, .3, .2] : [.36 * DARK, .2 * DARK, .14]);
  const leaves = [], pr = [];
  const ph = fl && fl.ph !== undefined ? fl.ph : r3(0, TAU), amp = fl && fl.amp !== undefined ? fl.amp : 1, thin = fl && fl.thin !== undefined ? fl.thin : rnd3();
  const tint = leafTint(), u0 = (kind % 2) * .5, v0 = kind < 2 ? .5 : 0;
  const one = (P0, dir, L, W) => {
   const dx = V3().crossVectors(dir, Nn).normalize(), dn = V3().crossVectors(dx, dir).normalize(), fold = r3(.1, .2), droop = r3(.12, .3), twist = r3(-.25, .25), curlE = r3(-.05, .12);
   const pos = [], uv = [], idx = [], flA = [], cA = [];
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const xn = i / nx * 2 - 1, yn = j / ny, x = xn * W / 2, y = yn * L;
    const z = fold * W * Math.abs(xn) * (1 - .4 * yn) - droop * L * yn * yn + curlE * W * xn * xn + twist * x * yn;
    pos.push(P0.x + dx.x * x + dir.x * y + dn.x * z, P0.y + dx.y * x + dir.y * y + dn.y * z, P0.z + dx.z * x + dir.z * y + dn.z * z);
    uv.push(u0 + (xn * .5 + .5) * .5, v0 + .003 + yn * .494); flA.push(amp * Math.pow(yn, 1.3) * L * 4, ph, thin, 0); const q = lc(tint); cA.push(q[0], q[1], q[2]);
   }
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
   const g = geo(pos, idx, { uv: [uv, 2], aFl: [flA, 4], color: [cA, 3] }); g.computeVertexNormals(); leaves.push(g);
  };
  const L1 = size * .62, W1 = L1 * .62, rot = (a) => V3().copy(Ly).applyAxisAngle(Nn, a);
  one(tip.clone().addScaledVector(Ly, -L1 * .04), Ly.clone(), L1, W1);
  for (const sd of [-1, 1]) {
   one(tip.clone().addScaledVector(Ly, -L1 * .03), rot(sd * r3(.85, 1.05)), L1 * .82, W1 * .82);
   if (five) one(tip.clone().addScaledVector(Ly, -pl * .35), rot(sd * r3(1.75, 2.05)), L1 * .55, W1 * .55);
  }
  // two tiny hooked prickles on the stalk's underside
  if (DET > .6) for (let i = 0; i < 2; i++) { const f = .3 + .35 * i; pr.push(prickle(O.clone().lerp(tip, f).addScaledVector(Nn, -size * .012), Nn.clone().negate(), Ly.clone().negate(), size * .045, size * .014, .5, kind === 3)); }
  return { leaf: leaves, stalk: [stalk].concat(pr) };
 }

 // ---------- fruit ----------
 // A blackberry: round drupelets packed over an ellipsoid round a dark core, each still carrying its dry style (a fine
 // whisker), with a green calyx of five reflexed sepals where its stalk joins. ripe 0 hard green, .4 red, .7 and on
 // glossy purple-black. Built hanging down from (cx, cy, cz). out collects berries; hairs collects whiskers and calyx.
 const DRUP = (() => { // a drupelet cap facing +z: a centre, two rings; normals from the sphere
  const p = [0, 0, 1], i = [], R = DET > .6 ? [[.62, 7], [1.32, 7]] : [[1.3, 5]];
  let base = 1;
  R.forEach(([el, n], r) => { for (let k = 0; k < n; k++) { const a = (k + r * .5) / n * TAU; p.push(Math.sin(el) * Math.cos(a), Math.sin(el) * Math.sin(a), Math.cos(el)); } });
  const n0 = R[0][1];
  for (let k = 0; k < n0; k++) i.push(0, 1 + k, 1 + (k + 1) % n0);
  if (R.length > 1) { const n1 = R[1][1], o1 = 1 + n0; for (let k = 0; k < n1; k++) { const a = 1 + k, b = 1 + (k + 1) % n0, c = o1 + k, d = o1 + (k + 1) % n1; i.push(a, c, d, a, d, b); } }
  return { p, i };
 })();
 const CORE = (() => { const g = new THREE.SphereGeometry(1, 8, 6); return { p: Array.from(g.attributes.position.array), i: Array.from(g.index.array) }; })();
 function berry(cx, cy, cz, len, rad, ripe, out, hairs) {
  const col = ripe > .7 ? [.1, .035, .1] : ripe > .35 ? [.52, .04, .1] : ripe > .2 ? [.62, .26, .12] : [.42, .55, .2];
  const P = out.p, N = out.n, C = out.c, I = out.i;
  const _o = V3(), _z = V3(0, 0, 1), _qq = new THREE.Quaternion(), _t = V3();
  const hl = len / 2, cy0 = cy - hl, rd = rad * .36, n = Math.max(14, Math.round(DET > .6 ? 46 + 30 * rad / .03 * .1 : 24));
  for (let k = 0; k < n; k++) {
   const z = 1 - 1.85 * (k + .5) / n, q = Math.sqrt(Math.max(0, 1 - z * z)), th = k * 2.39996 + rnd3() * .2;
   const nx = q * Math.cos(th), nz = q * Math.sin(th), x = cx + nx * rad * .92, y = cy0 + z * hl * .92, zz = cz + nz * rad * .92;
   _o.set(nx / rad, z / hl, nz / rad).normalize(); _qq.setFromUnitVectors(_z, _o);
   const j = .82 + .36 * rnd3(), r = rd * (.9 + .25 * rnd3()) * (z < -.6 ? .85 : 1);
   const cc = lc([col[0] * j, col[1] * j, col[2] * (ripe > .7 ? .9 + .5 * rnd3() : j)]), b = P.length / 3;
   for (let m = 0; m < DRUP.p.length; m += 3) { _t.set(DRUP.p[m], DRUP.p[m + 1], DRUP.p[m + 2]).applyQuaternion(_qq); P.push(x + _t.x * r, y + _t.y * r, zz + _t.z * r); N.push(_t.x, _t.y, _t.z); C.push(cc[0], cc[1], cc[2]); }
   for (const ii of DRUP.i) I.push(b + ii);
   // its style: a fine whisker standing out of the drupelet's top, dark on a ripe berry, pale on an unripe one
   if (hairs && DET > .6 && rnd3() < .8) {
    const hb = hairs.p.length / 3, L = r * r3(1, 1.8), w = r * .09, hc = lc(ripe > .7 ? [.24, .16, .12] : [.7, .62, .44]);
    _t.set(x, y, zz).addScaledVector(_o, r * .9); const e = V3().crossVectors(_o, Math.abs(_o.y) < .9 ? YAX : _z).normalize(), f = V3().crossVectors(_o, e);
    for (const [a, b2] of [[e, f], [f, e]]) {
     const hb2 = hairs.p.length / 3;
     hairs.p.push(_t.x - a.x * w, _t.y - a.y * w, _t.z - a.z * w, _t.x + a.x * w, _t.y + a.y * w, _t.z + a.z * w, _t.x + _o.x * L, _t.y + _o.y * L, _t.z + _o.z * L);
     for (let m = 0; m < 3; m++) { hairs.n.push(b2.x, b2.y, b2.z); hairs.c.push(hc[0], hc[1], hc[2]); }
     hairs.i.push(hb2, hb2 + 1, hb2 + 2, hb2, hb2 + 2, hb2 + 1);
    }
    void hb;
   }
  }
  const cc = lc([col[0] * .4, col[1] * .4, col[2] * .4]), b = P.length / 3; // the dark core fills the gaps
  for (let m = 0; m < CORE.p.length; m += 3) { P.push(cx + CORE.p[m] * rad * .86, cy0 + CORE.p[m + 1] * hl * .86, cz + CORE.p[m + 2] * rad * .86); N.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); C.push(cc[0], cc[1], cc[2]); }
  for (const ii of CORE.i) I.push(b + ii);
  // the calyx: five small sepals folded back up the stalk
  if (hairs) {
   const gc = lc(ripe > .7 ? [.3, .3, .16] : [.34, .44, .18]);
   for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + rnd3(), ox = Math.cos(a), oz = Math.sin(a), hb = hairs.p.length / 3, w = rad * .32, L = rad * .9;
    const bx = cx + ox * rad * .2, by = cy + rad * .05, bz = cz + oz * rad * .2;
    hairs.p.push(bx - oz * w, by, bz + ox * w, bx + oz * w, by, bz - ox * w, cx + ox * L, cy + L * .55, cz + oz * L);
    for (let m = 0; m < 3; m++) { hairs.n.push(0, 1, 0); hairs.c.push(gc[0], gc[1], gc[2]); }
    hairs.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
 }
 // a hanging bunch: a stalk with short branches, berries biggest and ripest at the top and every stage of ripeness among
 // them (it fruits all winter); returns berry geometry and stalk, calyx and whisker geometry (vertex-coloured), both in
 // the cluster's own space (origin at the attachment)
 function bunch(n, size) {
  const out = { p: [], n: [], c: [], i: [] }, hairs = { p: [], n: [], c: [], i: [] }, stems = [], yaw = rnd() * TAU, L = size * .2;
  for (let i = 0; i < n; i++) {
   const f = n > 1 ? i / (n - 1) : 0, a = yaw + i * 2.4, r = size * (.035 + .035 * Math.sin(PI * Math.min(1, f * 1.3))) * (i ? 1 : 0);
   const y = -size * .03 - f * L, x = Math.cos(a) * r, z = Math.sin(a) * r, q = rnd(), ripe = q < .12 ? .1 : q < .24 ? .3 : q < .36 ? .5 : .8 + .2 * rnd();
   const len = size * (.05 - .012 * f) * (.9 + .2 * rnd()) * (ripe < .35 ? .8 : 1), rad = len * .6;
   berry(x, y - .006, z, len, rad, ripe, out, hairs);
   const s = tube([[0, -f * L * .8, 0], [x * .5, y + .01, z * .5], [x, y + .002, z]], 3, DET > .6 ? 4 : 3, (t) => size * .0045 * (1 - .4 * t));
   colorAll(s, [.24 * DARK, .26 * DARK, .12]); stems.push(s);
  }
  const main = tube([[0, .01, 0], [0, -L * .4, size * .004], [0, -L * .85, 0]], 5, DET > .6 ? 5 : 3, (t) => size * .006 * (1 - .5 * t)); colorAll(main, [.26 * DARK, .22 * DARK, .12]); stems.push(main);
  const g = geo(out.p, out.i, { normal: [out.n, 3], color: [out.c, 3] });
  if (hairs.p.length) stems.push(geo(hairs.p, hairs.i, { normal: [hairs.n, 3], color: [hairs.c, 3] }));
  return { berries: g, stems };
 }
 // ---------- the root mound: a lumpy dome under a tangle of twisted roots, ribs of root arching out of the soil, old grey
 // dead canes snarled through it, and the litter of its own fallen leaves round it ----------
 const domeR = (e, a) => CR * Math.pow(Math.max(0, Math.cos(e)), .8) * (1 + .08 * Math.sin(a * 5 + e * 3) + .05 * Math.sin(a * 11 - e * 7) + .025 * Math.sin(a * 23 + e * 13));
 const domeY = (e) => CH * Math.sin(Math.max(0, e));
 // veins: x how strongly a vertex glows, y how far along the veins it is from the heart (0 at the heart, about .5 at the
 // foot of the spire, 1.5 and on at the ends of the roots): each heartbeat runs out along y
 const vein = (g, x, y0, y1, ring) => attr(g, 'aVn', 2, (i, o) => { o[0] = x; o[1] = lerp(y0, y1, Math.floor(i / ring) / Math.max(1, g.attributes.position.count / ring - 1)); });
 const domeP = (e, a, k, out) => { const r = domeR(e, a) * (k || 1); return out.set(Math.sin(a) * r, domeY(e) * (k || 1), Math.cos(a) * r); };
 const domeN = (e, a, out) => out.set(Math.sin(a) * Math.cos(e) * CH, Math.sin(e) * CR, Math.cos(a) * Math.cos(e) * CH).normalize();
 // mound parts low and far out are held by the ground, the rest by the mound
 function wCrown(x, y, z) { const g = sm(CR * .95, CR * 1.6, Math.hypot(x, z)) * sm(.3, .04, y); return [[BI.mass, 1 - g], [BI.ground, g]]; }
 const mossy = (y, ny, k) => { const m = MOSS * sm(.2, .8, ny) * sm(.1, CH * .6, y) * k; return m; };
 {
  const g = surf(Q(110, 40), Q(36, 14), (u, v, o) => { const a = u * TAU, e = lerp(-.14, PI / 2, v), r = domeR(e, a) * (1 + .04 * Math.sin(a * 37 + e * 19) * Math.sin(e * 3)); o[0] = Math.sin(a) * r; o[1] = domeY(e) - .03 + .03 * Math.sin(a * 17 + e * 29); o[2] = Math.cos(a) * r; }, (u, v) => [u * 8, v * 3]);
  const nn = g.attributes.normal;
  shadeBy(g, (x, y, z, i) => { const k = lerp(.34, .62, sm(-.02, CH, y)) * DARK, m = mossy(y, nn.getY(i), 1.2); return [k * lerp(1, .7, m), k * lerp(.9, 1.15, m), k * lerp(.82, .6, m)]; });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5; o[1] = .55 + .2 * (1 - g.attributes.position.getY(i) / CH); });
  put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
 }
 {
  // twisted roots spiralling down over the dome and out into the soil, each a bundle of fibres
  for (let i = 0, n = Q(52, 12); i < n; i++) {
   const a0 = rnd() * TAU, e0 = rr(.4, 1.3), tw = (rnd() < .5 ? -1 : 1) * rr(.5, 2.2), endR = CR * rr(1.1, 2.05), r0 = rr(.06, .15), pts = [];
   for (let j = 0; j <= 12; j++) {
    const t = j / 12, a = a0 + tw * t, e = lerp(e0, 0, Math.pow(t, .8)), R = lerp(domeR(e, a) + r0 * .55, endR, sm(.58, 1, t));
    pts.push(V3(Math.sin(a) * R, domeY(e) * (1 - sm(.6, .95, t)) + r0 * .45 - .12 * sm(.88, 1, t), Math.cos(a) * R));
   }
   const kt = r2(.12, .7), kk = r2(.25, .6), ph = rnd() * 9, fib = r2(5, 8), rs = Q(12, 5);
   const g = tube(pts, Q(44, 10), rs, (t, th) => r0 * (1.2 - .6 * t) * (1 + .1 * Math.sin(th * fib + t * 40 + ph) + .08 * Math.sin(th * 2 + t * 13 + ph)) * (1 + kk * Math.exp(-Math.pow((t - kt) / .05, 2))), 6);
   g.computeVertexNormals();
   const nn = g.attributes.normal;
   shadeBy(g, (x, y, z, k) => { const c = (.6 + .25 * sm(0, CH, y)) * DARK, m = mossy(y, nn.getY(k), 1); return [c * lerp(1, .72, m), c * lerp(.92, 1.12, m), c * lerp(.85, .62, m)]; });
   vein(g, r2(.75, 1.05), .55 + .1 * (1 - e0 / 1.3), 1.6, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // ribs: great roots that arch up out of the soil round the mound and plunge back in
  for (let i = 0, n = Q(11, 5); i < n; i++) {
   const a = (i + rr(.1, .9)) / n * TAU, Re = CR * rr(1.9, 2.7), hA = rr(.55, 1.1), r0 = rr(.1, .17), pts = [];
   for (let j = 0; j <= 12; j++) { const t = j / 12, R = lerp(CR * .8, Re, t), aa = a + .25 * Math.sin(PI * t); pts.push(V3(Math.sin(aa) * R, lerp(CH * .35, -.14, t) + hA * Math.sin(PI * Math.min(1, t * 1.15)), Math.cos(aa) * R)); }
   const rs = Q(14, 6), ph = rnd() * 9;
   const g = tube(pts, Q(48, 12), rs, (t, th) => r0 * (1.1 - .55 * t) * (1 + .1 * Math.sin(th * 6 + t * 50 + ph) + .1 * Math.sin(th * 2 + t * 15)), 6);
   g.computeVertexNormals(); shadeBy(g, () => [.66 * DARK, .6 * DARK, .54 * DARK]); vein(g, .9, .6, 1.4, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // fine rootlets spreading over the ground
  for (let i = 0, n = Q(80, 14); i < n; i++) {
   const len = rr(1.2, 3.4), r0 = rr(.02, .05), pts = [];
   let a = rnd() * TAU, R = CR * rr(.82, .98);
   for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(V3(Math.sin(a) * R, .02 + r0 * .3 - .05 * sm(.85, 1, t), Math.cos(a) * R)); a += rr(-.1, .1); R += len / 8; }
   const g = tube(pts, Q(16, 5), Q(5, 3), (t) => r0 * (1 - .78 * t), 3); shadeBy(g, () => [.56 * DARK, .5 * DARK, .44 * DARK]); vein(g, .8, 1, 1.7, Q(5, 3) + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // dead canes: old grey arching canes, long since dead and still armed, snarled over the mound and out between its legs;
  // a real thicket is half dead wood. They stand stiff (held by the mound or the ground)
  for (let i = 0, n = Q(30, 8); i < n; i++) {
   const a0 = rnd() * TAU, a1 = a0 + rr(-.9, .9), R0 = CR * rr(.2, .8), R1 = CR * rr(1.3, 2.8), hgt = rr(.7, 2.2), r0 = rr(.03, .07), pts = [];
   for (let j = 0; j <= 10; j++) { const t = j / 10, a = lerp(a0, a1, t), R = lerp(R0, R1, t); pts.push(V3(Math.sin(a) * R, lerp(CH * rr(.5, .9), -.05, Math.pow(t, 1.6)) + hgt * Math.sin(PI * Math.min(1, t * 1.05)) * (1 - t * .3), Math.cos(a) * R)); }
   const curve = new THREE.CatmullRomCurve3(pts), rs = Q(7, 4), segs = Q(36, 8);
   const g = tube(curve, segs, rs, (t, th) => r0 * (1 - .55 * t) * (1 + .1 * Math.cos(5 * th)), 2.5);
   g.computeVertexNormals();
   const grey = rr(.62, .82);
   shadeBy(g, () => [grey * .95, grey * .9, grey * .86]); oldAll(g, 1); attr(g, 'aVn', 2, (i2, o) => { o[0] = 0; o[1] = 2; });
   put(M.bark, cnAll(skinW(g, wCrown), -1, 0));
   const P = V3(), T = V3(), Nn = V3();
   for (let k = 0, np = Q(Math.round(curve.getLength() * 7), 3); k < np; k++) {
    const t = (k + rnd3()) / np, r = r0 * (1 - .55 * t); curve.getPointAt(t, P); curve.getTangentAt(t, T);
    Nn.set(rnd3() - .5, rnd3() - .5, rnd3() - .5).addScaledVector(T, -0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); P.addScaledVector(Nn, r * .85);
    const tl = r * 1.6 + .02; put(M.vc, cnAll(skinW(prickle(P.clone(), Nn.clone(), T.clone(), tl, tl * .42, .5, true), () => wCrown(P.x, P.y, P.z)), -1, 0));
   }
  }
 }

 // ---------- the spire: three old canes braided round each other, out of the mound up to the bud ----------
 const spW = (s) => chainW(SP, SPS, SPN, s);
 const strandC = (j, s, out) => { const f = cl(s / SPL, 0, 1), ph = j * TAU / 3 + s * 1.45, R = lerp(.46, .26, f); return out.set(Math.sin(ph) * R, SPH + s, Math.cos(ph) * R); };
 for (let j = 0; j < 3; j++) {
  const pts = []; for (let i = 0; i <= 30; i++) pts.push(strandC(j, lerp(-.5, SPL + .3, i / 30), V3()));
  const rs = Q(25, 10);
  const g = tube(pts, Q(150, 30), rs, (t, th) => lerp(.4, .22, t) * (1 + .055 * Math.cos(th * 5 + t * 3 + j)) * (1 + .05 * Math.sin(th * 3 + t * 23 + j)) * (1 + .16 * Math.exp(-Math.pow(((t * 8 + j * .37) % 1 - .5) * 7, 2))), 3.2);
  g.computeVertexNormals();
  const p = g.attributes.position;
  shadeBy(g, (x, y, z, i) => { const ring = i % (rs + 1), th = ring / rs * TAU, gr = .5 + .5 * Math.cos(th * 5 + j), k = (.82 + .18 * sm(SPH, BY, y)) * DARK * lerp(.78, 1.06, gr); return [k, k * .95, k * .92]; });
  oldAll(g, 0); attr(g, 'aOld', 1, (i, o) => { o[0] = .85 - .5 * sm(SPH + SPL * .6, BY, p.getY(i)); });
  attr(g, 'aVn', 2, (i, o) => { const ring = i % (rs + 1), th = ring / rs * TAU; o[0] = .8 * (.35 + .65 * (.5 - .5 * Math.cos(th * 5 + j))); o[1] = .5 * (1 - cl((p.getY(i) - SPH) / SPL, 0, 1)); });
  put(M.bark, cnAll(skinW(g, (x, y) => spW(y - SPH)), -1, 0));
 }
 {
  // hooked prickles all the way up the braid, on its ridges
  const P = V3(), N = V3();
  for (let i = 0, n = Q(170, 30); i < n; i++) {
   const j = i % 3, s = lerp(-.1, SPL - .15, (i + rnd3() * .9) / n), a = j * TAU / 3 + s * 1.45 + rr(-.7, .7);
   N.set(Math.sin(a), rr(-.15, .35), Math.cos(a)).normalize(); strandC(j, s, P).addScaledVector(N, lerp(.38, .21, cl(s / SPL, 0, 1)));
   const tl = (.2 + .1 * rnd3()) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), YAX, tl, tl * .42), () => spW(s)), -1, 0));
  }
  // leaves up the braid, and a ruff of them under the bud
  for (let i = 0, n = Q(44, 14), nr = Q(16, 7); i < n; i++) {
   const top = i >= n - nr, s = top ? SPL - .05 : rr(.1, SPL - .5), a = top ? (i - n + nr + rnd() * .4) / nr * TAU : rnd() * TAU, R = top ? .42 : lerp(.75, .45, s / SPL);
   P.set(Math.sin(a) * R, SPH + s, Math.cos(a) * R);
   const Ly = V3(Math.sin(a), top ? rr(-.5, -.1) : rr(.1, .7), Math.cos(a)).normalize(), Ln = V3(rr(-.3, .3), 1, rr(-.3, .3)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = top ? rr(.95, 1.25) : rr(.75, 1.05), kind = top ? (rnd() < .3 ? 1 : 0) : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly, Ln, sz, kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => spW(s)), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => spW(s)), -1, 0));
  }
 }

 // ---------- canes: five-angled, tapering, knotted, wine-dark with a waxy bloom, old and grey toward the base, armed with
 // hooked prickles on their angles, leafy, fruiting at the tips ----------
 const BERRIES = [];  // pendulum bones: { bone, len, X, Xp, ... }
 function addBunch(parent, local, at, n, size, cn) {
  const b = bone('b' + BERRIES.length, parent, local.x, local.y, local.z);
  const bn = bunch(n, size), M4 = _m4.makeTranslation(at.x, at.y, at.z);
  bn.berries.applyMatrix4(M4); put(M.berry, cnAll(rigid(bn.berries, b), cn[0], cn[1]));
  for (const s of bn.stems) { s.applyMatrix4(M4); put(M.vc, cnAll(rigid(s, b), cn[0], cn[1])); }
  BERRIES.push({ bone: b, len: size * .13, X: V3(), Xp: V3(), init: false, size, sway: rnd() * TAU });
  return b;
 }
 const RIDGE = (th, s, tw) => { const c = .5 + .5 * Math.cos(5 * (th + tw * s)); return c * c; }; // 1 on a ridge, 0 in a groove
 for (const C of CANES) {
  const d = V3(Math.sin(C.a), 0, Math.cos(C.a)), e1 = V3(Math.cos(C.a), 0, -Math.sin(C.a)), e2 = YAX, B = C.B, len = C.len;
  const rB = C.rB * (1 + .15 * TIER), rT = C.rT, kn = C.great ? .8 : .6, tw = r2(-.25, .25);
  const rad = (s) => (s < 0 ? rB * 1.12 : lerp(rB, rT, Math.pow(s / len, .72)) * (1 + .11 * Math.exp(-Math.pow((((s + .2) / kn) % 1 - .5) * 6, 2)))) * sm(len + .08, len - .2, s);
  const wob = (s, w) => { const k = sm(0, 1.4, s); w[0] = .05 * Math.sin(s * 1.1 + C.ph) * k; w[1] = .035 * Math.sin(s * 1.5 + C.ph * 1.7) * k; };
  const ax = (s, out) => { const w = [0, 0]; wob(s, w); return out.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]); };
  C.rad = rad; C.ax = ax; C.d = d; C.e1 = e1; C.tw = tw;
  const oldTo = C.great ? 2.4 : 1.5, oldK = C.great ? 1 : .75;
  {
   const rs = Q(C.great ? 25 : 20, 10), nu = Q(Math.round(len * (C.great ? 24 : 22)), 28);
   const g = rodTube(B, d, e1, e2, -.35, len + .08, nu, rs, (s, th) => rad(s) * (1 + .085 * (2 * RIDGE(th, s, tw) - 1) * sm(-.3, .4, s) + .02 * Math.sin(th * 3 + s * 7)), wob, C.great ? 2.4 : 1.7), S = g.userData.S, TH = g.userData.TH;
   attr(g, 'color', 3, (i, o) => { const f = sm(.55, 1, S[i] / len), rg = RIDGE(TH[i], S[i], tw), ao = lerp(.74, 1.06, rg); o[0] = lin1(lerp(1, .9, f) * ao); o[1] = lin1(lerp(1, 1.12, f) * ao); o[2] = lin1(lerp(1, .74, f) * ao); });
   attr(g, 'aOld', 1, (i, o) => { o[0] = oldK * (1 - sm(oldTo * .4, oldTo, S[i])); });
   skinW(g, (x, y, z, i) => caneW(C, Math.max(0, S[i]))); attr(g, 'aCn', 2, (i, o) => { o[0] = C.k; o[1] = S[i] / len; });
   attr(g, 'aVn', 2, (i, o) => { const gr = 1 - RIDGE(TH[i], S[i], tw); o[0] = (C.great ? .6 : .45) * (.25 + .75 * gr); o[1] = (C.great ? .3 : .62) + Math.max(0, S[i]) / len * .9; });
   put(M.bark, g);
  }
  const P = V3(), N = V3(), O = V3(), Ly = V3(), Ln = V3();
  // hooked prickles on the cane's five angles
  for (let i = 0, n = Q(Math.round(len * 14), 10); i < n; i++) {
   const s = lerp(.12, len * .97, (i + rnd3() * .8) / n), th = (Math.floor(rnd3() * 5) * TAU / 5) - tw * s + r3(-.12, .12), r = rad(s) * 1.06;
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .92);
   const tl = (r * .62 + .025) * (rnd3() < .35 ? .55 : 1) * (.85 + .3 * rnd3()) * 1.25 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .44), () => caneW(C, s)), C.k, s / len));
  }
  // great hooks toward the tips of the arms (and the mane and the front legs): what catch and hold
  for (let i = 0, n = { L: 9, M: 8, H: 4, F: 3 }[C.g] || 0; i < n; i++) {
   const s = lerp(.55, .94, (i + r2(.1, .9)) / n) * len, th = r2(-.9, .9) + (i % 2 ? PI : 0) - PI / 2, r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .85);
   const tl = (r * 1.4 + .1) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .4, r2(.8, 1)), () => caneW(C, s)), C.k, s / len));
  }
  // compound leaves on prickly stalks: five leaflets low down, three higher up, young bronze ones at the tip; the cold
  // has turned some wine-red, and the lowest on the legs are dead
  for (let i = 0, nL = Q(Math.round(len * 3.4), 6); i < nL; i++) {
   const f = lerp(.08, .96, (i + .2 + rnd() * .6) / nL), s = f * len, sg = i % 2 ? 1 : -1, th = sg > 0 ? rr(.1, .8) : PI - rr(.1, .8), r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .8);
   Ly.copy(e1).multiplyScalar(sg * rr(.5, .9)).addScaledVector(e2, rr(.15, .6)).addScaledVector(d, rr(.3, .7)).normalize();
   Ln.copy(e2).addScaledVector(V3(rr(-1, 1), 0, rr(-1, 1)), .35); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = rr(.85, 1.2) * (C.great ? 1 : .9) * (1 - .3 * f), kind = f > .84 && rnd() < .45 ? 2 : !C.great && f < .22 && rnd() < .4 ? 3 : rnd() < .32 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), sz, kind, f < .55 && rnd() < .75, { amp: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
  }
  // fruit: a heavy bunch near the tip of each arm, the mane and the front and side legs, on its own pendulum, and a second
  // smaller one further in on the great canes
  if (C.g !== 'B') for (const f of C.great ? [.9, .66] : [.9]) {
   const s = f * len, ip = Math.min(NS, Math.round(s / C.seg)), w = [0, 0]; wob(s, w);
   const local = V3(w[0], w[1] - rad(s) * .8, s - ip * C.seg), at = ax(s, V3()).addScaledVector(e2, -rad(s) * .8);
   const nb = Math.max(3, Math.round((C.great ? 8 : 6) * (f < .8 ? .6 : 1) * (1 + .3 * TIER) * (.85 + .3 * rnd()) * Math.max(.5, DET)));
   const bb = addBunch(C.chain[ip], local, at, nb, (C.great ? 3.6 : 3) * (f < .8 ? .85 : 1) * (1 + .1 * TIER), [C.k, f]);
   if (f > .8) C.bunch1 = bb;
  }
  // where a leg's tip touches the soil it has rooted, as bramble tips do: a tuft of fine roots into the ground
  if (!C.great) {
   const s = len * .985, base0 = ax(s, V3());
   for (let i = 0; i < Q(6, 3); i++) {
    const a = rnd3() * TAU, L = r3(.18, .45), p1 = base0.clone().add(V3(Math.cos(a) * L * .4, -L * .35, Math.sin(a) * L * .4)), p2 = base0.clone().add(V3(Math.cos(a) * L, -L, Math.sin(a) * L));
    const g = tube([base0.clone(), p1, p2], 4, 3, (t) => .012 * (1 - .8 * t)); colorAll(g, [.52, .42, .34]);
    put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, .99));
   }
  }
 }
 // leaves round the legs' bases, hiding where they leave the mound
 for (const C of CANES) if (!C.great) for (let i = 0; i < Q(6, 3); i++) {
  const s = rr(.05, 1.3), P = C.ax(s, V3()).addScaledVector(YAX, C.rad(s) * .6), Ly = V3().copy(C.e1).multiplyScalar(rr(-1, 1)).addScaledVector(YAX, rr(.4, .9)).addScaledVector(C.d, rr(-.2, .5)).normalize();
  const Ln = V3(rr(-.5, .5), 1, rr(-.5, .5)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
  const L = compoundLeaf(P, Ly, Ln, rr(.8, 1.1), rnd() < .3 ? 1 : 0, true, { amp: .8 });
  for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
  for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
 }

 // ---------- the mound's own leaves: the thicket it hides in, dead ones low down, fallen ones round it, and fruit ----------
 {
  const P = V3(), N = V3(), Ly = V3(), Ln = V3();
  for (let i = 0, n = Q(300, 60); i < n; i++) {
   const a = rnd() * TAU, e0 = Math.asin(Math.pow(rnd(), .75)) * 1.1, low = e0 < .35, e = Math.min(e0, 1.2);
   domeP(e, a, rr(.98, 1.18), P); domeN(e, a, N); P.y += .03;
   Ly.copy(N).add(V3(rr(-.5, .5), rr(.2, .7), rr(-.5, .5))).normalize();
   Ln.copy(YAX).multiplyScalar(.7).addScaledVector(N, .5).add(V3(rr(-.3, .3), 0, rr(-.3, .3))); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const kind = low && rnd() < .4 ? 3 : rnd() < .08 ? 2 : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone().addScaledVector(Ly, -.08), Ly.clone(), Ln.clone(), rr(.8, 1.15), kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
  }
  // fallen leaves on the soil round it: wine-red and brown, lying flat, held by the ground
  for (let i = 0, n = Q(110, 20); i < n; i++) {
   const a = rnd() * TAU, R = CR * (.9 + 1.6 * Math.sqrt(rnd())); P.set(Math.sin(a) * R, .025, Math.cos(a) * R);
   Ly.set(rr(-1, 1), rr(-.05, .08), rr(-1, 1)).normalize(); Ln.set(rr(-.15, .15), 1, rr(-.15, .15)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), rr(.5, .8), rnd() < .55 ? 3 : 1, rnd() < .5, { amp: .05, thin: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
  }
  for (let i = 0, nb = Math.max(3, Math.round(6 * DET)); i < nb; i++) { const at = domeP(rr(.4, .95), (i + rnd() * .6) / nb * TAU, 1.05, V3()); addBunch(mass, at, at, Math.max(3, Math.round(rr(4, 7) * Math.max(.5, DET))), 2.6, [-1, 0]); }
 }
 // ---------- the bud: five sepals round five petals, a crowd of stamens, a ring of fangs, and the heart ----------
 for (const F of SEP.concat(PET)) {
  const isS = F.n === 3, out = V3(Math.sin(F.a), 0, Math.cos(F.a)), tg = V3(Math.cos(F.a), 0, -Math.sin(F.a)), B = V3(out.x * F.r, BY + F.y, out.z * F.r), W = isS ? 1.5 : 1.55, cup = isS ? .2 : .28;
  const ph = rnd() * 9, crink = isS ? 0 : .022, nu = Q(isS ? 12 : 16, 6), nv = Q(isS ? 24 : 18, 8);
  const g = surf(nu, nv, (u, v, o) => {
   const xn = u * 2 - 1, x = xn * W / 2, c = cup * W * xn * xn * Math.sin(PI * Math.min(1, .15 + v)) + (isS ? .05 * W * Math.pow(Math.abs(xn), 3) * v : .06 * W * Math.pow(Math.abs(xn), 4) * v);
   const wr = crink * (Math.sin(u * 23 + v * 5 + ph) * .6 + Math.sin(v * 31 + u * 7 + ph * 2) * .4) * sm(0, .3, v);
   o[0] = B.x + tg.x * x - out.x * (c + wr); o[1] = B.y + v * F.len; o[2] = B.z + tg.z * x - out.z * (c + wr);
  }, (u, v) => [(isS ? .5 : 0) + u * .5, v]);
  colorAll(g, isS ? [DARK, DARK, DARK] : [1, 1, 1]);
  put(M.bloom, skinW(g, (x, y) => chainW(F.ch, F.seg, F.n, y - B.y)));
  if (isS) { // prickles down its back, and a hooked claw at its tip
   for (let i = 0; i < Q(7, 4); i++) { const s = (.14 + i * .12) * F.len, P = B.clone().addScaledVector(YAX, s).addScaledVector(out, .02).addScaledVector(tg, r3(-.12, .12)); put(M.vc, skinW(prickle(P, out.clone().addScaledVector(YAX, .35).normalize(), YAX, .2 * THS, .07), () => chainW(F.ch, F.seg, F.n, s))); }
   const s = F.len * .96; put(M.vc, skinW(prickle(B.clone().addScaledVector(YAX, s), YAX.clone().addScaledVector(out, -.5).normalize(), out, .36 * THS, .08, .9), () => chainW(F.ch, F.seg, F.n, s)));
  }
 }
 for (let i = 0, n = Q(170, 36); i < n; i++) { // stamens: pale filaments in three rings round the heart, gold anthers at their tips
  const ring = i % 3, a = (i + rnd3() * .8) / n * TAU, r0 = rr(.56, .66) - ring * .03, r1 = r0 + rr(.2, .45) + ring * .1, h = rr(.42, .74) + ring * .08, y0 = BY + .14;
  const p0 = V3(Math.sin(a) * r0, y0, Math.cos(a) * r0), p1 = V3(Math.sin(a) * (r0 + r1) * .5, y0 + h * .72, Math.cos(a) * (r0 + r1) * .5), p2 = V3(Math.sin(a) * r1, y0 + h, Math.cos(a) * r1);
  const f = tube([p0, p1, p2], DET > .6 ? 5 : 3, DET > .6 ? 4 : 3, (t) => .013 * (1 - .45 * t));
  colorAll(f, [.92, .8, .82]); put(M.vc, rigid(f, stam));
  const an = new THREE.SphereGeometry(.035, DET > .6 ? 6 : 4, DET > .6 ? 4 : 3); an.deleteAttribute('uv'); an.scale(1, 1.6, 1); an.rotateZ(rr(-.5, .5)); an.translate(p2.x, p2.y + .03, p2.z); colorAll(an, [.98, .72, .26]); put(M.vc, rigid(an, stam));
 }
 for (let i = 0; i < 10; i++) { // a ring of fangs, curving in over the heart
  const a = (i + .5) / 10 * TAU, out = V3(Math.sin(a), 0, Math.cos(a));
  put(M.vc, rigid(prickle(V3(out.x * .7, BY + .1, out.z * .7), V3(-out.x * .6, .8, -out.z * .6).normalize(), out, .58 * THS, .11, .85), bud));
 }
 { // the heart: a blackberry as big as a barrel, its drupelets lit from inside, each with its style still standing
  const o = { p: [], n: [], c: [], i: [], h: [] }, HR = .58, HL = 1.2, cy = BY + .12 + HL * .5, N = Q(320, 80), _t = V3(), _qq = new THREE.Quaternion(), _z = V3(0, 0, 1), nn = V3();
  const CG = DRUP.p.length / 3, ring1 = DET > .6 ? 7 : 5, hc = lc([.22, .03, .1]);
  for (let k = 0; k < N; k++) {
   const z = 1 - 2 * (k + .5) / N, q = Math.sqrt(1 - z * z), th = k * 2.39996, nx = q * Math.cos(th), nz = q * Math.sin(th), r = HR * .18 * Math.sqrt(130 / N) * 1.25 * (1 - .3 * Math.max(0, -z)) * (.92 + .16 * rnd3()), gl = rnd3();
   const px = nx * HR, py = cy + z * HL * .5, pz = nz * HR, b = o.p.length / 3;
   _qq.setFromUnitVectors(_z, nn.set(nx / HR, z / (HL * .5), nz / HR).normalize());
   for (let m = 0; m < CG; m++) { _t.set(DRUP.p[m * 3], DRUP.p[m * 3 + 1], DRUP.p[m * 3 + 2]).applyQuaternion(_qq); o.p.push(px + _t.x * r, py + _t.y * r, pz + _t.z * r); o.n.push(_t.x, _t.y, _t.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.12 + .55 * gl, m === 0 ? 1 : m <= ring1 ? .55 : 0); }
   for (const ii of DRUP.i) o.i.push(b + ii);
   if (DET > .6 && rnd3() < .7) { // a style: a fine glowing whisker
    const hb = o.p.length / 3, L = r * r3(.9, 1.6), w = r * .06, e = V3().crossVectors(nn, Math.abs(nn.y) < .9 ? YAX : _z).normalize();
    _t.set(px, py, pz).addScaledVector(nn, r * .9);
    o.p.push(_t.x - e.x * w, _t.y - e.y * w, _t.z - e.z * w, _t.x + e.x * w, _t.y + e.y * w, _t.z + e.z * w, _t.x + nn.x * L, _t.y + nn.y * L, _t.z + nn.z * L);
    for (let m = 0; m < 3; m++) { o.n.push(nn.x, nn.y, nn.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.05, .3); }
    o.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
  const b = o.p.length / 3; for (let m = 0; m < CORE.p.length; m += 3) { o.p.push(CORE.p[m] * HR * .9, cy + CORE.p[m + 1] * HL * .45, CORE.p[m + 2] * HR * .9); o.n.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); o.c.push(hc[0] * .4, hc[1] * .4, hc[2] * .4); o.h.push(.06, 0); }
  for (const ii of CORE.i) o.i.push(b + ii);
  put(M.heart, rigid(geo(o.p, o.i, { normal: [o.n, 3], color: [o.c, 3], aHt: [o.h, 2] }), heart));
 }

 // ---------- Thornwood: thorned shoots as tall as young trees that burst up out of the soil round the prey ----------
 // Each is a chain of UN + 1 bones under the ground bone, built along +Z and parked under the soil at a scale of nothing;
 // animate() plants them in a ring round the prey's feet, grows them up, closes them over it and draws them back down.
 const SNARE = [], UN = 4, NE = Q(10, 7);
 for (let m = 0; m < NE; m++) {
  const len = r2(3, 4.2), seg = len / UN, B = V3(0, -1, 0), d = V3(0, 0, 1), e1 = V3(1, 0, 0), e2 = V3(0, 1, 0), tw = r2(-.3, .3);
  const b0 = bone('u' + m + '_0', ground, B.x, B.y, B.z, 'YXZ');
  const chain = [b0]; for (let i = 1; i <= UN; i++) chain.push(bone('u' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const rad = (s) => lerp(.19, .03, Math.pow(Math.max(0, s) / len, .8)) * sm(len + .04, len - .14, s) * (1 + .12 * Math.exp(-Math.pow(((Math.max(0, s) / .8) % 1 - .5) * 6, 2)));
  const ph = r2(0, TAU), wob = (s, w) => { w[0] = .07 * Math.sin(s * 1.6 + ph); w[1] = .05 * Math.sin(s * 1.2 + ph * 1.3); };
  const g = rodTube(B, d, e1, e2, -.1, len + .04, Q(60, 12), Q(15, 6), (s, th) => rad(s) * (1 + .08 * (2 * RIDGE(th, s, tw) - 1)), wob, 1.6), S = g.userData.S, TH = g.userData.TH;
  skinW(g, (x, y, z, i) => chainW(chain, seg, UN, S[i])); attr(g, 'color', 3, (i, o) => { const f = S[i] / len, ao = lerp(.76, 1.05, RIDGE(TH[i], S[i], tw)); o[0] = lin1(lerp(.95, .86, f) * ao); o[1] = lin1(lerp(.88, 1.1, f) * ao); o[2] = lin1(lerp(.9, .72, f) * ao); });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5 * (1 - RIDGE(TH[i], S[i], tw)); o[1] = 1.4 + S[i] / len * .5; });
  put(M.bark, cnAll(g, -1, 0));
  const P = V3(), N = V3(), w = [0, 0];
  for (let i = 0, n = Q(Math.round(len * 16), 8); i < n; i++) {
   const s = lerp(.15, len * .95, (i + r3(.1, .9)) / n), th = Math.floor(rnd3() * 5) * TAU / 5 - tw * s + r3(-.1, .1), r = rad(s); wob(s, w);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]).addScaledVector(N, r * .9);
   const tl = (r * 1.1 + .06) * 1.3 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .42, r3(.6, .95)), () => chainW(chain, seg, UN, s)), -1, 0));
  }
  for (let i = 0; i < Q(4, 2); i++) {
   const s = r2(.3, .85) * len, sg = i % 2 ? 1 : -1; wob(s, w); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]);
   const Ly = V3().copy(e1).multiplyScalar(sg * r2(.5, .9)).addScaledVector(d, r2(.3, .7)).addScaledVector(e2, r2(-.3, .3)).normalize(), Ln = V3().copy(e2).addScaledVector(d, .3);
   Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone().addScaledVector(Ly, .06), Ly, Ln, r2(.5, .7), rnd2() < .7 ? 2 : 0, false, { amp: 1.2, thin: rnd2() });
   for (const gg of L.leaf) put(M.leaf, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
   for (const gg of L.stalk) put(M.vc, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
  }
  SNARE.push({ chain, len, a: (m + r2(-.3, .3)) / NE * TAU, R: r2(1.3, 1.9), t0: r2(0, .06), lean: r2(.25, .45), curl: r2(.3, .4), ph: r2(0, TAU), g: 0, up: false, down: false });
 }
 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [], SHADOWS = !!opts.shadows;
 for (const [mat, list] of BK) {
  const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m);
  m.castShadow = m.receiveShadow = SHADOWS; if (SHADOWS) m.customDepthMaterial = depthOf(mat);
 }
 BK.clear();
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone(), parent: b.parent };
 const soil = new THREE.Mesh(new THREE.CircleGeometry(CR * 2.9, Q(64, 20)), M.soil); soil.rotation.x = -PI / 2; soil.position.y = .006; soil.renderOrder = -1; soil.receiveShadow = SHADOWS; base.add(soil);

 // ---------- its roots under the meadow, for state.xray ----------
 // Fifteen great roots run out from under the mound, sinking as they go and branching twice, out to about 22 m: the reach
 // it feels the meadow with and spreads its warmth through. Drawn only in x-ray, as lines of light the heartbeat runs out
 // along (aVn as the veins': x brightness, y how far along from the heart).
 const xroots = (() => {
  const pos = [], idx = [], vn = [], P = V3(), D = V3(), T = V3(), E1 = V3(), E2 = V3();
  function root1(p0, dir, len, r0, d0, depth) {
   const n = Math.max(6, Math.round(len * 1.6)), pts = [p0.clone()], q = p0.clone(), dd = dir.clone();
   for (let i = 1; i <= n; i++) { dd.x += r3(-.25, .25); dd.z += r3(-.25, .25); dd.y = lerp(dd.y, -.08, .3) + r3(-.05, .05); dd.normalize(); q.addScaledVector(dd, len / n); q.y = Math.min(q.y, -.12); pts.push(q.clone()); }
   const curve = new THREE.CatmullRomCurve3(pts), segs = n * 3, rs = 4, b = pos.length / 3;
   const fr = curve.computeFrenetFrames(segs, false);
   for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, P); const r = r0 * (1 - .7 * t);
    for (let j = 0; j <= rs; j++) { const th = j / rs * TAU; D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); vn.push(lerp(1, .35, t) * (depth ? .7 : 1), d0 + t * len / 10); }
   }
   for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
   if (depth < 2) for (let k = 0, nb = depth ? 2 : 3; k < nb; k++) {
    const t = r3(.25, .85); curve.getPointAt(t, P); curve.getTangentAt(t, T); E1.set(-T.z, 0, T.x).normalize().multiplyScalar(rnd3() < .5 ? -1 : 1);
    root1(P.clone(), T.clone().lerp(E1, r3(.5, .9)).normalize(), len * r3(.35, .6), r0 * (1 - .7 * t) * .8, d0 + t * len / 10, depth + 1);
   }
   void E2;
  }
  for (let i = 0; i < 15; i++) { const a = (i + r3(.1, .9)) / 15 * TAU; root1(V3(Math.sin(a) * CR * .5, -.3, Math.cos(a) * CR * .5), V3(Math.sin(a), -.25, Math.cos(a)).normalize(), r3(13, 21), r3(.07, .12), .6, 0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aVn', new THREE.Float32BufferAttribute(vn, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, M.xray); m.frustumCulled = false; m.visible = false; m.renderOrder = 20; base.add(m); return m;
 })();

 // ---------- points: world-sized soft sprites with their own color, size and spin ----------
 const PV = 'attribute vec4 aCol; attribute float aSize; attribute float aRot; uniform float uScale; varying vec4 vC; varying float vR;\nvoid main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PF = 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1.0 - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 const _v2 = new THREE.Vector2();
 function points(n, map, blend, order) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n), rot = new Float32Array(n), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aRot', new THREE.BufferAttribute(rot, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 400 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: blend });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order || 8;
  p.onBeforeRender = (r) => { const rt = r.getRenderTarget(); if (rt) m.uniforms.uScale.value = rt.height * .5; else { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; } };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), next: 0, live: 2 };
 }
 // falling leaves and petals, dust and soil, motes (pollen, stolen life, embers), chips (bark and thorn, berry juice, sap
 // and clods of soil, all heavy and dark), and flames
 const LF = points(Q(220, 100), leafT, THREE.NormalBlending, 8), DU = points(240, puffT, THREE.NormalBlending, 7), MO = points(380, dotT, THREE.AdditiveBlending, 9), CHP = points(320, dotT, THREE.NormalBlending, 8);
 const FL = points(Q(180, 90), flameT, THREE.AdditiveBlending, 9); FL.upright = true; FL.end = C3(.55, .06, .02);
 // its breath: steam rising off the warm mound and out of the bud into the cold air
 const STM = points(Q(300, 120), steamT, THREE.NormalBlending, 6); STM.upright = true;
 fx.add(LF.p, DU.p, MO.p, CHP.p, FL.p, STM.p);
 // whip trails: a ribbon behind each great cane's tip and each front leg's, all in one mesh
 const TRN = 16, TRC = CANES.filter((c) => c.great || c.g === 'F'), trPos = new Float32Array(TRC.length * TRN * 6), trCol = new Float32Array(TRC.length * TRN * 6), trIdx = [];
 for (let r = 0; r < TRC.length; r++) for (let i = 0; i < TRN - 1; i++) { const a = (r * TRN + i) * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trG.setIndex(trIdx);
 const trail = new THREE.Mesh(trG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 7; fx.add(trail);
 const TR = TRC.map((C) => ({ C, tip: Array.from({ length: TRN }, () => V3()), mid: Array.from({ length: TRN }, () => V3()), prev: 0 }));
 // the heart's light, spilling out between the sepals onto the canes round it, and the firelight while it burns
 const heartLight = new THREE.PointLight(0xff3a6a, 0, 11 * SZ, 2), fireLight = new THREE.PointLight(0xff7a2c, 0, 9 * SZ, 2); fx.add(heartLight, fireLight);
 // cracks in the ground: six strips, each from ckA to ckB, rewritten every frame they show; their roots glow like the veins
 const NCK = 6, ckPos = new Float32Array(NCK * 12), ckUv = [], ckIdx = [], ckA = [], ckB = [], ckOn = new Float32Array(NCK);
 for (let i = 0; i < NCK; i++) { ckUv.push(0, 0, 0, 1, 1, 0, 1, 1); const b = i * 4; ckIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); ckA.push(V3()); ckB.push(V3()); }
 const ckG = new THREE.BufferGeometry(); ckG.setAttribute('position', new THREE.BufferAttribute(ckPos, 3).setUsage(THREE.DynamicDrawUsage)); ckG.setAttribute('uv', new THREE.Float32BufferAttribute(ckUv, 2)); ckG.setIndex(ckIdx);
 const crack = new THREE.Mesh(ckG, new THREE.ShaderMaterial({
  uniforms: { uMap: { value: crackT }, uOpen: { value: 0 }, uGlow: { value: 0 }, uFade: { value: 0 }, uGlowC: U.veinC },
  vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D uMap; uniform float uOpen, uGlow, uFade; uniform vec3 uGlowC; varying vec2 vUv;\n' +
   'void main(){ vec4 t = texture2D(uMap, vUv); float o = (1. - smoothstep(uOpen - .06, uOpen, vUv.x)) * smoothstep(0., .08, vUv.x) * (1. - smoothstep(.93, 1., vUv.x)) * uFade;\n' +
   ' vec3 c = mix(vec3(.025, .016, .012), vec3(.3, .22, .15), t.b * (1. - t.r)); c = mix(c, uGlowC * 1.8, t.g * uGlow);\n' +
   ' float a = max(max(t.r, t.b * .7), t.g * uGlow) * o; if (a < .01) discard; gl_FragColor = vec4(c, a); }',
  transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 crack.frustumCulled = false; crack.visible = false; crack.renderOrder = 6; fx.add(crack);
 // shockwaves: rings racing out over the ground (the Awakening's roar, Hammerfall, Wrath, the spire's fall). Dust ones
 // darken what they pass over; glowing ones add light.
 const SHK = [0, 1, 2, 3].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.6, 1, Q(80, 40), 1), new THREE.ShaderMaterial({
   uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
   vertexShader: 'varying float vR;\nvoid main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR;\nvoid main(){ float e = smoothstep(.62, .92, vR) * (1. - smoothstep(.94, 1., vR)); if (e * uA < .004) discard; gl_FragColor = vec4(uC, e * uA); }' }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 6; fx.add(m);
  return { m, t: 0, dur: 1, r0: 0, r1: 1, a: 0 };
 });
 let shkN = 0;
 function shock(x, z, r0, r1, dur, col, a, glow) { const S = SHK[shkN++ % SHK.length]; S.m.position.set(x, root.position.y + .04, z); S.t = 0; S.dur = dur; S.r0 = r0; S.r1 = r1; S.a = a; S.m.material.uniforms.uC.value.copy(col); S.m.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.m.visible = true; }
 // Thorn Volley's thorns: thrown in high arcs, sticking where they land, then crumbling away (one instanced mesh)
 const NTV = 30, TV = new THREE.InstancedMesh(prickle(V3(), V3(0, 0, 1), V3(0, 1, 0), 1, .17, .45), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45 }), NTV);
 TV.instanceMatrix.setUsage(THREE.DynamicDrawUsage); TV.frustumCulled = false; fx.add(TV);
 const TVS = Array.from({ length: NTV }, () => ({ t: -1, T: 1, p0: V3(), v: V3(), d: V3(), spin: 0, stick: -1 })), M0 = new THREE.Matrix4().makeScale(0, 0, 0);
 for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0);
 let tvN = 0;
 // ribbons: life spiralling down the spire into the roots as it feeds (Devour), or pollen streaming to its prey (Siren Bloom)
 const DRN = 3, DRS = 26, drPos = new Float32Array(DRN * (DRS + 1) * 6), drCol = new Float32Array(DRN * (DRS + 1) * 6), drIdx = [];
 for (let r = 0; r < DRN; r++) for (let i = 0; i < DRS; i++) { const a = (r * (DRS + 1) + i) * 2; drIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const drG = new THREE.BufferGeometry(); drG.setAttribute('position', new THREE.BufferAttribute(drPos, 3).setUsage(THREE.DynamicDrawUsage)); drG.setAttribute('color', new THREE.BufferAttribute(drCol, 3).setUsage(THREE.DynamicDrawUsage)); drG.setIndex(drIdx);
 const drain = new THREE.Mesh(drG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); drain.frustumCulled = false; drain.visible = false; drain.renderOrder = 8; fx.add(drain);

 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up, spin, sway) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1;
  P.drag[i] = drag || 0; P.up[i] = up || 0; P.spin[i] = spin || 0; P.sway[i] = sway || 0; P.rot[i] = P.upright ? 0 : rnd() * TAU;
 }
 function stepP(P, dt, fadeIn, t) {
  if (P.live <= 0) return;
  const pos = P.pos, vel = P.vel, col = P.col; let alive = 0;
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; P.size[i] = 0; } continue; }
   alive++; P.life[i] -= dt; const age = 1 - Math.max(0, P.life[i]) / P.max[i], dr = Math.exp(-P.drag[i] * dt);
   vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr + P.up[i] * dt; vel[i * 3 + 2] *= dr;
   const sw = P.sway[i] ? P.sway[i] * Math.sin(t * 3.1 + i * 1.7) : 0;
   pos[i * 3] += (vel[i * 3] + sw) * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += (vel[i * 3 + 2] + sw * .6) * dt;
   if (pos[i * 3 + 1] < .01) { pos[i * 3 + 1] = .01; vel[i * 3] *= .5; vel[i * 3 + 1] = 0; vel[i * 3 + 2] *= .5; P.spin[i] *= .9; }
   P.rot[i] += P.spin[i] * dt;
   const k = Math.min(1, age / (fadeIn || .15)) * (1 - age * age);
   if (P.end) { const f = Math.min(1, age * 1.4); col[i * 4] = lerp(P.base[i * 4], P.end.r, f); col[i * 4 + 1] = lerp(P.base[i * 4 + 1], P.end.g, f); col[i * 4 + 2] = lerp(P.base[i * 4 + 2], P.end.b, f); }
   else { col[i * 4] = P.base[i * 4]; col[i * 4 + 1] = P.base[i * 4 + 1]; col[i * 4 + 2] = P.base[i * 4 + 2]; }
   col[i * 4 + 3] = P.base[i * 4 + 3] * k;
   P.size[i] = lerp(P.sz[i * 2], P.sz[i * 2 + 1], age);
  }
  P.live = alive > 0 ? 2 : P.live - 1;
  for (const k of ['position', 'aCol', 'aSize', 'aRot']) P.g.attributes[k].needsUpdate = true;
 }
 // ---------- poses and actions ----------
 // body: y the mound's rise (it sinks deep into the earth before it appears), lean, tw twist, rl roll, sq squash, sw swirl
 //   (every cane turns the same way round it; Maelstrom spins it), coil (every cane curls sideways along its length), pulse
 //   breathing, gr growth
 // spire: sp pitch (+ forward), sb the bow of its top, sy twist, ss side bend, sk how far it turns to its prey, fall (felled,
 //   it topples forward and to its right)
 // bud: op how open (0 a closed bud, 1 a flower, more flares it), hb the heart's glow, gp a gulp (the bud swells), inn the
 //   prey is inside it
 // canes, by group (L the lead arm, M the other arm, H the mane, F, S and B the legs): l lift, c curl (negative arches it
 //   back), t tip curl, y swing toward the front, w writhe, k reach for the target (state.target)
 // reach: ikd how far toward the target, ikh height added (meters), wrap the tip's coil round what it holds, pull drags the
 //   reach point into the flower (where it feeds), tn twines the arms round each other
 // look: glow (the fruit gleams), lure (pollen), fade (1 solid, 0 gone), trail (whip trails), rust (leaves rustle), wither,
 //   dust, drain (life running down into the roots), shed (falling leaves), feed (the veins glow), fire
 const G6 = ['L', 'M', 'H', 'F', 'S', 'B'];
 function cg(g, l, c, t, y, w, k) { const o = {}, gs = g === '*' ? G6 : g.split(''); for (const q of gs) { if (l !== undefined) o[q + 'l'] = l; if (c !== undefined) o[q + 'c'] = c; if (t !== undefined) o[q + 't'] = t; if (y !== undefined) o[q + 'y'] = y; if (w !== undefined) o[q + 'w'] = w; if (k !== undefined) o[q + 'k'] = k; } return o; }
 const K = (...a) => Object.assign({}, ...a);
 // battle idle: the spire leaning a little at its prey, the bud just parted on the heart's glow, the arms arched out with
 // their tips on the soil before it, the mane up and back, the legs arched out round it like a spider's
 const BASE = K({ y: 0, lean: 0, tw: 0, rl: 0, sq: 0, sw: 0, coil: 0, pulse: 1, gr: 1, sp: .1, sb: .16, sy: 0, ss: 0, sk: .7, fall: 0, op: .14, hb: .55, gp: 0, inn: 0,
  ikd: 1, ikh: 0, wrap: 0, pull: 0, tn: 0, glow: .2, lure: 0, fade: 1, trail: 0, rust: 1, wither: 0, dust: 0, drain: 0, shed: 0, feed: 0, fire: 0 },
  cg('LM', .85, 2.7, .7, .32, .8, 0), cg('H', .75, 1.1, .6, -.25, 1.1, 0), cg('F', 1.2, 2.2, .6, .12, 1, 0), cg('S', 1.1, 2.5, .4, 0, 1, 0), cg('B', 1.05, 2.5, .45, -.1, 1, 0));
 const KEYS = Object.keys(BASE);
 // resting, disguised: a hill of brambles, the spire bowed over the mound with its bud hidden in the leaves
 const REST = K(cg('LM', -.1, 1.5, .5, .4, .2), cg('H', .25, 1.7, .5, .2, .2), cg('FSB', .7, 1.9, .4, -.04, .2), { coil: 2, y: -.15, sq: .1, pulse: .35, rust: .45, sp: .9, sb: 1.9, ss: .2, sk: 0, op: 0, hb: .32, glow: 0 });
 // alert: the spire straightens and leans at its prey, the bud parts on the heart's glow, every cane rises toward it
 const ALERT = K(cg('LM', .95, 1.3, 1.4, .45, .45), cg('H', 1.1, .3, .3, -.3, .5), cg('F', 1.32, 1.35, 1.55, .32, .45), cg('S', 1.28, 1.45, 1.45, .4, .45), cg('B', 1.22, 1.65, 1.2, .3, .45),
  { y: .06, lean: -.04, sq: -.04, sp: .2, sb: .3, sk: 1, op: .34, hb: .95, glow: .4, rust: 1.6, feed: .25 });
 // guard: the arms crossed before the spire, the bud shut tight
 const GUARD = K(cg('LM', .6, 1.2, .8, 1.05, .3), cg('H', .8, .9, .5, -.1, .3), cg('FS', 1.45, 1.4, 1, .75, .35), cg('B', 1.25, 2.3, .5, .2, .5), { sp: -.06, sb: .08, op: 0, hb: .25, lean: -.04, sq: .04, rust: 1.3 });
 const WALK = { lean: .05, rust: 1.4, y: .03, sp: .16 };
 const ACTS = {};
 const EASE = { s: (x) => x * x * (3 - 2 * x), l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x) };
 function act(name, dur, keys, o) {
  const t = [], p = [], e = []; let prev = BASE;
  for (const [u, k, ez] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); e.push(EASE[ez || 's']); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, e, hits: [], cues: [], hold: false, interrupt: false, rate: 12, snap: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, f = def.e[i + 1](s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], f);
 }
 const ARMS = (k) => cg('LM', undefined, undefined, undefined, undefined, undefined, k);
 // Awakening: it heaves up out of the splitting earth, spikes first, plants its legs, rears and roars its bud open
 act('appear', 4.6, [[0, K(REST, cg('LM', 1.45, -.4, .2, .9, .3), cg('H', 1.5, -.2, .2, .6, .3), cg('FSB', 1.5, -.6, -.2, .4, .3), { y: -8.6, sp: 0, sb: 0, ss: 0, op: 0, hb: .3, coil: 0, pulse: 1 })],
  [.06, { dust: 1, feed: .4 }], [.14, { y: -6.6, shed: .5 }, 'i'], [.42, { y: 0, sq: -.06, rust: 2.4, feed: .7 }, 'o'],
  [.5, K(cg('FSB', 1.3, 2.4, .6, .1, 1.4), cg('LM', .9, 1.2, 1, .5, .8), cg('H', 1, .4, .3, -.2, 1.2), { sq: .08, dust: .6, shed: .2 }), 'o'],
  [.58, K(cg('LM', 1.4, -.6, .4, .1, .5), cg('H', 1.5, -.7, .2, -.3, .8), { sp: -.5, sb: -.3, op: .3, hb: 1, lean: -.08, y: .1, sq: -.08, dust: .1, feed: 1, rust: 2.6 })],
  [.66, { op: 1.4, hb: 2.2, sq: -.1, shed: 1.2, rust: 3.2 }, 'o'], [.8, K(ALERT, { op: .6, hb: 1.2, shed: 0, dust: 0 })], [1, BASE]],
  { snap: KEYS, cues: [.04, .62], rate: 10 });
 // Alert: the spire turns and leans at its prey, every cane rising toward it
 act('alert', 1.8, [[0, {}], [.3, ALERT, 'o'], [.7, K(ALERT, cg('*', undefined, undefined, undefined, undefined, .25))], [1, BASE]], { cues: [.22], rate: 9 });
 // Siren Bloom: the flower opens wide, arms spread in welcome, pollen pouring over the party (the hit is a charm)
 act('bloom', 3.4, [[0, {}],
  [.22, K(cg('LM', .95, .9, .5, -.25, .4), cg('H', 1.25, -.5, -.2, -.5, .6), cg('FSB', 1.0, 2.5, .5, -.05, .3), { sp: -.12, sb: -.1, sk: 1, op: 1.05, hb: 1.3, glow: .8, lure: .6, y: .05, rust: .6 }), 'o'],
  [.34, { op: 1.15, lure: 1.6, glow: 1.2, hb: 1.5 }], [.78, { op: 1.0, lure: 1.1, glow: 1 }], [1, BASE]], { hits: [.55], cues: [.3], rate: 7 });
 // Thorn Lance: the lead arm draws back high, spears down through its prey into the ground, and rips free
 act('lance', 1.8, [[0, {}],
  [.26, K(cg('L', 1.3, -.7, .2, -.2, .2, 0), cg('M', .7, 1.8, .8, .5, .5), { sp: -.2, sb: -.1, sk: 1, sy: .35, tw: .1, lean: -.06, y: .04, op: .4, hb: 1, rust: 1.8 }), 'o'],
  [.4, { Lk: 1, ikd: 1.02, ikh: -.5, wrap: .2, trail: 1, sp: .35, sb: .3, sy: -.15, tw: -.06, lean: .12, sq: .08, rust: 2.6 }, 'i'],
  [.5, { wrap: .5 }], [.66, { Lk: .85, trail: 0, sp: .2 }],
  [.86, K(cg('L', .6, 2, .8, .3, .6, 0), { sp: .1, sy: 0, lean: 0, tw: 0, op: .2, sq: 0 }), 'o'], [1, BASE]], { hits: [.44], cues: [.3], rate: 22 });
 // Hammerfall: the arms rise and twine into one club, hang, then fall on the prey; a shockwave runs over the party
 act('slam', 3.0, [[0, {}],
  [.24, K(cg('LM', 1.05, -.25, -.2, .62, .2, 0), { sp: -.42, sb: -.3, sk: 1, op: .7, hb: 1.2, lean: -.1, y: .1, sq: -.08, rust: 2, tn: 1 }), 'o'],
  [.4, K(cg('LM', 1.15, -.4, -.3, .62, .3), { sp: -.5, sb: -.35, hb: 1.7, feed: .5, tn: 1.2 })],
  [.46, K(ARMS(1), { ikd: 1, ikh: -1.5, wrap: .1, trail: 1, sp: .38, sb: .32, lean: .16, y: -.05, sq: .12, rust: 3, op: .3, tn: 0 }), 'i'],
  [.56, { sq: .06 }], [.7, { Lk: .9, Mk: .9, trail: 0, sp: .25, feed: .3 }],
  [.88, K(cg('LM', .7, 1.9, .8, .4, .7, 0), { sp: .1, sb: .2, lean: 0, y: 0, sq: 0, op: .2, hb: .7 }), 'o'], [1, BASE]],
  { hits: [.5, .6], cues: [.36], rate: 18 });
 // Maelstrom: it winds round, then every cane whirls round it twice at three heights, striking the party four times
 act('whirl', 3.6, [[0, {}],
  [.2, K(cg('LM', -.15, .3, .2, -.4, .3), cg('H', .5, .5, .2, -.3, .3), cg('FSB', .55, .9, .3, .2, .3), { sw: -.9, sy: -.6, tw: -.12, sp: -.06, sb: 0, sk: 0, op: .2, rust: 2, y: .08, sq: -.06 }), 'o'],
  [.3, { sw: 0, sy: .2, trail: 1, rust: 3, dust: 1 }, 'i'],
  [.78, { sw: TAU * 2, trail: 1, dust: 1 }, 'l'],
  [.86, K(cg('LM', .6, 1.8, .7, .3, .8), cg('H', 1, .5, .4, -.15, 1), cg('FSB', 1.2, 2.5, .5, .05, 1), { sw: TAU * 2 + .25, sy: 0, tw: 0, sk: .7, trail: 0, dust: 0, op: .2 }), 'o'],
  [1, K(BASE, { sw: TAU * 2 })]], { hits: [.36, .48, .6, .72], cues: [.2], rate: 14 });
 // Thorn Volley: two whip-cracks of the arms and mane fling thorns that rain on the party in three waves
 act('volley', 3.2, [[0, {}],
  [.28, K(cg('LM', 1.6, -1.6, -.5, .25, .6), cg('H', 1.5, -1.3, -.4, .1, .6), { sp: -.38, sb: -.25, sk: 1, op: .9, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2.4 }), 'o'],
  [.38, K(cg('LM', .9, 1.6, .9, .4, .4), cg('H', 1.2, .4, .3, .4, .4), { sp: .28, sb: .2, lean: .12, trail: 1, sq: .06, rust: 3 }), 'i'],
  [.44, K(cg('LM', 1.4, -.8, -.2, .3, .6), cg('H', 1.45, -.9, -.2, .2, .6), { sp: -.2, trail: .6 }), 'o'],
  [.5, K(cg('LM', .8, 1.7, .9, .4, .4), cg('H', 1.1, .5, .3, .4, .4), { sp: .3, trail: 1 }), 'i'],
  [.66, K(cg('LM', .7, 2, .8, .35, .6), cg('H', 1, .6, .4, -.1, .8), { sp: .12, trail: 0, op: .4 }), 'o'], [1, BASE]],
  { hits: [.58, .68, .78], cues: [.38, .5], rate: 16 });
 // Devour: the arms lift the prey into the flower, which shuts; three gulps (a blow, then a heal) while life spirals down
 // the spire; then it bursts open and the arms set the prey back where it stood
 act('devour', 5.2, [[0, {}],
  [.12, K(cg('LM', 1.3, -.6, .2, .3, .6, 0), { sp: -.15, sb: -.1, sk: 1, op: .3, hb: 1, lean: -.06, y: .05, rust: 2 }), 'o'],
  [.17, K(ARMS(1), { ikd: 1, wrap: 2.6, trail: .7, sp: .2, lean: .08 }), 'i'],
  [.26, { trail: 0, ikh: .5 }],
  [.42, { ikh: 5.4, pull: .55, sp: -.28, sb: -.25, op: 1.25, hb: 1.6, glow: .8 }],
  [.47, { pull: 1, ikh: 4.6, inn: 1 }, 'i'],
  [.52, K(cg('LM', .9, 1.4, .9, .4, .6, 0), { op: 0, hb: 1.2, sq: .06, gp: .4, drain: 1, feed: 1, sp: -.05, sb: .1 }), 'i'],
  [.58, { feed: 1.4, gp: 1 }], [.62, { feed: .8, gp: .2 }], [.68, { feed: 1.4, gp: 1 }], [.72, { feed: .8, gp: .2 }], [.78, { feed: 1.4, gp: 1 }], [.82, { feed: .8, gp: 0, drain: .3 }],
  [.86, K(ARMS(1), { op: 1.35, hb: 1.8, drain: 0, feed: .3, ikh: 4.6, pull: 1 }), 'o'],
  [.95, { pull: 0, ikh: 0, inn: 0, op: .6, sp: .15 }, 'o'],
  [.97, K(ARMS(0), { wrap: 0 })], [1, BASE]],
  { hits: [.2, .58, .68, .78], cues: [.62, .72, .82, .9], rate: 12 });
 // Thornwood: canes stab the soil, the ground splits toward the prey and tree-tall shoots burst up round it and squeeze
 // (animate() drives the shoots)
 act('briar', 3.8, [[0, {}],
  [.2, K(cg('LM', 1.6, -1, .2, .2, .6), cg('H', 1.5, -.8, .1, 0, .6), cg('FSB', 1.75, 1.6, .9, .15, .6), { sp: -.35, sb: -.2, sk: 1, op: .8, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2, feed: .3 }), 'o'],
  [.3, K(cg('LM', .3, 2.9, 1.3, .5, .3), cg('H', .9, 1.2, .6, .3, .3), cg('FSB', .25, 2.9, 1.3, .6, .3), { sp: .35, sb: .3, op: .2, lean: .14, y: -.04, sq: .14, rust: 2.8, dust: 1, feed: 1 }), 'i'],
  [.36, { dust: 0, sq: .06 }],
  [.6, K(cg('*', undefined, undefined, undefined, undefined, 1.2), { feed: .8, rust: 1.6, op: .5 })],
  [.66, { sq: .12, feed: 1.2, rust: 2.4, hb: 1.5 }], [.74, { sq: .05, feed: .7, hb: 1 }],
  [.86, K(cg('LM', 1.2, 1, .8, .3, .6), cg('FSB', 1.55, 1.5, .9, .3, .6), { sp: .1, lean: -.06, y: .04, sq: -.05, dust: .7, feed: .2, op: .2 }), 'o'],
  [1, BASE]], { hits: [.46, .66], cues: [.3, .86], rate: 14 });
 // Wrath: it curls in, then bursts open in a ring of red light; the battle sets state.wrath for its second phase's look
 act('enrage', 3.2, [[0, {}],
  [.28, K(cg('LM', .2, 3.2, 1.2, .9, .4), cg('H', .4, 2.6, .8, .6, .4), cg('FSB', .9, 3.2, 1, .3, .4), { coil: 1.8, sp: .55, sb: .9, ss: .1, op: 0, hb: .4, y: -.1, sq: .16, lean: .06, rust: .6, feed: .4 })],
  [.4, K(cg('LM', 1.7, -1.2, -.4, -.5, 1.6), cg('H', 1.6, -1.4, -.4, -.5, 1.6), cg('FSB', 1.6, 1.3, .2, -.2, 1.6), { coil: 0, sp: -.62, sb: -.4, ss: 0, op: 1.45, hb: 2.4, y: .16, sq: -.14, lean: -.12, rust: 3.6, feed: 1.5, shed: 1.5, dust: 1 }), 'o'],
  [.58, { shed: .3, dust: 0 }], [.78, K(ALERT, { op: .5, hb: 1.4, feed: .6 })], [1, BASE]],
  { cues: [.42], rate: 12 });
 // Hurt: the spire rocks back, every cane flinching away
 act('hurt', .8, [[0, {}], [.16, K(cg('*', 1.35, 1.8, .2, -.35, 2.5), { sp: -.3, sb: -.2, ss: .12, lean: -.12, y: .04, sq: -.08, op: .05, hb: .3, shed: 1.2, rust: 3 })], [1, BASE]], { interrupt: true, rate: 16 });
 act('block', .6, [[0, {}], [.3, K(GUARD, { lean: -.08, rust: 1.6 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18 });
 // Scorch: its recoil from fire; leaves catch and curl black, and the char fades over the next few seconds
 act('burn', 1.8, [[0, {}],
  [.12, K(cg('*', 1.5, .9, .1, -.5, 3.2), { sp: -.45, sb: -.3, ss: .15, op: 0, hb: .3, lean: -.2, y: .08, sq: -.1, shed: 2, rust: 3.6, fire: 1 }), 'o'],
  [.32, K(cg('*', 1.35, 1.3, .3, -.4, 2.4), { sp: -.3, ss: -.1, lean: -.14, fire: 1, shed: 1 })],
  [.62, K(cg('*', 1.2, 1.9, .5, -.15, 1.5), { sp: 0, ss: 0, lean: -.05, fire: .45, shed: .4, rust: 2 })],
  [1, BASE]], { interrupt: true, rate: 14 });
 act('rest', 2.0, [[0, {}], [1, REST]], { hold: true, rate: 5 });
 // Felled: a last flail, then the spire topples like a tree, the heart beats once more and goes dark, and it crumbles away
 act('die', 5.6, [[0, {}],
  [.08, K(cg('*', 1.6, 1.2, .5, .1, 3), { sp: -.4, sb: -.3, op: 1.3, hb: 2, lean: -.1, y: .08, sq: -.08, rust: 3, shed: 1, feed: 1.4 })],
  [.2, { op: .9, hb: 1.2, ss: .15 }],
  [.44, K(cg('LM', .1, .6, .2, -.2, .4), cg('H', -1.1, .9, .3, .2, .4), cg('FSB', .2, .5, .1, -.1, .15), { fall: 1, sp: .2, sb: .5, ss: .3, coil: 1, op: .5, hb: .9, lean: .05, y: -.1, sq: .25, shed: 1.6, dust: 1, feed: .2 }), 'i'],
  [.52, { fall: .95, dust: .4 }, 'o'], [.56, { fall: 1 }],
  [.7, { hb: 1.6, feed: 1 }], [.76, { hb: .1, feed: 0, wither: .6, shed: .6, dust: 0 }],
  [.9, { wither: 1, op: .3, pulse: 0, shed: 0 }], [.97, { fade: 0 }], [1, { fade: 0 }]],
  { hold: true, interrupt: true, cues: [.2, .5, .7], rate: 10 });
 // ---------- runtime ----------
 // state (written by the page or the battle): target, glow, wilt, wrath, open as the game's model; and for the field study:
 // xray (0 to 1, its roots under the meadow), frost (0 to 1, how cold the night is; its heart keeps the frost off its middle),
 // breath (0 to 1 and on, how much it steams), wind ({ x, z } in m/s, which way its steam drifts)
 const state = { target: null, glow: 1, wilt: 0, wrath: 0, open: 0, xray: 0, frost: undefined, breath: 1, wind: null };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, lastName = '', lastU = 0, lastPhase = 0;
 // the idle cane that tastes the air (TW), the pulse running out along the veins (VW), where a held prey belongs, the char
 // fire leaves, the heartbeat (HB the time since the last one, beat its swell) and how far into its wrath it is
 const TW = { k: -1, t: 0, dur: 2, wait: 2.2, e: 0 }, VW = { t: 9, s: 0 }, held = V3();
 let charV = 0, holdV = 0, idleW = 1, playN = 0, curN = 0, lastN = 0, HB = 0, beat = 0, wrathV = 0, spInit = false, beatN = 0;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.fade < .02 && (!actv || actv.name === 'die');
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force) {
   if (actv.name === 'die' && name !== 'appear') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; for (const C of CANES) C.sp = null; spInit = false; for (const Bq of BERRIES) Bq.init = false; }
  if (name === 'appear') { regrow(); charV = 0; }
  actv = { name, def, t: 0, n: ++playN };
  return true;
 }
 // a pulse of light running out from the heart along the veins (strength s; about a second to reach the roots' ends)
 const pulse = (s) => { VW.t = 0; VW.s = s; };
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _sd = V3(), _cf = V3(), _up = V3(), _z1 = V3(0, 0, 1), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const lerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
 const TIPW = new Float32Array(NS + 1); TIPW[NS - 3] = .2; TIPW[NS - 2] = .35; TIPW[NS - 1] = .45;
 // follow-through: each cane joint chases its pose on a spring, stiff near its base and softer toward the tip (slightly
 // underdamped); the great canes are heavier and swing slower
 const SPK = Float32Array.from({ length: NS + 1 }, (_, i) => 1150 * (1 - .62 * i / NS)), SPD = SPK.map((k) => 2 * .42 * Math.sqrt(k));
 // where each group takes hold round the prey: sideways (toward its own side) and up, in meters
 const HOLD = { L: [.32, .12], M: [.32, -.12], H: [.4, .5], F: [.5, -.3], S: [.6, .4], B: [.5, .7] };
 const IK = { yaw: 0, phi: 0, kap: 0, s: 0 };
 // a constant-curvature arc from the cane's base whose point at s* passes through the target (in its parent's space); a far
 // target makes the cane stretch, moving s* out toward the tip, and what is left past s* coils round the prey
 function solveReach(C, T) {
  _a.copy(T); C.pb.worldToLocal(_a);
  const B = C.chain[0].position, dx = _a.x - B.x, dy = _a.y - B.y, dz = _a.z - B.z, d = Math.hypot(dx, dz), c = Math.hypot(d, dy), s = IK.s = cl(c, C.len * .74, C.len * .9);
  IK.yaw = Math.atan2(dx, dz);
  let kap = 0;
  if (c < s * .999) { let lo = 0, hi = TAU / s * .98; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (2 * Math.sin(m * s / 2) / m - c > 0) lo = m; else hi = m; } kap = (lo + hi) / 2; }
  IK.phi = Math.min(2.5, Math.atan2(dy, d) + kap * s / 2); IK.kap = kap;
 }
 const st = { init: false, px: 0, pz: 0, acc: 0 }, PH = 1 / 120, DOWN = V3(0, -1, 0);
 // the spire's springs: each joint's pitch and side bend chase the pose, heavily; SPB is how much of the bow each joint takes
 const SPB = [0, 0, .06, .12, .2, .28, .34], SPX = SP.map(() => ({ x: 0, v: 0, z: 0, w: 0 }));
 // after the bind: each fruit bone's "down" in its own frame, so a bunch hangs plumb whatever holds it
 for (const Bq of BERRIES) { Bq.bone.getWorldQuaternion(_q); Bq.hang = DOWN.clone().applyQuaternion(_q.invert()).normalize(); Bq.dd = r2(0, .14); Bq.dk = 0; }
 // a point along the spire, f from its foot (0) to the bud (1)
 function spinePt(f, out) { const x = cl(f, 0, 1) * SPN, i = Math.min(SPN - 1, Math.floor(x)); SP[i].getWorldPosition(out); SP[i + 1].getWorldPosition(_d); return out.lerp(_d, x - i); }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  curN = actv ? actv.n : 0;
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  if (name !== 'whirl') FIN.sw = Math.atan2(Math.sin(FIN.sw), Math.cos(FIN.sw)); // after Maelstrom's turns, without unwinding them
  gW += ((gOn && !actv ? 1 : 0) - gW) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 0);
  const wk = actv ? 0 : walk;
  walkS += (wk - walkS) * (dt > 0 ? 1 - Math.exp(-dt * 6) : 1);
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  // the battle can hold the bud open, its heart bare, between its turns (state.open, 0 to 1)
  const heldOpen = cl(+state.open || 0, 0, 1); if (heldOpen > 0) { TGT.op = Math.max(TGT.op, 1.05 * heldOpen); TGT.hb = Math.max(TGT.hb, 1.3 * heldOpen); }
  const rate = actv ? actv.def.rate : 6, kk = dt > 0 ? 1 - Math.exp(-dt * rate) : 0;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  if (dt > 0) wrathV += (cl(+state.wrath || 0, 0, 1) - wrathV) * (1 - Math.exp(-dt * 1.2));
  const P = FIN, tt = t * (1 + .12 * wrathV);
  // the mound: breathing, the creep's bob, lean, twist and squash
  const breath = .5 + .5 * Math.sin(tt * .9), ps = .025 * P.pulse * (breath - .5);
  crown.position.set(0, P.y + walkS * .05 * Math.abs(Math.sin(phase)) + .012 * breath * P.pulse, 0);
  crown.rotation.set(P.lean + walkS * .04 + .01 * Math.sin(tt * .6) * P.pulse, P.tw + .014 * Math.sin(tt * .45) * P.pulse, P.rl + .01 * Math.sin(tt * .55) * P.pulse);
  mass.scale.set(1 + P.sq * .5 + ps, 1 - P.sq + ps * 1.4, 1 + P.sq * .5 + ps); crown.scale.setScalar(P.gr);
  // moved somewhere new by the battle: the springs start again
  const rx = root.position.x, rz = root.position.z;
  if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 3 * SZ) { st.init = true; for (const Bq of BERRIES) Bq.init = false; for (const C of CANES) C.sp = null; spInit = false; }
  st.px = rx; st.pz = rz;
  root.updateMatrixWorld(true);
  // the prey: state.target (world), or a point before it at chest height
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.1, REACH * SZ));
  _sd.set(_tg.x - rx, 0, _tg.z - rz); const tl = _sd.length() || 1; _sd.set(_sd.z / tl, 0, -_sd.x / tl);
  // idle: every couple of seconds one cane lifts its tip and tastes the air, swaying, then settles (more often in its wrath)
  idleW += ((actv && !(actv.def.hold && actv.t >= actv.def.dur) ? 0 : 1 - gW) - idleW) * (dt > 0 ? 1 - Math.exp(-dt * 3) : 0);
  if (dt > 0) {
   if (TW.k < 0) { TW.wait -= dt; if (TW.wait <= 0) { const live = CANES.filter((c) => c.cutJ < 0); if (live.length) { TW.k = live[(rnd2() * live.length) | 0].k; TW.t = 0; TW.dur = r2(2, 3); } else TW.wait = 1; } }
   else { TW.t += dt; if (TW.t >= TW.dur) { TW.k = -1; TW.wait = r2(.8, 2.6) * (1 - .5 * wrathV); } }
  }
  TW.e = TW.k < 0 ? 0 : Math.pow(Math.sin(PI * cl(TW.t / TW.dur, 0, 1)), 2) * idleW * (1 - walkS);
  // the heartbeat: a double beat every 1.7 s (quicker in its wrath); while it waits, each one runs out along its veins
  if (dt > 0) { HB += dt; const per = 1.7 - .55 * wrathV; if (HB > per) { HB -= per; if (P.fade > .9) beatN++; if (!actv && P.fade > .9) pulse(.35 + .35 * TIER + .5 * wrathV); } }
  beat = (Math.exp(-Math.pow((HB - .08) / .06, 2)) + .6 * Math.exp(-Math.pow((HB - .32) / .07, 2))) * P.pulse;
  // the physics substeps this frame, for the springs of the canes, the spire and the fruit
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  // ---------- the spire: it turns to its prey (sk), pitches (sp), bows at the top (sb), bends to the side (ss), twists (sy)
  // and, felled, topples forward and to its right; each joint chases its pose on a heavy spring ----------
  crown.worldToLocal(_a.copy(_tg)); const aim = cl(Math.atan2(_a.x, _a.z), -1.1, 1.1) * P.sk;
  const swX = .02 * Math.sin(tt * .7) * P.pulse, swZ = .016 * Math.sin(tt * .53 + 1) * P.pulse;
  for (let i = 0; i <= SPN; i++) {
   const S = SPX[i], X = P.sp / (SPN + 1) + P.sb * SPB[i] + swX + (i ? .03 : .95) * P.fall, Z = P.ss / (SPN + 1) + swZ + (i ? .03 : .6) * P.fall;
   if (!spInit) { S.x = X; S.z = Z; S.v = S.w = 0; }
   for (let n = 0; n < nSteps; n++) { S.v += (95 * (X - S.x) - 10 * S.v) * PH; S.x += S.v * PH; S.w += (95 * (Z - S.z) - 10 * S.w) * PH; S.z += S.w * PH; }
   SP[i].rotation.set(S.x, (i < 2 ? aim * .5 : 0) + P.sy / (SPN + 1), S.z);
  }
  spInit = true; SP[0].updateMatrixWorld(true);
  // ---------- the bud: it opens (op) and flares past open, gulps (gp), and the heart beats ----------
  const so = Math.max(0, P.op), o1 = sm(0, 1, so), ox = Math.max(0, so - 1), po = sm(.25, 1, so);
  bud.scale.setScalar(1 + .07 * P.gp); bud.rotation.set(.035 * Math.sin(tt * 1.1) * P.pulse, 0, .03 * Math.sin(tt * .8 + 1) * P.pulse);
  heart.scale.setScalar(1 + .05 * beat + .06 * P.gp); stam.scale.setScalar(Math.max(1e-3, sm(.2, .85, so)));
  for (const F of SEP) {
   const th = lerp(PI / 2 - .3, .2, o1) - .45 * ox + .025 * Math.sin(tt * 1.7 + F.ph) * o1, cu = lerp(.48, -.26, o1) - .2 * ox;
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  for (const F of PET) {
   const th = lerp(PI / 2 - .08, .5, po) - .25 * ox + .03 * Math.sin(tt * 1.3 + F.ph) * po, cu = lerp(.5, -.12, po);
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  bud.updateMatrixWorld(true);
  // the flower's middle, where it feeds; where a held prey belongs, and how firmly it is held
  bud.localToWorld(_cf.set(0, .75, 0));
  held.copy(_tg); held.y += P.ikh; held.lerp(_cf, P.pull);
  holdV = cl(Math.max(cl(Math.max(P.Lk, P.Mk), 0, 1) * sm(.7, 1.7, P.wrap), P.inn), 0, 1) * cl(P.fade * 2, 0, 1);
  // ---------- canes ----------
  for (const C of CANES) {
   const g = C.g, nJ = C.cutJ >= 0 ? C.cutJ : NS + 1;
   let lift = P[g + 'l'] + C.dl, curl = P[g + 'c'] + C.dc, tip = P[g + 't'];
   const w = P[g + 'w'] * (1 + .5 * wrathV), k = P[g + 'k'];
   let yaw = C.a - C.sgn * P[g + 'y'] + P.sw + w * .03 * Math.sin(tt * .6 + C.ph);
   if (TW.k === C.k && TW.e > 0) { const e = TW.e; lift += .3 * e; curl -= .9 * e; tip -= .8 * e; yaw += .16 * Math.sin(tt * 1.8 + C.ph) * e; }
   // the creep: alternate legs lift and swing forward, the others plant and pull
   if (walkS > 1e-3 && !C.great) { const p = phase + (C.k % 2) * PI, swg = Math.max(0, Math.sin(p)); lift += .3 * swg * walkS; curl -= .45 * swg * walkS; yaw += -Math.sin(C.a) * .2 * Math.cos(p) * walkS; }
   const bj = curl / (NS - 1), twn = g === 'L' || g === 'M' ? P.tn * C.sgn : 0;
   for (let i = 1; i < NS; i++) { C.bend[i] = bj + C.jb[i] + tip * TIPW[i] + w * .045 * Math.sin(tt * 1.1 + i * .85 + C.ph); C.yawW[i] = C.jy[i] + w * .04 * Math.sin(tt * .8 + i * .7 + C.ph * 1.3) + twn * .2 * Math.sin(i * 1.9); }
   let th0 = lift - C.bend[1] * .5 + w * .025 * Math.sin(tt * .5 + C.ph);
   if (k > 1e-3) {
    const H = HOLD[g]; C.chain[0].getWorldPosition(_b);
    _c.copy(_tg).addScaledVector(_sd, H[0] * C.sgn).add(_d.set(0, H[1], 0));
    _c.sub(_b).multiplyScalar(P.ikd).add(_b); _c.y += P.ikh; _c.lerp(_cf, P.pull);
    solveReach(C, _c);
    const jr = Math.round(IK.s / C.seg);
    yaw = lerpA(yaw, IK.yaw, k); th0 = lerp(th0, IK.phi - IK.kap * C.seg * .5, k);
    // past the reach point the tip coils round the prey: mostly sideways, round its body, a little downward
    const cw = Math.min(1.3, P.wrap / Math.max(1, NS - jr));
    for (let i = 1; i < NS; i++) { C.bend[i] = lerp(C.bend[i], i < jr ? IK.kap * C.seg : cw * .4, k); C.yawW[i] = lerp(C.yawW[i], i < jr ? C.yawW[i] * .15 : -C.sgn * cw * .95, k); }
   }
   const SPc = C.sp || (C.sp = { b: Float32Array.from(C.bend), bv: new Float32Array(NS + 1), y: Float32Array.from(C.yawW), yv: new Float32Array(NS + 1) });
   // a cane reaching for its prey stiffens, so it lands on the beat of its hit and still whips a little past it
   const sk = (1 + 3 * k) * (C.great ? .5 + .6 * k : .8), sd = Math.sqrt(sk);
   for (let n = 0; n < nSteps; n++) for (let i = 1; i < NS; i++) {
    SPc.bv[i] += (SPK[i] * sk * (C.bend[i] - SPc.b[i]) - SPD[i] * sd * SPc.bv[i]) * PH; SPc.b[i] += SPc.bv[i] * PH;
    SPc.yv[i] += (SPK[i] * sk * (C.yawW[i] - SPc.y[i]) - SPD[i] * sd * SPc.yv[i]) * PH; SPc.y[i] += SPc.yv[i] * PH;
   }
   for (let i = 1; i < NS; i++) { C.bend[i] = SPc.b[i]; C.yawW[i] = SPc.y[i]; }
   // keep it out of the ground: a joint that would sink is laid along the soil instead (not while it is still under it)
   C.pb.getWorldQuaternion(_q); _up.set(0, 1, 0).applyQuaternion(_q.invert());
   // (the height a joint gains is rho * sin(theta + dl): the parent's tilt, however large, along the cane's own plane)
   C.chain[0].getWorldPosition(_b); const hx = Math.sin(yaw) * _up.x + Math.cos(yaw) * _up.z, rho = Math.max(.05, Math.hypot(hx, _up.y)), dl = Math.atan2(hx, _up.y), by = (_b.y - root.position.y) / SZ, gnd = P.y > -.3;
   let th = th0, y = 0;
   for (let i = 0; i < NS; i++) {
    if (i > 0) th -= C.bend[i];
    const fl = C.rad(Math.min(C.len, (i + 1) * C.seg)) + .02 - by;
    let thW = th + dl, ny = y + C.seg * rho * Math.sin(thW);
    if (gnd && ny < fl) { const a = Math.asin(cl((fl - y) / (C.seg * rho), -1, 1)); thW = thW < -PI / 2 ? -PI - a : a; th = thW - dl; ny = y + C.seg * rho * Math.sin(thW); }
    C.theta[i] = th; y = ny;
   }
   C.chain[0].rotation.set(-C.theta[0], yaw, 0);
   const cj = P.coil * C.cm / (NS - 1);
   for (let i = 1; i < NS && i < nJ; i++) { C.chain[i].rotation.x = C.theta[i - 1] - C.theta[i]; C.chain[i].rotation.y = C.yawW[i] + cj; }
   if (nJ > NS) C.chain[NS].rotation.x = tip * .12;
   C.swing = walkS > 1e-3 && !C.great ? Math.sin(phase + (C.k % 2) * PI) : -1;
  }
  // ---------- Thornwood's shoots: planted round the prey's feet, up out of the soil, closing, squeezing, gone ----------
  const ug = name === 'briar' && P.fade > .02;
  if (ug) base.worldToLocal(_d.set(_tg.x, root.position.y, _tg.z));
  for (const S of SNARE) {
   const b0 = S.chain[0], e0 = .44 + S.t0, x = ug ? cl((u - e0) / .07, 0, 1) : 0;
   const gIn = x <= 0 ? 0 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2), gOut = ug ? 1 - sm(.85 + S.t0 * .6, .94 + S.t0 * .6, u) : 0;
   S.g = gIn * gOut;
   if (S.g <= 1e-3) { b0.position.set(0, -1, 0); b0.scale.setScalar(1e-4); continue; }
   const px = _d.x + Math.cos(S.a) * S.R / SZ, pz = _d.z + Math.sin(S.a) * S.R / SZ, close = sm(e0 + .03, .6, u), sq = win(u, .62, .71, .025);
   b0.position.set(px, _d.y, pz); b0.scale.setScalar(S.g);
   b0.rotation.set(-(PI / 2 + S.lean - close * (S.lean + .22) - .12 * sq), Math.atan2(_d.x - px, _d.z - pz), 0);
   for (let i = 1; i <= UN; i++) { const c = S.chain[i]; c.rotation.x = close * S.curl * (1 + .45 * sq) + .05 * Math.sin(tt * 2.6 + S.ph + i * 1.3) * close; c.rotation.y = .08 * Math.sin(tt * 2 + S.ph * 1.7 + i) * close; }
  }
  root.updateMatrixWorld(true);
  // ---------- fruit on pendulums ----------
  const damp = Math.exp(-1.8 * PH), floorY = P.y > -.3 ? root.position.y + .05 * SZ : -1e4, dying = name === 'die' ? u : 0;
  for (const Bq of BERRIES) {
   const b = Bq.bone, L = Bq.len * SZ, dk = dying > 0 ? Math.pow(sm(.3 + Bq.dd, .46 + Bq.dd, dying), 2) : 0;
   if (dk > 0 || Bq.dk > 0) { // on defeat the fruit lets go and drops to the soil; it hangs again when it grows back
    b.position.copy(b.userData.bind.p); _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
    if (dk > 0) { _a.y = lerp(_a.y, Math.min(_a.y, floorY + L * .4), dk); b.position.copy(b.parent.worldToLocal(_c.copy(_a))); }
    Bq.dk = dk;
   } else _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
   if (!Bq.init || Bq.X.distanceTo(_a) > L * 4) { Bq.X.copy(_a); Bq.X.y -= L; Bq.Xp.copy(Bq.X); Bq.init = true; }
   for (let n = 0; n < nSteps; n++) {
    _b.subVectors(Bq.X, Bq.Xp).multiplyScalar(damp); Bq.Xp.copy(Bq.X); Bq.X.add(_b); Bq.X.y -= 9.8 * PH * PH;
    Bq.X.x += Math.sin(tt * 1.3 + Bq.sway) * 1.5e-6 * P.rust; Bq.X.z += Math.cos(tt * 1.1 + Bq.sway) * 1.5e-6 * P.rust;
    _c.subVectors(Bq.X, _a); const l = _c.length() || 1e-6; Bq.X.copy(_a).addScaledVector(_c, L / l);
    if (Bq.X.y < floorY) Bq.X.y = floorY;
   }
   _c.subVectors(Bq.X, _a).normalize(); b.parent.getWorldQuaternion(_q); _c.applyQuaternion(_q.invert());
   b.quaternion.setFromUnitVectors(Bq.hang, _c);
   b.updateMatrixWorld(true);
  }
  // ---------- severed pieces fall, settle and burn away ----------
  for (const C of CANES) if (C.piece) {
   const pc = C.piece, b = pc.b; pc.t += dt;
   if (!pc.rest) {
    pc.vel.y -= 9.8 / SZ * dt; b.position.addScaledVector(pc.vel, dt);
    if (b.position.y < .08) { b.position.y = .08; if (pc.vel.y < -.8) { puff(b.getWorldPosition(_a), 8, 1); } pc.vel.y = pc.vel.y < -.8 ? -pc.vel.y * .22 : 0; pc.vel.x *= .5; pc.vel.z *= .5; if (pc.vel.lengthSq() < .02) pc.rest = true; }
   }
   _a.set(0, 0, 1).applyQuaternion(b.quaternion); _b.set(_a.x, 0, _a.z); if (_b.lengthSq() < 1e-4) _b.set(1, 0, 0); _b.normalize();
   _q.setFromUnitVectors(_a, _b).multiply(b.quaternion); b.quaternion.slerp(_q, 1 - Math.exp(-dt * (b.position.y <= .081 ? 5 : 1.6)));
   for (let i = pc.j + 1; i <= NS; i++) { const c = C.chain[i]; c.rotation.x *= Math.exp(-dt * 3); c.rotation.y *= Math.exp(-dt * 3); }
   U.cut.value[C.k].z = sm(1.5, 2.8, pc.t); U.cut.value[C.k].w = Math.max(0, 1 - pc.t * 1.3);
   b.updateMatrixWorld(true);
  }
  // ---------- looks ----------
  const fk = cl(P.fade, 0, 1) * fadeE;
  U.time.value = tt; U.flut.value = P.rust * (1 + .6 * walkS);
  U.ctr.value.copy(root.position); U.warm.value.z = SZ; if (state.frost !== undefined) U.frost.value = cl(+state.frost || 0, 0, 1);
  if (dt > 0) XRAY.value += (cl(+state.xray || 0, 0, 1) - XRAY.value) * (1 - Math.exp(-dt * 4)); xroots.visible = XRAY.value > .01;
  U.dis.value = 1 - fk; U.disCol.value.copy(name === 'appear' ? GROWC : BURNC); U.with.value = cl(Math.max(P.wither, state.wilt * .3), 0, 1); U.thin.value = cl(+state.wilt || 0, 0, 1) * .45;
  U.clip.value = name === 'appear' && u < .7 ? root.position.y + .004 : -1e4;
  M.soil.opacity = fk;
  M.berry.emissive.copy(BERRYGLOW).multiplyScalar(cl(P.glow, 0, 2) * .32 * fk * (state.glow === undefined ? 1 : +state.glow));
  // the veins: a glow while it feeds, the glow at rest (stronger at the higher levels and in its wrath), and each pulse
  // running out from the heart, down the spire and into the roots and the canes
  if (dt > 0) VW.t += dt;
  U.vein.value.set(cl(P.feed, 0, 1.5) * fk, VW.t / .9 * 1.8 - .1, VW.s * (1 - sm(.8, 1.1, VW.t)) * fk, lerp(VEIN, 1.3, wrathV) * fk * (1 - P.wither));
  U.veinC.value.copy(VEINC).lerp(WRATHC, wrathV); U.wrath.value = wrathV;
  U.heartC.value.copy(HEARTC).lerp(WRATHC, wrathV * .45); U.hb.value = cl(P.hb, 0, 2.5) * (1 + .7 * beat) * (1 + .35 * wrathV) * fk * (1 - P.wither * .9);
  // fire: flames while it burns, and the char they leave, which fades over the next few seconds
  if (dt > 0) charV = P.fire > .05 ? Math.min(.34, charV + dt * P.fire * .7) : Math.max(0, charV - dt * .06);
  U.char.value = charV * fk; U.burn.value = cl(P.fire, 0, 1) * fk;
  liftV = Math.max(0, P.y * SZ);
  updateFX(name, u, t, dt, fk, phase);
  lastName = name; lastU = u; lastPhase = phase; lastN = curN;
 }
 // ---------- effects ----------
 const fxS = { acc: { shed: 0, dust: 0, lure: 0, drain: 0, fire: 0, rip: 0, sap: 0, erupt: 0, vortex: 0, ember: 0, steam: 0 } };
 const STEAMC = C3(.62, .62, .7), STEAMH = C3(1, .55, .66);
 const GROWC = C3(.55, .95, .3), BURNC = C3(1, .6, .22), C1 = new THREE.Color(), LEAFC = C3(.42, .58, .28), DEADC = C3(.62, .46, .26), DUSTC = C3(.34, .27, .2), CHIPC = C3(.2, .1, .08);
 const SWEET = [C3(1, .72, .45), C3(1, .5, .62), C3(1, .9, .7)], DRAINC = C3(.75, 1, .42), PETALC = C3(.95, .8, .82);
 const JUICEC = C3(.3, .015, .09), SOILC = C3(.16, .11, .07), SMOKEC = C3(.13, .11, .11), FLAMEC = C3(1, .8, .4), EMBERC = C3(1, .45, .12);
 const BERRYGLOW = C3(.55, .12, .2);
 const VEINC = C3(1, .14, .42), WRATHC = C3(1, .3, .08), HEARTC = C3(1, .16, .36);
 const lim = (C) => (C.cutJ >= 0 ? C.cutJ - 1 : NS);
 const tipW = (C, out) => C.chain[lim(C)].getWorldPosition(out);
 function canePt(C, f, out) {
  const s = f * C.len, j = Math.min(Math.floor(s / C.seg), NS - 1);
  if (j + 1 > lim(C)) return tipW(C, out);
  C.chain[j].getWorldPosition(out); C.chain[j + 1].getWorldPosition(_d); return out.lerp(_d, s / C.seg - j);
 }
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 function leafBurst(p, n, spread, wither, col) {
  for (let i = 0; i < n; i++) emit(LF, p.x + (rnd() - .5) * spread, p.y + (rnd() - .5) * spread, p.z + (rnd() - .5) * spread, (rnd() - .5) * 3.4, rnd() * 2.6, (rnd() - .5) * 3.4, 2 + rnd() * 1.2, C1.copy(col || LEAFC).lerp(DEADC, wither).multiplyScalar(.8 + .4 * rnd()), 1, (.22 + .12 * rnd()) * SZ, (.22 + .12 * rnd()) * SZ, 1.8, -1.6, (rnd() - .5) * 8, .7);
 }
 function chips(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, rnd() * sp * .8, (rnd() - .5) * sp, .7 + rnd() * .5, CHIPC, .95, (.05 + .04 * rnd()) * SZ, .03 * SZ, 1.2, -8); }
 function puff(p, n, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU; emit(DU, p.x + Math.cos(a) * .2 * s, Math.max(.1, p.y), p.z + Math.sin(a) * .2 * s, Math.cos(a) * .9 * s, .3 + rnd() * .4, Math.sin(a) * .9 * s, 1.4 + rnd() * .8, DUSTC, .5, .5 * s * SZ, 1.5 * s * SZ, 1.5, .12); } }
 // berry juice and dark sap: heavy drops that fall and splash; clods of soil thrown up out of the ground
 function juice(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, (.2 + rnd() * .8) * sp, (rnd() - .5) * sp, .7 + rnd() * .5, JUICEC, 1, (.06 + .05 * rnd()) * SZ, .04 * SZ, .5, -9); }
 function clods(p, n, sp, up) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * sp; emit(CHP, p.x + Math.cos(a) * .15, p.y + .03, p.z + Math.sin(a) * .15, Math.cos(a) * r, up * (.6 + rnd() * .7), Math.sin(a) * r, .8 + rnd() * .6, SOILC, 1, (.07 + .08 * rnd()) * SZ, .05 * SZ, .35, -9.8); } }
 function ring(n, r0, r1, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rr(r0, r1) * SZ; _a.set(root.position.x + Math.cos(a) * r, .1, root.position.z + Math.sin(a) * r); emit(DU, _a.x, _a.y, _a.z, Math.cos(a) * 1.4, .4 + rnd() * .5, Math.sin(a) * 1.4, 1.5 + rnd() * .7, DUSTC, .55, .6 * s * SZ, 1.9 * s * SZ, 1.4, .12); } }
 // the cracks: strip i runs from ckA[i] to ckB[i], w (by SZ) to each side; open how far along they have split (0 to 1.1)
 let ckUsed = false;
 function crackDraw(open, glow, fade, w) {
  for (let i = 0; i < NCK; i++) {
   const A = ckA[i], B = ckB[i], dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz) || 1, ww = w * SZ * ckOn[i] * (len > .3 ? 1 : 0), sx = dz / len * ww, sz = -dx / len * ww;
   ckPos.set([A.x - sx, A.y, A.z - sz, A.x + sx, A.y, A.z + sz, B.x - sx, B.y, B.z - sz, B.x + sx, B.y, B.z + sz], i * 12);
  }
  ckG.attributes.position.needsUpdate = true; crack.visible = ckUsed = true;
  const cu = crack.material.uniforms; cu.uOpen.value = open; cu.uGlow.value = glow; cu.uFade.value = fade;
 }
 const cracksFrom = (c, L0, L1) => { for (let i = 0; i < NCK; i++) { const a = (i + rr(-.3, .3)) / NCK * TAU, L = rr(L0, L1) * SZ; ckA[i].copy(c); ckB[i].set(c.x + Math.sin(a) * L, c.y, c.z + Math.cos(a) * L); ckOn[i] = 1; } };
 // Thorn Volley: [launched at, lands at, how many], each wave thrown from the arms' and the mane's tips
 const VOLLEY = [[.38, .58, 9], [.42, .68, 9], [.5, .78, 10]];
 function launch(a, b, T) { const S = TVS[tvN++ % NTV]; S.p0.copy(a); S.v.subVectors(b, a).multiplyScalar(1 / T); S.v.y += 4.9 * T; S.t = 0; S.T = T; S.stick = -1; S.spin = rr(-9, 9); }
 const _m4b = new THREE.Matrix4(), _sc = V3();
 function stepVolley(dt) {
  let any = false;
  for (let i = 0; i < NTV; i++) {
   const S = TVS[i]; if (S.t < 0) continue; any = true; S.t += dt;
   if (S.stick < 0) { // in flight, point first along its arc
    const tt = Math.min(S.t, S.T); _a.copy(S.p0).addScaledVector(S.v, tt); _a.y -= 4.9 * tt * tt; S.d.copy(S.v); S.d.y -= 9.8 * tt; S.d.normalize();
    if (S.t >= S.T) { S.stick = 0; _a.y = root.position.y; _c.copy(_a); clods(_c, 5, 1.8, 2.6); puff(_c, 2, .9); chips(_c, 4, 2.4); }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.t)); _a.addScaledVector(S.d, -(S.stick < 0 ? .5 : .72) * SZ);
    if (S.stick === 0) S.p0.copy(_a);
    TV.setMatrixAt(i, _m4b.compose(_a, _q, _sc.setScalar(SZ)));
   } else { // stuck in the soil; after a while it crumbles away
    S.stick += dt; const k = 1 - sm(1.8, 2.4, S.stick);
    if (k <= 0) { S.t = -1; TV.setMatrixAt(i, M0); _c.copy(S.p0).addScaledVector(S.d, .7 * SZ); puff(_c, 2, .7); continue; }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.T)); TV.setMatrixAt(i, _m4b.compose(S.p0, _q, _sc.setScalar(SZ * k)));
   }
  }
  if (any || stepVolley.was) TV.instanceMatrix.needsUpdate = true; stepVolley.was = any;
 }
 function updateFX(name, u, t, dt, fk, phase) {
  const P = FIN;
  ckUsed = false;
  // whip trails: which canes trail depends on the move
  const trW = (C) => (name === 'whirl' ? 1.7 : name === 'lance' ? +(C === LEAD) : name === 'volley' ? +C.great : +(C === LEAD || C === MATE));
  let anyT = false;
  TR.forEach((T, r) => {
   const C = T.C, kk = P.trail * fk * trW(C) * (C.cutJ < 0 ? 1 : 0), o = r * TRN * 6;
   if (kk > .01) {
    anyT = true; tipW(C, _a); canePt(C, .88, _b);
    if (T.prev <= .01) for (let i = 0; i < TRN; i++) { T.tip[i].copy(_a); T.mid[i].copy(_b); }
    for (let i = TRN - 1; i > 0; i--) { T.tip[i].copy(T.tip[i - 1]); T.mid[i].copy(T.mid[i - 1]); }
    T.tip[0].copy(_a); T.mid[0].copy(_b);
    for (let i = 0; i < TRN; i++) { const k = kk * Math.pow(1 - i / (TRN - 1), 3), r0 = lerp(.24, .42, wrathV), g0 = lerp(.13, .1, wrathV), b0 = lerp(.16, .04, wrathV); trPos.set([T.tip[i].x, T.tip[i].y, T.tip[i].z, T.mid[i].x, T.mid[i].y, T.mid[i].z], o + i * 6); trCol.set([r0 * k, g0 * k, b0 * k, .02 * k, .01 * k, .01 * k], o + i * 6); }
   } else if (T.prev > .01) trCol.fill(0, o, o + TRN * 6);
   T.prev = kk;
  });
  trail.visible = anyT; if (anyT) trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
  // leaves shaken loose, dust, pollen
  const amb = fk * (name === 'die' ? 1 - sm(.7, .95, u) : 1);
  fxS.acc.shed += dt * (P.shed * 60 + .2 * P.rust) * amb;
  while (fxS.acc.shed >= 1) {
   fxS.acc.shed -= 1; const r = rnd();
   if (r < .3) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.4, CH * rr(.4, 1.1), (rnd() - .5) * CR * 1.4)); else if (r < .45) spinePt(rr(.1, 1), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.15, .95), _a);
   leafBurst(_a, 1, .2 * SZ, Math.max(P.wither, state.wilt * .5));
  }
  fxS.acc.dust += dt * P.dust * 60 * amb; while (fxS.acc.dust >= 1) { fxS.acc.dust -= 1; ring(1, CR * .9, CR * 2.4, 1); }
  // Siren Bloom's pollen: sweet glowing motes pouring off the heart and drifting over its prey
  fxS.acc.lure += dt * P.lure * 70 * fk;
  while (fxS.acc.lure >= 1) { fxS.acc.lure -= 1; heart.localToWorld(_a.set((rnd() - .5) * .6, rr(.5, 1.1), (rnd() - .5) * .6)); _b.subVectors(_tg, _a); const tm = rr(1.6, 2.6); emit(MO, _a.x, _a.y, _a.z, _b.x / tm + (rnd() - .5) * .6, _b.y / tm + rr(.2, .7), _b.z / tm + (rnd() - .5) * .6, tm * 1.05, SWEET[(rnd() * 3) | 0], .75, .14 * SZ, .07 * SZ, .25, -.3, 0, .35); }
  // the ribbons: pollen streaming from the heart to the prey (Siren Bloom), or stolen life spiralling down the spire into
  // the roots (Devour)
  const dk = cl(P.drain, 0, 1) * fk, lk = cl(P.lure * .6, 0, 1) * fk, rk = Math.max(dk, lk); drain.visible = rk > .01;
  if (drain.visible) {
   const pol = lk > dk; heart.localToWorld(_b.set(0, .8, 0));
   for (let r = 0, o = 0; r < DRN; r++) {
    const ph = r * TAU / DRN, cc = pol ? SWEET[r] : DRAINC;
    for (let i = 0; i <= DRS; i++, o += 6) {
     const s = i / DRS;
     if (pol) { const th = s * TAU * 1.3 + t * 3 + ph, rad = (.15 + .5 * Math.sin(PI * s)) * SZ; _a.copy(_b).lerp(_tg, s); _a.x += Math.cos(th) * rad; _a.y += Math.sin(PI * s) * (1.2 + .3 * r) * SZ + Math.sin(th) * rad * .6; _a.z += Math.sin(th) * rad; }
     else { const th = s * TAU * 2.2 - t * 4 + ph, rad = (.55 + .15 * Math.sin(s * 9 + t)) * SZ; spinePt(1 - s, _a); _a.x += Math.cos(th) * rad; _a.y += lerp(.6, -.2, s) * SZ; _a.z += Math.sin(th) * rad; }
     const w = (pol ? .06 : .1) * SZ * (1 - .4 * s), k = (pol ? .9 : 1.2) * rk * sm(0, .08, s) * sm(1, .9, s) * (.25 + .75 * Math.pow(Math.max(0, Math.sin(s * 14 - t * (pol ? 6 : 10) + ph * 2)), 2));
     drPos[o] = drPos[o + 3] = _a.x; drPos[o + 1] = _a.y - w; drPos[o + 4] = _a.y + w; drPos[o + 2] = drPos[o + 5] = _a.z;
     drCol[o] = drCol[o + 3] = cc.r * k; drCol[o + 1] = drCol[o + 4] = cc.g * k; drCol[o + 2] = drCol[o + 5] = cc.b * k * .85;
    }
   }
   drG.attributes.position.needsUpdate = drG.attributes.color.needsUpdate = true;
  }
  // fire: flames licking up along the canes, the spire and off the mound, with smoke and embers; and in its wrath, embers
  // rising off it all the time
  fxS.acc.fire += dt * P.fire * 160 * fk;
  while (fxS.acc.fire >= 1) {
   fxS.acc.fire -= 1; const r = rnd();
   if (r < .25) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.3, CH * rr(.5, 1.05), (rnd() - .5) * CR * 1.3)); else if (r < .45) spinePt(rnd(), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.1, .9), _a);
   emit(FL, _a.x, _a.y, _a.z, (rnd() - .5) * .5, 1 + rnd(), (rnd() - .5) * .5, .5 + rnd() * .4, FLAMEC, .9, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.2, 2.2, 0, .2);
   if (rnd() < .3) emit(DU, _a.x, _a.y + .2, _a.z, (rnd() - .5) * .3, .7 + rnd() * .5, (rnd() - .5) * .3, 1.6 + rnd() * .6, SMOKEC, .45, .5 * SZ, 1.8 * SZ, 1, .4);
   if (rnd() < .25) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 1.2, 1.2 + rnd(), (rnd() - .5) * 1.2, 1 + rnd() * .8, EMBERC, .9, .07 * SZ, .02 * SZ, .8, .6, 0, .4);
  }
  fxS.acc.ember += dt * wrathV * 16 * fk;
  while (fxS.acc.ember >= 1) { fxS.acc.ember -= 1; const r = rnd(); if (r < .4) spinePt(rnd(), _a); else if (r < .7) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.5, CH * rr(.3, 1), (rnd() - .5) * CR * 1.5)); else canePt(CANES[(rnd() * NC) | 0], rr(.05, .6), _a); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .4, .5 + rnd() * .7, (rnd() - .5) * .4, 1.6 + rnd(), EMBERC, .8, .06 * SZ, .015 * SZ, .5, .3, 0, .35); }
  // the heart's light between the sepals (much brighter as it opens), and the firelight while it burns
  heart.localToWorld(heartLight.position.set(0, .6, 0)); heartLight.color.copy(U.heartC.value); heartLight.intensity = U.hb.value * (.5 + 1.7 * sm(.05, .9, P.op)) * .75;
  const fireI = cl(P.fire, 0, 1) * fk * 4 * (.78 + .22 * Math.sin(t * 31) * Math.sin(t * 17.3)); fireLight.intensity = fireI; if (fireI > 0) spinePt(.25, fireLight.position);
  // a severed cane's stump bleeds dark sap for a while
  for (const C of CANES) if (C.bleed > 0 && C.cutJ > 0) {
   C.bleed -= dt; fxS.acc.sap += dt * 18 * fk * Math.min(1, C.bleed);
   while (fxS.acc.sap >= 1) { fxS.acc.sap -= 1; C.chain[C.cutJ - 1].localToWorld(_a.set(0, 0, C.seg * .5)); emit(CHP, _a.x, _a.y, _a.z, (rnd() - .5) * .4, -.1, (rnd() - .5) * .4, .9, JUICEC, 1, .07 * SZ, .04 * SZ, .3, -7); }
  }
  // ---------- the moves ----------
  // Awakening: the ground trembles and splits, earth erupts as it heaves up, its legs slam down, and the bud roars open
  if (name === 'appear') {
   if (crossed(name, u, 'appear', ACTS.appear.cues[0])) { _a.set(root.position.x, root.position.y + .012, root.position.z); cracksFrom(_a, 6, 8.5); ring(24, CR * .5, CR * 2.4, 1.2); }
   const s0 = sm(.03, .16, u), fade = 1 - sm(.6, .75, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.5 + .5 * sm(.1, .2, u)) * (1 - sm(.45, .7, u)), fade, .9);
   if (u > .12 && u < .46) { fxS.acc.erupt += dt * 110 * fk; while (fxS.acc.erupt >= 1) { fxS.acc.erupt -= 1; const a = rnd() * TAU, r = CR * rr(.5, 1.35) * SZ; _a.set(root.position.x + Math.sin(a) * r, root.position.y + .05, root.position.z + Math.cos(a) * r); if (rnd() < .6) clods(_a, 1, 2.2, 4.2); else puff(_a, 1, 1.4); } }
   if (crossed(name, u, 'appear', .5)) for (const C of CANES) if (!C.great) { tipW(C, _a); clods(_a, 8, 2.4, 3); puff(_a, 4, 1.1); }
   if (crossed(name, u, 'appear', ACTS.appear.cues[1])) { const x = root.position.x, z = root.position.z; shock(x, z, 1, 17 * SZ, 1.4, VEINC, .9, true); shock(x, z, 1, 12 * SZ, 1.8, DUSTC, .75, false); bud.localToWorld(_a.set(0, 1, 0)); leafBurst(_a, 20, 2.5 * SZ, 0); leafBurst(_a, 14, 2 * SZ, 0, PETALC); chips(_a, 20, 5); ring(30, CR * .6, CR * 2.8, 1.3); pulse(2.2); }
  }
  // Thorn Lance: a crater where it spears into the soil; it rips free
  if (crossed(name, u, 'lance', ACTS.lance.hits[0]) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 24, 4); juice(_a, 16, 3.4); leafBurst(_a, 8, .5 * SZ, 0); _b.set(_a.x, root.position.y + .05, _a.z); clods(_b, 26, 3, 4.5); puff(_b, 8, 1.5); shock(_b.x, _b.z, .3, 4.5 * SZ, .7, DUSTC, .75, false); }
  if (crossed(name, u, 'lance', .66) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 12, 3); clods(_a, 14, 2.4, 3.6); juice(_a, 8, 2.4); }
  // Hammerfall: the club lands; the ground splits from the crater and a shockwave runs out over the party
  if (name === 'slam') {
   if (crossed(name, u, 'slam', ACTS.slam.hits[0])) {
    tipW(LEAD, _a); tipW(MATE, _b); _a.lerp(_b, .5); _a.y = root.position.y + .012;
    clods(_a, 40, 4.4, 5.2); chips(_a, 26, 5); puff(_a, 14, 2.2); leafBurst(_a, 12, 1.5 * SZ, 0); juice(_a, 10, 3.4);
    shock(_a.x, _a.z, .5, 12 * SZ, 1.2, DUSTC, .9, false); shock(_a.x, _a.z, .3, 8 * SZ, .8, VEINC, .85, true); cracksFrom(_a, 4, 7); pulse(1.8);
   }
   const s0 = sm(.5, .6, u), fade = 1 - sm(.82, .97, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.4 + .6 * sm(.5, .55, u)) * (1 - sm(.68, .9, u)), fade, 1);
   if (crossed(name, u, 'slam', .7)) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 2.6); clods(_a, 10, 2.2, 3.2); }
  }
  // Maelstrom: a vortex of dust and leaves round it while its canes whirl
  if (name === 'whirl') {
   fxS.acc.vortex += dt * P.trail * 80 * fk;
   while (fxS.acc.vortex >= 1) {
    fxS.acc.vortex -= 1; const a = rnd() * TAU, r = rr(3, 10) * SZ, x = root.position.x + Math.sin(a) * r, z = root.position.z + Math.cos(a) * r, v = 5 + rnd() * 4;
    emit(DU, x, .2, z, Math.cos(a) * v, .4 + rnd() * .8, -Math.sin(a) * v, 1.2 + rnd() * .6, DUSTC, .5, .7 * SZ, 2.2 * SZ, 1.4, .35);
    if (rnd() < .4) emit(LF, x, rr(.5, 3.5), z, Math.cos(a) * v * 1.2, rr(.5, 1.5), -Math.sin(a) * v * 1.2, 1.5, C1.copy(LEAFC).multiplyScalar(.8 + .4 * rnd()), 1, .25 * SZ, .25 * SZ, 1, -1, (rnd() - .5) * 12, .5);
   }
   for (const h of ACTS.whirl.hits) if (crossed(name, u, 'whirl', h)) for (const C of CANES) if (C.great && C.cutJ < 0) { tipW(C, _a); leafBurst(_a, 3, .4 * SZ, 0); chips(_a, 5, 3.4); }
  }
  // Thorn Volley: each whip-crack throws a wave of thorns in high arcs onto the ground round the prey
  for (const [ul, uh, n] of VOLLEY) if (crossed(name, u, 'volley', ul)) {
   const T = (uh - ul) * ACTS.volley.dur;
   for (let i = 0; i < n; i++) { const C = CANES[i % 4]; if (C.cutJ >= 0) continue; tipW(C, _a); const a = rnd() * TAU, r = Math.sqrt(rnd()) * 3.4 * SZ; _b.set(_tg.x + Math.sin(a) * r, root.position.y, _tg.z + Math.cos(a) * r); launch(_a, _b, T * rr(.94, 1)); chips(_a, 2, 2); }
  }
  stepVolley(dt);
  // Devour: the arms seize; the flower takes the prey and shuts; three gulps; it spits it back out
  if (name === 'devour') {
   if (crossed(name, u, 'devour', ACTS.devour.hits[0])) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 3.4); leafBurst(_a, 4, .3 * SZ, 0); }
   if (crossed(name, u, 'devour', .5)) { bud.localToWorld(_a.set(0, 1.2, 0)); leafBurst(_a, 14, 1.4 * SZ, 0, PETALC); juice(_a, 16, 3.4); pulse(1.6); }
   for (const h of ACTS.devour.hits.slice(1)) if (crossed(name, u, 'devour', h)) { bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 18; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 3.4, rnd() * 2.4, (rnd() - .5) * 3.4, .7, DRAINC, .85, .14 * SZ, .02 * SZ, 2.6); pulse(1.4); }
   if (crossed(name, u, 'devour', .86)) { bud.localToWorld(_a.set(0, 1.1, 0)); juice(_a, 22, 4.4); leafBurst(_a, 16, 1.6 * SZ, 0, PETALC); chips(_a, 10, 3.4); }
  }
  // Siren Bloom: a slow sweet ring of light as the flower opens
  if (crossed(name, u, 'bloom', ACTS.bloom.cues[0])) shock(root.position.x, root.position.z, 1, 11 * SZ, 2.4, SWEET[1], .4, true);
  // Thornwood: the canes stab into the soil, the ground splits toward the prey, the shoots burst up and sink back
  if (name === 'briar') {
   const UG = ACTS.briar;
   if (crossed(name, u, 'briar', UG.cues[0])) { pulse(2); for (const C of CANES) if (C.cutJ < 0 && C.g !== 'B' && C.g !== 'H') { tipW(C, _a); clods(_a, 8, 2.4, 3.2); puff(_a, 4, 1.2); } }
   _b.set(_tg.x, root.position.y + .012, _tg.z);
   if (crossed(name, u, 'briar', .318)) { let n = 0; for (const C of [LEAD, MATE].concat(CANES.filter((c) => c.g === 'F' || c.g === 'S'))) if (n < NCK && C.cutJ < 0) { tipW(C, ckA[n]); ckA[n].y = _b.y; ckOn[n++] = 1; } for (; n < NCK; n++) ckOn[n] = 0; }
   for (let i = 0; i < NCK; i++) ckB[i].copy(_b);
   const s0 = sm(.32, .44, u), fade = 1 - sm(.86, .98, u);
   if (s0 > 0 && fade > 0) {
    crackDraw(s0 * 1.1, (.45 + .55 * sm(.4, .46, u)) * (1 - sm(.7, .9, u)) * fk, fade * fk, 1);
    if (s0 < 1) { fxS.acc.rip += dt * 60; while (fxS.acc.rip >= 1) { fxS.acc.rip -= 1; const i = (rnd() * NCK) | 0; if (!ckOn[i]) continue; _c.copy(ckA[i]).lerp(_b, s0); puff(_c, 1, .9); if (rnd() < .5) clods(_c, 1, 1, 2.2); } }
   }
   for (const S of SNARE) {
    if (S.g > .02 && !S.up) { S.up = true; S.chain[0].getWorldPosition(_c); clods(_c, 10, 2.2, 4); puff(_c, 4, 1.4); chips(_c, 5, 3); }
    if (S.up && !S.down && u > .86 + S.t0 * .6) { S.down = true; S.chain[0].getWorldPosition(_c); puff(_c, 3, 1.2); clods(_c, 4, 1.2, 2); }
   }
   if (crossed(name, u, 'briar', UG.hits[0])) { _c.set(_tg.x, root.position.y + .05, _tg.z); clods(_c, 18, 3, 4.6); }
   if (crossed(name, u, 'briar', UG.hits[1])) { _c.copy(_tg); chips(_c, 20, 3.4); leafBurst(_c, 10, .8 * SZ, 0); }
   if (crossed(name, u, 'briar', UG.cues[1])) for (const C of CANES) if (C.cutJ < 0 && !C.great) { tipW(C, _a); clods(_a, 6, 1.6, 3); puff(_a, 2, .9); }
  } else if (SNARE[0].up) for (const S of SNARE) S.up = S.down = false;
  // Wrath: a ring of red light and a storm of embers as it bursts open
  if (crossed(name, u, 'enrage', ACTS.enrage.cues[0])) {
   const x = root.position.x, z = root.position.z; shock(x, z, 1, 19 * SZ, 1.5, WRATHC, 1, true); shock(x, z, .8, 13 * SZ, 1.9, DUSTC, .7, false);
   bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 60; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 9, rnd() * 6, (rnd() - .5) * 9, 1.2 + rnd(), EMBERC, 1, .12 * SZ, .03 * SZ, 1.4, -2);
   leafBurst(_a, 24, 3 * SZ, .2); ring(30, CR * .6, CR * 3, 1.4); pulse(2.4);
  }
  // the moments of being hurt, burnt and felled
  const fresh = curN !== 0 && curN !== lastN;
  if (name === 'hurt' && fresh) { spinePt(.5, _a); leafBurst(_a, 18, 1.4 * SZ, state.wilt * .5); chips(_a, 14, 3.6); juice(_a, 10, 2.6); }
  if (name === 'burn' && fresh) { spinePt(.4, _a); for (let i = 0; i < 30; i++) emit(FL, _a.x + (rnd() - .5) * CR * SZ, _a.y + rnd() * 2, _a.z + (rnd() - .5) * CR * SZ, (rnd() - .5) * 1.6, 1.4 + rnd(), (rnd() - .5) * 1.6, .6 + rnd() * .3, FLAMEC, 1, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.5, 1.8); leafBurst(_a, 14, 1.4 * SZ, .7); }
  if (crossed(name, u, 'die', .06)) pulse(2);
  if (crossed(name, u, 'die', ACTS.die.cues[0])) { spinePt(.06, _a); chips(_a, 30, 4.4); juice(_a, 14, 3); leafBurst(_a, 10, 1 * SZ, .3); }
  if (crossed(name, u, 'die', ACTS.die.cues[1])) { bud.localToWorld(_a.set(0, .8, 0)); _a.y = root.position.y + .05; shock(_a.x, _a.z, .5, 12 * SZ, 1.3, DUSTC, .9, false); clods(_a, 36, 4, 4.6); puff(_a, 14, 2.2); leafBurst(_a, 24, 2 * SZ, .5, PETALC); ring(24, CR * .5, CR * 2.6, 1.3); }
  if (crossed(name, u, 'die', ACTS.die.cues[2])) { pulse(2.2); heart.localToWorld(_a.set(0, .6, 0)); for (let i = 0; i < 40; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 4, rnd() * 3, (rnd() - .5) * 4, 1 + rnd(), HEARTC, 1, .14 * SZ, .02 * SZ, 1.5, -1); }
  // the creep: a puff where each leg sets down
  if (walkS > .05) for (const C of CANES) if (!C.great) { const p0 = Math.sin(lastPhase + (C.k % 2) * PI), p1 = Math.sin(phase + (C.k % 2) * PI); if (p0 > 0 && p1 <= 0 && C.cutJ < 0) { tipW(C, _a); puff(_a, 2, .8); } }
  // the shockwaves race out and fade
  for (const S of SHK) if (S.m.visible) { S.t += dt; const f = S.t / S.dur; if (f >= 1) { S.m.visible = false; continue; } S.m.scale.setScalar(Math.max(.01, lerp(S.r0, S.r1, 1 - Math.pow(1 - f, 3)))); S.m.material.uniforms.uA.value = S.a * Math.pow(1 - f, 1.5) * sm(0, .05, f) * fk; }
  if (!ckUsed && crack.visible) crack.visible = false;
  // its breath: steam off the warm mound all the time, more from the bud as it opens and while it feeds, drifting downwind
  {
   const wnd = state.wind || { x: .35, z: .1 }, br = Math.max(0, state.breath === undefined ? 1 : +state.breath) * U.frost.value * 1.6;
   const so = sm(.1, .9, P.op);
   fxS.acc.steam += dt * br * fk * (9 + 10 * so + 12 * cl(P.feed, 0, 1.5) + 10 * cl(P.dust, 0, 1)) * (name === 'die' ? 1 - sm(.7, .9, u) : 1);
   while (fxS.acc.steam >= 1) {
    fxS.acc.steam -= 1; const fromBud = rnd() < .15 + .25 * so;
    if (fromBud) heart.localToWorld(_a.set(rr(-.4, .4), rr(.6, 1.3), rr(-.4, .4))); else mass.localToWorld(_a.set(...[rr(-1, 1), 0, rr(-1, 1)].map((v, i) => (i === 1 ? 0 : v * CR * .8)))).setY(root.position.y + rr(.3, 1.2) * CH * SZ);
    C1.copy(STEAMC).lerp(STEAMH, fromBud ? .08 + .12 * so : .03);
    emit(STM, _a.x, _a.y, _a.z, wnd.x * rr(.3, .8) + rr(-.08, .08), rr(.25, .55) * (fromBud ? 1.3 : 1), wnd.z * rr(.3, .8) + rr(-.08, .08), rr(3.5, 6), C1, rr(.07, .14), rr(.4, .8) * SZ, rr(1.6, 3) * SZ, .25, .06, rr(-.2, .2), .12);
   }
  }
  stepP(LF, dt, .1, t); stepP(DU, dt, .3, t); stepP(MO, dt, .2, t); stepP(CHP, dt, .05, t); stepP(FL, dt, .12, t); stepP(STM, dt, .3, t);
 }

 // ---------- losing a cane, and growing it back ----------
 function sever(k) {
  if (k === undefined || k === null) { const live = CANES.filter((c) => c.cutJ < 0 && c !== LEAD); const pool = live.length ? live : CANES.filter((c) => c.cutJ < 0); if (!pool.length) return -1; k = pool[(rnd() * pool.length) | 0].k; }
  const C = CANES[k]; if (!C || C.cutJ >= 0) return -1;
  const j = cl(Math.round(NS * rr(.42, .7)), 3, NS - 2), b = C.chain[j];
  canePt(C, j / NS, _a); chips(_a, 30, 4); leafBurst(_a, 12, .5 * SZ, 0); juice(_a, 20, 3.4);
  base.attach(b);
  C.cutJ = j; C.bleed = 3; C.piece = { b, j, t: 0, rest: false, vel: V3(Math.sin(C.a) * .6, .8, Math.cos(C.a) * .6) }; // in the body's own space
  U.cut.value[k].set((j - .5) / NS, (j + .5) / NS, 0, 1);
  return k;
 }
 function regrow() {
  for (const C of CANES) {
   if (C.cutJ < 0) continue;
   const b = C.chain[C.cutJ]; C.chain[C.cutJ - 1].add(b);
   for (let i = C.cutJ; i <= NS; i++) { const bd = C.chain[i].userData.bind; C.chain[i].position.copy(bd.p); C.chain[i].quaternion.copy(bd.q); }
   C.cutJ = -1; C.piece = null; C.bleed = 0; U.cut.value[C.k].set(2, 2, 0, 0);
  }
 }
 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'hit': case 'tip': return tipW(LEAD, out);
   case 'lure': case 'bloom': return heart.localToWorld(out.set(0, 1.25, 0)); // the open flower's middle, over the heart
   case 'heart': return heart.localToWorld(out.set(0, .55, 0));               // its weak point, hidden while the bud is shut
   case 'head': case 'top': case 'bud': return bud.localToWorld(out.set(0, 2.1, 0));
   case 'crown': case 'mouth': return mass.localToWorld(out.set(0, CH * .6, 0));
   case 'grasp': return tipW(LEAD, out).add(tipW(MATE, _a)).multiplyScalar(.5);
   case 'held': return out.copy(held); // where a held prey's chest belongs; see holding and inside
   case 'snare': case 'impact': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, REACH * SZ)); }
   case 'feet': return out.copy(root.position);
   case 'hitmid': return canePt(LEAD, .62, out);                             // halfway out along the lead arm, among its hooks
   case 'fruit': { const C = CANES.find((c) => c.g === 'F' && c.bunch1 && c.cutJ < 0) || LEAD; return (C.bunch1 || C.chain[NS]).localToWorld(out.set(0, -.25 * SZ, 0)); }
   default: { // 'chest' and anything else: the front of the spire, halfway up
    const m = /^cane(\d+)$/.exec(name); if (m && CANES[+m[1]]) return tipW(CANES[+m[1]], out);
    const mb = /^bunch(\d+)$/.exec(name); if (mb && BERRIES[+mb[1]]) return BERRIES[+mb[1]].bone.localToWorld(out.set(0, -.3, 0));
    return SP[3].localToWorld(out.set(0, 0, .5));
   }
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isPoints) draws++; });
 return {
  root, fx, animate, play, ACTIONS, anchor, sever, regrow,
  // one cane lifts its tip and tastes the air, as it does by itself now and then at rest (k: which cane, or any)
  taste(k) { const live = CANES.filter((c) => c.cutJ < 0); if (!live.length) return; TW.k = (k !== undefined && CANES[k] && CANES[k].cutJ < 0) ? k : live[(rnd2() * live.length) | 0].k; TW.t = 0; TW.dur = r2(2.4, 3.2); },
  get beats() { return beatN; },                 // counts its heartbeats, for sound
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); regrow(); state.wilt = 0; charV = 0; VW.t = 9; HB = 0; for (const C of CANES) C.sp = null; spInit = false; for (const S of TVS) S.t = -1; for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0); TV.instanceMatrix.needsUpdate = true; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return 0; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return FIN.fade < .02 && !!actv && actv.name === 'die'; },
  get holding() { return holdV; },               // 0 to 1: how firmly it holds its prey (Devour); the prey belongs at anchor('held')
  get inside() { return cl(FIN.inn, 0, 1); },   // 0 to 1: the prey is inside the shut bud (Devour); over .5 the battle hides it
  get open() { return cl(FIN.op, 0, 1.5); },    // how open the bud is: over about .6 its heart is bare to blows
  get wrath() { return wrathV; },
  get canes() { return CANES.filter((c) => c.cutJ < 0).length; },
  get greatCanes() { return CANES.filter((c) => c.great && c.cutJ < 0).length; },
  height: (BY + 2.35) * SZ, width: 11 * SZ, reach: REACH * SZ, level: LEVEL, variant: 'colossus',
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}

/* ---------- copies/io-cutscene.js ---------- */
// io-cutscene.js: Io for the story scenes. Defines makeIoCutscene(opts) only. It is the main-character study's Io
// (io.js, below unchanged unless marked "cutscene:") with her face, and the look round it, made like Chris's paper doll
// and painted art, because a film's close-ups show her face where the battles never do (Chris, October 4, 2026):
//  - a face that narrows to a small chin instead of a round ball, on a slimmer neck;
//  - almond eyes no taller than the paper doll's, under a heavy upper lash line that is the top of the eye (the skin
//    over the resting lid reads as her face, not as a band of lid), with a flick at the outer corner and a fine lower line;
//  - thin dark brows just above her glasses, a small closed smile with a tint of rose, and rosier cheeks;
//  - her hat lower and tipped back less, its brim over bangs that sweep to one side and end at her brows;
//  - her hair darker, with an ash shine rather than a golden one, wavier and fuller, with locks framing her face;
//  - her black top up to her collarbones.
// Her bones, her proportions below the head, the rest of her clothes and every move are the study's (and the game's);
// the battles keep the game's own Io. state.blink: false holds her eyes open (for pictures); state.lids: 0 to 1 lowers
// her lids (sleepy, sad, closed).
//
// What follows is the study's own description:
// io.js: Io, the Witch, as a main-character study (the laptop reference). three.js r128 (global THREE).
// Defines makeIo(opts) only, with the same interface, bones, moves, hit times and anchors as the game's model
// (src/models/witch.js, makeWitch), so it can stand in for it unchanged.
//
// What it is: the game's Io, kept exactly as she looks and moves (every bone, proportion, colour, lock of hair, fold and
// motion is the game model's), and built again at the level of detail of the Bramble Colossus field study. Nothing is
// redesigned; every part is made the way the real thing is made:
//  - her face is one smooth sculpt with her nose and cheeks in it, its skin painted (her blush is in the skin now) and lit
//    as skin is, with light glowing red through its edges; her eyes have a painted iris with depth, a wet cornea that
//    catches the night, and lashes and brows of single hairs;
//  - her hair keeps every lock where it was, each now a bundle of fine strands with its own highlight running along it;
//  - her coat and hat are velvet with a pile that shines at the edges, the stars on them are embroidered in gold and silk
//    thread, the coat has its lining and a thickness, and its trim is a woven gold braid with piping round its edges;
//  - her dress glitters as it moves through the light, her bodice is a fine knotted net, her sash is satin;
//  - her boots are creased leather with stitched straps and real buckles; her hands have shaped fingers and lacquered nails;
//  - the gold and silver are polished metal that reflect the night, her dagger has a ridged, engraved blade and a wrapped
//    grip, her glasses have glass in them, the horns on her hat are ridged horn;
//  - her flame is a living flame, and her spells' light is drawn at a higher resolution.
//
// opts: { detail .25 to 1 (1, the default, is the laptop reference; .5 is about a third of its triangles; .25 is near the
//         game's budget), shadows (true: she casts and takes shadows), linear (default true: colours are painted for a
//         linear, tone-mapped renderer with an environment; false for the game's plain one) }
function makeIoCutscene(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, her feet on the ground at the origin. Her right side is -X: the dagger hand.
 opts = opts || {};
 const DET = Math.max(.25, Math.min(1, opts.detail == null || !Number.isFinite(+opts.detail) ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 // the game model's own stream: it places her hair, her sparks and motes and times her blinks. Each part that used it
 // starts it again where the game model had it, so every lock and spark falls where it did there.
 let hs = 90210;
 const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
 const SEED = { hair: 768023001, spark: 1213765947, motes: 1176445400, starmap: 1996422933, motion: 1126508089 };
 // a second stream for everything new (strands, stitches, paint), so its counts never move the first
 let s2 = 4471;
 const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * r2();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
 // colour: everything is chosen in sRGB, as the game model lists it; LIN turns it linear for a tone-mapped renderer and
 // marks painted colour maps as sRGB so the renderer decodes them
 const LIN = opts.linear !== false;
 const lin1 = (v) => (LIN ? Math.pow(cl(v, 0, 16), 2.2) : v);
 const C = (hex) => { const c = new THREE.Color(hex); if (LIN) c.convertSRGBToLinear(); return c; };
 const CR = (r, g, b) => new THREE.Color(lin1(r), lin1(g), lin1(b));
 const tex = (c, rx, ry, data) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx);
  t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding;
  return t;
 };
 const dataTex = (c, rx, ry) => tex(c, rx, ry, true);
 const TS = DET > .6 ? 1 : .5;                         // texture size: halved below detail .6

 // ---------- painting helpers ----------
 // Each surface is painted twice in step: its colour, and a height field (white stands up, black sinks) that becomes its
 // normal map, so stitches, grain and pile catch the light where they really are. Some also get a third map: roughness in
 // green and metalness in blue, so gold thread shines in velvet.
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hgt = (v, a) => css(v * 255, v * 255, v * 255, a === undefined ? 1 : a);
 function pair(W, H, col, h0) {
  const c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H); h.fillStyle = hgt(h0 === undefined ? .5 : h0); h.fillRect(0, 0, W, H);
  return { c, g, hc, h, W, H };
 }
 // draw f(ox, oy) once per neighbouring tile, so marks that cross an edge come back on the other side
 const tiled = (W, H, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) f(ox, oy); };
 // a tiling normal map from a height canvas (k: how deep)
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = s[i * 4] / 255;
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const at = (x, y) => h[((y + H) % H) * W + (x + W) % W];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
   const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
   const nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 const blur = (cv, px) => { const c = cvs(cv.width, cv.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; tiled(cv.width, cv.height, (ox, oy) => g.drawImage(cv, ox, oy)); g.filter = 'none'; return c; };
 // a canvas painted pixel by pixel: f(x, y, out) writes r, g, b, a (0 to 255)
 function perPixel(W, H, f) {
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(c.width, c.height), d = img.data, o = [0, 0, 0, 255];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { o[3] = 255; f(x, y, o); const i = (y * c.width + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
  g.putImageData(img, 0, 0); return c;
 }
 // value noise on a tiling lattice, for painting (n cells across)
 function noise2(n, seed) {
  const L = new Float32Array(n * n); let s = seed || 1;
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; L[i] = s / 2147483647; }
  return (u, v) => {
   const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
   const a = L[((yi % n + n) % n) * n + (xi % n + n) % n], b = L[((yi % n + n) % n) * n + ((xi + 1) % n + n) % n];
   const c = L[(((yi + 1) % n + n) % n) * n + (xi % n + n) % n], d = L[(((yi + 1) % n + n) % n) * n + ((xi + 1) % n + n) % n];
   const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
   return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
 }
 // the four-pointed star the game model scatters on her coat and hat
 function star4(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
 }

 // ---------- painted textures ----------
 // Every map is painted at one repeat; each part scales its own UVs to the repeat the game model gave it, so the stars,
 // braid and net sit at the same size on her as before.

 // velvet with embroidered stars: the coat (and sleeves and hood) and the hat. The game model's star cloth, painted four
 // times larger: the same number of stars to a tile, the same colours and sizes, now worked in thread (gold thread shines
 // as metal; the pink is silk), over velvet whose pile is crushed in soft patches and lies one way
 function VELVET(base, nStars, cols, rmin, rmax, seed) {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, base, .5), g = P.g, h = P.h;
  const rmC = cvs(W, W), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,212,0)'; rm.fillRect(0, 0, W, W);
  // crushed pile: big soft patches lighter and darker, painted pixel by pixel over the base
  const n1 = noise2(6, seed), n2 = noise2(23, seed + 7), b = new THREE.Color(base);
  const pile = perPixel(W, W, (x, y, o) => {
   const u = x / W, v = y / W, n = n1(u, v) * .65 + n2(u, v) * .35, l = .84 + .3 * n;
   o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l;
  });
  g.drawImage(pile, 0, 0);
  const hp = perPixel(W, W, (x, y, o) => { const v = (n2(x / W * 3 % 1, y / W * 3 % 1) - .5) * .1 + .5; o[0] = o[1] = o[2] = v * 255; });
  h.drawImage(hp, 0, 0);
  // the game model's flecks: dark and pale specks in the pile
  for (let i = 0; i < W * 4 / k; i++) { g.fillStyle = r2() < .55 ? 'rgba(20,0,12,0.10)' : 'rgba(255,200,230,0.05)'; g.fillRect(r2() * W, r2() * W, (1 + r2() * 4) * k * .7, (1 + r2() * 4) * k * .7); }
  // fine pile, lying one way: short strokes, a little lighter at their tips
  g.lineCap = 'round';
  for (let i = 0; i < 9000 * TS; i++) { const x = r2() * W, y = r2() * W, l = (3 + r2() * 6) * k * .5; g.strokeStyle = r2() < .5 ? 'rgba(0,0,0,.03)' : 'rgba(255,190,220,.018)'; g.lineWidth = .8 * k * .5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * .2, y + l); g.stroke(); }
  // the stars, embroidered: a raised star of thread, satin-stitched out along its four points, with a fine dark outline
  const thread = (col) => { const c = new THREE.Color(col); return [c.r * 255, c.g * 255, c.b * 255]; };
  for (let i = 0; i < nStars; i++) {
   const x = r2() * W, y = r2() * W, r = (rmin + r2() * (rmax - rmin)) * k, col = cols[(r2() * cols.length) | 0], t = thread(col), gold = col !== '#ff9fd0';
   tiled(W, W, (ox, oy) => {
    const X = x + ox, Y = y + oy;
    g.fillStyle = 'rgba(40,6,20,.55)'; star4(g, X, Y + r * .06, r * 1.12);
    g.fillStyle = col; star4(g, X, Y, r);
    // satin stitches: lines from the middle out along each point, alternately lighter and darker
    g.lineWidth = Math.max(.6, r * .07);
    for (let s = 0; s < 28; s++) {
     const a = s / 28 * TAU, rr2 = r * (.55 + .45 * Math.pow(Math.abs(Math.cos(2 * a)), 6));
     g.strokeStyle = s % 2 ? css(t[0] * .72, t[1] * .7, t[2] * .7, .7) : css(Math.min(255, t[0] * 1.15), Math.min(255, t[1] * 1.12), Math.min(255, t[2] * 1.1), .55);
     g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * rr2 * .9, Y + Math.sin(a) * rr2 * .9); g.stroke();
    }
    h.fillStyle = hgt(.92); star4(h, X, Y, r);
    h.strokeStyle = hgt(.62, .8); h.lineWidth = Math.max(.6, r * .05);
    for (let s = 0; s < 14; s++) { const a = s / 14 * TAU; h.beginPath(); h.moveTo(X, Y); h.lineTo(X + Math.cos(a) * r * .8, Y + Math.sin(a) * r * .8); h.stroke(); }
    rm.fillStyle = gold ? 'rgb(0,92,230)' : 'rgb(0,118,0)'; star4(rm, X, Y, r);
   });
  }
  // the game model's glints: tiny beads of the same threads
  for (let i = 0; i < nStars * 4; i++) {
   const x = r2() * W, y = r2() * W, col = cols[(r2() * cols.length) | 0], s = 1.3 * k * .8, a = .35 + r2() * .6;
   g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); g.globalAlpha = 1;
   h.fillStyle = hgt(.85, a); h.beginPath(); h.arc(x, y, s, 0, TAU); h.fill();
   rm.fillStyle = col !== '#ff9fd0' ? 'rgb(0,80,210)' : 'rgb(0,100,0)'; rm.beginPath(); rm.arc(x, y, s, 0, TAU); rm.fill();
  }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6 * k * .5), 2.4)), rm: dataTex(rmC) };
 }
 const COATV = VELVET('#8e2a57', 38, ['#f2c15a', '#e8a93e', '#ff9fd0'], 1.5, 4.5, 31);
 const HATV = VELVET('#7c1d4f', 16, ['#f2c15a', '#e8a93e'], 2, 5, 57);

 // the trim: the game model's ribbon (burgundy, a gold band along it, a row of gold blocks, a dark lower edge), woven:
 // a twill ribbon, the band a twisted gold cord, the blocks satin-stitched in two golds
 const TRIM = (() => {
  const W = 512 * TS, H = 64 * TS, k = W / 256, P = pair(W, H, '#5c1238', .45), g = P.g, h = P.h;
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,150,0)'; rm.fillRect(0, 0, W, H);
  g.lineWidth = h.lineWidth = .7 * k;
  for (let x = -H; x < W + H; x += 2.2 * k) { g.strokeStyle = 'rgba(20,0,10,.25)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H * .5, H); g.stroke(); h.strokeStyle = hgt(.35, .6); h.beginPath(); h.moveTo(x, 0); h.lineTo(x + H * .5, H); h.stroke(); }
  // the cord: short slanted twists along a gold band
  g.fillStyle = '#e8ad48'; g.fillRect(0, 2 * k, W, 4 * k); h.fillStyle = hgt(.86); h.fillRect(0, 2 * k, W, 4 * k); rm.fillStyle = 'rgb(0,90,220)'; rm.fillRect(0, 2 * k, W, 4 * k);
  for (let x = 0; x < W; x += 2 * k) {
   g.strokeStyle = 'rgba(120,70,10,.75)'; g.lineWidth = .7 * k; g.beginPath(); g.moveTo(x, 2 * k); g.lineTo(x + 2 * k, 6 * k); g.stroke();
   g.strokeStyle = 'rgba(255,236,170,.6)'; g.lineWidth = .45 * k; g.beginPath(); g.moveTo(x + .6 * k, 2 * k); g.lineTo(x + 2.4 * k, 5.6 * k); g.stroke();
   h.strokeStyle = hgt(.55); h.lineWidth = .6 * k; h.beginPath(); h.moveTo(x, 2 * k); h.lineTo(x + 2 * k, 6 * k); h.stroke();
  }
  // the blocks, each satin-stitched across, alternately pale and deep gold
  for (let i = 0; i < 16; i++) {
   const x = (i * 16 + 4) * k, y = 15 * k, w = 8 * k, hh = 6 * k;
   g.fillStyle = i % 2 ? '#f7d68d' : '#e0a33c'; g.fillRect(x, y, w, hh);
   h.fillStyle = hgt(.9); h.fillRect(x, y, w, hh); rm.fillStyle = 'rgb(0,84,225)'; rm.fillRect(x, y, w, hh);
   for (let s = 0; s <= w; s += .9 * k) { g.fillStyle = 'rgba(110,60,10,.35)'; g.fillRect(x + s, y, .35 * k, hh); h.fillStyle = hgt(.7, .8); h.fillRect(x + s, y, .35 * k, hh); }
   g.strokeStyle = 'rgba(60,20,10,.6)'; g.lineWidth = .5 * k; g.strokeRect(x, y, w, hh);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 27 * k, W, 5 * k); h.fillStyle = hgt(.3); h.fillRect(0, 28 * k, W, 4 * k);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.2)), rm: dataTex(rmC) };
 })();

 // the dress: the game model's black tulle with warm glints, painted as a fine net with sequins caught in it (the light
 // catching single threads is the shader's)
 const DRESS = (() => {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, '#1f171c', .5), g = P.g, h = P.h;
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .8, (2 + r2() * 3) * k * .8); }
  // the net: a hexagonal mesh of fine threads
  const cell = 7 * k * .5; g.strokeStyle = 'rgba(70,52,62,.35)'; h.strokeStyle = hgt(.72, .7); g.lineWidth = h.lineWidth = .55 * k * .5;
  for (let y = 0, row = 0; y < W + cell; y += cell * .866, row++) for (let x = (row % 2) * cell * .5; x < W + cell; x += cell) {
   for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(x, y, cell * .5, 0, TAU); ctx.stroke(); }
  }
  // the game model's 1600 glints, now sequins: a round disc, bright on one side
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < 1000; i++) {
   const x = r2() * W, y = r2() * W, b = 70 + r2() * 120, r = (r2() < .75 ? .6 : .9) * k * .75;
   const col = `rgb(${b | 0},${(b * .82) | 0},${(b * .74) | 0})`;
   g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
   e.fillStyle = col; e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill();
   h.fillStyle = hgt(.9); h.beginPath(); h.arc(x, y, r, 0, TAU); h.fill();
  }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.6)) };
 })();

 // satin with glints (the sash, grey with white glints) and the hat band (brown, warm glints, made furry by its shells)
 function SATIN(base, n, warm, seed) {
  const W = 512 * TS, k = W / 128, P = pair(W, W, base, .5), g = P.g, h = P.h, nz = noise2(5, seed);
  const b = new THREE.Color(base);
  g.drawImage(perPixel(W, W, (x, y, o) => { const l = .86 + .28 * nz(x / W, y / W); o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l; }), 0, 0);
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .7, (2 + r2() * 3) * k * .7); }
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < n; i++) {
   const x = r2() * W, y = r2() * W, bb = 110 + r2() * 145, s = (r2() < .75 ? .55 : .9) * k * .7;
   const col = warm ? `rgb(${bb | 0},${(bb * .82) | 0},${(bb * .74) | 0})` : `rgb(${bb | 0},${bb | 0},${bb | 0})`;
   for (const ctx of [g, e]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  }
  // a fine weave
  h.strokeStyle = hgt(.62, .5); h.lineWidth = .5 * k * .4; for (let x = 0; x < W; x += 1.6 * k * .5) { h.beginPath(); h.moveTo(x, 0); h.lineTo(x, W); h.stroke(); }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.2)) };
 }
 const SASH = SATIN('#4d4248', 700, false, 11);
 const BAND = SATIN('#3a2422', 500, true, 13);

 // the bodice: the game model's diamond net (eight diamonds to a tile), knotted where its threads cross
 const NET = (() => {
  const W = 512 * TS, k = W / 64, P = pair(W, W, '#1b141b', .3), g = P.g, h = P.h;
  const line = (ctx, x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  for (let pass = 0; pass < 2; pass++) for (let q = -W; q <= W * 2; q += 8 * k) {
   g.lineWidth = (pass ? .4 : .95) * k; g.strokeStyle = pass ? 'rgba(200,180,190,.25)' : 'rgba(150,128,140,0.55)';
   line(g, q, 0, q + W, W); line(g, q, W, q + W, 0);
   if (!pass) { h.lineWidth = 1.3 * k; h.strokeStyle = hgt(.85); line(h, q, 0, q + W, W); line(h, q, W, q + W, 0); }
  }
  for (let x = 0; x <= W; x += 4 * k) for (let y = 0; y <= W; y += 4 * k) {
   if (((x + y) / (4 * k)) % 2) continue;
   g.fillStyle = 'rgba(166,146,156,.6)'; g.beginPath(); g.arc(x, y, .75 * k, 0, TAU); g.fill();
   h.fillStyle = hgt(1); h.beginPath(); h.arc(x, y, 1 * k, 0, TAU); h.fill();
  }
  for (let i = 0; i < 60; i++) { const b = 150 + r2() * 105; g.fillStyle = `rgb(${b | 0},${(b * 0.85) | 0},${(b * 0.8) | 0})`; g.fillRect(r2() * W, r2() * W, k * .6, k * .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.6)) };
 })();

 // leather: her boots and the dagger's grip. Pebbled grain, creases where it bends, worn paler on the edges of the creases
 const LEATHER = (() => {
  const W = 1024 * TS, P = pair(W, W, '#2e1f22', .5), g = P.g, h = P.h, k = W / 256;
  const n1 = noise2(9, 3), n2 = noise2(64, 5), n3 = noise2(150, 9);
  g.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, l = .8 + .35 * n1(u, v) + .12 * (n2(u, v) - .5); o[0] = 46 * l; o[1] = 31 * l; o[2] = 34 * l; }), 0, 0);
  h.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, p = n3(u, v), q = n2(u, v); const c = Math.pow(Math.abs(p - .5) * 2, .6); o[0] = o[1] = o[2] = (.35 + .4 * c + .15 * q) * 255; }), 0, 0);
  // creases: wandering lines across, in bunches, each a dark groove with a pale worn lip
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
   const y0 = r2() * W, x0 = r2() * W, len = (40 + r2() * 160) * k * .5, amp = (2 + r2() * 4) * k * .5;
   const pts = []; for (let s = 0; s <= 12; s++) pts.push([x0 + s / 12 * len, y0 + Math.sin(s * .9 + i) * amp]);
   const path = (ctx, dy) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy))); ctx.stroke(); };
   for (const ox of [0, -W]) {
    g.save(); g.translate(ox, 0); g.strokeStyle = 'rgba(10,4,6,.45)'; g.lineWidth = 1.4 * k * .5; path(g, 0); g.strokeStyle = 'rgba(120,96,96,.18)'; g.lineWidth = 1.2 * k * .5; path(g, -1.5 * k * .5); g.restore();
    h.save(); h.translate(ox, 0); h.strokeStyle = hgt(.05, .8); h.lineWidth = 1.6 * k * .5; path(h, 0); h.strokeStyle = hgt(.8, .5); h.lineWidth = 1.4 * k * .5; path(h, -1.6 * k * .5); h.restore();
   }
  }
  const rmC = perPixel(W, W, (x, y, o) => { o[0] = 0; o[1] = (.42 + .3 * n1(x / W * 2 % 1, y / W * 2 % 1)) * 255; o[2] = 0; });
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 2.8)), rm: dataTex(rmC) };
 })();

 // horn: fine growth lines across it, between the ridges the geometry makes
 const HORN = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#e9cfa4', .5), g = P.g, h = P.h;
  for (let i = 0; i < 260; i++) {
   const x = r2() * W, w = .5 + r2() * 1.5, a = .05 + r2() * .12;
   g.fillStyle = r2() < .5 ? `rgba(120,90,60,${a})` : `rgba(255,248,230,${a})`; g.fillRect(x, 0, w, H);
   h.fillStyle = hgt(r2() < .5 ? .35 : .65, .5); h.fillRect(x, 0, w * 1.3, H);
  }
  for (let i = 0; i < 400 * TS; i++) { g.fillStyle = 'rgba(140,110,80,.08)'; g.fillRect(r2() * W, r2() * H, 2 + r2() * 12, .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6), 2)) };
 })();

 // the iris: the game model's amber-brown eye, at four times its resolution: fibres, a darker rim, the lid's shadow over
 // its top and a warm glow low in it, round a deep pupil
 const IRIS = (() => {
  const S = 512 * TS, k = S / 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m + 8 * k, 4 * k, m, m, m);
  gr.addColorStop(0, '#d8a060'); gr.addColorStop(0.45, '#9a5a2a'); gr.addColorStop(0.8, '#5a2f16'); gr.addColorStop(1, '#241208');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
   const a = r2() * TAU, r0 = (14 + r2() * 6) * k, r1 = (30 + r2() * 30) * k;
   g.strokeStyle = r2() < .5 ? 'rgba(255,215,160,0.2)' : 'rgba(40,16,4,0.26)'; g.lineWidth = (.3 + r2() * .6) * k;
   g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.quadraticCurveTo(m + Math.cos(a + .08) * (r0 + r1) * .5, m + Math.sin(a + .08) * (r0 + r1) * .5, m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke();
  }
  // the collarette, a ragged ring round the pupil, and a few dark crypts
  g.strokeStyle = 'rgba(255,200,130,.35)'; g.lineWidth = 2 * k; g.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, r = (25 + 2.5 * Math.sin(a * 13) + 1.5 * Math.sin(a * 29)) * k; i ? g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r) : g.moveTo(m + Math.cos(a) * r, m + Math.sin(a) * r); } g.stroke();
  for (let i = 0; i < 40; i++) { const a = r2() * TAU, r = (30 + r2() * 26) * k; g.fillStyle = 'rgba(30,10,2,.3)'; g.beginPath(); g.ellipse(m + Math.cos(a) * r, m + Math.sin(a) * r, 2.2 * k, 1 * k, a, 0, TAU); g.fill(); }
  gr = g.createLinearGradient(0, 0, 0, S * 0.58); gr.addColorStop(0, 'rgba(20,6,2,0.85)'); gr.addColorStop(1, 'rgba(20,6,2,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.58);
  gr = g.createRadialGradient(m, S * 0.84, 2 * k, m, S * 0.84, S * 0.38); gr.addColorStop(0, 'rgba(255,200,130,0.65)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#120804'; g.beginPath(); g.ellipse(m, m + 3 * k, 16 * k, 21 * k, 0, 0, TAU); g.fill();
  gr = g.createRadialGradient(m, m, m - 9 * k, m, m, m); gr.addColorStop(0, 'rgba(22,8,3,0)'); gr.addColorStop(.5, 'rgba(22,8,3,.95)'); gr.addColorStop(1, 'rgba(22,8,3,1)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return tex(c);
 })();

 // cutscene: where her nose and lips are on the shaped face, in the sphere's own elevations, for painting them. The
 // same shaping as jaw() further down (which needs the head's size, not known yet here): keep the two together.
 const jawYn = (el) => { let y = Math.sin(el); if (y < -0.08) { const u = (-y - 0.08) / 0.92; y = -0.08 - 0.92 * u * (1 - 0.3 * Math.pow(u, 0.8)); } return y; };
 const elForYn = (yn) => { let a = -1.55, b = 1.55; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (jawYn(m) < yn) a = m; else b = m; } return (a + b) / 2; };
 const FACE_NOSE = elForYn(-0.043 / 0.159), FACE_MOUTH = elForYn(-0.07 / 0.159);
 // her face's skin, in the head's own sphere UVs: her skin tone, the blush she always wears (the game model's two pink
 // discs, now in the skin, soft at their edges), a warmer nose tip, and a faint unevenness, with pores in its relief
 const FACE = (() => {
  const W = 1024 * TS, H = 512 * TS, base = new THREE.Color('#f0b894'), blush = new THREE.Color('#ff8a8a'), shade = new THREE.Color('#eaa585'), lipC = new THREE.Color('#d8737f');
  const nz = noise2(24, 21), nz2 = noise2(90, 23);
  const az0 = (x) => { const ph = x / W * TAU; return Math.atan2(-Math.cos(ph), Math.sin(ph)); };
  const c = perPixel(W, H, (x, y, o) => {
   const th = y / H * PI, el = PI / 2 - th, az = az0(x);
   let r = base.r, gg = base.g, b = base.b;
   const v = (nz(x / W, y / H) - .5) * .05; r += v; gg += v * .8; b += v * .7;
   // blush: a soft oval on each cheek
   for (const sd of [-1, 1]) {
    const dx = (az - sd * .5) * Math.cos(el) / .16, dy = (el + .36) / .1, d = Math.hypot(dx, dy), a = .5 * (1 - sm(.2, 1.35, d)); // cutscene: on the shaped cheeks, and a little rosier
    r = lerp(r, blush.r, a); gg = lerp(gg, blush.g, a); b = lerp(b, blush.b, a);
   }
   // the nose tip, warmer
   { const d = Math.hypot(az * Math.cos(el) / .05, (el - FACE_NOSE) / .05), a = .5 * (1 - sm(.3, 1.2, d)); r = lerp(r, shade.r, a); gg = lerp(gg, shade.g, a); b = lerp(b, shade.b, a); }
   // cutscene: the rose of her lips, mostly the lower one, under the line of her smile
   { const d = Math.hypot(az * Math.cos(el) / .1, (el - FACE_MOUTH + .028) / .03), a = .5 * (1 - sm(.25, 1.1, d)); r = lerp(r, lipC.r, a); gg = lerp(gg, lipC.g, a); b = lerp(b, lipC.b, a); }
   // a little warmth under the brows and round the jaw, where skin is thinner and in shade
   { const a = .18 * sm(-.55, -.85, el) + .08 * sm(.5, .9, Math.abs(az) / 1.6); r = lerp(r, shade.r * .95, a); gg = lerp(gg, shade.g * .9, a); b = lerp(b, shade.b * .9, a); }
   o[0] = cl(r, 0, 1) * 255; o[1] = cl(gg, 0, 1) * 255; o[2] = cl(b, 0, 1) * 255;
  });
  const hc = perPixel(W, H, (x, y, o) => { const p = nz2(x / W, y / H); o[0] = o[1] = o[2] = (.5 + .5 * (p - .5) + (r2() - .5) * .18) * 255; });
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, .6), 1.2)) };
 })();
 // skin elsewhere (neck, arms, legs, hands): pores only
 const SKIN = (() => {
  const W = 256 * TS, nz = noise2(40, 41);
  const hc = perPixel(W, W, (x, y, o) => { o[0] = o[1] = o[2] = (.5 + .45 * (nz(x / W, y / W) - .5) + (r2() - .5) * .25) * 255; });
  return dataTex(normalFrom(blur(hc, .6), 1.4), 1, 1);
 })();

 // the dagger's blade: steel with a crescent and a line of small stars engraved down its middle (u along the blade, v across)
 const BLADE = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#c8c8d2', .6), g = P.g, h = P.h, k = W / 512;
  for (let i = 0; i < 900 * TS; i++) { const y = r2() * H, x = r2() * W, l = 20 + r2() * 90; g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(60,60,80,.08)'; g.fillRect(x, y, l * k, .7); h.fillStyle = hgt(r2() < .5 ? .66 : .54, .5); h.fillRect(x, y, l * k, .7); }
  g.strokeStyle = 'rgba(40,40,60,.75)'; h.strokeStyle = hgt(.05); g.lineWidth = h.lineWidth = 2.2 * k;
  for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(70 * k, H / 2, 26 * k, PI * .2, PI * 1.8); ctx.arc(84 * k, H / 2 - 6 * k, 22 * k, PI * 1.75, PI * .25, true); ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { const x = (130 + i * 52) * k, r = (9 - i) * k; g.fillStyle = 'rgba(40,40,60,.7)'; star4(g, x, H / 2, r); h.fillStyle = hgt(.08); star4(h, x, H / 2, r); }
  for (const ctx of [g, h]) { ctx.beginPath(); for (let x = 110 * k; x < W * .86; x += 3 * k) { const y = H / 2 + Math.sin(x / (18 * k)) * 14 * k; x === 110 * k ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineWidth = 1.2 * k; ctx.stroke(); }
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,52,255)'; rm.fillRect(0, 0, W, H);
  rm.globalCompositeOperation = 'source-over'; rm.drawImage(P.hc, 0, 0); // the engraving darker in G (rougher)
  const d = rm.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const e = d.data[i] < 60; d.data[i] = 0; d.data[i + 1] = e ? 170 : 52; d.data[i + 2] = 255; } rm.putImageData(d, 0, 0);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 3)), rm: dataTex(rmC) };
 })();

 // crushed velvet for the scrunchie
 const CRUSH = (() => {
  const W = 256 * TS, nz = noise2(12, 61), nz2 = noise2(31, 67);
  const hc = perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W; o[0] = o[1] = o[2] = (.5 + .5 * Math.sin((u * 3 + nz(u, v) * 1.5) * TAU) * .5 + (nz2(u, v) - .5) * .4) * 255; });
  return dataTex(normalFrom(blur(hc, .8), 2.5));
 })();

 // ---------- materials ----------
 // Shader additions, each where the real material needs it:
 //  - skin: light wraps a little past the edge of the lit side and comes out warm and red there, as it does through skin;
 //  - hair: two highlights run along each strand (a sharp pale one and a broad tinted one, shifted along it), broken up
 //    strand by strand, as hair shines;
 //  - glitter: a share of tiny facets in the dress, sash and hat band each catch a light only when it, the facet and the
 //    eye line up, so they twinkle as she moves and the camera turns;
 //  - fur: the hat band's shells thin out toward their tips into a fuzz;
 //  - a faint cool rim at the edges facing away, so she reads against the night;
 //  - her spells' white glow and her trance's blue (the game model lerps every emissive toward them; here they are added);
 //  - the starlight cloak of her trance, exactly as the game model draws it.
 const U = {
  time: { value: 0 }, glow: { value: 0 }, glowC: { value: CR(.48, .48, .5) }, trance: { value: 0 }, trC: { value: C('#6a80d8') },
  rim: { value: .3 }, rimC: { value: CR(.42, .45, .66) }, sss: { value: CR(1, .36, .24) }, glitC: { value: CR(1, .92, .82) }
 };
 const NOISE = 'float ioH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n';
 const KEYS = ['skin', 'hair', 'glit', 'fur', 'rim', 'glow', 'tr', 'star', 'dark'];
 function patch(m, o) {
  const key = 'io1c-' + KEYS.map((k) => (o[k] ? k + o[k] : '')).join(''); // cutscene: io1c, its own programs apart from the study's
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uGlow: U.glow, uGlowC: U.glowC, uTrance: U.trance, uTrC: U.trC, uRim: U.rim, uRimC: U.rimC, uSSS: U.sss, uGlitC: U.glitC });
   if (o.star) sh.uniforms.starMap = { value: STARMAP };
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   vs = 'varying vec3 vDP;\nvarying vec3 vWP;\n' + (o.hair ? 'attribute vec3 aHT;\nvarying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'attribute float aShell;\nvarying float vShell;\n' : '') + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;' + (o.fur ? ' vShell = aShell;' : '') + (o.hair ? ' vHU = uv;' : ''));
   if (o.hair) vs = vs.replace('#include <skinnormal_vertex>', '#include <skinnormal_vertex>\n vec3 hT = aHT;\n#ifdef USE_SKINNING\n hT = (skinMatrix * vec4(hT, 0.)).xyz;\n#endif\n vHT = normalize((modelViewMatrix * vec4(hT, 0.)).xyz);');
   vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
   fs = 'varying vec3 vDP;\nvarying vec3 vWP;\nuniform float uTime, uGlow, uTrance, uRim;\nuniform vec3 uGlowC, uTrC, uRimC, uSSS, uGlitC;\n' + (o.hair ? 'varying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'varying float vShell;\n' : '') +
    (o.star ? 'uniform sampler2D starMap;\n' : '') + NOISE + fs;
   let fn = '';
   if (o.skin) fn += 'vec3 ioSSS(IncidentLight dl, GeometricContext g) { float d = dot(g.normal, dl.direction); float w = clamp((d + .5) / 1.5, 0., 1.); return dl.color * max(0., w * w - max(d, 0.)) * uSSS * ' + (+o.skin).toFixed(2) + '; }\n';
   if (o.hair) fn += 'vec3 ioHair(IncidentLight dl, GeometricContext g, vec3 base) { vec3 T = normalize(vHT), N = g.normal, H = normalize(dl.direction + g.viewDir);\n' +
    ' float id = floor(vHU.y * 4096.), nz = ioH(vec3(id, 3.1, 7.7)), sp = .55 + .9 * ioH(vec3(floor(vHU.x * 40.), id, 1.));\n' +
    ' vec3 T1 = normalize(T + N * (-.1 + .08 * nz)), T2 = normalize(T + N * (.16 + .12 * nz)); float a = dot(T1, H), b = dot(T2, H);\n' +
    ' float s1 = pow(sqrt(max(0., 1. - a * a)), 160.), s2 = pow(sqrt(max(0., 1. - b * b)), 34.); float dif = clamp(dot(N, dl.direction) * .55 + .45, 0., 1.);\n' +
    ' return dl.color * dif * (s1 * .1 * vec3(1., .96, .92) + s2 * .4 * base * vec3(1.06, 1., 1.02)) * sp; }\n'; // cutscene: an ash shine, not a golden one, as the paper doll's hair has
   if (o.glit) fn += 'vec3 ioGlit(IncidentLight dl, GeometricContext g) { vec3 c = floor(vDP * ' + (+o.glit).toFixed(1) + '); float h = ioH(c); if (h < .62) return vec3(0.);\n' +
    ' vec3 j = vec3(ioH(c + 1.7), ioH(c + 3.1), ioH(c + 5.3)) - .5; vec3 n = normalize(g.normal + j * 1.6); float s = pow(max(dot(n, normalize(dl.direction + g.viewDir)), 0.), 600.);\n' +
    ' return dl.color * s * 14. * uGlitC; }\n';
   if (fn) fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\n' + fn);
   let add = '';
   if (o.skin) add += '\n\t\treflectedLight.directDiffuse += ioSSS(directLight, geometry) * material.diffuseColor;';
   if (o.hair) add += '\n\t\treflectedLight.directSpecular += ioHair(directLight, geometry, material.diffuseColor);';
   if (o.glit) add += '\n\t\treflectedLight.directSpecular += ioGlit(directLight, geometry);';
   if (add) fs = fs.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );' + add));
   // the fuzz: each shell keeps fewer fibres, and the lower ones are in their shade
   if (o.fur) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n if (vShell > .001) { float n = ioH(vec3(floor(vUv.x * 1400.), floor(vUv.y * 70.), 0.)); if (n < vShell * .95 + .02) discard; }\n diffuseColor.rgb *= .5 + .5 * vShell + .2 * step(.001, vShell);');
   if (o.star) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n vec4 stc = texture2D(starMap, vUv * 0.6 + vec2(uTime * 0.004, uTime * 0.012));' + (LIN ? ' stc.rgb = pow(stc.rgb, vec3(2.2));' : '') + '\n diffuseColor.rgb = mix(diffuseColor.rgb, stc.rgb * 0.75 + ' + (LIN ? 'vec3(0.0005, 0.0014, 0.0155)' : 'vec3(0.03, 0.05, 0.15)') + ', uTrance);');
   let em = '';
   if (o.star) em += '\n totalEmissiveRadiance += stc.rgb * stc.rgb * 1.8 * uTrance * (0.7 + 0.3 * sin(uTime * 3.0 + vUv.x * 37.0 + vUv.y * 23.0));';
   if (o.rim) em += '\n totalEmissiveRadiance += uRimC * uRim * ' + (+o.rim).toFixed(2) + ' * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.);';
   if (o.glow) em += '\n totalEmissiveRadiance += uGlowC * uGlow * ' + (+o.glow).toFixed(2) + ';';
   if (o.tr) em += '\n totalEmissiveRadiance += uTrC * uTrance * ' + (+o.tr).toFixed(2) + ';';
   if (em) fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + em);
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const nv2 = (k) => new THREE.Vector2(k, k);
 const METAL = LIN ? 1 : .4;                           // the game's plain renderer has no night to reflect: less metal there
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 // the trance's starlight (the game model's map, painted at twice the size, from the same stream)
 hs = SEED.starmap;
 const STARMAP = tex((() => {
  const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, S);
  gr.addColorStop(0, '#2a3c86'); gr.addColorStop(0.5, '#1b2660'); gr.addColorStop(1, '#2c2470'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) { const b = 150 + hr() * 105; g.fillStyle = 'rgba(' + (b | 0) + ',' + ((b * 0.96) | 0) + ',255,' + (0.35 + hr() * 0.65).toFixed(2) + ')'; const s = (hr() < 0.85 ? 1 : 2) * k; g.fillRect(hr() * S, hr() * S, s, s); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const x = hr() * S, y = hr() * S, r = (2 + hr() * 4) * k; for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) star4(g, x + dx, y + dy, r); }
  return c;
 })(), 1, 1, true);
 const M = {
  face: patch(std({ map: FACE.map, normalMap: FACE.normal, normalScale: nv2(.08), roughness: .5 }), { skin: 1, rim: .5, glow: 1 }),
  skin: patch(std({ color: C('#f0b894'), normalMap: SKIN, normalScale: nv2(.22), roughness: .55 }), { skin: 1, rim: .5, glow: 1 }),
  lid: patch(std({ color: C('#f0b894'), roughness: .5 }), { skin: 1, glow: 1 }),
  // cutscene: the skin over the top of her eye while her lid rests, as her face's
  lidSkin: patch(std({ color: C('#f0b894'), roughness: .5 }), { skin: 1, rim: .5, glow: 1 }),
  skinShade: patch(std({ color: C('#eaa585'), normalMap: SKIN, normalScale: nv2(.2), roughness: .6 }), { skin: 1, rim: .5, glow: 1 }),
  lip: patch(phys({ color: C('#c85a6e'), roughness: .34, clearcoat: .6, clearcoatRoughness: .22 }), { skin: .6, glow: 1 }),
  // cutscene: the line of her closed smile, and her brows, matte so they read as dark strokes under any light
  brow: patch(std({ vertexColors: true, color: C('#5a4a4c'), roughness: .95, envMapIntensity: 0 }), { glow: 1 }),
  mouth: patch(phys({ color: C('#6f2c38'), roughness: .45, clearcoat: .3, clearcoatRoughness: .3 }), { glow: 1 }),
  nail: patch(phys({ color: C('#4a1850'), roughness: .22, clearcoat: 1, clearcoatRoughness: .06 }), { glow: 1 }),
  hair: patch(std({ vertexColors: true, roughness: .7, envMapIntensity: .15 }), { hair: 1, glow: 1, tr: .45 }),
  lash: patch(std({ vertexColors: true, roughness: .55, envMapIntensity: .4 }), { glow: 1 }),
  scrunchie: patch(phys({ color: C('#7d2e9a'), roughness: .72, sheen: CR(.62, .4, .8), normalMap: CRUSH, normalScale: nv2(.9) }), { rim: .6, glow: 1 }),
  coat: patch(phys({ map: COATV.map, normalMap: COATV.normal, normalScale: nv2(.6), roughnessMap: COATV.rm, metalnessMap: COATV.rm, roughness: 1, metalness: METAL, sheen: CR(.34, .14, .26), envMapIntensity: .35 }), { star: 1, rim: 1, glow: 1 }),
  lining: patch(phys({ color: C('#4a1334'), roughness: .42, sheen: CR(.4, .2, .34), side: THREE.BackSide }), { glow: 1 }),
  trim: patch(phys({ map: TRIM.map, normalMap: TRIM.normal, normalScale: nv2(1), roughnessMap: TRIM.rm, metalnessMap: TRIM.rm, roughness: 1, metalness: METAL, emissive: C('#2a0a18').multiplyScalar(.5) }), { rim: .6, glow: 1 }),
  gold: patch(phys({ color: C('#efbd5c'), metalness: METAL, roughness: .24, clearcoat: .4, clearcoatRoughness: .1, emissive: C('#3a2206').multiplyScalar(.35) }), { glow: 1 }),
  silver: patch(phys({ color: C('#dddbe4'), metalness: METAL, roughness: .2, clearcoat: .3, emissive: C('#1c1c22').multiplyScalar(.4) }), { glow: 1 }),
  blade: patch(phys({ map: BLADE.map, normalMap: BLADE.normal, normalScale: nv2(.7), roughnessMap: BLADE.rm, metalnessMap: BLADE.rm, metalness: METAL, roughness: 1, envMapIntensity: 1.3 }), { glow: 1 }),
  handle: patch(phys({ map: LEATHER.map, color: CR(.62, .6, .62), normalMap: LEATHER.normal, normalScale: nv2(.8), roughness: .62 }), { glow: 1 }),
  boot: patch(phys({ map: LEATHER.map, normalMap: LEATHER.normal, normalScale: nv2(.55), roughnessMap: LEATHER.rm, roughness: 1, clearcoat: .28, clearcoatRoughness: .38 }), { rim: .7, glow: 1 }),
  bootDark: patch(phys({ map: LEATHER.map, color: CR(.62, .56, .58), normalMap: LEATHER.normal, normalScale: nv2(.6), roughness: .66, clearcoat: .15 }), { rim: .5, glow: 1 }),
  dress: patch(phys({ map: DRESS.map, emissiveMap: DRESS.emis, emissive: CR(.12, .12, .12), normalMap: DRESS.normal, normalScale: nv2(.7), roughness: .6, sheen: CR(.22, .16, .22), side: THREE.DoubleSide }), { glit: 260, rim: .8, glow: 1 }),
  bodice: patch(std({ map: NET.map, normalMap: NET.normal, normalScale: nv2(1), roughness: .78 }), { rim: .3, glow: 1 }),
  sash: patch(phys({ map: SASH.map, emissiveMap: SASH.emis, emissive: CR(.2, .2, .2), normalMap: SASH.normal, normalScale: nv2(.5), roughness: .4, sheen: CR(.62, .6, .68), side: THREE.DoubleSide }), { glit: 300, rim: .6, glow: 1 }),
  hat: patch(phys({ map: HATV.map, normalMap: HATV.normal, normalScale: nv2(.6), roughnessMap: HATV.rm, metalnessMap: HATV.rm, roughness: 1, metalness: METAL, sheen: CR(.32, .13, .24), side: THREE.DoubleSide, envMapIntensity: .35 }), { rim: 1, glow: 1 }),
  hatBand: patch(phys({ map: BAND.map, emissiveMap: BAND.emis, emissive: CR(.12, .12, .12), normalMap: BAND.normal, normalScale: nv2(.6), roughness: .9, sheen: CR(.4, .3, .26) }), { fur: 1, rim: .5, glow: 1 }),
  horn: patch(phys({ map: HORN.map, normalMap: HORN.normal, normalScale: nv2(.8), vertexColors: true, roughness: .36, clearcoat: .45, clearcoatRoughness: .28 }), { rim: .6, glow: 1 }),
  cord: patch(std({ color: C('#151015'), roughness: .62, normalMap: CRUSH, normalScale: nv2(.4) }), { glow: 1 }),
  eyeW: patch(phys({ color: 0xffffff, vertexColors: true, roughness: .28, clearcoat: .8, clearcoatRoughness: .1, emissive: C('#3c3c40') }), { glow: 1 }),
  iris: patch(phys({ map: IRIS, emissiveMap: IRIS, emissive: C('#5a5a5a'), roughness: .3, clearcoat: 1, clearcoatRoughness: .05 }), { glow: 1, tr: .8 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  frame: patch(phys({ color: C('#141014'), roughness: .24, metalness: .6 * METAL, clearcoat: .8, clearcoatRoughness: .12 }), { glow: 1 }),
  // glass that only adds what it reflects (so it never darkens her eyes), and a breath of tint
  lens: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.1 }, ADD)),
  lensTint: new THREE.MeshStandardMaterial({ color: C('#dfe8ff'), roughness: .05, transparent: true, opacity: .07, depthWrite: false }),
  cornea: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .02, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: .9 }, ADD))
 };
 for (const k in M) M[k].name = k;
 const LINING = [{ m: M.lining, c: M.lining.color.clone() }];
 const INDIGO = C('#1c2660');

 // ---------- skeleton: the game model's 51 bones, where they were ----------
 const root = new THREE.Group(); root.name = 'Io';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) {
  const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b);
  BI[name] = bones.length; bones.push(b); return b;
 }
 const pelvis = bone('pelvis', root, 0, 0.86, 0);
 const spine = bone('spine', pelvis, 0, 0.12, 0);
 const chest = bone('chest', spine, 0, 0.14, 0);
 const neck = bone('neck', chest, 0, 0.16, 0); neck.rotation.order = 'YXZ';
 const headB = bone('head', neck, 0, 0.10, 0); headB.rotation.order = 'YXZ';
 const legs = [], knees = [], ankles = [], arms = [], elbows = [], wrists = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, 0.075 * sd, -0.07, 0), k = bone('knee' + sd, h, 0, -0.36, 0), a = bone('ankle' + sd, k, 0, -0.34, 0);
  legs.push(h); knees.push(k); ankles.push(a);
  const s = bone('shoulder' + sd, chest, 0.155 * sd, 0.075, 0), e = bone('elbow' + sd, s, 0, -0.235, 0), w = bone('wrist' + sd, e, 0, -0.215, 0);
  arms.push(s); elbows.push(e); wrists.push(w);
 }
 const SK = 8, skirt = [];
 for (let k = 0; k < SK; k++) {
  const a = k / SK * TAU, b = bone('skirt' + k, pelvis, 0.12 * Math.sin(a), 0.02, 0.12 * Math.cos(a) * 0.9);
  b.rotation.order = 'YXZ'; b.rotation.y = a; skirt.push(b);
 }
 const CK = 8, coatU = [], coatL = [];
 for (let k = 0; k < CK; k++) {
  const a = (k + 0.5) / CK * TAU, u = bone('coatU' + k, pelvis, 0.2 * Math.sin(a), 0.06, 0.2 * Math.cos(a) * 0.88);
  u.rotation.order = 'YXZ'; u.rotation.y = a;
  const l = bone('coatL' + k, u, 0, -0.3, 0.035); l.rotation.order = 'YXZ';
  coatU.push(u); coatL.push(l);
 }
 const hairA = bone('hairA', headB, 0, -0.085, -0.14), hairB = bone('hairB', hairA, 0, -0.17, -0.03), hairC = bone('hairC', hairB, 0, -0.17, -0.005);
 const sideL1 = bone('sideL1', headB, 0.125, -0.02, 0.05), sideL2 = bone('sideL2', sideL1, 0.005, -0.1, 0.005);
 const sideR1 = bone('sideR1', headB, -0.125, -0.02, 0.05), sideR2 = bone('sideR2', sideR1, -0.005, -0.1, 0.005);
 // cutscene: her hat sits lower and tipped back less than the study's, as the paper doll wears it: under its brim her
 // bangs fall to her brows, just above her glasses (the study's showed a band of forehead there)
 const hatB = bone('hat', headB, 0.0, 0.085, -0.011); hatB.rotation.set(-0.12, 0, 0.07);
 const hatA1 = bone('hatA', hatB, 0, 0.25, -0.02), hatA2 = bone('hatB', hatA1, -0.035, 0.1, -0.035);
 root.updateMatrixWorld(true);
 const bw = (b) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };

 // ---------- skin weights: the game model's, by where a point is in the bind pose ----------
 const ring = (x, z, zs, n, off) => ((((Math.atan2(x, z / zs) / TAU) * n - (off || 0)) % n) + n) % n;
 function wTorso(x, y) {
  if (y >= 1.1) { const t = sm(1.1, 1.16, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.95) { const t = sm(0.95, 1.1, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  return [[BI.pelvis, 1]];
 }
 function wSkirt(x, y, z) {
  if (y >= 0.9) return wTorso(x, y, z);
  const s = sm(0.9, 0.6, y);
  const f = ring(x, z, 0.9, SK), k0 = Math.floor(f) % SK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s], [BI['skirt' + k0], s * (1 - fr)], [BI['skirt' + ((k0 + 1) % SK)], s * fr]];
 }
 function wCoat(x, y, z) {
  if (y >= 1.0) { const t = sm(1.0, 1.12, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.93) { const t = sm(0.93, 1.0, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  const s1 = sm(0.93, 0.74, y), s2 = sm(0.68, 0.42, y);
  const f = ring(x, z, 0.88, CK, 0.5), k0 = Math.floor(f) % CK, k1 = (k0 + 1) % CK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s1], [BI['coatU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['coatU' + k1], s1 * (1 - s2) * fr], [BI['coatL' + k0], s1 * s2 * (1 - fr)], [BI['coatL' + k1], s1 * s2 * fr]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd];
  if (y >= 0.48) return [[H, 1]];
  const t = sm(0.48, 0.4, y); return [[H, 1 - t], [K, t]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd];
  if (y > 1.16) { const c = sm(1.16, 1.25, y) * 0.55; return [[S, 1 - c], [BI.chest, c]]; }
  if (y > 1.0) return [[S, 1]];
  if (y > 0.93) { const t = sm(1.0, 0.93, y); return [[S, 1 - t], [E, t]]; }
  return [[E, 1]];
 }
 function wHair(x, y, z) {
  if (z < -0.06 || Math.abs(x) < 0.1) {
   if (y > 1.33) return [[BI.head, 1]];
   if (y > 1.22) { const t = sm(1.33, 1.22, y); return [[BI.head, 1 - t], [BI.hairA, t]]; }
   if (y > 1.08) { const t = sm(1.2, 1.08, y); return [[BI.hairA, 1 - t], [BI.hairB, t]]; }
   const t = sm(1.02, 0.9, y); return [[BI.hairB, 1 - t], [BI.hairC, t]];
  }
  const L = x > 0, S1 = BI[L ? 'sideL1' : 'sideR1'], S2 = BI[L ? 'sideL2' : 'sideR2'];
  if (y > 1.36) return [[BI.head, 1]];
  if (y > 1.3) { const t = sm(1.36, 1.3, y); return [[BI.head, 1 - t], [S1, t]]; }
  const t = sm(1.26, 1.16, y); return [[S1, 1 - t], [S2, t]];
 }

 // ---------- geometry helpers ----------
 const dummy = new THREE.Object3D(), _nm = new THREE.Matrix3();
 // a geometry moved by a matrix, with its hair directions (aHT) turned too
 function xform(g, m) {
  g.applyMatrix4(m);
  const t = g.attributes.aHT;
  if (t) { for (let i = 0; i < t.count; i++) { _v.set(t.getX(i), t.getY(i), t.getZ(i)).transformDirection(m); t.setXYZ(i, _v.x, _v.y, _v.z); } t.needsUpdate = true; }
  return g;
 }
 const _v = new THREE.Vector3();
 // a copy of geo placed by position, rotation (or quaternion) and scale, as every part adds its pieces
 function place(geo, p, rot, sc, quat) {
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
  if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1);
  else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc);
  else dummy.scale.set(sc[0], sc[1], sc[2]);
  dummy.updateMatrix();
  return xform(geo.clone(), dummy.matrix);
 }
 // merges geometries into one indexed geometry with every attribute any of them has; one that lacks an attribute gets
 // white for colour, straight up for a hair direction, nothing for the rest
 const DEF = { color: [1, 1, 1], aHT: [0, 1, 0] };
 function merge(list) {
  let nv = 0, ni = 0; const keys = new Map();
  for (const g of list) {
   nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count;
   for (const k of Object.keys(g.attributes)) if (!keys.has(k)) { const a = g.attributes[k]; keys.set(k, { size: a.itemSize, T: a.array.constructor }); }
  }
  const out = new THREE.BufferGeometry();
  for (const [k, { size, T }] of keys) {
   const A = new T(nv * size), d = DEF[k];
   let o = 0;
   for (const g of list) {
    const a = g.attributes[k], c = g.attributes.position.count;
    if (a) A.set(a.array.length === c * size ? a.array : a.array.subarray(0, c * size), o);
    else if (d) for (let i = 0; i < c; i++) for (let s = 0; s < size; s++) A[o + i * size + s] = d[s];
    o += c * size;
   }
   out.setAttribute(k, new THREE.BufferAttribute(A, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; }
   else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  out.setIndex(new THREE.BufferAttribute(I, 1));
  out.computeBoundingSphere();
  return out;
 }
 function weights(geo, fn) {
  const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(pos.getX(i), pos.getY(i), pos.getZ(i)).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
 }
 // ---------- pooling: one skinned mesh per material (built at bind) ----------
 // Skinned parts pool their geometry by material. A rigid part riding on a bone, directly or through a group that never
 // moves relative to it (STATIC), pools too: it is skinned to that bone with full weight, so it moves exactly as if it
 // were parented to it. Only see-through materials stay meshes of their own.
 const POOL = new Map(), STATIC = new Set();
 // three.js r128 compiles a material once, skinned or not, for every object that uses it: a part that is not skinned
 // (lids, lashes, the dagger's charm) gets its own copy of a material the skinned body also uses, as the game model does
 const plainCache = new Map();
 function plain(m) {
  if (!m.skinning) return m;
  let c = plainCache.get(m);
  if (!c) { c = m.clone(); c.skinning = false; c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; c.name = m.name; plainCache.set(m, c); }
  return c;
 }
 function boneOf(p) { while (p && !p.isBone) { if (!STATIC.has(p)) return null; p = p.parent; } return p || null; }
 function poolAdd(mat, geo, rigid) { let list = POOL.get(mat); if (!list) POOL.set(mat, (list = [])); list.push({ geo, rigid }); }
 function part(wfn) {
  const buckets = new Map();
  return {
   add(geo, mat, p, rot, sc, quat) { const g = place(geo, p, rot, sc, quat); let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(g); return this; },
   addWorld(geo, mat) { let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(geo); return this; },
   build(parent, off) {
    const out = [], bone = wfn ? null : boneOf(parent);
    for (const [mat, list] of buckets) {
     const geo = merge(list);
     if (wfn) { weights(geo, wfn); poolAdd(mat, geo, null); continue; }
     if (bone && !mat.transparent) { poolAdd(mat, geo, { parent, off, bone }); continue; }
     const m = new THREE.Mesh(geo, plain(mat));
     if (off) m.position.set(-off[0], -off[1], -off[2]);
     if (mat.transparent) m.renderOrder = 2;
     parent.add(m); out.push(m);
    }
    return out;
   }
  };
 }
 const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
 function seg(P, mat, a, b, r0, r1, rs, caps) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = _d.length(); _d.multiplyScalar(1 / L);
  _q.setFromUnitVectors(YA, _d);
  P.add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, !!caps), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, _q);
  if (caps) {
   P.add(new THREE.SphereGeometry(r0, rs, Math.max(6, rs >> 1)), mat, a);
   P.add(new THREE.SphereGeometry(r1, rs, Math.max(6, rs >> 1)), mat, b);
  }
 }
 // a profile made smooth: n points between each pair, passing through every one of them
 function smoothP(prof, n) {
  if (n <= 1) return prof;
  const cv = new THREE.SplineCurve(prof.map((p) => new THREE.Vector2(p[0], p[1])));
  return cv.getPoints((prof.length - 1) * n).map((p) => [p.x, p.y]);
 }
 function lathe(profile, segs, disp, zs, phiStart, phiLen, xs) {
  const full = phiLen === undefined, np = profile.length;
  const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segs, full ? Math.PI : phiStart, full ? TAU : phiLen);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
   let x = pos.getX(i), z = pos.getZ(i);
   const y = pos.getY(i), r = Math.hypot(x, z);
   if (disp && r > 1e-6) { const k = disp(r, y, Math.atan2(x, z)) / r; x *= k; z *= k; }
   pos.setXYZ(i, x * (xs || 1), y, z * (zs || 1));
  }
  g.computeVertexNormals();
  if (full) {
   const n = g.attributes.normal;
   for (let j = 0; j < np; j++) {
    const a = j, b = segs * np + j;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
   }
  }
  return g;
 }
 function sheet(nu, nv, fn, uvRot) {
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), Uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0];
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, v = j / nv; fn(u, v, o);
   P[k * 3] = o[0]; P[k * 3 + 1] = o[1]; P[k * 3 + 2] = o[2];
   if (uvRot) { Uv[k * 2] = v; Uv[k * 2 + 1] = u; } else { Uv[k * 2] = u; Uv[k * 2 + 1] = 1 - v; }
   k++;
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(Uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // uv scaled, as the game model's texture repeats were
 const uvs = (g, sx, sy) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; };
 // a colour per vertex from its position (light tints and shade in the creases, linear)
 function vcol(g, fn) {
  const p = g.attributes.position, n = p.count, a = new Float32Array(n * 3), o = [1, 1, 1];
  for (let i = 0; i < n; i++) { o[0] = o[1] = o[2] = 1; fn(p.getX(i), p.getY(i), p.getZ(i), o, i); a[i * 3] = o[0]; a[i * 3 + 1] = o[1]; a[i * 3 + 2] = o[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
 }
 // a tube along a curve whose cross-section can be flattened against a surface (locks, the hat's crown, horns, fingers).
 // It carries its direction along the curve (aHT), for hair.
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _vv = new THREE.Vector3();
 function strand(pts, TSg, RS, rFn, flat, centerFn) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, TSg, 1, RS, false);
  const pos = g.attributes.position, ht = new Float32Array(pos.count * 3);
  for (let i = 0; i <= TSg; i++) {
   const t = i / TSg; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
   const cen = centerFn ? centerFn(_c) : null;
   if (cen) { _o.subVectors(_c, cen); _o.addScaledVector(_t, -_o.dot(_t)); }
   if (!cen || _o.lengthSq() < 1e-10) _o.copy(g.normals[i]);
   _o.normalize(); _w.crossVectors(_t, _o).normalize();
   const r = rFn(t);
   for (let j = 0; j <= RS; j++) {
    const idx = i * (RS + 1) + j;
    _vv.fromBufferAttribute(pos, idx).sub(_c);
    const a = _vv.dot(_o), b = _vv.dot(_w);
    _vv.copy(_c).addScaledVector(_o, a * r * flat).addScaledVector(_w, b * r);
    pos.setXYZ(idx, _vv.x, _vv.y, _vv.z);
    ht[idx * 3] = _t.x; ht[idx * 3 + 1] = _t.y; ht[idx * 3 + 2] = _t.z;
   }
  }
  g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.computeVertexNormals();
  return g;
 }
 // Fine strands through a lock: K thin tubes of RS sides along the lock's centre line, each placed somewhere in the lock's
 // section (most of them near its surface, where they show), wandering a little, tapering, some ending early, each a
 // slightly different shade and darker toward the root and the lock's inside. Returns one geometry with position, normal,
 // uv (x along the strand, y the strand's number), color and aHT (the direction along it).
 let strandId = 0;
 const _fr = { P: [], T: [], O: [], W: [] };
 function lockStrands(pts, K, N, RS, rFn, flat, cenFn, col, o) {
  o = o || {};
  const lean = o.lean === undefined ? .7 : o.lean, thick = o.thick || .00058, jit = o.jitter === undefined ? .35 : o.jitter, inner = o.inner === undefined ? .3 : o.inner;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const fr = curve.computeFrenetFrames(N, false), F = _fr;
  for (let i = 0; i <= N; i++) {
   const t = i / N, P = F.P[i] || (F.P[i] = V3()), T = F.T[i] || (F.T[i] = V3()), O = F.O[i] || (F.O[i] = V3()), W = F.W[i] || (F.W[i] = V3());
   curve.getPointAt(t, P); curve.getTangentAt(t, T);
   const cen = cenFn ? cenFn(P) : null;
   if (cen) { O.subVectors(P, cen); O.addScaledVector(T, -O.dot(T)); }
   if (!cen || O.lengthSq() < 1e-10) O.copy(fr.normals[i]);
   O.normalize(); W.crossVectors(T, O).normalize();
  }
  const nv = K * (N + 1) * RS, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), cc = new Float32Array(nv * 3), ht = new Float32Array(nv * 3);
  const idx = new Uint32Array(K * N * RS * 6);
  let v = 0, ii = 0;
  for (let k = 0; k < K; k++) {
   const ang = r2() * TAU, rad = Math.min(1.08, (1 - inner) + inner * Math.sqrt(r2()) + .08 * r2()), a = Math.cos(ang) * rad, b = Math.sin(ang) * rad;
   const ph1 = r2() * TAU, ph2 = r2() * TAU, f1 = 3 + r2() * 6, f2 = 4 + r2() * 7, tip = 1 - Math.pow(r2(), 2) * (o.short || .22), sh = .82 + r2() * .34, rot = r2() * TAU;
   const id = (strandId++ % 4096) / 4096 + .5 / 4096, th = thick * (.7 + r2() * .6);
   const v0 = v;
   for (let i = 0; i <= N; i++) {
    const t = i / N, P = F.P[i], T = F.T[i], O = F.O[i], W = F.W[i], R = rFn(t);
    const wo = jit * R * Math.sin(f1 * t * PI + ph1) * t, ww = jit * R * Math.sin(f2 * t * PI + ph2) * t;
    const cx = P.x + O.x * (a * R * flat + wo) + W.x * (b * R + ww), cy = P.y + O.y * (a * R * flat + wo) + W.y * (b * R + ww), cz = P.z + O.z * (a * R * flat + wo) + W.z * (b * R + ww);
    const rs = th * (1 - .55 * t) * (1 - sm(tip - .1, tip, t)) + 1e-5;
    const shade = sh * (.5 + .5 * sm(0, .14, t)) * (.6 + .4 * rad) * (1 + .1 * t);
    for (let j = 0; j < RS; j++) {
     const q = j / RS * TAU + rot, cq = Math.cos(q), sq = Math.sin(q);
     const nx = O.x * cq + W.x * sq, ny = O.y * cq + W.y * sq, nz = O.z * cq + W.z * sq;
     pos[v * 3] = cx + nx * rs; pos[v * 3 + 1] = cy + ny * rs; pos[v * 3 + 2] = cz + nz * rs;
     const mx = nx * lean + O.x, my = ny * lean + O.y, mz = nz * lean + O.z, ml = Math.hypot(mx, my, mz) || 1;
     nrm[v * 3] = mx / ml; nrm[v * 3 + 1] = my / ml; nrm[v * 3 + 2] = mz / ml;
     uv[v * 2] = t; uv[v * 2 + 1] = id;
     cc[v * 3] = col.r * shade; cc[v * 3 + 1] = col.g * shade; cc[v * 3 + 2] = col.b * shade;
     ht[v * 3] = T.x; ht[v * 3 + 1] = T.y; ht[v * 3 + 2] = T.z;
     v++;
    }
   }
   for (let i = 0; i < N; i++) for (let j = 0; j < RS; j++) {
    const A = v0 + i * RS + j, B = v0 + i * RS + (j + 1) % RS, Cc = A + RS, D = B + RS;
    idx[ii++] = A; idx[ii++] = B; idx[ii++] = Cc; idx[ii++] = B; idx[ii++] = D; idx[ii++] = Cc;
   }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
 }
 // a cross outline extruded with a bevel (the gold crosses on her necklace, hat chain and charm): a bar w by h, a crossbar
 // cw by ch whose middle is cy above the bar's, d deep
 function crossGeo(w, h, cw, ch, cy, d, bev) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2, X = cw / 2, Y0 = cy - ch / 2, Y1 = cy + ch / 2;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, Y0); s.lineTo(X, Y0); s.lineTo(X, Y1); s.lineTo(x, Y1); s.lineTo(x, y); s.lineTo(-x, y);
  s.lineTo(-x, Y1); s.lineTo(-X, Y1); s.lineTo(-X, Y0); s.lineTo(-x, Y0); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * bev) / 2); g.computeVertexNormals();
  return g;
 }
 const _e = new THREE.Euler();
 const offE = (c, rot, v) => { _v.set(v[0], v[1], v[2]).applyEuler(_e.set(rot[0], rot[1], rot[2])); return [c[0] + _v.x, c[1] + _v.y, c[2] + _v.z]; };
 const qz = (q, a) => q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ZA, a));
 const interp = (tab, y) => {
  if (y <= tab[0][1]) return tab[0][0];
  for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); }
  return tab[tab.length - 1][0];
 };
 const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();

 // ---------- the body: every part where the game model has it, at its size, drawn finer ----------
 const SMP = DET > .6 ? 4 : 2;                       // points added between each pair of a profile
 const Tp = part(wTorso);
 // cutscene: her black top comes up to her collarbones, as the paper doll's does, so only her neck and a little of her
 // chest show between her coat's lapels (the study's showed a wide pale breast that ran on into her face)
 Tp.add(uvs(lathe(smoothP([[0.118, 1.13], [0.126, 1.16], [0.13, 1.19], [0.125, 1.212]], SMP), Q(96, 24), null, 0.78, undefined, undefined, 1.22), 6, 2), M.bodice);
 Tp.add(uvs(lathe(smoothP([[0.125, 1.212], [0.12, 1.22], [0.098, 1.25], [0.07, 1.28], [0.05, 1.3]], SMP), Q(96, 24), null, 0.78, undefined, undefined, 1.22), 6, 2), M.skin);
 const bust = (r, y, a) => r + 0.016 * Math.exp(-(((y - 1.085) / 0.035) ** 2)) * Math.max(0, Math.cos(a)) ** 2;
 Tp.add(uvs(lathe(smoothP([[0.112, 0.86], [0.1, 0.9], [0.094, 0.95], [0.1, 1.0], [0.114, 1.04], [0.126, 1.08], [0.128, 1.11], [0.124, 1.14], [0.12, 1.165], [0.104, 1.17]], SMP), Q(144, 32), bust, 0.82, undefined, undefined, 1.05), 10, 5), M.bodice);
 Tp.build(root);

 // the sash: a satin band, a gathered knot and two tails
 const Sk = part(wSkirt);
 Sk.add(uvs(lathe(smoothP([[0.112, 0.876], [0.116, 0.884], [0.116, 0.912], [0.11, 0.921]], 3), Q(128, 24), (r, y, a) => r + .0006 * Math.sin(a * 23), 0.9), 3, 1), M.sash);
 { const k = new THREE.SphereGeometry(1, Q(40, 16), Q(28, 10)), p = k.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .09 * Math.cos(5 * Math.atan2(y, x)) * (1 - Math.abs(z)); p.setXYZ(i, x * f, y * f, z); } k.computeVertexNormals(); Sk.add(uvs(k, 3, 1), M.sash, [0.012, 0.895, 0.104], null, [0.024, 0.02, 0.016]); }
 for (const s of [-1, 1]) {
  const pts = [[0.012 + 0.006 * s, 0.888, 0.112], [0.02 * s + 0.013, 0.82, 0.148], [0.03 * s + 0.014, 0.75, 0.166]];
  Sk.add(uvs(strand(pts, Q(40, 10), 12, (t) => 0.011 * (1 - 0.3 * t) * (1 + .06 * Math.sin(t * 19)), 0.3, (c) => new THREE.Vector3(0, c.y, 0)), 3, 1), M.sash);
 }
 // the dress: three ruffled tiers, the lower two open at the slit; its ruffles are the game model's, with a fine gathering
 const ruff = (amp, n, y0, y1) => (r, y, a) => r + amp * sm(y0, y1, y) * (Math.sin(n * a + 0.5) + 0.35 * Math.sin(2 * n * a + 1.3) + .1 * Math.sin(4.7 * n * a + 2.1));
 const SLIT = 0.42, DSEG = Q(256, 60);
 Sk.add(uvs(lathe(smoothP([[0.14, 0.575], [0.212, 0.582], [0.2, 0.64], [0.176, 0.72], [0.148, 0.8], [0.124, 0.86], [0.108, 0.9]], 3), DSEG, ruff(0.012, 12, 0.72, 0.6), 0.9), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.2, 0.3], [0.274, 0.306], [0.262, 0.38], [0.242, 0.48], [0.216, 0.56], [0.19, 0.6], [0.162, 0.645]], 3), DSEG, ruff(0.017, 11, 0.5, 0.32), 0.9, SLIT + 0.17, TAU - 0.34), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.27, 0.05], [0.322, 0.056], [0.312, 0.12], [0.296, 0.22], [0.276, 0.3], [0.255, 0.34], [0.232, 0.372]], 3), DSEG, ruff(0.02, 13, 0.25, 0.07), 0.9, SLIT + 0.24, TAU - 0.48), 5, 3), M.dress);
 Sk.build(root);

 const Lg = part(wLeg);
 for (const sd of [-1, 1]) Lg.add(uvs(lathe(smoothP([[0.052, 0.39], [0.057, 0.44], [0.061, 0.5], [0.068, 0.58], [0.074, 0.66], [0.08, 0.74], [0.084, 0.8], [0.08, 0.86]], SMP), Q(64, 14), null, 0.95), 5, 4), M.skin, [0.075 * sd, 0, 0]);
 Lg.build(root);

 const Ar = part(wArm);
 for (const sd of [-1, 1]) Ar.add(uvs(lathe(smoothP([[0.027, 0.735], [0.029, 0.76], [0.033, 0.82], [0.036, 0.88], [0.037, 0.94], [0.035, 0.965], [0.039, 1.0], [0.043, 1.08], [0.045, 1.15], [0.044, 1.2], [0.034, 1.235], [0.0, 1.248]], SMP), Q(48, 12), null, 0.92), 4, 4), M.skin, [0.155 * sd, 0, 0]);
 Ar.build(root);

 // ---------- the coat: open front, handkerchief-point hem, the game model's folds; velvet outside, satin lining inside,
 // a thickness between them, its gold-braid trim, and gold piping round every edge ----------
 const CT = smoothP([[0.38, 0.26], [0.335, 0.42], [0.265, 0.6], [0.205, 0.76], [0.168, 0.88], [0.158, 0.98], [0.162, 1.1], [0.176, 1.18], [0.19, 1.225], [0.152, 1.265], [0.105, 1.295]], 24);
 const aOpen = (v) => 0.5 + 0.34 * v;
 const hemY = (a) => 0.35 - 0.08 * Math.max(0, Math.cos(7 * (a - Math.PI))) ** 2 - 0.045 * Math.max(0, -Math.cos(a));
 function coatPt(u, v, o, off) {
  const ao = aOpen(v), a = ao + u * (TAU - 2 * ao);
  const y = v < 0.08 ? lerp(1.295, 1.215, v / 0.08) : lerp(1.215, hemY(a), (v - 0.08) / 0.92);
  const lo = sm(0.95, 0.32, y);
  const r = interp(CT, y) + lo * (0.026 * Math.sin(9 * a + 0.7) + 0.01 * Math.sin(17 * a + 2.1) + .0032 * Math.sin(31 * a + .4)) + (off || 0);
  const top = sm(1.14, 1.22, y), mid = sm(0.95, 1.05, y) * (1 - top);
  const xs = 1 + 0.12 * top - 0.05 * mid, zs = 0.9 - 0.18 * sm(1.12, 1.22, y);
  o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
 }
 // a gold cord along a line of points, closing round if asked
 const piping = (pts, r, closed, n) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], p[2])), !!closed), n, r, Q(8, 5), !!closed);
 const Co = part(wCoat);
 const CNU = Q(320, 64), CNV = Q(110, 22), _o3 = [0, 0, 0];
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, 0)), 5, 3), M.coat);
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, -0.0026)), 5, 3), M.lining);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, 0.968 + v * 0.032, o, 0.003)), 40, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(0.988 + u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, v * 0.03, o, 0.003)), 10, 1), M.trim);
 {
  const edge = [], n = 90;
  for (let i = 0; i <= n; i++) { coatPt(0, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = 1; i <= 160; i++) { coatPt(i / 160, 1, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = n - 1; i >= 0; i--) { coatPt(1, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  Co.addWorld(piping(edge, .0024, false, Q(900, 200)), M.gold);
 }
 Co.build(root);

 function sleevePt(sd) {
  return (u, v, o, off) => {
   const a = u * TAU;
   const yEnd = 0.87 - 0.11 * Math.pow(Math.max(0, -Math.cos(a)), 1.5);
   const y = lerp(1.24, yEnd, v);
   let r = lerp(0.062, 0.078, sm(0, 0.35, v)) + 0.066 * sm(0.4, 1.0, v) ** 2 + 0.012 * sm(0.6, 1, v) * Math.sin(7 * a + sd) + .0025 * sm(.3, 1, v) * Math.sin(17 * a + 2 * sd);
   r = r * lerp(0.4, 1, sm(0, 0.12, v)) + (off || 0);
   o[0] = 0.155 * sd + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a);
  };
 }
 const Sl = part(wArm);
 for (const sd of [-1, 1]) {
  const f = sleevePt(sd), NU = Q(120, 24), NV = Q(56, 10);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, 0)), 2, 1.5), M.coat);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, -0.0022)), 2, 1.5), M.lining);
  Sl.addWorld(uvs(sheet(NU, 2, (u, v, o) => f(u, 0.955 + v * 0.045, o, 0.003)), 10, 1), M.trim);
  const cuff = []; for (let i = 0; i < 120; i++) { f(i / 120, 1, _o3, -0.001); cuff.push(_o3.slice()); }
  Sl.addWorld(piping(cuff, .0022, true, Q(240, 60)), M.gold);
 }
 Sl.build(root);

 // the hood, lying down at the back of the neck, in soft folds
 const chB = bw(chest), Hood = part();
 {
  const g = new THREE.SphereGeometry(1, Q(64, 16), Q(40, 10)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .07 * Math.sin(7 * Math.atan2(x, z) + 1) * (1 - Math.abs(y)) + .04 * Math.sin(13 * Math.atan2(x, y)); p.setXYZ(i, x * f, y * f, z * f); }
  g.computeVertexNormals();
  Hood.add(uvs(g, 5, 3), M.coat, [0, 1.175, -0.1], null, [0.13, 0.055, 0.05]);
 }
 Hood.add(uvs(new THREE.TorusGeometry(0.12, 0.006, Q(12, 6), Q(96, 16), Math.PI), 10, 1), M.trim, [0, 1.2, -0.11], [Math.PI / 2 + 0.25, 0, Math.PI], [1, 0.42, 1]);
 Hood.build(chest, chB);

 // ---------- knee-high boots: creased leather, two stitched straps with gold buckles, a rolled top, a crescent anklet ----------
 const BOOTP = [[0.046, -0.345], [0.049, -0.3], [0.052, -0.22], [0.056, -0.12], [0.059, -0.05], [0.066, -0.02], [0.068, -0.004], [0.062, 0.0]];
 for (let i = 0; i < 2; i++) {
  const sd = i === 0 ? -1 : 1;
  const Bs = part();
  Bs.add(uvs(lathe(smoothP(BOOTP, 3), Q(72, 14), (r, y, a) => r + .0005 * sm(-.34, -.3, y) * (1 - sm(-.3, -.22, y)) * Math.sin(a * 9), 0.95), 1.5, 1.2), M.boot);
  Bs.add(new THREE.TorusGeometry(.0625, .0022, Q(8, 5), Q(72, 16)), M.bootDark, [0, -.0008, 0], [Math.PI / 2, 0, 0], [1, .95, 1]);
  for (const y of [-0.27, -0.13]) {
   const R = interp(BOOTP.map((p) => [p[0], p[1]]), y);
   Bs.add(uvs(lathe([[R - .001, y - .0068], [R + .0045, y - .0066], [R + .0058, y - .004], [R + .006, y + .004], [R + .0045, y + .0066], [R - .001, y + .0068]], Q(72, 14), null, 0.95), 3, .2), M.bootDark);
   // the buckle: a gold frame on her outer side with its prong, and the strap's end through it
   const bx = sd * (R + .007);
   for (const [p, s] of [[[0, .0095, 0], [.0028, .0028, .021]], [[0, -.0095, 0], [.0028, .0028, .021]], [[0, 0, .0093], [.0028, .021, .0028]], [[0, 0, -.0093], [.0028, .021, .0028]]]) {
    Bs.add(new THREE.CylinderGeometry(.0014, .0014, Math.max(s[1], s[2]), 8), M.gold, [bx + p[0], y + p[1], .004 + p[2]], s[1] > s[2] ? null : [Math.PI / 2, 0, 0]);
    for (const e of [-1, 1]) if (s[1] > s[2]) Bs.add(new THREE.SphereGeometry(.0016, 8, 6), M.gold, [bx + p[0], y + p[1] + e * .0105, .004 + p[2]]);
   }
   Bs.add(new THREE.CylinderGeometry(.0009, .0009, .018, 6), M.gold, [bx + sd * .0012, y, .004], [Math.PI / 2, 0, 0]);
   Bs.add(new THREE.BoxGeometry(0.009, 0.012, 0.014, 2, 2, 2), M.bootDark, [sd * (R + .009), y, -.012]);
  }
  Bs.build(knees[i]);
  const Ft = part();
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(40, 12), Q(28, 8)), 1, 1), M.boot, [0, -0.036, 0.04], null, [0.047, 0.042, 0.1]);
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(32, 10), Q(24, 8)), 1, 1), M.boot, [0, -0.048, 0.1], null, [0.04, 0.032, 0.05]);
  // the sole, its edge a little proud of the upper, and a block heel
  Ft.add(uvs(lathe([[0, -.5], [.96, -.5], [1, -.38], [1, .38], [.96, .5], [0, .5]], Q(48, 12)), 2, 1), M.bootDark, [0, -0.082, 0.042], null, [0.05, 0.014, 0.115]);
  Ft.add(new THREE.BoxGeometry(0.042, 0.05, 0.04, 3, 4, 3), M.bootDark, [0, -0.07, -0.035]);
  Ft.add(new THREE.TorusGeometry(0.05, 0.0028, Q(10, 5), Q(96, 16)), M.gold, [0, 0.0, 0.002], [Math.PI / 2 - 0.1, 0, 0]);
  Ft.add(new THREE.TorusGeometry(0.009, 0.0026, Q(10, 5), Q(32, 12), Math.PI * 1.3), M.gold, [sd * 0.034, -0.014, 0.037], [0, sd * 0.8, Math.PI * 1.35]);
  Ft.build(ankles[i]);
 }

 // ---------- hands: the game model's slender fingers, each one smooth tube through its joints, lacquered nails ----------
 function finger(P, a, m, b, r0, r1) {
  const g = strand([a, m, b], Q(18, 6), Q(12, 6), (t) => lerp(r0, r1, t) * (1 + .07 * Math.exp(-(((t - .5) / .1) ** 2))), 1, null);
  P.addWorld(uvs(g, 1, 1), M.skin);
  P.add(new THREE.SphereGeometry(r1, Q(12, 6), Q(10, 5)), M.skin, b);
  P.add(new THREE.SphereGeometry(r0, Q(12, 6), Q(10, 5)), M.skin, a);
 }
 function hand(P, sd, cup) {
  P.add(uvs(new THREE.SphereGeometry(1, Q(32, 12), Q(24, 8)), 1, 1), M.skin, [0, -0.028, 0.002], null, [0.016, 0.03, 0.03]);
  const zs = [0.016, 0.005, -0.006, -0.016], L1 = [0.019, 0.021, 0.02, 0.016], L2 = [0.017, 0.019, 0.018, 0.015];
  for (let f = 0; f < 4; f++) {
   const a1 = cup ? 0.35 + f * 0.06 : 1.25 + f * 0.05, a2 = a1 + (cup ? 0.45 : 1.45);
   const b = [-sd * 0.002, -0.054, zs[f]];
   const m = [b[0] - sd * L1[f] * Math.sin(a1), b[1] - L1[f] * Math.cos(a1), b[2]];
   const d2 = [-sd * Math.sin(a2), -Math.cos(a2), 0], tip = [m[0] + d2[0] * L2[f], m[1] + d2[1] * L2[f], m[2]];
   finger(P, b, m, tip, 0.0068, 0.0056);
   const n = [sd * Math.cos(a2), -Math.sin(a2), 0];
   _bz.set(n[0], n[1], n[2]).normalize(); _by.set(-d2[0], -d2[1], -d2[2]).normalize(); _bx.crossVectors(_by, _bz); _bm.makeBasis(_bx, _by, _bz);
   P.add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.nail, [tip[0] - d2[0] * 0.004 + n[0] * 0.005, tip[1] - d2[1] * 0.004 + n[1] * 0.005, tip[2]], null, [0.0048, 0.0065, 0.0018], new THREE.Quaternion().setFromRotationMatrix(_bm));
  }
  const t0 = [-sd * 0.006, -0.02, 0.026];
  const t1 = cup ? [-sd * 0.016, -0.036, 0.04] : [-sd * 0.02, -0.04, 0.03];
  const t2 = cup ? [-sd * 0.024, -0.05, 0.046] : [-sd * 0.024, -0.055, 0.016];
  finger(P, t0, t1, t2, 0.0078, 0.0064);
 }
 for (let i = 0; i < 2; i++) { const P = part(); hand(P, i === 0 ? -1 : 1, i === 1); P.build(wrists[i]); }
 const Br = part();
 [[0.0335, M.silver, 0.0], [0.035, M.cord, 0.012], [0.034, M.silver, 0.022]].forEach((b, k) => Br.add(new THREE.TorusGeometry(b[0], 0.0034, Q(12, 6), Q(72, 22)), b[1], [0, -0.178 - b[2], 0], [Math.PI / 2 + 0.12 * (k - 1), 0, 0.1 * k]));
 Br.build(elbows[1]);

 // ---------- the dagger (her right hand): a wrapped grip with gold rings, a fluted pommel, a ringed guard, and a ridged
 // blade with a fuller, engraved with a crescent and stars ----------
 const dagger = new THREE.Group(); dagger.position.set(0.018, -0.048, 0.004); dagger.rotation.set(-0.25, 0, 0); wrists[0].add(dagger); STATIC.add(dagger);
 const Dg = part();
 {
  const grip = lathe(smoothP([[0.0115, -0.0425], [0.0112, 0], [0.0105, 0.0425]], 12), Q(48, 12), (r, y, a) => r + .0007 * Math.abs(Math.sin(a + y * 230)));
  Dg.add(uvs(grip, 1, 1), M.handle, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const pom = lathe(smoothP([[0, -.013], [.008, -.011], [.0125, -.004], [.013, .002], [.009, .01], [.004, .0125], [0, .013]], 4), Q(48, 12), (r, y, a) => r * (1 + .07 * Math.abs(Math.cos(4 * a))));
  Dg.add(pom, M.gold, [0, 0, -0.05], [Math.PI / 2, 0, 0]);
 }
 for (const z of [-0.03, -0.01, 0.01, 0.03]) Dg.add(new THREE.TorusGeometry(0.0113, 0.0017, Q(8, 4), Q(40, 14)), M.gold, [0, 0, z]);
 Dg.add(new THREE.TorusGeometry(0.019, 0.0042, Q(16, 8), Q(64, 20)), M.gold, [0, 0, 0.049]);
 Dg.add(lathe(smoothP([[.0062, -.035], [.0048, -.02], [.0044, 0], [.0048, .02], [.0062, .035]], 4), Q(20, 8), null, .9), M.gold, [0, 0, 0.049], [0, 0, Math.PI / 2]);
 for (const x of [-0.037, 0.037]) Dg.add(new THREE.SphereGeometry(0.007, Q(24, 8), Q(16, 6)), M.gold, [x, 0, 0.049]);
 {
  // the blade: a section with edges, bevels and a fuller groove down the middle, tapering to its point
  const SEC = [[1, 0], [.84, .3], [.36, .94], [.17, 1], [0, .74], [-.17, 1], [-.36, .94], [-.84, .3], [-1, 0], [-.84, -.3], [-.36, -.94], [-.17, -1], [0, -.74], [.17, -1], [.36, -.94], [.84, -.3], [1, 0]];
  const NL = Q(48, 10), ns = SEC.length, P = new Float32Array((NL + 1) * ns * 3), UVb = new Float32Array((NL + 1) * ns * 2), idx = [];
  for (let i = 0; i <= NL; i++) {
   const t = i / NL, w = 0.02 * (1 - t) * (1 + .14 * Math.sin(PI * t)), h = 0.0036 * (1 - t) * (1 + .1 * Math.sin(PI * t)), z = 0.056 + t * 0.19;
   for (let j = 0; j < ns; j++) { const k = i * ns + j; P[k * 3] = SEC[j][0] * w; P[k * 3 + 1] = SEC[j][1] * h; P[k * 3 + 2] = z; UVb[k * 2] = t * .92 + .04; UVb[k * 2 + 1] = SEC[j][0] * .5 + .5; }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < ns - 1; j++) { const a = i * ns + j, b = a + 1, c = a + ns, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UVb, 2)); g.setIndex(idx); g.computeVertexNormals();
  Dg.addWorld(g, M.blade);
 }
 Dg.build(dagger);
 const charm = new THREE.Group(); charm.position.set(0, 0, -0.058); dagger.add(charm);
 const Ch = part();
 for (let k = 0; k < 3; k++) Ch.add(new THREE.TorusGeometry(0.005, 0.0013, Q(8, 4), Q(20, 8)), M.gold, [0, -0.006 - k * 0.009, 0], [0, k % 2 ? Math.PI / 2 : 0, 0]);
 Ch.add(new THREE.TorusGeometry(0.009, 0.0025, Q(10, 5), Q(40, 14), Math.PI * 1.3), M.gold, [0, -0.041, 0], [0, 0, Math.PI * 1.35]);
 Ch.add(crossGeo(.003, .022, .013, .003, .006, .003, .0006), M.gold, [0, -0.066, 0]);
 Ch.build(charm);

 // ---------- necklace: a twisted black cord, a gold crescent and cross ----------
 const Nl = part();
 {
  const cord = new THREE.CatmullRomCurve3([[0, 1.275, -0.075], [0.066, 1.268, -0.03], [0.078, 1.245, 0.04], [0.046, 1.2, 0.1], [0, 1.162, 0.123], [-0.046, 1.2, 0.1], [-0.078, 1.245, 0.04], [-0.066, 1.268, -0.03]].map((p) => new THREE.Vector3(p[0], p[1], p[2])), true);
  const n = Q(480, 64), fr = cord.computeFrenetFrames(n, true), c = V3();
  for (let ply = 0; ply < 2; ply++) {
   const pts = [];
   for (let i = 0; i < n; i++) { const t = i / n, th = t * TAU * 80 + ply * PI; cord.getPointAt(t, c); pts.push(c.clone().addScaledVector(fr.normals[i], Math.cos(th) * .0012).addScaledVector(fr.binormals[i], Math.sin(th) * .0012)); }
   Nl.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), n * 2, 0.00135, Q(6, 4), true), M.cord);
  }
 }
 Nl.add(new THREE.TorusGeometry(0.004, 0.0015, Q(8, 4), Q(24, 10)), M.gold, [0, 1.157, 0.126]);
 Nl.add(new THREE.TorusGeometry(0.017, 0.0042, Q(12, 6), Q(48, 18), Math.PI).rotateZ(Math.PI), M.gold, [0, 1.145, 0.128]);
 Nl.add(crossGeo(.0042, .03, .017, .0042, .006, .003, .0007), M.gold, [0, 1.108, 0.13]);
 Nl.build(chest, chB);

 // ---------- head: the game model's round face, one smooth sculpt ----------
 const Nk = part();
 // cutscene: a slimmer neck, in the shade of her chin
 Nk.add(uvs(new THREE.CylinderGeometry(0.035, 0.041, 0.14, Q(48, 16), 4, true), 4, 1), M.skinShade, [0, 1.3, -0.005]);
 Nk.build(neck, bw(neck));
 const head = new THREE.Group(); headB.add(head); STATIC.add(head);
 const HR = 0.15, HS = [1.0, 1.06, 0.97];
 // cutscene: the top of her head, all under her lowered hat, drawn in a little so it fits inside the hat's band; her
 // hair is placed on the same shape
 const cranK = (y) => 1 - 0.12 * sm(0.02, 0.07, y);
 const headPt = (az, el, k) => { const y = HR * HS[1] * Math.sin(el), f = cranK(y); return [HR * HS[0] * Math.sin(az) * Math.cos(el) * k * f, y * k, HR * HS[2] * Math.cos(az) * Math.cos(el) * k * f]; };
 // cutscene: the paper doll's face, not a round ball. Below her eyes the face is shortened (the chin rises from the
 // sphere's bottom to about 10 cm under her eyes, where the paper doll has it) and narrowed, the cheeks staying full to
 // her nose before the jaw tapers to a small chin, which comes a little forward. Above her eyes nothing changes, so
 // her hat, hair and glasses sit as they did.
 function jaw(x, y, z) {
  if (y < -0.08) {
   const u = (-y - 0.08) / 0.92, k = 1 - 0.5 * sm(0.02, 0.75, u) - 0.22 * sm(0.5, 1, u);
   y = -0.08 - 0.92 * u * (1 - 0.3 * Math.pow(u, 0.8));
   x *= k; z *= z > 0 ? lerp(1, k, 0.42) + 0.1 * u * u : lerp(1, k, 0.75);
  }
  const f = cranK(y * HR * HS[1]);
  return [x * HR * HS[0] * f, y * HR * HS[1], z * HR * HS[2] * f];
 }
 const jawAt = (az, el) => jaw(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
 // the elevation on her face's middle line that comes out at height y (head space), once the jaw has shaped it
 function elFor(y) { let a = -1.55, b = 1.55; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (jawAt(0, m)[1] < y) a = m; else b = m; } return (a + b) / 2; }
 const _fa = new THREE.Vector3(), _fe = new THREE.Vector3();
 function frameAt(az, el, off) {
  const p = jawAt(az, el);
  // the surface's facing, measured on the shaped face itself (the jaw bends it below her eyes)
  const pa = jawAt(az + 1e-3, el), pe = jawAt(az, el + 1e-3);
  _fa.set(pa[0] - p[0], pa[1] - p[1], pa[2] - p[2]); _fe.set(pe[0] - p[0], pe[1] - p[1], pe[2] - p[2]);
  _bz.crossVectors(_fa, _fe).normalize();
  _bx.crossVectors(YA, _bz).normalize(); _by.crossVectors(_bz, _bx);
  _bm.makeBasis(_bx, _by, _bz);
  return { p: [p[0] + _bz.x * off, p[1] + _bz.y * off, p[2] + _bz.z * off], q: new THREE.Quaternion().setFromRotationMatrix(_bm) };
 }
 // the sculpt: her nose is now part of the face (the game model's small nose, the same size and place, risen out of the
 // skin rather than set on it), with cheeks a touch fuller under the blush
 // cutscene: where the paper doll has her nose, mouth and brows, measured down from her eyes in the shaped face
 const NOSE_EL = elFor(-0.043), MOUTH_EL = elFor(-0.07), BROW_EL = 0.295;
 const hg = new THREE.SphereGeometry(1, Q(160, 40), Q(120, 30)), hpos = hg.attributes.position;
 for (let i = 0; i < hpos.count; i++) {
  const ux = hpos.getX(i), uy = hpos.getY(i), uz = hpos.getZ(i), az = Math.atan2(ux, uz), el = Math.asin(cl(uy, -1, 1));
  let bump = .0052 * Math.exp(-((az / .056) ** 2) * Math.cos(el) - (((el - NOSE_EL) / .05) ** 2)) * (uz > 0 ? 1 : 0);
  for (const sd of [-1, 1]) bump += .0016 * Math.exp(-(((az - sd * .5) / .26) ** 2) - (((el + .32) / .16) ** 2));
  const p = jaw(ux, uy, uz), k = 1 + bump / Math.hypot(p[0], p[1], p[2]);
  hpos.setXYZ(i, p[0] * k, p[1] * k, p[2] * k);
 }
 hg.computeVertexNormals();
 const headC = new THREE.Vector3(0, 0, 0);
 // fine dark hairs (brows and lashes): each a tapering tube through three points
 const fibre = (P, mat, pts, r0, col) => P.addWorld(lockStrands(pts, 1, 6, Q(5, 3), () => 0, 1, null, col, { thick: r0, jitter: 0, short: .001 }), mat);
 const DARK = C('#3a2224'), LASH = C('#1e1216'), LASHLOW = C('#5a3434');
 const Hd = part();
 Hd.addWorld(hg, M.face);
 const _p3 = V3(), _q3 = new THREE.Quaternion();
 const atFrame = (f, local) => _p3.set(local[0], local[1], local[2]).applyQuaternion(f.q).add(V3(f.p[0], f.p[1], f.p[2])).toArray();
 for (const sd of [-1, 1]) {
  const b0 = headPt(sd * 1.5, -0.12, 0.96), b1 = [sd * 0.157, -0.005, -0.02], b2 = [sd * 0.168, 0.038, -0.04];
  Hd.add(uvs(strand([b0, b1, b2], Q(32, 12), Q(20, 10), (t) => 0.017 * Math.pow(1 - t, 0.7) + 0.0015, 0.42, () => headC), 1, 1), M.skin);
  Hd.add(uvs(strand([headPt(sd * 1.5, -0.1, 0.985), [sd * 0.16, -0.002, -0.02], [sd * 0.168, 0.035, -0.038]], Q(28, 10), Q(16, 8), (t) => 0.011 * Math.pow(1 - t, 0.8), 0.35, () => headC), 1, 1), M.skinShade);
  // cutscene: the brow as the paper doll draws it, one thin dark stroke just above her glasses: thicker at its inner
  // end, arching, tapering to its outer end. (The study's brow sat behind her glasses' rim and under her bangs.)
  // In the face's frame +x is toward her left, so a brow runs from inner (-sd) to outer (+sd).
  const fb = frameAt(sd * 0.29, BROW_EL, 0.0022), F = { p: fb.p, q: qz(fb.q, -sd * 0.05) };
  const bpts = [];
  for (let k = 0; k <= 12; k++) { const s = k / 12, x = sd * lerp(-0.021, 0.023, s), y = 0.0062 * Math.sin(PI * cl(s * 0.86 + 0.1, 0, 1)) - 0.0038 * s * s; bpts.push(atFrame(F, [x, y, 0])); }
  Hd.addWorld(lockStrands(bpts, 1, Q(28, 12), Q(8, 4), () => 0, 1, null, DARK, { thick: .0036, jitter: 0, short: .001 }), M.brow);
 }
 // cutscene: her mouth, a small closed smile (the paper doll's): a fine dark-rose line, lifting at its corners and a
 // little more at her left one; the rose of her lips is painted into her skin (FACE)
 {
  const f = frameAt(0, MOUTH_EL, 0.0007), mp = [];
  for (let k = 0; k <= 10; k++) { const s = k / 10 * 2 - 1; mp.push(atFrame(f, [s * 0.0158, 0.0042 * s * s - 0.0011 + 0.0008 * s, 0.0004 * (1 - s * s)])); }
  Hd.addWorld(uvs(strand(mp, Q(24, 10), Q(8, 5), (t) => 0.00035 + 0.00085 * Math.pow(Math.sin(PI * t), 0.6), 0.55, null), 1, 1), M.mouth);
 }
 Hd.build(head);

 // eyes: shaded whites, a painted iris that looks around, a wet cornea over it that reflects the night, the game model's
 // two highlights, real lids for blinking, a lash line with single lashes and the two long flicks at the outer corner.
 // The whites, irises and highlights never move within an eye, so they sit in head space and are shared by both eyes.
 // cutscene: the paper doll's eyes. Wider than tall (the study's were taller than wide, which made them a doll's), the
 // iris big and slightly taller than wide so it reaches the lower lash line, the upper lid resting a little lowered
 // over the iris's top (LID_REST), a heavy dark upper lash line thickest at the outer corner, where it runs on past the
 // eye and flicks up, and a fine lower line under its outer half. Blinking, the gaze and the two highlights work as
 // before.
 const SX = 0.0315, SY = 0.025, SZ = 0.007, EH = SY * 1.06, LID_REST = 0.15, IRX = 0.0184, IRY = 0.0215;
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 const eyes = [], whiteG = [], shineG = [], irisE = [], darkE = part(), lidSk = part();
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.07, -0.003);
  const eg = new THREE.Group(); eg.position.set(f.p[0], f.p[1], f.p[2]); eg.quaternion.copy(f.q); head.add(eg); eg.updateMatrix(); STATIC.add(eg);
  const sg = new THREE.SphereGeometry(1, Q(64, 24), Q(40, 16)); sg.scale(SX, SY, SZ);
  // the white, in the lid's shade along its top and a little greyer at its corners
  vcol(sg, (x, y, z, o) => { const k = 1 - 0.4 * sm(0.0, 0.017, y) - 0.06 * sm(-0.012, -0.021, y) - .07 * sm(.55, 1, Math.abs(x) / SX); o[0] = o[1] = lin1(k); o[2] = lin1(Math.min(1, k * 1.03)); });
  whiteG.push(sg.applyMatrix4(eg.matrix));
  const ig = new THREE.RingGeometry(0, 1, Q(72, 32), Q(14, 5)), ip = ig.attributes.position, base = new Float32Array(ip.count * 2);
  for (let i = 0; i < ip.count; i++) { base[i * 2] = ip.getX(i) * IRX; base[i * 2 + 1] = ip.getY(i) * IRY; }
  irisE.push({ ig, base, n: ip.count, m: eg.matrix.clone(), q: eg.quaternion.clone() });
  // the highlights: a big one high on her right of the iris, a small one low on her left (both eyes alike, as drawn)
  const hl = (x, y, r) => place(new THREE.SphereGeometry(r, Q(24, 10), Q(16, 8)), [x, y, zS(x, y) + r * .35]);
  shineG.push(merge([hl(-0.0065, 0.0053, 0.0051), hl(0.0062, -0.0099, 0.0026)]).applyMatrix4(eg.matrix));
  // the lower line: fine, under the outer half of the eye, thicker at the outer corner
  const lpts = []; for (let k = 0; k <= 12; k++) { const a = lerp(-0.32, -1.72, k / 12), x = sd * SX * 1.04 * Math.cos(a), y = SY * 1.05 * Math.sin(a); lpts.push([x, y, zS(x * .97, y * .97) + .0009]); }
  darkE.addWorld(xform(lockStrands(lpts, 1, Q(20, 8), Q(6, 4), () => 0, 1, null, LASHLOW, { thick: .0011, jitter: 0, short: .001 }), eg.matrix), M.lash);
  const dome = new THREE.SphereGeometry(1, Q(64, 24), Q(20, 8), 0, TAU, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
  const lid = new THREE.Group(); lid.position.set(0, EH, 0); eg.add(lid);
  const LD = part(); LD.add(dome, M.lid, [0, -EH, 0], null, [SX * 1.08, EH, SZ * 1.4]); LD.build(lid);
  const lowL = new THREE.Group(); lowL.position.set(0, -EH, 0); eg.add(lowL);
  const LW = part(); LW.add(dome, M.lid, [0, EH, 0], null, [SX * 1.08, EH, SZ * 1.4]); LW.build(lowL);
  // the upper lash line, riding on the lid's edge: drawn from the outer corner (thickest) to the inner, flat along the
  // top and dropping at the corners, running on past the outer corner; then the flick, and three short lashes there
  const lash = new THREE.Group(); eg.add(lash);
  const LS = part(), REST_Y = EH - 2 * EH * (0.02 + 0.8 * LID_REST), D = REST_Y + SY * 0.12;
  const upAt = (xn) => { const x = sd * xn * SX, ye = REST_Y - D * Math.pow(Math.min(1, Math.abs(xn)), 2.3) - (Math.abs(xn) > 1 ? (Math.abs(xn) - 1) * SY * 0.9 : 0); return [x, ye - REST_Y, zS(Math.min(Math.abs(x), SX * .98) * Math.sign(x), Math.max(-SY * .98, Math.min(SY * .98, ye))) + .0014]; };
  const upts = []; for (let k = 0; k <= 22; k++) upts.push(upAt(lerp(1.12, -0.97, k / 22)));
  LS.addWorld(lockStrands(upts, 1, Q(44, 14), Q(8, 4), () => 0, 1, null, LASH, { thick: .0037, jitter: 0, short: .001 }), M.lash);
  {
   const a = upAt(1.12), b = [a[0] + sd * .0062, a[1] + .0046, a[2] - .0004], m = [(a[0] + b[0]) / 2 + sd * .0008, (a[1] + b[1]) / 2 - .0006, a[2]];
   LS.addWorld(lockStrands([a, m, b], 1, Q(14, 6), Q(8, 4), () => 0, 1, null, LASH, { thick: .0022, jitter: 0, short: .001 }), M.lash);
  }
  for (const [xn, len, ang] of [[0.98, .0052, 0.9], [0.84, .0046, 0.7], [0.7, .0036, 0.5]]) {
   const a = upAt(xn), dx = sd * Math.cos(ang), dy = Math.sin(ang);
   LS.addWorld(lockStrands([a, [a[0] + dx * len * .5, a[1] + dy * len * .5, a[2] + .0006], [a[0] + dx * len, a[1] + dy * len * 1.05, a[2] + .0009]], 1, 6, Q(5, 3), () => 0, 1, null, LASH, { thick: .0011, jitter: 0, short: .001 }), M.lash);
  }
  LS.build(lash);
  // cutscene: the skin above her lash line while her lid rests. It covers the eye from the line up to the eye's edge (so
  // no white shows above the line, even at the corners where the line drops), lies just over the eye's own curve, and is
  // shaded as her face round it is (its facing is the face's, not the eye's bulge), so it reads as part of her face
  // rather than a pale band of lid. The lid itself only shows as it closes, to blink or to lower her eyes.
  {
   const NX = Q(36, 14), NY = Q(6, 3), zC = (x, y) => SZ * 1.25 * Math.sqrt(Math.max(0, 1 - (x / (SX * .96)) ** 2 - (y / (SY * .96)) ** 2));
   const P = [], N = [], I = [];
   for (let i = 0; i <= NX; i++) {
    const xn = lerp(-0.99, 1, i / NX), x = sd * xn * SX, y0 = REST_Y - D * Math.pow(Math.abs(xn), 2.3);
    const y1 = Math.max(y0 + .0005, SY * Math.sqrt(Math.max(0, 1 - xn * xn)) + .0006);
    for (let j = 0; j <= NY; j++) {
     const y = lerp(y0, y1, j / NY);
     P.push(x, y, Math.max(zS(x, y), zC(x, y)) + .0004);
     _v.set(x / HR, y / HR, 1).normalize(); N.push(_v.x, _v.y, _v.z);
    }
   }
   for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const a = i * (NY + 1) + j, b = a + NY + 1;
    if (sd > 0) I.push(a, b, a + 1, b, b + 1, a + 1); else I.push(a, a + 1, b, b, a + 1, b + 1);
   }
   const g = new THREE.BufferGeometry();
   g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
   lidSk.addWorld(g.applyMatrix4(eg.matrix), M.lidSkin);
  }
  // the cornea: clear, catching the night and the lamps; hidden with the highlights when the eye closes
  const cg = new THREE.SphereGeometry(1, Q(48, 16), Q(16, 6), 0, TAU, 0, Math.PI / 2); cg.rotateX(Math.PI / 2); cg.scale(SX * .96, SY * .96, SZ * 1.25);
  const cornea = new THREE.Mesh(cg, M.cornea); cornea.renderOrder = 3; eg.add(cornea);
  lowL.visible = false;
  eyes.push({ lid, low: lowL, lash, cornea });
 }
 darkE.build(head); lidSk.build(head);
 head.add(new THREE.Mesh(merge(whiteG), plain(M.eyeW)));
 const irisG = merge(irisE.map((e) => e.ig)), irisMesh = new THREE.Mesh(irisG, plain(M.iris));
 irisMesh.frustumCulled = false; head.add(irisMesh);
 const shineGeo = merge(shineG), SH0 = shineG[0].index.count, SH1 = shineG[1].index.count, shineMesh = new THREE.Mesh(shineGeo, M.shine);
 head.add(shineMesh);
 const IR = { ox: 9, oy: 9 };
 function setIris(ox, oy) {
  if (Math.abs(ox - IR.ox) < 1e-4 && Math.abs(oy - IR.oy) < 1e-4) return;
  IR.ox = ox; IR.oy = oy;
  const pos = irisG.attributes.position, nrm = irisG.attributes.normal;
  let o = 0;
  for (const e of irisE) {
   for (let i = 0; i < e.n; i++) {
    const x = e.base[i * 2], y = e.base[i * 2 + 1], X = x + ox, Y = y + oy, Z = zS(X, Y);
    _v.set(X, Y, Z + 0.0005).applyMatrix4(e.m); pos.setXYZ(o + i, _v.x, _v.y, _v.z);
    _v.set(X / (SX * SX), Y / (SY * SY), Z / (SZ * SZ) + 1e-3).normalize().applyQuaternion(e.q); nrm.setXYZ(o + i, _v.x, _v.y, _v.z);
   }
   o += e.n;
  }
  pos.needsUpdate = true; nrm.needsUpdate = true;
 }
 setIris(0, 0); IR.ox = IR.oy = 9; // a sensible ring until the first frame sets the real gaze
 // highlights show for each open eye; the right eye (drawn first) is never more closed than the left
 function setShine(v0, v1) {
  shineMesh.visible = v0 || v1;
  shineGeo.setDrawRange(v0 ? 0 : SH0, (v0 ? SH0 : 0) + (v1 ? SH1 : 0));
  eyes[0].cornea.visible = v0; eyes[1].cornea.visible = v1;
 }

 // round glasses: fine black frames with hinges, and glass that reflects
 const Gl = part(), GlL = part(), rimC = [];
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.066, 0);
  const c = [f.p[0] + sd * 0.004, f.p[1], f.p[2] + 0.02];
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * 0.2, 0));
  Gl.add(new THREE.TorusGeometry(0.047, 0.0036, Q(14, 6), Q(120, 36)), M.frame, c, null, null, q);
  const lg = new THREE.CircleGeometry(0.046, Q(64, 28)), lp = lg.attributes.position;
  for (let i = 0; i < lp.count; i++) { const r = Math.hypot(lp.getX(i), lp.getY(i)) / .046; lp.setZ(i, .0035 * (1 - r * r)); }
  lg.computeVertexNormals();
  GlL.add(lg, M.lensTint, c, null, null, q); GlL.add(lg, M.lens, c, null, null, q);
  rimC.push(c);
  const outer = [c[0] + sd * 0.046, c[1] + 0.003, c[2] - 0.0094], mid = [sd * 0.152, c[1] + 0.004, 0.05], ear = headPt(sd * 1.5, -0.03, 1.03);
  Gl.add(new THREE.BoxGeometry(.006, .0052, .007), M.frame, [outer[0] - sd * .001, outer[1], outer[2] + .002], [0, sd * .2, 0]);
  seg(Gl, M.frame, outer, mid, 0.0028, 0.0028, Q(12, 6), true);
  seg(Gl, M.frame, mid, ear, 0.0028, 0.0026, Q(12, 6), true);
 }
 Gl.add(new THREE.TorusGeometry(0.016, 0.003, Q(12, 6), Q(40, 14), Math.PI * 0.8).rotateZ(Math.PI * 0.1), M.frame, [0, rimC[0][1] - 0.002, (rimC[0][2] + rimC[1][2]) / 2 + 0.002]);
 Gl.build(head); GlL.build(head);

 // ---------- hair: the game model's every lock, where it was, each now a dark core filled out with fine strands ----------
 // Scalp, bangs and crown ride on her head; the side locks and the long wavy ponytail are skinned to their own bones and
 // swing with the game model's springs. The random stream starts where the game model's did, so each lock has the same
 // place, wave and shade (the darker or the lighter of her two browns) as there.
 hs = SEED.hair;
 const strand0 = strandId;
 const HAIR1 = C('#2b2024'), HAIR2 = C('#4a3f3e'), CORE = .62; // cutscene: darker and ashier, as the paper doll's
 const lockMat = () => (hr() < 0.62 ? HAIR1 : HAIR2);
 const coreCol = (g, c) => vcol(g, (x, y, z, o) => { o[0] = c.r * CORE; o[1] = c.g * CORE; o[2] = c.b * CORE; });
 const HQ = { K: (n) => Q(n * 2, 4), N: (n) => Q(Math.round(n * .7), 8), RS: 3 };
 const Hc = part();
 const capG = new THREE.SphereGeometry(1, Q(96, 24), Q(48, 12), 0, TAU, 0, Math.PI * 0.56); capG.rotateX(-0.45);
 { const cp = capG.attributes.position; for (let i = 0; i < cp.count; i++) { const f = cranK(cp.getY(i) * HR * HS[1] * 1.05 + 0.003); cp.setX(i, cp.getX(i) * f); cp.setZ(i, cp.getZ(i) * f); } capG.computeVertexNormals(); } // cutscene
 M.cap = patch(std({ color: C('#4c3134'), roughness: .72, side: THREE.DoubleSide }), { glow: 1 }); M.cap.name = 'cap';
 Hc.add(capG, M.cap, [0, 0.003, -0.004], null, [HR * HS[0] * 1.05, HR * HS[1] * 1.05, HR * HS[2] * 1.06]);
 function wavy(pts, amp, freq, ph, cen, n, side) { // cutscene: side, the main wave out to the side rather than front to back
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const out = [], T = new THREE.Vector3(), O = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
   const u = i / n; cv.getPointAt(u, P); cv.getTangentAt(u, T);
   O.subVectors(P, cen(P)); O.addScaledVector(T, -O.dot(T)).normalize(); S.crossVectors(T, O).normalize();
   let w = amp * u * Math.sin(freq * u + ph), w2 = amp * 0.6 * u * Math.sin(freq * u + ph + 1.4);
   if (side) { const t = w; w = w2 * 0.6; w2 = t; }
   out.push([P.x + S.x * w + O.x * w2, P.y + S.y * w + O.y * w2, P.z + S.z * w + O.z * w2]);
  }
  return out;
 }
 // one lock: its core (the game model's lock, darker, so gaps between strands look deep) and its strands
 function lock(P, pts, TSg, RSg, rFn, flat, cen, col, K, N, o) {
  P.addWorld(coreCol(strand(pts, TSg, RSg, (t) => rFn(t) * .92, flat, cen), col), M.hair);
  P.addWorld(lockStrands(pts, K, N, HQ.RS, rFn, flat, cen, col, o), M.hair);
 }
 // cutscene: the paper doll's bangs. Swept from a part on her left across to her right, wavy, ending at her brows in
 // the middle (so her brows show, as the paper doll's do), longer toward her right temple, their tips curling out.
 // The random stream is drawn in the same order as before, so the hair after the bangs is as it was.
 const PART = 0.3;
 for (let i = 0; i < 12; i++) {
  const az = -0.95 + i * (1.6 / 11) + (hr() - 0.5) * 0.05, past = az > PART;
  const toR = sm(0.2, -0.8, az), e0 = hr();
  const endEl = past ? 0.4 + e0 * 0.04 : 0.355 + e0 * 0.05 - 0.4 * toR * toR;
  const sweep = past ? 0.1 : -0.2 * (1 - 0.4 * toR);
  const p0 = headPt(PART + (az - PART) * 0.25, 1.15, 0.97), p1 = headPt(az + sweep * 0.35, 0.7, 1.12), p2 = headPt(az + sweep, endEl, 1.1 + 0.02 * toR);
  const tip = headPt(az + sweep * 1.3, endEl + 0.05, 1.17 + 0.02 * toR);
  const pts = wavy([p0, p1, p2, tip], 0.011, 6, hr() * 6, () => headC, 12), col = lockMat();
  lock(Hc, pts, Q(48, 12), Q(10, 5), (t) => 0.019 * Math.pow(1 - t, 0.6) + 0.0015, 0.5, () => headC, col, HQ.K(26), HQ.N(28), { jitter: .3 });
 }
 // cutscene: the locks that frame her face, as the paper doll's do: from under her hat at each temple, down past her
 // glasses and along her cheek to below her chin, a little out from her face, wavy, curling out at the end. They ride
 // on her head (they are short enough not to need springs).
 const jawOut = (az, el, out) => { const p = jawAt(az, el); return [p[0] * out, p[1] * out, p[2] * out]; };
 for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
  const a0 = sd * (0.74 + k * 0.13), len = 1 - 0.12 * k;
  // (from her cheek they hang straight down past her jaw, rather than following it in under her chin)
  const p2 = jawOut(a0 + sd * 0.03, -0.3, 1.12 + 0.02 * k);
  const pts = [headPt(a0, 0.66, 1.03), jawOut(a0 + sd * 0.05, 0.22, 1.1), p2, [p2[0] * 1.02 + sd * 0.003, p2[1] - 0.06 * len, p2[2] - 0.012], [p2[0] * 1.05 + sd * 0.014, p2[1] - 0.105 * len, p2[2] - 0.028]];
  lock(Hc, wavy(pts, 0.02, 6, r2() * 6, () => headC, 16, true), Q(60, 14), Q(10, 5), (t) => 0.016 * Math.pow(1 - t, 0.5) + 0.0018, 0.55, () => headC, r2() < 0.62 ? HAIR1 : HAIR2, HQ.K(22), HQ.N(36), { jitter: .35 });
 }
 const tie = [0, -0.085, -0.14];
 for (let i = 0; i < 13; i++) {
  const az = Math.PI / 2 + 0.15 + i * ((Math.PI - 0.3) / 12);
  const p0 = headPt(az, 1.32, 0.97), p1 = headPt(az, 0.55, 1.13), p2 = [tie[0] + Math.sin(az) * 0.025, tie[1] + 0.02, tie[2] + 0.012];
  lock(Hc, [p0, p1, p2], Q(40, 10), Q(10, 5), (t) => 0.032 * (1 - 0.5 * t), 0.42, () => headC, lockMat(), HQ.K(30), HQ.N(22), { jitter: .2, short: .05 });
 }
 // a few stray hairs lifting off the crown (cutscene: only at her sides and back, so none falls across her face)
 for (let k = 0; k < Q(24, 4); k++) {
  const a0 = rr(-2.6, 2.6), az = (a0 < 0 ? -1 : 1) * lerp(1.3, 2.6, Math.abs(a0) / 2.6), p0 = headPt(az, rr(.6, 1.2), 1.1), p1 = headPt(az + rr(-.2, .2), rr(.2, .7), 1.2 + rr(0, .05)), p2 = headPt(az + rr(-.3, .3), rr(-.2, .4), 1.18 + rr(0, .08));
  Hc.addWorld(lockStrands([p0, p1, p2], 1, Q(12, 6), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0005, jitter: 0, short: .001 }), M.hair);
 }
 Hc.build(head);
 const hb = bw(headB), Wd = (p) => [p[0] + hb[0], p[1] + hb[1], p[2] + hb[2]];
 const Hs = part(wHair);
 const sideCen = new THREE.Vector3(hb[0], hb[1] - 0.05, hb[2]);
 for (const sd of [-1, 1]) {
  for (let k = 0; k < 5; k++) {
   const az = sd * (0.72 + k * 0.16);
   // (cutscene: the paper doll's hair is fuller; three more locks per side follow these, drawn from the second stream)
   const p0 = headPt(az, 0.72, 0.99), p1 = headPt(az, 0.15, 1.2), p2 = headPt(az - sd * 0.02, -0.45, 1.3 + k * 0.02);
   const p3 = [p2[0] + sd * (0.07 + k * 0.012), p2[1] - 0.16 - hr() * 0.05, p2[2] - 0.02 - k * 0.01]; // cutscene: longer, spreading over her shoulders
   // cutscene: wavier and fuller, as the paper doll's long hair is
   const pts = wavy([p0, p1, p2, p3].map(Wd), 0.05, 5, hr() * 6, () => sideCen, 18, true), col = lockMat();
   lock(Hs, pts, Q(64, 14), Q(10, 5), (t) => 0.031 * Math.pow(1 - t, 0.5) + 0.003, 0.5, () => sideCen, col, HQ.K(32), HQ.N(40), { jitter: .45 });
  }
  for (let k = 0; k < 3; k++) {
   const az = sd * (0.8 + k * 0.2);
   const p0 = headPt(az, 0.6, 1.0), p1 = headPt(az, 0.05, 1.22), p2 = headPt(az - sd * 0.03, -0.5, 1.34 + k * 0.03);
   const p3 = [p2[0] + sd * (0.08 + k * 0.015), p2[1] - 0.15 - r2() * 0.06, p2[2] - 0.03 - k * 0.012];
   const pts = wavy([p0, p1, p2, p3].map(Wd), 0.055, 4.6, r2() * 6, () => sideCen, 18, true);
   lock(Hs, pts, Q(64, 14), Q(10, 5), (t) => 0.03 * Math.pow(1 - t, 0.5) + 0.003, 0.5, () => sideCen, r2() < 0.62 ? HAIR1 : HAIR2, HQ.K(30), HQ.N(40), { jitter: .45 });
  }
 }
 for (let i = 0; i < 28; i++) {
  const fx = i / 27 - 0.5, len = 0.44 + hr() * 0.1, ph = hr() * TAU, pts = [];
  for (let k = 0; k <= 8; k++) {
   const s = k / 8;
   const x = fx * 0.04 + fx * 0.27 * Math.sin(s * 1.5) + 0.03 * Math.sin(s * 10 + ph) * s;
   const y = -0.085 - s * len;
   const z = -0.15 - 0.045 * Math.sin(s * 2.4) - 0.07 * s * s + 0.012 * Math.cos(s * 9 + ph) * s - Math.abs(fx) * 0.03 * s;
   pts.push(Wd([x, y, z]));
  }
  const r0 = 0.02 + 0.006 * Math.cos(i);
  lock(Hs, pts, Q(60, 14), Q(10, 5), (t) => r0 * Math.pow(1 - t, 0.55) + 0.0025, 0.45, (cc) => new THREE.Vector3(0, cc.y, 0.03), lockMat(), HQ.K(20), HQ.N(40), { jitter: .4, short: .3 });
 }
 // strays in the ponytail, wandering wider than the locks
 for (let k = 0; k < Q(40, 6); k++) {
  const fx = rr(-.75, .75), len = rr(.3, .52), ph = rr(0, TAU), pts = [];
  for (let j = 0; j <= 8; j++) {
   const s = j / 8;
   pts.push(Wd([fx * 0.04 + fx * 0.3 * Math.sin(s * 1.5) + 0.045 * Math.sin(s * 8 + ph) * s, -0.09 - s * len, -0.155 - 0.05 * Math.sin(s * 2.4) - 0.075 * s * s + 0.02 * Math.cos(s * 7 + ph) * s]));
  }
  Hs.addWorld(lockStrands(pts, 1, Q(28, 10), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0006, jitter: 0, short: .2 }), M.hair);
 }
 Hs.build(root);
 const HAIR_STRANDS = strandId - strand0;
 const Sc = part(), scG = new THREE.TorusGeometry(0.028, 0.013, Q(32, 10), Q(96, 22)), scP = scG.attributes.position;
 for (let i = 0; i < scP.count; i++) {
  const x = scP.getX(i), y = scP.getY(i), a = Math.atan2(y, x), k = 1 + 0.12 * Math.sin(a * 11) + .025 * Math.sin(a * 37 + 1);
  const cx = Math.cos(a) * 0.028, cy = Math.sin(a) * 0.028;
  scP.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, scP.getZ(i) * k);
 }
 scG.computeVertexNormals();
 Sc.add(uvs(scG, 2, 1), M.scrunchie, [0, -0.01, -0.012], [Math.PI / 2 + 0.3, 0, 0]);
 Sc.build(hairA);

 // ---------- the hat: drooping brim (now with a thickness and a wired edge), the bent crown whose tip flops, the fuzzy
 // band (real fuzz now), ridged ram horns, the silver chain with its gold crosses, the big gold charm ----------
 const HatP = part();
 const brimPt = (u, v, o, dy) => {
  const a = u * TAU, r = lerp(0.115, 0.335, v), e = (r - 0.115) / 0.22;
  o[0] = r * Math.sin(a); o[2] = r * Math.cos(a) * 0.97;
  o[1] = -0.028 * Math.pow(e, 1.7) + 0.013 * Math.sin(3 * a + 1) * Math.pow(e, 1.2) - 0.012 * Math.max(0, Math.cos(a)) * e + (dy || 0);
 };
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o)), 2, 3), M.hat);
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o, -.0035)), 2, 3), M.hat);
 const edge = []; for (let k = 0; k < 160; k++) { const o = [0, 0, 0]; brimPt(k / 160, 1, o, -.00175); edge.push(new THREE.Vector3(o[0], o[1], o[2])); }
 HatP.add(uvs(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), Q(240, 60), 0.0045, Q(10, 6), true), 2, 3), M.hat);
 const BANDP = smoothP([[0.13, -0.008], [0.136, 0.0], [0.138, 0.022], [0.135, 0.046], [0.127, 0.054]], 3);
 const bandDisp = (r, y, a) => r + (y < 0.008 ? 0.004 * Math.sin(36 * a) : 0);
 HatP.add(uvs(lathe(BANDP, Q(192, 64), bandDisp, 1), 6, 1), M.hatBand);
 { const NS = Q(6, 2); for (let k = 1; k <= NS; k++) { const g = uvs(lathe(BANDP, Q(192, 64), (r, y, a) => bandDisp(r, y, a) + k / NS * .0026, 1), 6, 1); g.setAttribute('aShell', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k / NS), 1)); HatP.add(g, M.hatBand); } }
 const ridge = (t) => Math.pow(Math.abs(Math.sin(t * PI * 12)), .6);
 for (const sd of [-1, 1]) {
  const pts = [[sd * 0.122, 0.028, 0.0], [sd * 0.185, 0.04, -0.03], [sd * 0.228, 0.085, -0.045], [sd * 0.22, 0.132, -0.02], [sd * 0.185, 0.128, 0.012], [sd * 0.172, 0.1, 0.02]];
  const TSh = Q(160, 20), RSh = Q(24, 8);
  const g = strand(pts, TSh, RSh, (t) => 0.03 * (1 - t * 0.8) * (1 + .06 * (ridge(t) - .5)), 1, null);
  vcol(g, (x, y, z, o, i) => { const t = Math.floor(i / (RSh + 1)) / TSh, k = lerp(.74, 1, ridge(t)) * lerp(1, .9, t); o[0] = k; o[1] = k * lerp(1, .96, t); o[2] = k * lerp(1, .93, t); });
  HatP.add(uvs(g, 3, 1), M.horn);
 }
 const chainPt = (s) => { const ang = s * 1.2; return [0.142 * Math.sin(ang), 0.062 - 0.03 * (1 - s * s), 0.142 * Math.cos(ang) * 0.97]; };
 for (let k = 0; k <= 34; k++) { const s = -1 + k / 17; HatP.add(new THREE.TorusGeometry(0.0052, 0.0014, Q(8, 4), Q(20, 8)), M.silver, chainPt(s), [k % 2 ? Math.PI / 2 : 0, s * 1.2, 0]); }
 for (const s of [-0.72, -0.4, 0.4, 0.72]) {
  const p = chainPt(s), ry = s * 1.2;
  HatP.add(crossGeo(.0032, .02, .012, .0032, .004, .0025, .0005), M.gold, [p[0], p[1] - 0.016, p[2]], [0, ry, 0]);
 }
 HatP.add(new THREE.TorusGeometry(0.019, 0.0036, Q(16, 8), Q(72, 24)), M.gold, [0, 0.085, 0.132], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0045, .034, .026, .0045, .003, .003, .0006), M.gold, [0, 0.085, 0.133], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0055, .075, .0055, .0001, 0, .0035, .0007), M.gold, [0, 0.03, 0.14], [-0.12, 0, 0]);
 HatP.build(hatB);
 const crownG = uvs(strand([[0, -0.012, 0], [0, 0.1, -0.004], [0.004, 0.2, -0.025], [-0.02, 0.29, -0.055], [-0.075, 0.36, -0.08], [-0.14, 0.385, -0.07], [-0.185, 0.36, -0.045]], Q(180, 20), Q(72, 14),
  (t) => (0.127 * Math.pow(1 - t, 0.85) + 0.004) * (1 + 0.05 * Math.sin(t * 25 + 1.3)), 1, null), 2, 3);
 crownG.applyMatrix4(hatB.matrixWorld);
 const hatY = bw(hatB)[1];
 const Cr = part((x, y) => {
  if (y < hatY + 0.16) return [[BI.hat, 1]];
  if (y < hatY + 0.26) { const t = sm(hatY + 0.16, hatY + 0.26, y); return [[BI.hat, 1 - t], [BI.hatA, t]]; }
  const t = sm(hatY + 0.28, hatY + 0.35, y); return [[BI.hatA, 1 - t], [BI.hatB, t]];
 });
 Cr.addWorld(crownG, M.hat);
 Cr.build(root);

 // ---------- bind: one skinned mesh per pooled material ----------
 root.updateMatrixWorld(true);
 const _pm = new THREE.Matrix4(), _po = new THREE.Matrix4(), skinned = [];
 for (const [mat, list] of POOL) {
  const geos = list.map(({ geo, rigid }) => {
   if (rigid) {
    // a rigid piece goes into bind space and follows its bone at full weight, exactly as when it was parented to it
    _pm.copy(rigid.parent.matrixWorld);
    if (rigid.off) _pm.multiply(_po.makeTranslation(-rigid.off[0], -rigid.off[1], -rigid.off[2]));
    xform(geo, _pm);
    const n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), b = bones.indexOf(rigid.bone);
    for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
   }
   return geo;
  });
  const g = geos.length > 1 ? merge(geos) : geos[0];
  if (mat !== M.hair && g.attributes.aHT) g.deleteAttribute('aHT');
  if (!mat.vertexColors && g.attributes.color) g.deleteAttribute('color');
  const m = new THREE.SkinnedMesh(g, mat);
  m.frustumCulled = false; root.add(m); skinned.push(m);
 }
 const skeleton = new THREE.Skeleton(bones);
 for (const m of skinned) m.bind(skeleton);
 if (opts.shadows) root.traverse((o) => { if (o.isMesh && !o.material.transparent) { o.castShadow = o.isSkinnedMesh; o.receiveShadow = true; } });

 // ---------- the purple flame in her left palm: a living flame, rising sparks, and a real light ----------
 // The game model's flame is a painted flipbook; this one is drawn as it burns: a wisp whose spine sways and curls as the
 // flipbook's did (at the same pace), its edges licked by noise, a white heart low in it, two layers out of step. It turns
 // moon-white for her moonlight spells, as the game model's cross-fades to its white flame.
 const flame = new THREE.Group(); flame.position.set(-0.07, -0.042, 0.006); wrists[1].add(flame);
 const FLC = (pal) => pal.map((p) => CR(p[0] / 255, p[1] / 255, p[2] / 255));
 const PURP = FLC([[120, 20, 200], [200, 70, 255], [255, 225, 255]]), MOONF = FLC([[110, 140, 255], [190, 215, 255], [255, 255, 255]]);
 const FLAME_VS = 'uniform vec2 uSize; uniform vec2 uCen; varying vec2 vUv;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);\n' +
  ' vec3 up = (viewMatrix * vec4(0., 1., 0., 0.)).xyz; vec2 u2 = length(up.xy) > .05 ? normalize(up.xy) : vec2(0., 1.); vec2 r2 = vec2(u2.y, -u2.x);\n' +
  ' vec2 p = (uv - uCen) * uSize; mv.xy += r2 * p.x + u2 * p.y; gl_Position = projectionMatrix * mv; }';
 // The game model's flame is a flipbook: eight frames, each three passes of soft discs along a spine of two bezier curves
 // (a sway, then a curl at the tip) whose control points swing with the frame's phase. Here the same spine and passes are
 // drawn for every frame as it burns, the phase running smoothly at the flipbook's pace, with noise licking its edges.
 const FLAME_FS = 'uniform float uTime, uPhase, uOp, uWhite; uniform vec3 uA, uB, uC, uA2, uB2, uC2; varying vec2 vUv;\n' +
  'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
  'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }\n' +
  'float bz(float a, float b, float c, float d, float t){ float u = 1. - t; return u * u * u * a + 3. * u * u * t * b + 3. * u * t * t * c + t * t * t * d; }\n' +
  'void main(){ vec2 P = vec2(vUv.x * 96., (1. - vUv.y) * 176.); float ph = (uTime * 1.75 + uPhase) * 6.2831853;\n' +
  ' float X0 = 48., X1 = 28. + sin(ph) * 9., X2 = 70. + sin(ph + 1.9) * 10., X3 = 50. + sin(ph + .7) * 6.;\n' +
  ' float Y0 = 160., Y1 = 118., Y2 = 72., Y3 = 28. + sin(ph * 2.) * 6.;\n' +
  ' float W1 = X3 - 16. + sin(ph + 2.5) * 8., W2 = X3 + 10., W3 = X3 - 4. + sin(ph + 1.) * 6., Z1 = Y3 - 12., Z2 = Y3 - 24., Z3 = 10. + sin(ph) * 4.;\n' +
  ' P.x += (vn(vec2(P.y * .05 - uTime * 2.6, uPhase * 9.)) - .5) * 9. * (1. - P.y / 176.);\n' +
  ' float o = 0., m = 0., c = 0.;\n' +
  ' for (int i = 0; i <= 56; i++) { float t = float(i) / 56.; bool top = t > .72; float tt = top ? (t - .72) / .28 : t / .72;\n' +
  '  vec2 S = top ? vec2(bz(X3, W1, W2, W3, tt), bz(Y3, Z1, Z2, Z3, tt)) : vec2(bz(X0, X1, X2, X3, tt), bz(Y0, Y1, Y2, Y3, tt));\n' +
  '  float r = (1. - t * .85) * (.8 + .2 * sin(t * 20. + ph)), d2 = dot(P - S, P - S);\n' +
  '  o += exp(-d2 / (42. * 42. * r * r) * 3.); m += exp(-d2 / (27. * 27. * r * r) * 3.); c += exp(-d2 / (13. * 13. * r * r) * 3.); }\n' +
  ' o = 1. - exp(-o * .13 * .7); m = 1. - exp(-m * .22 * .7); c = 1. - exp(-c * .4 * .7);\n' +
  ' vec3 A = mix(uA, uA2, uWhite), B = mix(uB, uB2, uWhite), C = mix(uC, uC2, uWhite);\n' +
  ' vec3 col = A * o * .95 + B * m * .9 + C * c * 1.05;\n' +
  ' gl_FragColor = vec4(col * uOp, 1.); }';
 const flames = [0, 1].map((k) => {
  const mt = new THREE.ShaderMaterial(Object.assign({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: {
   uSize: { value: new THREE.Vector2(.2, .36) }, uCen: { value: new THREE.Vector2(.5, .06) }, uTime: U.time, uPhase: { value: k * .5 }, uOp: { value: 1 }, uWhite: { value: 0 },
   uA: { value: PURP[0] }, uB: { value: PURP[1] }, uC: { value: PURP[2] }, uA2: { value: MOONF[0] }, uB2: { value: MOONF[1] }, uC2: { value: MOONF[2] } } }, ADD));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mt); m.geometry.translate(.5, .5, 0); m.frustumCulled = false; m.renderOrder = 5; flame.add(m); return m;
 });
 const softCanvas = (S, stops) => { const c = cvs(S, S), g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const s of stops) gr.addColorStop(s[0], s[1]); g.fillStyle = gr; g.fillRect(0, 0, S, S); return c; };
 const palmGlow = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: tex(softCanvas(128, [[0, 'rgba(230,150,255,0.9)'], [0.35, 'rgba(170,60,255,0.35)'], [1, 'rgba(120,20,220,0)']])), color: 0xb0b0b0 }, ADD)));
 palmGlow.scale.set(0.16, 0.16, 1); palmGlow.renderOrder = 5; flame.add(palmGlow);
 function starSprite() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#ffffff'; star4(g, m, m, m * 0.95);
  return c;
 }
 const STAR = tex(starSprite());
 hs = SEED.spark;
 const NPt = 18 + Q(18, 0), ptPos = new Float32Array(NPt * 3), ptCol = new Float32Array(NPt * 3), ptSeed = [];
 for (let i = 0; i < NPt; i++) ptSeed.push(i < 18 ? [hr() * TAU, 0.35 + hr() * 0.6, hr()] : [r2() * TAU, 0.3 + r2() * 0.7, r2()]);
 const ptGeo = new THREE.BufferGeometry();
 ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3)); ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
 const sparks = new THREE.Points(ptGeo, new THREE.PointsMaterial(Object.assign({ size: 0.028, map: STAR, vertexColors: true }, ADD)));
 sparks.frustumCulled = false; sparks.renderOrder = 6; flame.add(sparks);
 const fLight = new THREE.PointLight(0xb455ff, 1.4, 3.2, 2); fLight.position.set(0, 0.09, 0); flame.add(fLight);

 // ---------- effects in world space (the scene adds `fx`) ----------
 const fx = new THREE.Group(); fx.name = 'IoFX';
 const addBlend = (map, color, extra) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra || {});
 function beamCanvas() {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = (x - W / 2 + 0.5) / (W / 2), vy = 1 - y / H;
   const core = Math.exp(-dx * dx * 7) * 0.75 + Math.exp(-dx * dx * 55) * 0.6 + Math.exp(-dx * dx * 300) * .3;
   const a = Math.min(1, core * Math.min(1, vy * 7) * Math.pow(1 - vy, 1.1));
   const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 // her moon sigil: the game model's (two rings, a dotted ring, a crescent, eight stars), drawn at four times the size with
 // the moon's phases between the outer rings and fine ticks
 function sigilCanvas() {
  const S = 1024 * TS, k = S / 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.shadowColor = '#bcd2ff'; g.shadowBlur = 10 * k;
  g.lineWidth = 3.5 * k; g.beginPath(); g.arc(m, m, 118 * k, 0, TAU); g.stroke();
  g.lineWidth = 1.6 * k; g.beginPath(); g.arc(m, m, 102 * k, 0, TAU); g.stroke();
  g.beginPath(); g.arc(m, m, 70 * k, 0, TAU); g.stroke();
  g.lineWidth = .6 * k; g.beginPath(); g.arc(m, m, 66 * k, 0, TAU); g.stroke();
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; g.beginPath(); g.arc(m + Math.cos(a) * 110 * k, m + Math.sin(a) * 110 * k, (i % 4 ? 1.8 : 3.4) * k, 0, TAU); g.fill(); }
  for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, r0 = (i % 5 ? 96 : 92) * k; g.lineWidth = .5 * k; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * 100 * k, m + Math.sin(a) * 100 * k); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .59, x = m + Math.cos(a) * 81 * k, y = m + Math.sin(a) * 81 * k, ph = i / 8; g.beginPath(); g.arc(x, y, 4.5 * k, 0, TAU); g.lineWidth = .6 * k; g.stroke(); g.beginPath(); g.arc(x, y, 4.5 * k, -PI / 2, PI / 2, false); g.ellipse(x, y, 4.5 * k * Math.abs(Math.cos(ph * PI)), 4.5 * k, 0, PI / 2, -PI / 2, ph < .5); g.fill(); }
  g.beginPath(); g.arc(m, m, 52 * k, 0, TAU); g.arc(m + 20 * k, m - 12 * k, 45 * k, 0, TAU, true); g.fill('evenodd');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; star4(g, m + Math.cos(a) * 86 * k, m + Math.sin(a) * 86 * k, (i % 2 ? 6 : 9) * k); }
  return c;
 }
 const moonG = new THREE.Group(); fx.add(moonG);
 const beam = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(beamCanvas()), 0xd6e2ff)));
 beam.center.set(0.5, 0); beam.renderOrder = 4; moonG.add(beam);
 const sigil = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial(addBlend(tex(sigilCanvas()), 0xcfe0ff)));
 sigil.rotation.x = -Math.PI / 2; sigil.position.y = 0.02; sigil.renderOrder = 3; moonG.add(sigil);
 const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 96), new THREE.MeshBasicMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,1)'], [.45, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']])), 0xb9ccff)));
 pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; pool.renderOrder = 2; moonG.add(pool);
 const aura = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,0.95)'], [.45, 'rgba(220,232,255,0.35)'], [1, 'rgba(255,255,255,0)']])), 0xeef3ff)));
 aura.scale.set(2.0, 2.5, 1); aura.renderOrder = 7; moonG.add(aura);
 hs = SEED.motes;
 const NM = 48 + Q(48, 0), mPos = new Float32Array(NM * 3), mCol = new Float32Array(NM * 3), mSeed = [];
 for (let i = 0; i < NM; i++) mSeed.push(i < 48 ? [hr() * TAU, 0.25 + hr() * 0.45, hr(), 0.3 + hr() * 1.0] : [r2() * TAU, 0.2 + r2() * 0.5, r2(), 0.2 + r2() * 1.1]);
 const mGeo = new THREE.BufferGeometry();
 mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
 const motes = new THREE.Points(mGeo, new THREE.PointsMaterial(Object.assign({ size: 0.07, map: STAR, vertexColors: true }, ADD)));
 motes.frustumCulled = false; motes.renderOrder = 8; moonG.add(motes);
 const moonLight = new THREE.PointLight(0xe4ecff, 0, 6.5, 2); moonLight.position.set(0, 1.2, 0.6); moonG.add(moonLight);
 moonG.visible = false;
 const WHITE = new THREE.Color(0xdfe8ff), PURPLE = new THREE.Color(0xb455ff), MOONC = new THREE.Color(0xe4ecff);
 void WHITE;

 // the steel-blue ribbon that follows the dagger tip through a strike: the game model's 16 last positions, drawn as a
 // smooth curve through them
 const TRN = 16, TRS = 4, TRV = (TRN - 1) * TRS + 1, trPos = new Float32Array(TRV * 2 * 3), trCol = new Float32Array(TRV * 2 * 3), trIdx = [];
 for (let i = 0; i < TRV - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const tipL = new THREE.Vector3(0, 0, 0.246), midL = new THREE.Vector3(0, 0, 0.09), trTip = [], trMid = [];
 for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 const cr1 = (p0, p1, p2, p3, t, out) => { const t2 = t * t, t3 = t2 * t; out.set(0, 0, 0).addScaledVector(p0, -t3 + 2 * t2 - t).addScaledVector(p1, 3 * t3 - 5 * t2 + 2).addScaledVector(p2, -3 * t3 + 4 * t2 + t).addScaledVector(p3, t3 - t2).multiplyScalar(.5); return out; };

 // ---------- Lunar Trance: the starlight cloak (in the coat's shader), ghost moth wings, a crescent aura ----------
 function ghostWing(hind) {
  const k = 4 * TS, H0 = (hind ? 384 : 256), c = cvs(256 * k, H0 * k), g = c.getContext('2d');
  g.scale(k, k);
  const path = () => {
   g.beginPath();
   if (!hind) { g.moveTo(8, 150); g.quadraticCurveTo(110, 70, 246, 34); g.quadraticCurveTo(252, 120, 205, 180); g.quadraticCurveTo(110, 204, 8, 168); }
   else { g.moveTo(8, 20); g.quadraticCurveTo(170, 0, 226, 110); g.quadraticCurveTo(232, 192, 172, 222); g.quadraticCurveTo(150, 300, 162, 374); g.quadraticCurveTo(134, 362, 122, 242); g.quadraticCurveTo(58, 204, 8, 62); }
   g.closePath();
  };
  path(); g.save(); g.clip();
  const ry = hind ? 30 : 155, gr = g.createRadialGradient(8, ry, 6, 8, ry, hind ? 330 : 250);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(185,215,255,0.5)'); gr.addColorStop(1, 'rgba(150,190,255,0.28)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, H0);
  // fine scales, a soft shimmer over the wing
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(150,180,255,.07)'; g.beginPath(); g.ellipse(r2() * 256, r2() * H0, .9, .5, r2() * PI, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) { const a = -1.0 + i * (hind ? 0.27 : 0.21); g.beginPath(); g.moveTo(8, ry); g.quadraticCurveTo(110, ry + Math.sin(a) * 50, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  // the finer veins between
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = .5;
  for (let i = 0; i < 26; i++) { const a = -1.05 + i * (hind ? .092 : .072); g.beginPath(); g.moveTo(40, ry + Math.sin(a) * 14); g.quadraticCurveTo(130, ry + Math.sin(a) * 60, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  const ex = hind ? 132 : 150, ey = hind ? 126 : 118;
  [[17, 'rgba(255,255,255,0.8)'], [12, 'rgba(120,170,255,0.7)'], [7, 'rgba(255,255,255,0.9)'], [3, 'rgba(90,130,255,.9)']].forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, r, r * 1.15, 0.3, 0, TAU); g.fill(); });
  g.restore(); path(); g.strokeStyle = '#ffffff'; g.shadowColor = '#cfe0ff'; g.shadowBlur = 12; g.lineWidth = 3; g.stroke();
  return c;
 }
 const gwm = (cnv) => new THREE.MeshBasicMaterial({ map: tex(cnv), color: 0xdcecff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
 const gwMF = gwm(ghostWing(false)), gwMH = gwm(ghostWing(true));
 const tWing = new THREE.Group(); tWing.position.set(0, 0.1, -0.18); chest.add(tWing); tWing.visible = false;
 // both fore wings are one mesh and both hind wings another; their corners are placed each frame (in trance only)
 // through the game model's side, fore and hind joints
 const tSides = [], FORE = new THREE.PlaneGeometry(0.95, 0.95), HIND = new THREE.PlaneGeometry(0.8, 1.2);
 const foreGeo = merge([FORE, FORE]), hindGeo = merge([HIND, HIND]);
 for (const [geo, mat] of [[foreGeo, gwMF], [hindGeo, gwMH]]) { const w = new THREE.Mesh(geo, mat); w.renderOrder = 6; w.frustumCulled = false; tWing.add(w); }
 for (const sd of [-1, 1]) {
  const side = new THREE.Object3D(); side.scale.x = sd;
  const fo = new THREE.Object3D(); fo.rotation.z = 0.2;
  const hi = new THREE.Object3D(); hi.position.set(0, -0.07, -0.01); hi.rotation.z = -0.25; hi.updateMatrix();
  tSides.push({ side, fo, hi, sd });
 }
 const _wm = new THREE.Matrix4(), _wt = new THREE.Matrix4();
 function wingCorners(geo, k, base, m) {
  const pos = geo.attributes.position, b = base.attributes.position;
  for (let i = 0; i < 4; i++) { _v.fromBufferAttribute(b, i).applyMatrix4(m); pos.setXYZ(k * 4 + i, _v.x, _v.y, _v.z); }
  pos.needsUpdate = true;
 }
 function placeWings() {
  tSides.forEach((s, k) => {
   s.side.updateMatrix(); s.fo.updateMatrix();
   wingCorners(foreGeo, k, FORE, _wm.multiplyMatrices(s.side.matrix, s.fo.matrix).multiply(_wt.makeTranslation(0.445, 0.08, 0)));
   wingCorners(hindGeo, k, HIND, _wm.multiplyMatrices(s.side.matrix, s.hi.matrix).multiply(_wt.makeTranslation(0.375, -0.538, 0)));
  });
 }
 const tAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex((() => { const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'); g.shadowColor = '#cfe0ff'; g.shadowBlur = 26 * k; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128 * k, 128 * k, 96 * k, 0, TAU); g.arc(150 * k, 104 * k, 86 * k, 0, TAU, true); g.fill('evenodd'); return c; })()), color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
 tAura.position.set(0, 0.32, -0.45); tAura.scale.setScalar(1.3); tAura.renderOrder = 1; tAura.visible = false; chest.add(tAura);

 // ---------- motion: the game model's, unchanged (its springs, its blinking and looking about, every action's keys,
 // durations and blends); only what it drives is drawn differently ----------
 hs = SEED.motion;
 const K0 = (x) => ({ x, v: 0 });
 const skS = skirt.map(() => K0(0.02)), cuS = coatU.map(() => K0(0.03)), clS = coatL.map(() => K0(0.02));
 const hairS = [K0(0), K0(0), K0(0), K0(0), K0(0), K0(0)];
 const sideS = [K0(0), K0(0), K0(0), K0(0)];
 const hatS = [K0(0), K0(0), K0(0), K0(0)];
 const chS = [K0(0), K0(0)];
 const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, prevYaw: 0, yawRate: 0, acc: 0, hp: new THREE.Vector3(), hv: new THREE.Vector3(), ha: new THREE.Vector3() };
 let lookYaw = 0, lookPitch = 0, lookTY = 0, lookTP = 0, lookTimer = 1.5, blinkIn = 1.5 + hr() * 2, blinkT = -1;
 let trK = 0, act = null, glowK = 0, dashV = 0, liftV = 0, moonKv = 0, trailOn = 0, guardOn = false, gW = 0, trance = 0, glowTint = 0;
 let blinkOn = true, lidsV = 0; // cutscene: state.blink and state.lids
 const PH = 1 / 120;
 const spring = (s, target, h, K, C) => { s.v += (K * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
 const _hp = new THREE.Vector3(), _hq = new THREE.Quaternion(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _wq = new THREE.Quaternion();
 const kf = (u, ts, vs) => {
  if (u <= ts[0]) return vs[0];
  for (let i = 0; i < ts.length - 1; i++) if (u <= ts[i + 1]) { const f = (u - ts[i]) / (ts[i + 1] - ts[i]), s2 = f * f * (3 - 2 * f); return vs[i] + (vs[i + 1] - vs[i]) * s2; }
  return vs[vs.length - 1];
 };
 const win = (u, a, b, e) => sm(a, a + e, u) * (1 - sm(b - e, b, u));
 const IN_OUT = (a, b) => [[0, a, b, 1], [0, 1, 1, 0]];
 // Channels: pelvis drop/lean/twist/roll, chest pitch/twist, right (dagger) arm, left (flame) arm, legs, head pitch.
 const ACTS = {
  cast: { dur: 1.4 },
  lunge: { dur: 0.9, t: [0, 0.2, 0.36, 0.6, 1], w: IN_OUT(0.1, 0.78),
   pDY: [0, -0.05, -0.17, -0.15, 0], pX: [0, -0.06, 0.32, 0.28, 0], pY: [0, -0.18, 0.2, 0.15, 0], cY: [0, -0.5, 0.32, 0.26, 0], cX: [0, 0, 0.12, 0.1, 0],
   sX0: [-0.18, 0.4, -1.45, -1.4, -0.18], sZ0: [-0.32, -1.0, -0.08, -0.12, -0.32], eX0: [-0.55, -1.5, -0.08, -0.15, -0.55], wX0: [0.12, 0.2, 1.25, 1.2, 0.12],
   sX1: [-0.75, -0.95, 0.6, 0.5, -0.75], sZ1: [0.3, 0.45, 0.55, 0.5, 0.3], eX1: [-1.25, -0.9, -0.35, -0.4, -1.25],
   h0: [0, -0.25, -1.0, -0.95, 0], k0: [0.03, 0.45, 1.1, 1.05, 0.03], a0: [0, -0.2, -0.1, -0.1, 0],
   h1: [0, -0.1, 0.55, 0.5, 0], k1: [0.03, 0.35, 0.15, 0.2, 0.03], a1: [0, -0.15, 0.35, 0.3, 0], hp: [0, 0.1, -0.08, -0.05, 0],
   dash: (u) => (u > 0.2 && u < 0.5 ? 5.5 * Math.sin(Math.PI * (u - 0.2) / 0.3) : 0), trail: [[0.18, 0.72]] },
  combo: { dur: 1.75, t: [0, 0.08, 0.17, 0.27, 0.37, 0.48, 0.6, 0.7, 0.82, 1], w: IN_OUT(0.06, 0.88),
   pDY: [0, -0.04, -0.06, -0.05, -0.06, -0.05, -0.17, -0.15, -0.05, 0], pX: [0, 0.05, 0.14, 0.1, 0.14, 0.02, 0.32, 0.28, 0.08, 0],
   pY: [0, -0.2, 0.25, 0.2, -0.2, -0.15, 0.2, 0.15, 0.05, 0], cY: [0, -0.45, 0.4, 0.45, -0.35, -0.5, 0.32, 0.26, 0.05, 0], cX: [0, 0, 0.08, 0.06, 0.08, 0, 0.12, 0.1, 0.02, 0],
   sX0: [-0.18, -0.4, -1.2, -1.1, -1.15, 0.3, -1.45, -1.4, -0.5, -0.18], sZ0: [-0.32, -1.25, 0.35, 0.45, -1.15, -0.6, -0.1, -0.12, -0.3, -0.32],
   eX0: [-0.55, -0.9, -0.25, -1.2, -0.15, -1.5, -0.08, -0.15, -0.6, -0.55], wX0: [0.12, 0.4, 0.6, 0.5, 0.6, 0.2, 1.25, 1.2, 0.3, 0.12],
   sX1: [-0.75, -0.6, 0, 0.05, 0, -0.3, 0.6, 0.5, -0.4, -0.75], sZ1: [0.3, 0.45, 0.55, 0.55, 0.5, 0.45, 0.55, 0.5, 0.35, 0.3], eX1: [-1.25, -1.1, -0.8, -0.8, -0.8, -0.9, -0.35, -0.4, -1.0, -1.25],
   h0: [0, -0.25, -0.4, -0.35, -0.4, -0.25, -1.0, -0.95, -0.3, 0], k0: [0.03, 0.35, 0.45, 0.4, 0.45, 0.4, 1.1, 1.05, 0.35, 0.03], a0: [0, -0.1, -0.05, -0.05, -0.05, -0.15, -0.1, -0.1, -0.05, 0],
   h1: [0, 0.15, 0.3, 0.25, 0.3, 0.1, 0.55, 0.5, 0.15, 0], k1: [0.03, 0.2, 0.2, 0.2, 0.2, 0.3, 0.15, 0.2, 0.15, 0.03], a1: [0, 0.05, 0.1, 0.1, 0.1, 0, 0.35, 0.3, 0.05, 0],
   hp: [0, 0.05, 0, 0, 0, 0.1, -0.08, -0.05, 0, 0],
   dash: (u) => (u > 0.5 && u < 0.62 ? 3.4 * Math.sin(Math.PI * (u - 0.5) / 0.12) : 0), trail: [[0.1, 0.21], [0.3, 0.41], [0.5, 0.68]] },
  throw: { dur: 1.15, t: [0, 0.3, 0.44, 0.6, 1], w: IN_OUT(0.1, 0.8),
   pX: [0, -0.05, 0.16, 0.12, 0], pY: [0, 0.2, -0.15, -0.1, 0], cY: [0, 0.45, -0.4, -0.3, 0], cX: [0, -0.05, 0.1, 0.08, 0],
   sX1: [-0.75, 0.35, -1.5, -1.3, -0.75], sZ1: [0.3, 0.6, 0.12, 0.15, 0.3], eX1: [-1.25, -1.7, -0.2, -0.35, -1.25],
   sX0: [-0.18, -0.3, 0.25, 0.2, -0.18], sZ0: [-0.32, -0.45, -0.55, -0.5, -0.32], eX0: [-0.55, -0.7, -0.5, -0.5, -0.55],
   h0: [0, 0.1, 0.25, 0.2, 0], k0: [0.03, 0.15, 0.2, 0.2, 0.03], a0: [0, 0, 0.1, 0.1, 0], h1: [0, -0.3, -0.45, -0.4, 0], k1: [0.03, 0.35, 0.4, 0.35, 0.03], a1: [0, -0.05, 0.05, 0.05, 0],
   flame: (u) => (u < 0.44 ? 1 + 0.6 * sm(0.2, 0.44, u) : sm(0.62, 0.95, u)) },
  crescent: { dur: 2.4, t: [0, 0.15, 0.3, 0.55, 0.64, 0.8, 1], w: IN_OUT(0.08, 0.88),
   pDY: [0, 0.02, 0.05, 0.05, 0, 0, 0], cX: [0, -0.08, -0.12, -0.1, 0.08, 0.06, 0], hp: [0, -0.08, -0.12, -0.1, 0, 0, 0], cY: [0, 0, 0, 0, 0.3, 0.25, 0], pX: [0, 0, -0.03, -0.03, 0.15, 0.12, 0],
   sX0: [-0.18, -0.9, -1.35, -1.3, -1.5, -1.45, -0.18], sZ0: [-0.32, -0.9, -1.15, -1.1, -0.1, -0.12, -0.32], eX0: [-0.55, -0.5, -0.3, -0.3, -0.05, -0.1, -0.55], wX0: [0.12, 0.3, 0.3, 0.3, 1.2, 1.15, 0.12],
   sX1: [-0.75, -1.0, -1.35, -1.3, -0.9, -0.85, -0.75], sZ1: [0.3, 0.9, 1.15, 1.1, 0.6, 0.55, 0.3], eX1: [-1.25, -0.6, -0.3, -0.3, -0.7, -0.8, -1.25],
   h0: [0, -0.1, -0.1, -0.1, -0.35, -0.3, 0], k0: [0.03, 0.1, 0.1, 0.1, 0.35, 0.3, 0.03], h1: [0, 0.1, 0.1, 0.1, 0.25, 0.2, 0], k1: [0.03, 0.1, 0.1, 0.1, 0.15, 0.15, 0.03],
   glow: (u) => 0.35 * kf(u, [0, 0.2, 0.62, 0.8], [0, 1, 1, 0]) },
  mend: { dur: 1.9, t: [0, 0.25, 0.75, 1], w: IN_OUT(0.15, 0.85),
   sX1: [-0.75, -0.55, -0.55, -0.75], sZ1: [0.3, 0.02, 0.02, 0.3], eX1: [-1.25, -1.95, -1.95, -1.25],
   sX0: [-0.18, -0.35, -0.35, -0.18], sZ0: [-0.32, -0.2, -0.2, -0.32], eX0: [-0.55, -1.3, -1.3, -0.55],
   hp: [0, 0.2, 0.2, 0], pDY: [0, -0.02, -0.02, 0], cX: [0, 0.05, 0.05, 0],
   shut: [0.22, 0.78], glow: (u) => 0.5 * kf(u, [0, 0.25, 0.7, 1], [0, 1, 1, 0]), tint: 1 },
  hurt: { dur: 0.6, t: [0, 0.15, 0.45, 1], w: IN_OUT(0.05, 0.7),
   pX: [0, -0.25, -0.1, 0], cX: [0, -0.2, -0.08, 0], hp: [0, -0.3, -0.1, 0], pDY: [0, -0.05, -0.02, 0],
   sX0: [-0.18, 0.35, 0.1, -0.18], sZ0: [-0.32, -0.75, -0.5, -0.32], eX0: [-0.55, -0.3, -0.45, -0.55],
   sX1: [-0.75, -0.2, -0.5, -0.75], sZ1: [0.3, 0.85, 0.5, 0.3], eX1: [-1.25, -0.5, -0.9, -1.25],
   h0: [0, 0.15, 0.05, 0], k0: [0.03, 0.25, 0.1, 0.03], h1: [0, -0.2, -0.1, 0], k1: [0.03, 0.35, 0.15, 0.03],
   dash: (u) => (u < 0.3 ? -1.8 * Math.sin(Math.PI * u / 0.3) : 0), shut: [0.03, 0.4], interrupt: true },
  block: { dur: 0.45, t: [0, 0.2, 1], w: IN_OUT(0.05, 0.6), pX: [0, -0.12, 0], hp: [0, -0.1, 0], cX: [0, -0.06, 0],
   dash: (u) => (u < 0.3 ? -0.8 * Math.sin(Math.PI * u / 0.3) : 0), interrupt: true },
  kneel: { dur: 1.3, t: [0, 0.3, 0.6, 1], w: [[0, 0.25, 1], [0, 1, 1]], hold: true, interrupt: true,
   pDY: [0, -0.1, -0.36, -0.36], pX: [0, -0.2, 0.3, 0.35], cX: [0, -0.15, 0.2, 0.25], hp: [0, -0.3, 0.35, 0.45],
   h0: [0, 0.1, -1.5, -1.5], k0: [0.03, 0.3, 1.5, 1.5], a0: [0, 0, 0, 0], h1: [0, 0.1, 0, 0], k1: [0.03, 0.4, 1.5, 1.5], a1: [0, 0.1, 0.45, 0.45],
   sX0: [-0.18, 0.3, -0.25, -0.2], sZ0: [-0.32, -0.7, -0.2, -0.15], eX0: [-0.55, -0.3, -0.3, -0.2],
   sX1: [-0.75, -0.3, 0.05, 0.1], sZ1: [0.3, 0.8, 0.25, 0.2], eX1: [-1.25, -0.5, -0.35, -0.3],
   flame: (u) => 1 - 0.7 * sm(0.3, 1, u) },
  victory: { dur: 1.9, t: [0, 0.3, 0.55, 1], w: [[0, 0.2, 1], [0, 1, 1]], hold: true,
   sX1: [-0.75, -1.6, -2.5, -2.45], sZ1: [0.3, 0.4, 0.3, 0.32], eX1: [-1.25, -0.8, -0.3, -0.35],
   sX0: [-0.18, -0.8, -0.1, -0.1], sZ0: [-0.32, -0.9, -0.55, -0.55], eX0: [-0.55, -0.4, -0.25, -0.25], wX0: [0.12, 0.8, 0.2, 0.2],
   pZ: [0, 0, 0.07, 0.08], pY: [0, 0.3, -0.1, -0.1], cY: [0, 0.3, 0.1, 0.1], hp: [0, -0.1, -0.12, -0.1],
   h0: [0, 0, 0.05, 0.05], k0: [0.03, 0.1, 0.12, 0.12], h1: [0, 0, -0.08, -0.08], k1: [0.03, 0.05, 0.02, 0.02],
   flame: (u) => 1 + 0.8 * sm(0.3, 0.6, u), wink: 0.55 },
  moon: { dur: 2.8, t: [0, 0.18, 0.75, 1], w: IN_OUT(0.12, 0.85),
   pDY: [0, 0.08, 0.16, 0], pX: [0, -0.05, -0.08, 0], cX: [0, -0.1, -0.16, 0],
   sX0: [-0.18, -0.3, -0.35, -0.18], sZ0: [-0.32, -0.8, -0.95, -0.32], eX0: [-0.55, -0.3, -0.2, -0.55], wX0: [0.12, 0.3, 0.4, 0.12],
   sX1: [-0.75, -2.2, -2.75, -0.75], sZ1: [0.3, 0.3, 0.22, 0.3], eX1: [-1.25, -0.5, -0.25, -1.25],
   h0: [0, -0.1, -0.15, 0], k0: [0.03, 0.25, 0.35, 0.03], a0: [0, 0.35, 0.5, 0], h1: [0, 0.05, 0.1, 0], k1: [0.03, 0.25, 0.35, 0.03], a1: [0, 0.35, 0.5, 0],
   hp: [0, -0.1, -0.16, 0], moon: (u) => kf(u, [0, 0.15, 0.3, 0.72, 1], [0, 0.6, 1, 1, 0]), float: true }
 };
 ACTS.summon = { dur: 2.6, t: [0, 0.18, 0.4, 0.62, 0.85, 1], w: IN_OUT(0.08, 0.9),
  sX0: [-0.18, -2.4, -2.6, -0.6, -0.6, -0.18], sZ0: [-0.32, -0.5, -0.45, 0.25, 0.25, -0.32], eX0: [-0.55, -0.25, -0.2, -1.9, -1.9, -0.55],
  sX1: [-0.75, -2.5, -2.7, -0.6, -0.6, -0.75], sZ1: [0.3, 0.5, 0.45, -0.05, -0.05, 0.3], eX1: [-1.25, -0.3, -0.2, -1.9, -1.9, -1.25],
  hp: [0, -0.25, -0.3, 0.3, 0.3, 0], cX: [0, -0.12, -0.14, 0.15, 0.15, 0], pDY: [0, 0.02, 0.03, -0.36, -0.36, 0], pX: [0, -0.05, -0.06, 0.25, 0.25, 0],
  h0: [0, 0, 0, -1.5, -1.5, 0], k0: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a0: [0, 0, 0, 0, 0, 0], h1: [0, 0, 0, 0, 0, 0], k1: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a1: [0, 0, 0, 0.45, 0.45, 0],
  glow: (u) => 0.45 * kf(u, [0, 0.2, 0.85, 1], [0, 1, 1, 0]), flame: (u) => 1 + 0.5 * kf(u, [0, 0.3, 0.6, 1], [0, 1, 0.3, 0]), shut: [0.55, 0.9] };
 ACTS.briar = { dur: 1.35, t: [0, 0.3, 0.45, 0.72, 1], w: IN_OUT(0.1, 0.85),
  sX1: [-0.75, -2.0, -0.45, -0.5, -0.75], sZ1: [0.3, 0.45, 0.2, 0.2, 0.3], eX1: [-1.25, -0.6, -0.25, -0.3, -1.25],
  pDY: [0, 0.02, -0.28, -0.26, 0], pX: [0, -0.06, 0.38, 0.34, 0], hp: [0, -0.12, 0.3, 0.28, 0], cX: [0, -0.05, 0.15, 0.12, 0],
  h0: [0, 0, -0.85, -0.8, 0], k0: [0.03, 0.05, 1.05, 1.0, 0.03], a0: [0, 0, -0.1, -0.1, 0], h1: [0, 0, 0.4, 0.38, 0], k1: [0.03, 0.05, 0.8, 0.75, 0.03], a1: [0, 0, 0.4, 0.38, 0],
  sX0: [-0.18, -0.4, 0.2, 0.15, -0.18], sZ0: [-0.32, -0.5, -0.6, -0.55, -0.32],
  flame: (u) => 1 + 0.7 * kf(u, [0, 0.3, 0.45, 0.6, 1], [0, 1, 1.2, 0.3, 0]) };
 ACTS.transform = { dur: 2.6, t: [0, 0.2, 0.45, 0.55, 0.75, 1], w: IN_OUT(0.08, 0.9),
  sX0: [-0.18, -0.7, -0.7, -1.9, -1.85, -0.18], sZ0: [-0.32, 0.45, 0.45, -1.2, -1.15, -0.32], eX0: [-0.55, -2.0, -2.0, -0.15, -0.2, -0.55],
  sX1: [-0.75, -0.7, -0.7, -1.9, -1.85, -0.75], sZ1: [0.3, -0.2, -0.2, 1.2, 1.15, 0.3], eX1: [-1.25, -2.0, -2.0, -0.15, -0.2, -1.25],
  hp: [0, 0.3, 0.2, -0.3, -0.25, 0], cX: [0, 0.12, 0.08, -0.2, -0.16, 0], pDY: [0, -0.08, 0.12, 0.2, 0.18, 0],
  k0: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], k1: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], a0: [0, 0.1, 0.25, 0.35, 0.3, 0], a1: [0, 0.1, 0.25, 0.35, 0.3, 0],
  flame: (u) => 1 + 0.9 * kf(u, [0, 0.45, 0.55, 0.8, 1], [0, 0.4, 1.2, 0.4, 0]), shut: [0.12, 0.48], glow: (u) => 0.6 * kf(u, [0, 0.4, 0.6, 1], [0.2, 0.5, 1, 0]) };
 const GUARD = { sX0: -1.15, sZ0: 0.35, eX0: -1.35, wX0: 0.35, sX1: -1.0, sZ1: 0.15, eX1: -0.8, h0: -0.25, k0: 0.3, h1: 0.25, k1: 0.3, a1: 0.1, pDY: -0.05, cY: 0.15, hp: 0.05 };
 // rise (new in this pass): getting up after kneel. It starts from the pose she is holding, captured when it is
 // played so nothing pops; from a kneel she pushes up off her front knee, then she blends back into her idle.
 // It needs a pose to rise from, so it returns false when she is already up.
 const RISE_DUR = 1.2;
 ACTS.rise = { dur: RISE_DUR, t: [0, 1], w: [[0, 1], [0, 0]] };
 const POSE_KEYS = ['pDY', 'pX', 'pY', 'pZ', 'cX', 'cY', 'hp', 'sX0', 'sZ0', 'eX0', 'wX0', 'sX1', 'sZ1', 'eX1', 'h0', 'k0', 'a0', 'h1', 'k1', 'a1'];
 const IDLE = { pDY: 0, pX: 0, pY: 0, pZ: 0, cX: 0, cY: 0, hp: 0, sX0: -0.18, sZ0: -0.32, eX0: -0.55, wX0: 0.12, sX1: -0.75, sZ1: 0.3, eX1: -1.25, h0: 0, k0: 0.03, a0: 0, h1: 0, k1: 0.03, a1: 0 };
 const PUSH = { pDY: -0.17, pX: 0.3, cX: 0.16, hp: 0.22, h0: -0.95, k0: 1.0, a0: -0.08, h1: 0.22, k1: 0.75, a1: 0.22, sX0: -0.45, sZ0: -0.25, eX0: -0.65, sX1: -0.45, sZ1: 0.35, eX1: -0.85 };
 function riseFrom(cur) {
  const d = cur.def, u0 = Math.min(1, cur.t / cur.dur), w0 = kf(u0, d.w[0], d.w[1]);
  if (w0 < 0.05) return null;
  const kneel = cur.type === 'kneel', R = { dur: RISE_DUR, t: kneel ? [0, 0.42, 1] : [0, 1], w: [[0, 0.72, 1], [w0, w0, 0]] };
  for (const k of POSE_KEYS) {
   if (!d[k]) continue;
   const v0 = kf(u0, d.t, d[k]);
   R[k] = kneel ? [v0, PUSH[k] !== undefined ? PUSH[k] : lerp(v0, IDLE[k], 0.5), IDLE[k]] : [v0, IDLE[k]];
  }
  const f0 = d.flame ? d.flame(u0) : 1;
  R.flame = (u) => lerp(f0, 1, sm(0.15, 0.85, u));
  return R;
 }
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  if (act && !force && !def.interrupt && !(act.def.hold)) return false;
  if (name === 'rise') { def = act && act.type !== 'cast' && act.type !== 'rise' ? riseFrom(act) : null; if (!def) return false; }
  act = { type: name, t: 0, dur: def.dur, def }; return true;
 }

 // ---------- every frame: the game model's animate(), line for line, but for what draws her flame (its shader's size and
 // whiteness), her glow (shared uniforms instead of rewriting emissive colours) and the trail (a smooth curve) ----------
 function animate(phase, wb, t, dt) {
  dt = dt > 0 ? Math.min(dt, 0.05) : 0;
  const idt = dt > 0 ? dt : 1 / 60;
  const ph = phase, s = Math.sin(ph), c = Math.cos(ph);
  const rx = root.position.x, rz = root.position.z, yaw = root.rotation.y;
  const jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2;
  if (jump) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.prevYaw = yaw; st.yawRate = 0; }
  const kv = 1 - Math.exp(-idt / 0.08), ka = 1 - Math.exp(-idt / 0.06);
  if (dt > 0) {
   const nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
   st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka;
   st.vx = nvx; st.vz = nvz;
   let dyaw = yaw - st.prevYaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
   st.yawRate += (dyaw / dt - st.yawRate) * (1 - Math.exp(-dt / 0.12));
  }
  st.px = rx; st.pz = rz; st.prevYaw = yaw;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), alx = st.ax * cy - st.az * sy, alz = st.ax * sy + st.az * cy;

  // actions
  let cast = 0, w = 0, P = null, u = 0;
  if (act) {
   act.t += dt; u = Math.min(1, act.t / act.dur);
   if (u >= 1 && !act.def.hold) { act = null; u = 0; }
   else if (act.type === 'cast') cast = Math.sin(Math.PI * Math.min(1, u * 1.2));
   else { P = act.def; w = kf(u, P.w[0], P.w[1]); }
  }
  const type = act ? act.type : '', isMoon = type === 'moon';
  gW += ((guardOn ? 1 : 0) - gW) * (1 - Math.exp(-idt * 9));
  const gw = gW * (1 - w);
  const V = (key, base) => {
   let v = GUARD[key] !== undefined ? lerp(base, GUARD[key], gw) : base;
   return P && P[key] ? lerp(v, kf(u, P.t, P[key]), w) : v;
  };
  dashV = P && P.dash ? P.dash(u) : 0;
  moonKv = P && P.moon ? P.moon(u) : 0;
  const glowV = Math.max(P && P.glow ? P.glow(u) : 0, trance * 0.28);
  glowTint += (((P && P.tint) ? 1 : 0) - glowTint) * (1 - Math.exp(-idt * 6));
  const flameS = P && P.flame ? P.flame(u) : 1;

  // body: base walk/idle pose, guard stance and action poses blended on top
  const lean = cl(alz * 0.005, -0.1, 0.1) * (1 - w), bank = cl(-st.yawRate * wb * 0.03, -0.1, 0.1);
  const pDY = V('pDY', 0);
  liftV = Math.max(0, pDY);
  pelvis.position.set(-s * 0.012 * wb * (1 - w), 0.86 + Math.abs(c) * 0.018 * wb - 0.006 * wb + Math.sin(t * 1.9) * 0.003 * (1 - wb) + pDY + (P && P.float ? Math.sin(t * 3) * 0.012 * w : 0) + trance * (0.07 + 0.015 * Math.sin(t * 2.2)), 0);
  pelvis.rotation.set(V('pX', wb * 0.035 + lean), V('pY', -s * 0.09 * wb), V('pZ', (c * 0.05 * wb + Math.sin(t * 0.45) * 0.02 * (1 - wb)) * (1 - w) + bank));
  spine.rotation.set(-0.01 * wb, s * 0.05 * wb * (1 - w), -pelvis.rotation.z * 0.35);
  chest.rotation.set(V('cX', lean * 0.2 - 0.05 * cast), V('cY', s * 0.07 * wb - 0.1 * cast), -c * 0.02 * wb * (1 - w) - pelvis.rotation.z * 0.25);
  const br = Math.sin(t * 2.0) * 0.006 * (1 - 0.5 * wb); chest.scale.set(1 + br, 1 + br * 0.4, 1 + br);
  const hipW = [0, 0];
  for (let i = 0; i < 2; i++) {
   const sg = i === 0 ? 1 : -1, hipB = sg * s * 0.42 * wb, kneeB = wb * (0.05 + 0.85 * Math.max(0, -sg * c)) + 0.03;
   const ankB = -(hipB + kneeB) * 0.65 + Math.max(0, sg * s) * 0.25 * wb;
   hipW[i] = V('h' + i, hipB);
   legs[i].rotation.set(hipW[i] - pelvis.rotation.x, 0, -pelvis.rotation.z + sg * 0.02);
   knees[i].rotation.x = V('k' + i, kneeB);
   ankles[i].rotation.x = V('a' + i, ankB);
  }
  const sw = -s * 0.22 * wb + Math.sin(t * 1.2) * 0.02 * (1 - wb);
  arms[0].rotation.set(V('sX0', -0.18 + sw - lean * 0.5), 0, V('sZ0', -0.32 + Math.sin(t * 0.9) * 0.015 * (1 - wb)));
  elbows[0].rotation.set(V('eX0', -0.55 - 0.2 * Math.max(0, -sw) - 0.05 * wb), 0, 0);
  wrists[0].rotation.set(V('wX0', 0.12), 0, 0.1);
  const bob = Math.sin(ph * 2) * 0.025 * wb + Math.sin(t * 1.6) * 0.02 * (1 - wb);
  arms[1].rotation.set(V('sX1', -0.75 - 0.95 * cast + bob), 0, V('sZ1', 0.3 + 0.1 * cast));
  elbows[1].rotation.set(V('eX1', -1.25 + 0.75 * cast - bob * 0.5), Math.PI / 2, 0);
  wrists[1].rotation.set(0.05 + 0.2 * cast + (isMoon ? 0.35 * w : 0), 0, -0.15);

  // gaze
  if (P && !isMoon) { lookTY = 0; lookTP = 0.04; }
  else if (isMoon) { lookTY = 0; lookTP = -0.2; }
  else if (cast > 0.05) { lookTY = 0.35; lookTP = -0.18; }
  else if (wb > 0.3) { lookTY = cl(st.yawRate * 0.15, -0.5, 0.5); lookTP = 0.06; lookTimer = 0.8 + hr(); }
  else if (dt > 0) {
   lookTimer -= dt;
   if (lookTimer <= 0) {
    if (hr() < 0.3) { lookTY = 0.32; lookTP = 0.12; } else { lookTY = (hr() - 0.5) * 1.1; lookTP = (hr() - 0.55) * 0.25; }
    lookTimer = 2.2 + hr() * 3; if (blinkT < 0 && hr() < 0.6 && blinkOn) blinkT = 0;
   }
  }
  const kl = 1 - Math.exp(-idt * (P ? 9 : 4));
  lookYaw += (lookTY - lookYaw) * kl; lookPitch += (lookTP - lookPitch) * kl;
  neck.rotation.set(lookPitch * 0.4, lookYaw * 0.35 - chest.rotation.y * 0.5, 0);
  headB.rotation.set(lookPitch * 0.6 + 0.015 * wb * Math.abs(s) - lean * 0.3 + V('hp', 0), lookYaw * 0.5 - chest.rotation.y * 0.35 - pelvis.rotation.y * 0.3,
   -chest.rotation.z * 0.5 - pelvis.rotation.z * 0.5 + Math.sin(t * 0.7) * 0.025 * (1 - wb));
  if (blinkT < 0 && blinkOn) { blinkIn -= dt; if (blinkIn <= 0) blinkT = 0; }
  let close = 0;
  if (blinkT >= 0) { blinkT += dt; const bu = blinkT / 0.16; if (bu >= 1) { blinkT = -1; blinkIn = 1.8 + hr() * 3.2; } else close = Math.sin(Math.PI * Math.min(1, bu * 1.1)); }
  if (P && P.shut) close = Math.max(close, win(u, P.shut[0], P.shut[1], 0.06));
  // cutscene: the same gaze, moving the iris a little less in the smaller eye
  const eyeX = cl((lookTY - lookYaw) * 0.012 + lookYaw * 0.0048, -0.0048, 0.0048), eyeY = cl(-lookPitch * 0.011, -0.003, 0.0024);
  setIris(eyeX, eyeY);
  const hlOn = [false, false];
  eyes.forEach((e, i) => {
   let cc = (P && P.wink && i === 1) ? Math.max(close, sm(P.wink, P.wink + 0.08, u)) : close;
   cc = Math.max(cc, lidsV);
   // cutscene: the upper lid rests a little lowered (LID_REST) and closes from there; the lash line rides its edge
   const c2 = LID_REST + (1 - LID_REST) * cc;
   e.low.visible = cc > 0.01; e.lid.visible = cc > 0.01; // cutscene: at rest the lid is the skin over the eye (lidSk)
   e.lid.scale.set(1, 0.02 + 0.8 * c2, 0.5 + 0.5 * c2);
   e.low.scale.set(1, 0.015 + 0.225 * cc, 0.45 + 0.55 * cc);
   e.lash.position.set(0, EH - 2 * EH * e.lid.scale.y, SZ * 0.6 * cc);
   e.lash.scale.y = 1 - 0.85 * cc;
   hlOn[i] = cc < 0.35;
  });
  setShine(hlOn[0], hlOn[1]);

  // physics: skirt, two-level cloak, hair chain and side locks, floppy hat tip, dagger charms
  root.updateMatrixWorld(true);
  headB.getWorldPosition(_hp);
  if (jump) {
   for (const k of skS) { k.x = 0.02; k.v = 0; } for (const k of cuS) { k.x = 0.03; k.v = 0; } for (const k of clS) { k.x = 0.02; k.v = 0; }
   for (const k of [...hairS, ...sideS, ...hatS, ...chS]) { k.x = k.v = 0; }
   st.hp.copy(_hp); st.hv.set(0, 0, 0); st.ha.set(0, 0, 0); st.acc = 0; st.init = true;
  }
  if (dt > 0) {
   _t1.subVectors(_hp, st.hp).divideScalar(dt);
   _t2.copy(st.hv); st.hv.lerp(_t1, kv); _t2.subVectors(st.hv, _t2).divideScalar(dt); st.ha.lerp(_t2, ka);
  }
  st.hp.copy(_hp);
  headB.getWorldQuaternion(_hq).invert(); _t1.copy(st.ha).applyQuaternion(_hq);
  const hax = _t1.x, haz = _t1.z, headPitch = headB.rotation.x + neck.rotation.x + chest.rotation.x + pelvis.rotation.x;
  const bounce = Math.sin(ph * 2 + 0.4) * wb, mk = moonKv, billow = Math.sin(t * 4.2), lw = type === 'lunge' || type === 'combo' ? w : 0;
  const skT = skirt.map((b, k) => {
   const a = k / SK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   let kick = 0;
   for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.3 : 0.3))) ** 2;
   return cl(0.02 - dot * 0.004 + kick * 0.18 + Math.abs(c) * 0.012 * wb + 0.05 * cast + mk * (0.12 + 0.04 * Math.sin(t * 5 + k)), -0.03, 0.4);
  });
  const cuT = coatU.map((b, k) => {
   const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   let kick = 0;
   for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.5 : 0.5))) ** 2;
   return cl(0.03 - dot * 0.006 + Math.abs(c) * 0.02 * wb + 0.04 * wb * Math.max(0, -Math.cos(a)) + 0.08 * cast + mk * (0.24 + 0.06 * Math.sin(t * 3.4 + k * 1.3)) + lw * 0.25 * Math.max(0, -Math.cos(a)) + kick * 0.12, -0.04, 0.55);
  });
  const clT = coatL.map((b, k) => {
   const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   return cl(0.02 - dot * 0.008 + Math.sin(ph * 2 + k) * 0.03 * wb + 0.1 * cast + mk * (0.22 + 0.1 * Math.sin(t * 4 + k * 1.7)) + lw * 0.3 * Math.max(0, -Math.cos(a)), -0.08, 0.6);
  });
  const hT = [cl(haz * 0.003, -0.12, 0.12) - headPitch * 0.9 + bounce * 0.015 + mk * 0.3, cl(-hax * 0.003, -0.1, 0.1),
   cl(haz * 0.004, -0.15, 0.15) + bounce * 0.02 + mk * (0.25 + 0.08 * billow), cl(-hax * 0.004, -0.12, 0.12),
   cl(haz * 0.005, -0.18, 0.18) + bounce * 0.025 + mk * (0.3 + 0.12 * billow), cl(-hax * 0.005, -0.14, 0.14)];
  const sT = cl(haz * 0.004, -0.14, 0.14) + bounce * 0.02 - headPitch * 0.4 + mk * 0.3;
  const tT = [cl(haz * 0.004, -0.12, 0.12) + bounce * 0.03 + mk * 0.1 * billow, cl(-hax * 0.004, -0.1, 0.1), cl(haz * 0.006, -0.2, 0.2) + bounce * 0.05 + mk * 0.18 * billow, cl(-hax * 0.006, -0.16, 0.16)];
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH));
  st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  for (let n = 0; n < nSteps; n++) {
   for (let k = 0; k < SK; k++) spring(skS[k], skT[k], PH, 110, 8);
   for (let k = 0; k < CK; k++) { spring(cuS[k], cuT[k], PH, 70, 6); spring(clS[k], clT[k] + cuS[k].v * 0.02, PH, 45, 4.5); }
   spring(hairS[0], hT[0], PH, 80, 6); spring(hairS[1], hT[1], PH, 80, 6);
   spring(hairS[2], hT[2], PH, 60, 4.5); spring(hairS[3], hT[3], PH, 60, 4.5);
   spring(hairS[4], hT[4], PH, 45, 3.5); spring(hairS[5], hT[5], PH, 45, 3.5);
   for (const k of sideS) spring(k, sT, PH, 90, 5);
   spring(hatS[0], tT[0], PH, 90, 5); spring(hatS[1], tT[1], PH, 90, 5); spring(hatS[2], tT[2], PH, 60, 3.5); spring(hatS[3], tT[3], PH, 60, 3.5);
   spring(chS[0], cl(-alz * 0.02, -0.5, 0.5) + bounce * 0.15, PH, 50, 3); spring(chS[1], cl(alx * 0.02, -0.4, 0.4), PH, 50, 3);
  }
  for (let k = 0; k < SK; k++) skirt[k].rotation.x = -skS[k].x;
  for (let k = 0; k < CK; k++) { coatU[k].rotation.x = -cuS[k].x; coatL[k].rotation.x = -clS[k].x; }
  hairA.rotation.set(hairS[0].x, 0, hairS[1].x); hairB.rotation.set(hairS[2].x, 0, hairS[3].x); hairC.rotation.set(hairS[4].x, 0, hairS[5].x);
  sideL1.rotation.x = sideS[0].x; sideL2.rotation.x = sideS[1].x * 1.3; sideR1.rotation.x = sideS[2].x; sideR2.rotation.x = sideS[3].x * 1.3;
  hatA1.rotation.set(hatS[0].x, 0, hatS[1].x); hatA2.rotation.set(hatS[2].x, 0, hatS[3].x);

  // hanging things point down; the flame stays upright and follows the action
  root.updateMatrixWorld(true);
  dagger.getWorldQuaternion(_wq).invert();
  charm.quaternion.copy(_wq).multiply(_hq.setFromEuler(_e.set(chS[0].x, 0, chS[1].x)));
  wrists[1].getWorldQuaternion(_wq).invert(); flame.quaternion.copy(_wq);
  const whiteF = Math.max(mk, trance);
  U.time.value = t;
  const fs = (1 + 0.06 * Math.sin(t * 9)) * (1 + 0.9 * cast + 0.7 * mk) * flameS + 1e-4;
  flames[0].material.uniforms.uSize.value.set(0.2 * fs, 0.36 * fs); flames[1].material.uniforms.uSize.value.set(0.16 * fs, 0.29 * fs);
  for (const f of flames) f.material.uniforms.uWhite.value = whiteF;
  palmGlow.scale.setScalar(0.16 * (1 + 0.5 * cast) * (1 + 0.08 * Math.sin(t * 13)) * Math.min(1, flameS + 0.2));
  palmGlow.material.opacity = 1 - whiteF * 0.8;
  fLight.color.copy(PURPLE).lerp(MOONC, whiteF);
  fLight.intensity = (1.3 + 0.22 * Math.sin(t * 13) + 0.14 * Math.sin(t * 7.3)) * (1 + 1.2 * cast + 1.2 * mk) * Math.min(1.4, 0.15 + flameS);
  fLight.distance = 3.2 + 1.5 * cast + 1.5 * mk;
  for (let i = 0; i < NPt; i++) {
   const sd = ptSeed[i], age = (t * sd[1] * (1 + cast) + sd[2]) % 1, ang = sd[0] + age * 5, r = 0.02 + 0.045 * age * (1 + cast);
   ptPos[i * 3] = Math.cos(ang) * r; ptPos[i * 3 + 1] = 0.02 + age * 0.3 * (1 + cast); ptPos[i * 3 + 2] = Math.sin(ang) * r;
   const k = Math.sin(Math.PI * age) * (0.75 + 0.25 * Math.sin(t * 20 + i)) * Math.min(1, flameS);
   ptCol[i * 3] = 0.9 * k; ptCol[i * 3 + 1] = lerp(0.55, 0.93, whiteF) * k; ptCol[i * 3 + 2] = k;
  }
  ptGeo.attributes.position.needsUpdate = true; ptGeo.attributes.color.needsUpdate = true;

  // light effects: moonlight (beam, sigil, pool), aura for trance and healing, rising motes; she glows
  const auraK = Math.max(mk, glowV);
  moonG.visible = auraK > 0.001;
  if (moonG.visible) {
   moonG.position.set(rx, 0, rz);
   beam.visible = sigil.visible = mk > 0.001;
   beam.material.opacity = mk * 0.8; beam.scale.set(1.4 + 0.4 * mk, 8, 1);
   sigil.material.opacity = mk * 0.9; sigil.rotation.z = t * 0.4; sigil.scale.setScalar(0.65 + 0.35 * mk);
   pool.material.opacity = auraK * 0.5;
   pool.material.color.setRGB(lerp(0.72, 0.62, glowTint), lerp(0.8, 1.0, glowTint), lerp(1.0, 0.72, glowTint));
   aura.material.opacity = auraK * (0.5 + 0.08 * Math.sin(t * 6)); aura.position.set(0, 1.0 + pDY, 0);
   aura.material.color.setRGB(lerp(0.93, 0.8, glowTint), 1, lerp(1, 0.82, glowTint));
   moonLight.intensity = auraK * 3.2;
   moonLight.color.setRGB(lerp(0.9, 0.75, glowTint), 1, lerp(1, 0.8, glowTint));
   for (let i = 0; i < NM; i++) {
    const sd = mSeed[i], age = (t * sd[1] + sd[2]) % 1, ang = sd[0] + age * 2.5, r = sd[3] * (1 - 0.35 * age) * (0.6 + 0.4 * mk);
    mPos[i * 3] = Math.cos(ang) * r; mPos[i * 3 + 1] = age * (1.4 + 1.8 * mk); mPos[i * 3 + 2] = Math.sin(ang) * r;
    const k = Math.sin(Math.PI * age) * auraK;
    mCol[i * 3] = lerp(0.85, 0.6, glowTint) * k; mCol[i * 3 + 1] = 0.95 * k; mCol[i * 3 + 2] = lerp(1, 0.7, glowTint) * k;
   }
   mGeo.attributes.position.needsUpdate = true; mGeo.attributes.color.needsUpdate = true;
  }
  const gk = Math.max(mk * 0.5, glowV * 0.35);
  glowK = gk; trK = trance; U.glow.value = gk; U.trance.value = trance;
  tWing.visible = trance > 0.01;
  if (tWing.visible) { gwMF.opacity = gwMH.opacity = 0.85 * trance; const fl = Math.sin(t * 2.4); for (const sw of tSides) { sw.side.rotation.y = sw.sd * (0.45 + 0.3 * fl); sw.side.scale.set(sw.sd * (0.3 + 0.7 * trance), 0.3 + 0.7 * trance, 1); sw.fo.rotation.x = 0.08 * fl; } placeWings(); }
  tAura.visible = trance > 1e-3; // below this its additive light is under half a color step: nothing to draw
  tAura.material.opacity = 0.7 * trance; tAura.material.rotation = Math.sin(t * 0.5) * 0.1; tAura.scale.setScalar(1.2 + 0.1 * Math.sin(t * 1.7));
  for (const L of LINING) L.m.color.copy(L.c).lerp(INDIGO, trance);

  // dagger trail during strikes
  let trOn = 0;
  if (P && P.trail) for (const r of P.trail) trOn = Math.max(trOn, win(u, r[0], r[1], 0.05));
  if (trOn > 0 && trailOn === 0) { dagger.localToWorld(_t1.copy(tipL)); dagger.localToWorld(_t2.copy(midL)); for (let i = 0; i < TRN; i++) { trTip[i].copy(_t1); trMid[i].copy(_t2); } }
  trailOn = trOn; trail.visible = trOn > 0;
  if (trail.visible) {
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   dagger.localToWorld(trTip[0].copy(tipL)); dagger.localToWorld(trMid[0].copy(midL));
   for (let i = 0; i < TRV; i++) {
    const s = i / TRS, i0 = Math.min(TRN - 1, Math.floor(s)), f = s - i0, im = Math.max(0, i0 - 1), i1 = Math.min(TRN - 1, i0 + 1), i2 = Math.min(TRN - 1, i0 + 2);
    cr1(trTip[im], trTip[i0], trTip[i1], trTip[i2], f, _t1); cr1(trMid[im], trMid[i0], trMid[i1], trMid[i2], f, _t2);
    const k = trOn * Math.pow(1 - s / (TRN - 1), 1.6);
    trPos.set([_t1.x, _t1.y, _t1.z, _t2.x, _t2.y, _t2.z], i * 6);
    trCol.set([k, k, k, 0.35 * k, 0.4 * k, 0.55 * k], i * 6);
   }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
 }

 const _tp = new THREE.Vector3();

 // ---------- the Model Build Spec interface, as the game model has it ----------
 // Hit and cue times (0 to 1) as the battle demo times them (the game model's, unchanged).
 const TIMES = {
  lunge: { hits: [0.36] }, combo: { hits: [0.17, 0.37, 0.6] },
  throw: { hits: [0.87], cues: [0.44] }, crescent: { hits: [0.733, 0.788, 0.842, 0.896, 0.95], cues: [0.18, 0.6] },
  briar: { hits: [0.613], cues: [0.45] }, mend: { hits: [0.6] },
  moon: { hits: [0.407, 0.521, 0.636], cues: [0.3, 0.389] }, summon: { cues: [0.3, 0.569] }, transform: { cues: [0.55] }
 };
 const ACTIONS = {};
 for (const n in ACTS) {
  const d = ACTS[n], q = TIMES[n] || {};
  ACTIONS[n] = Object.freeze({ dur: d.dur, hits: Object.freeze((q.hits || []).slice()), cues: Object.freeze((q.cues || []).slice()), hold: !!d.hold, interrupt: !!d.interrupt });
 }
 Object.freeze(ACTIONS);
 // named points in world space: the game model's (chest, head, hit or tip, flame, handL, handR) and, for labels and close
 // views, her parts: hatTip, horn, charm, glasses, eye, ponytail, scrunchie, coat, dress, sash, boot, necklace, bracelet, dagger
 const GLASS = rimC[1].slice(), EYE = frameAt(0.34, -0.07, 0).p;
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  const at = (b, x, y, z) => { b.updateWorldMatrix(true, false); return b.localToWorld(out.set(x, y, z)); };
  switch (name) {
   case 'hit': case 'tip': dagger.updateWorldMatrix(true, false); return dagger.localToWorld(out.copy(tipL));
   case 'flame': return flame.getWorldPosition(out);
   case 'head': return at(headB, 0, 0, 0.05);
   case 'handL': return at(wrists[1], 0, -0.03, 0.002);
   case 'handR': return at(wrists[0], 0, -0.03, 0.002);
   case 'hatTip': return at(hatA2, -0.05, 0.02, 0.01);
   case 'horn': return at(hatB, 0.215, 0.115, -0.02);
   case 'charm': return at(hatB, 0, 0.085, 0.135);
   case 'glasses': return at(headB, GLASS[0], GLASS[1], GLASS[2]);
   case 'eye': return at(headB, EYE[0], EYE[1], EYE[2]);
   case 'ponytail': return at(hairB, 0, -0.06, -0.02);
   case 'scrunchie': return at(hairA, 0, -0.01, -0.012);
   case 'coat': return at(coatL[1], 0, -0.1, 0.02);
   case 'dress': return at(pelvis, 0.08, -0.62, 0.22);
   case 'sash': return at(pelvis, 0.012, 0.035, 0.104);
   case 'boot': return at(knees[1], 0, -0.2, 0.05);
   case 'necklace': return at(chest, 0, 1.145 - chB[1], 0.128);
   case 'bracelet': return at(elbows[1], 0, -0.19, 0);
   case 'dagger': return at(dagger, 0, 0, 0.15);
   default: return chest.getWorldPosition(out);
  }
 }
 // state: trance (0 to 1) brings in the starlight cloak, ghost wings and crescent aura (the same as m.trance)
 const state = {};
 Object.defineProperty(state, 'trance', { enumerable: true, get: () => trance, set: (v) => { trance = cl(v, 0, 1); } });
 // cutscene: blink (false holds her eyes open), lids (0 to 1: how far her lids are lowered, for a sleepy or sad look)
 Object.defineProperty(state, 'blink', { enumerable: true, get: () => blinkOn, set: (v) => { blinkOn = v !== false; if (!blinkOn) blinkT = -1; } });
 Object.defineProperty(state, 'lids', { enumerable: true, get: () => lidsV, set: (v) => { lidsV = cl(+v || 0, 0, 1); } });
 // a party member does not fade; at 0 she is hidden, anything above shows her
 let fade = 1;
 function setFade(f) {
  const was = fade > 0.001; fade = cl(Number.isFinite(+f) ? +f : 1, 0, 1);
  const now = fade > 0.001; if (now !== was) { root.visible = now; fx.visible = now; }
 }

 return {
  root, skeleton, bones, animate, flameLight: fLight, flame, fx,
  play, cast() { return play('cast'); }, lunge() { return play('lunge'); }, moonlight() { return play('moon'); },
  guard(on) { guardOn = !!on; },
  reset() { act = null; guardOn = false; gW = 0; trance = 0; },
  set trance(v) { trance = cl(v, 0, 1); }, get trance() { return trance; },
  ACTIONS, anchor, setFade, get fade() { return fade; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  get busy() { return !!act && !(act.def.hold && act.t >= act.dur); },
  get action() { return act ? act.type : ''; },
  get casting() { return !!act && act.type === 'cast'; },
  get progress() { return act ? Math.min(1, act.t / act.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get moon() { return moonKv; },
  tip(out) { return dagger.localToWorld((out || _tp).copy(tipL)); },
  flamePos(out) { return flame.getWorldPosition(out || _tp); },
  chestPos(out) { return chest.getWorldPosition(out || _tp); },
  // for the study page: the rim's strength (0 to 1), and the detail it was built at
  set rim(v) { U.rim.value = .3 * cl(v, 0, 2); }, detail: DET, strands: HAIR_STRANDS
 };
}

/* ---------- copies/sol.js ---------- */
// sol.js: Solenne "Sol" Kestrel, the last Ember Warden. three.js r128 (global THREE). Defines makeSol(opts) only.
// Touched up from src/models/originals/sol.js after her sheets (reference/art/sol-model.webp, which wins, and sol-model-b.webp):
// a sculpted face with sun-browned, freckled skin, amber eyes and a half-smile; copper hair cut above the ears; brushed bronze
// half-plate with gold edges and a sun on the breastplate; the burnt-orange tabard with its sun crest; a midnight-blue cape with
// a hood, gold edging, a sun on the back and a chain clasp; a blade that glows amber-gold. Fewer materials and draw calls.
// Her skeleton, every action and its timing, Heat, Sunburn and the Dawnbreaker trance are unchanged.
function makeSol(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, feet on y = 0. Her right side is -X.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 let seed = 1778;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const G2 = (dx, dy, sx, sy) => Math.exp(-(dx * dx) / (sx * sx) - (dy * dy) / (sy * sy));
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const TAU = Math.PI * 2, PI = Math.PI;
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };

 // ---------- materials: a warm rim light on every surface, so she reads in the dark and glows with Heat ----------
 const RIM = { c: { value: new THREE.Color(1, .62, .32) }, k: { value: .1 } };
 function std(c, r, x, rimS) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, x || {}));
  const s = { value: rimS === undefined ? 1 : rimS };
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uRimC = RIM.c; sh.uniforms.uRimK = RIM.k; sh.uniforms.uRimS = s;
   sh.fragmentShader = 'uniform vec3 uRimC;\nuniform float uRimK;\nuniform float uRimS;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    'float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uRimC * (uRimK * uRimS * pow(rimF, 2.6));\n#include <dithering_fragment>');
  };
  m.customProgramCacheKey = () => 'sol-rim';
  return m;
 }

 // ---------- painted textures ----------
 function blob(g, x, y, r, col, sx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  g.save(); g.translate(x, y); g.scale(sx || 1, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
 }
 // fine noise laid from one small tile, so no canvas is ever read back
 let NT = null;
 function grain(g, x, y, w, h, amt) {
  if (!NT) { NT = cvs(128, 128); const t = NT.getContext('2d'), id = t.createImageData(128, 128), d = id.data; for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = rnd() < .5 ? 0 : 255; d[i + 3] = rnd() * 255; } t.putImageData(id, 0, 0); }
  g.save(); g.globalAlpha = Math.min(1, amt / 120); g.fillStyle = g.createPattern(NT, 'repeat'); g.fillRect(x, y, w, h); g.restore();
 }
 function weave(g, x0, y0, W, H, a) { for (let i = 0; i < W * H / 80; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a * .6 + ')'; g.fillRect(x0 + rnd() * W, y0 + rnd() * H, 1 + rnd() * 3, 1); } }
 // the Ember Wardens' sun: a disc in a ring, long rays up and down, shorter rays across, small rays between
 function sun(g, x, y, r, sy, fill, dark) {
  g.save(); g.translate(x, y); g.scale(1, sy || 1); g.fillStyle = fill;
  for (let i = 0; i < 16; i++) {
   const a = i / 16 * TAU - PI / 2, q = i % 4, L = q === 0 ? (i % 8 === 0 ? 3.3 : 2.4) : q === 2 ? 1.85 : 1.4, w = q === 0 ? .2 : q === 2 ? .15 : .1;
   g.beginPath(); g.moveTo(Math.cos(a - w) * r * 1.12, Math.sin(a - w) * r * 1.12); g.lineTo(Math.cos(a) * r * L, Math.sin(a) * r * L); g.lineTo(Math.cos(a + w) * r * 1.12, Math.sin(a + w) * r * 1.12); g.closePath(); g.fill();
  }
  g.beginPath(); g.arc(0, 0, r * 1.16, 0, TAU); g.fill();
  g.strokeStyle = dark; g.lineWidth = Math.max(1, r * .1); g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.stroke();
  const gr = g.createRadialGradient(-r * .25, -r * .3, r * .1, 0, 0, r * .9); gr.addColorStop(0, 'rgba(255,244,200,.4)'); gr.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.fill();
  g.restore();
 }
 // the lower ornament: a spear point rising out of two scrolls
 function fleur(g, x, y, h, sy, fill) {
  g.save(); g.translate(x, y); g.scale(1, sy || 1); g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = 'round';
  const w = h * .17;
  g.beginPath(); g.moveTo(0, -h * .5); g.lineTo(w * .62, -h * .08); g.lineTo(w * .2, h * .02); g.lineTo(w * .2, h * .5); g.lineTo(-w * .2, h * .5); g.lineTo(-w * .2, h * .02); g.lineTo(-w * .62, -h * .08); g.closePath(); g.fill();
  g.lineWidth = Math.max(1.4, h * .05);
  for (const s of [-1, 1]) {
   g.beginPath(); g.moveTo(s * w * .2, h * .3); g.bezierCurveTo(s * w * 1.5, h * .14, s * w * 2.5, h * .34, s * w * 1.7, h * .44); g.bezierCurveTo(s * w * 1.1, h * .5, s * w * .95, h * .36, s * w * 1.35, h * .34); g.stroke();
   g.beginPath(); g.moveTo(s * w * .2, h * .12); g.quadraticCurveTo(s * w * 1.2, h * .02, s * w * 1.6, -h * .1); g.stroke();
  }
  g.beginPath(); g.moveTo(-w * .9, h * .2); g.lineTo(w * .9, h * .2); g.stroke();
  g.restore();
 }

 // skin atlas: her face painted in its front view (left half), her forearms (right half)
 const FW = 512, FS = FW / 2.2, PX = (X) => (X / 1.1 * .5 + .5) * FW, PY = (Y) => (.5 - Y / 1.1 * .5) * FW;
 const SKIN = '#c4845c';
 function skinCanvas() {
  const c = cvs(1024, 512), g = c.getContext('2d');
  g.fillStyle = SKIN; g.fillRect(0, 0, 1024, 512); grain(g, 0, 0, 1024, 512, 7);
  const B = (X, Y, r, col, sx) => blob(g, PX(X), PY(Y), r * FS, col, sx);
  B(0, .42, .5, 'rgba(222,160,118,.3)', 1.3);          // forehead
  B(0, -.12, .1, 'rgba(232,170,128,.4)', .5);          // the ridge of the nose
  B(0, -.3, .07, 'rgba(242,188,146,.36)');             // the tip of the nose catching light
  for (const s of [-1, 1]) {
   B(s * .52, -.07, .2, 'rgba(232,168,126,.36)', 1.3);  // cheekbones
   B(s * .8, .2, .28, 'rgba(118,62,38,.28)');          // temples
   B(s * .5, -.42, .17, 'rgba(126,66,42,.22)', .9);     // under the cheekbones
   B(s * .74, -.64, .28, 'rgba(104,54,34,.32)');       // the jaw turning under
   B(s * .37, .07, .21, 'rgba(100,44,24,.46)', 1.35);   // warm shadow in the sockets
   B(s * .55, .1, .11, 'rgba(84,36,20,.36)');          // deepest at the outer corners
   B(s * .36, -.1, .12, 'rgba(150,82,58,.2)', 1.5);     // under the eyes
   B(s * .1, -.21, .075, 'rgba(126,64,40,.4)', .5);     // the sides of the nose
   B(s * .075, -.385, .028, 'rgba(64,24,14,.62)');      // nostrils
   B(s * .125, -.36, .045, 'rgba(110,52,32,.35)');      // the creases of the nostril wings
   B(s * .48, -.25, .21, 'rgba(214,96,74,.2)', 1.3);    // sun on the cheeks
   B(s * .38, .24, .19, 'rgba(90,40,22,.16)', 2.2);     // under the brows
  }
  B(0, -.17, .13, 'rgba(208,96,74,.14)', 2);           // sun across the nose
  B(0, -1.04, .38, 'rgba(96,48,30,.45)', 1.5);         // under the chin
  B(0, -.55, .22, 'rgba(160,74,58,.26)', 1.9);         // lip tint under the painted mouth
  B(0, -.425, .06, 'rgba(104,46,30,.32)', 1.5);        // the shadow under the nose
  B(0, -.675, .1, 'rgba(110,52,34,.3)', 2);            // under the lower lip
  // smile lines from the nose to the corners of the mouth
  g.save(); g.strokeStyle = 'rgba(120,60,40,.12)'; g.lineWidth = 3; g.lineCap = 'round'; g.shadowColor = 'rgba(120,60,40,.25)'; g.shadowBlur = 4;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(PX(s * .19), PY(-.39)); g.quadraticCurveTo(PX(s * .34), PY(-.45), PX(s * .35), PY(-.57)); g.stroke(); }
  g.restore();
  // freckles across the nose and cheeks
  for (let i = 0; i < 2200; i++) {
   const X = (rnd() - .5) * 1.6, Y = .02 - rnd() * .42;
   const d = Math.exp(-((Math.abs(X) - .42) ** 2) / .05) * Math.exp(-((Y + .2) ** 2) / .014) + .9 * Math.exp(-(X * X) / .014) * Math.exp(-((Y + .16) ** 2) / .008);
   if (rnd() > d * .7) continue;
   g.fillStyle = 'rgba(' + ((128 + rnd() * 30) | 0) + ',' + ((60 + rnd() * 20) | 0) + ',' + ((32 + rnd() * 12) | 0) + ',' + (.22 + rnd() * .3).toFixed(2) + ')';
   g.beginPath(); g.arc(PX(X), PY(Y), .8 + rnd() * 1.1, 0, TAU); g.fill();
  }
  // forearms: x 512-767 her right, 768-1023 her left; u runs round the arm (front at the middle), v from the elbow down
  for (let k = 0; k < 2; k++) for (let i = 0; i < 110; i++) { g.fillStyle = 'rgba(126,58,32,' + (.18 + rnd() * .2).toFixed(2) + ')'; g.beginPath(); g.arc(512 + k * 256 + rnd() * 256, rnd() * 512, .8 + rnd() * .9, 0, TAU); g.fill(); }
  // the burn scar: a branching, curling mark on her right forearm, on the side her sword grip turns outward; mostly under the vambrace
  const segs = [];
  const grow = (x, y, a, len, w, depth) => {
   for (let s = 0; s < len; s += 5) {
    const na = a + (rnd() - .5) * .7, nx = x + Math.sin(na) * 2.9, ny = y + Math.cos(na) * 5;
    segs.push([x, y, nx, ny, w * (1 - s / len * .55)]);
    if (depth > 0 && rnd() < .13) grow(nx, ny, na + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .7), len * (.28 + rnd() * .3), w * .62, depth - 1);
    x = nx; y = ny; a = na;
   }
  };
  grow(607, 16, -.05, 300, 3.4, 3); grow(625, 40, -.25, 220, 2.6, 2);
  g.lineCap = 'round';
  for (const [col, k] of [['rgba(170,78,66,.3)', 2.8], ['rgba(116,34,30,.72)', 1], ['rgba(236,156,136,.32)', .32]]) { g.strokeStyle = col; for (const s of segs) { g.lineWidth = s[4] * k; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); } }
  g.fillStyle = SKIN; g.fillRect(992, 0, 32, 32); // a clean swatch for the neck and ears
  return c;
 }
 function irisCanvas() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
  g.fillStyle = '#efe4d6'; g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, '#2a1204'); gr.addColorStop(.3, '#8a4a0c'); gr.addColorStop(.44, '#f0aa36'); gr.addColorStop(.7, '#d48420'); gr.addColorStop(.86, '#7a3a08'); gr.addColorStop(.94, '#2a1204'); gr.addColorStop(1, '#2a1204');
  g.fillStyle = gr; g.beginPath(); g.arc(h, h, h, 0, TAU); g.fill();
  for (let i = 0; i < 90; i++) { const a = rnd() * TAU; g.strokeStyle = rnd() < .55 ? 'rgba(255,214,130,.3)' : 'rgba(90,40,6,.3)'; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(h + Math.cos(a) * h * .32, h + Math.sin(a) * h * .32); g.lineTo(h + Math.cos(a) * h * .86, h + Math.sin(a) * h * .86); g.stroke(); }
  g.fillStyle = '#0c0503'; g.beginPath(); g.arc(h, h, h * .29, 0, TAU); g.fill();
  const sh = g.createLinearGradient(0, 0, 0, S * .5); sh.addColorStop(0, 'rgba(30,12,4,.6)'); sh.addColorStop(1, 'rgba(30,12,4,0)'); g.fillStyle = sh; g.fillRect(0, 0, S, S * .5);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(h - h * .3, h - h * .34, h * .15, h * .12, -.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,240,210,.6)'; g.beginPath(); g.arc(h + h * .3, h + h * .32, h * .07, 0, TAU); g.fill();
  return c;
 }
 // mouth shapes, each in a 128 x 64 cell that covers X -.42 to .42 and Y -.44 to -.64 of the face
 function mouthCanvas() {
  const c = cvs(512, 64), g = c.getContext('2d'), mx = (X) => 64 + X * 152.4, my = (Y) => (-.44 - Y) * 320;
  const lipU = '#7a3428', lipL = '#a64c40', line = '#320e08';
  // 0: a confident half-smile, her left corner (viewer's right) lifted
  g.fillStyle = lipU; g.beginPath(); g.moveTo(mx(-.3), my(-.527)); g.quadraticCurveTo(mx(-.17), my(-.482), mx(-.055), my(-.477)); g.lineTo(mx(0), my(-.492)); g.lineTo(mx(.055), my(-.476));
  g.quadraticCurveTo(mx(.18), my(-.472), mx(.325), my(-.5)); g.quadraticCurveTo(mx(.14), my(-.532), mx(0), my(-.536)); g.quadraticCurveTo(mx(-.14), my(-.537), mx(-.29), my(-.53)); g.fill();
  g.fillStyle = lipL; g.beginPath(); g.moveTo(mx(-.27), my(-.533)); g.quadraticCurveTo(mx(-.14), my(-.543), mx(0), my(-.54)); g.quadraticCurveTo(mx(.15), my(-.535), mx(.3), my(-.508));
  g.quadraticCurveTo(mx(.17), my(-.622), mx(0), my(-.626)); g.quadraticCurveTo(mx(-.17), my(-.624), mx(-.27), my(-.533)); g.fill();
  blob(g, mx(.01), my(-.574), 9, 'rgba(244,176,156,.42)', 2.4);
  g.strokeStyle = line; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx(-.31), my(-.524)); g.quadraticCurveTo(mx(-.14), my(-.546), mx(0), my(-.54)); g.quadraticCurveTo(mx(.17), my(-.532), mx(.335), my(-.495)); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.moveTo(mx(.333), my(-.496)); g.quadraticCurveTo(mx(.36), my(-.5), mx(.37), my(-.485)); g.stroke(); g.beginPath(); g.moveTo(mx(-.31), my(-.524)); g.quadraticCurveTo(mx(-.33), my(-.522), mx(-.34), my(-.512)); g.stroke();
  // 1: gritted teeth
  g.save(); g.translate(128, 0);
  g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, 0, TAU); g.fill();
  g.fillStyle = '#f2e8de'; g.beginPath(); g.ellipse(64, 31, 36, 8.5, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(90,50,40,.7)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(30, 31); g.lineTo(98, 31); g.stroke();
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(64 + i * 9, 23); g.lineTo(64 + i * 9, 39); g.stroke(); }
  g.strokeStyle = lipU; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, PI, TAU); g.stroke();
  g.strokeStyle = lipL; g.lineWidth = 5; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, 0, PI); g.stroke();
  g.restore();
  // 2: open, shouting or hurt
  g.save(); g.translate(256, 0);
  g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, 0, TAU); g.fill();
  g.fillStyle = '#b4505a'; g.beginPath(); g.ellipse(64, 47, 15, 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#f2e8de'; g.fillRect(46, 16, 36, 6);
  g.strokeStyle = lipU; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, PI, TAU); g.stroke();
  g.strokeStyle = lipL; g.lineWidth = 5; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, 0, PI); g.stroke();
  g.restore();
  // 3: closed and pained, the corners pulled down
  g.save(); g.translate(384, 0);
  g.fillStyle = lipU; g.beginPath(); g.moveTo(mx(-.2), my(-.545)); g.quadraticCurveTo(mx(0), my(-.5), mx(.2), my(-.545)); g.quadraticCurveTo(mx(0), my(-.53), mx(-.2), my(-.545)); g.fill();
  g.fillStyle = lipL; g.beginPath(); g.moveTo(mx(-.19), my(-.548)); g.quadraticCurveTo(mx(0), my(-.535), mx(.19), my(-.548)); g.quadraticCurveTo(mx(0), my(-.6), mx(-.19), my(-.548)); g.fill();
  g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(mx(-.22), my(-.556)); g.quadraticCurveTo(mx(0), my(-.528), mx(.22), my(-.556)); g.stroke();
  g.restore();
  return c;
 }
 function hairCanvas() {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 170; i++) { g.fillStyle = rnd() < .55 ? 'rgba(60,12,2,.17)' : 'rgba(255,214,170,.17)'; g.fillRect(0, rnd() * H, W, .6 + rnd() * 1.4); }
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(50,8,2,.4)'); gr.addColorStop(.3, 'rgba(50,8,2,0)'); gr.addColorStop(.8, 'rgba(255,196,130,0)'); gr.addColorStop(1, 'rgba(255,196,130,.32)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
 }
 // cloth atlas: the quilted gambeson and orange waist band round her torso (top half), dark trousers (bottom left), cream linen (bottom right)
 function clothCanvas() {
  const c = cvs(512, 512), g = c.getContext('2d');
  g.fillStyle = '#3c2c24'; g.fillRect(0, 0, 512, 256);
  for (let k = -256; k < 512; k += 14) for (const s of [-1, 1]) { g.strokeStyle = 'rgba(16,8,4,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s * 256, 256); g.stroke(); g.strokeStyle = 'rgba(120,96,80,.2)'; g.beginPath(); g.moveTo(k + 1.5, 0); g.lineTo(k + 1.5 + s * 256, 256); g.stroke(); }
  grain(g, 0, 0, 512, 256, 10);
  const r0 = (1.445 - 1.094) / .625 * 256, r1 = (1.445 - 1.03) / .625 * 256;
  g.fillStyle = '#b44a1c'; g.fillRect(0, r0, 512, r1 - r0); weave(g, 0, r0, 512, r1 - r0, .07);
  g.fillStyle = 'rgba(40,12,4,.35)'; g.fillRect(0, r0, 512, 2); g.fillRect(0, r1 - 2, 512, 2);
  // trousers
  g.fillStyle = '#4a3226'; g.fillRect(0, 256, 256, 256); weave(g, 0, 256, 256, 256, .07);
  for (let i = 0; i < 9; i++) { const x = rnd() * 256, gg = g.createLinearGradient(x - 10, 0, x + 10, 0); gg.addColorStop(0, 'rgba(20,10,6,0)'); gg.addColorStop(.5, 'rgba(20,10,6,.22)'); gg.addColorStop(1, 'rgba(20,10,6,0)'); g.fillStyle = gg; g.fillRect(x - 10, 256, 20, 256); }
  // linen
  g.fillStyle = '#c9b894'; g.fillRect(256, 256, 256, 256);
  for (let i = 0; i < 256; i += 2) { g.fillStyle = 'rgba(120,90,60,.06)'; g.fillRect(256, 256 + i, 256, 1); g.fillRect(256 + i, 256, 1, 256); }
  for (let i = 0; i < 12; i++) { const x = 256 + rnd() * 256, gg = g.createLinearGradient(x - 9, 0, x + 9, 0); gg.addColorStop(0, 'rgba(110,80,50,0)'); gg.addColorStop(.5, 'rgba(110,80,50,.13)'); gg.addColorStop(1, 'rgba(110,80,50,0)'); g.fillStyle = gg; g.fillRect(x - 9, 256, 18, 256); }
  return c;
 }
 const toTorso = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, .5 + uv.getY(i) * .5); return g; };
 const toTrousers = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .5, uv.getY(i) * .5); return g; };
 const toLinen = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 + uv.getX(i) * .5, uv.getY(i) * .5); return g; };
 // the tabard: front panel (left half) with the sun crest and the ornament below it, back panel (right half)
 const TAB = [
  { back: false, top: 1.02, hw0: .094, hw1: .1, Ls: .58, Lt: .66 },
  { back: true, top: 1.03, hw0: .078, hw1: .084, Ls: .53, Lt: .6 }
 ];
 const tabL = (T, u) => lerp(T.Ls, T.Lt, 1 - Math.abs(2 * u - 1));
 function tabardCanvas() {
  const c = cvs(512, 512), g = c.getContext('2d'), gold = '#e8b44c', goldD = '#9a5c16';
  for (let k = 0; k < 2; k++) {
   const T = TAB[k], x0 = k * 256, by = (x) => tabL(T, x / 256) / T.Lt * 512;
   const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#cf5c20'); gr.addColorStop(.7, '#c2501c'); gr.addColorStop(1, '#a8401a');
   g.fillStyle = gr; g.fillRect(x0, 0, 256, 512); weave(g, x0, 0, 256, 512, .06); grain(g, x0, 0, 256, 512, 8);
   const outline = (ins) => { g.beginPath(); g.moveTo(x0 + ins, -2); g.lineTo(x0 + ins, by(ins) - ins * .55); g.lineTo(x0 + 128, by(128) - ins * 1.25); g.lineTo(x0 + 256 - ins, by(256 - ins) - ins * .55); g.lineTo(x0 + 256 - ins, -2); };
   g.lineJoin = 'miter'; g.strokeStyle = gold; g.lineWidth = 13; outline(10); g.stroke();
   g.strokeStyle = 'rgba(255,236,170,.4)'; g.lineWidth = 2; outline(6); g.stroke();
   g.strokeStyle = goldD; g.lineWidth = 1.6; outline(17.5); g.stroke();
   g.strokeStyle = gold; g.lineWidth = 2.6; outline(23); g.stroke();
   if (!k) {
    // the crest: 256 px across 0.2 m, 512 px down 0.66 m, so circles are drawn squashed to 0.6
    const sy = (512 / T.Lt) / (256 / (2 * T.hw1));
    sun(g, x0 + 128, (T.top - .72) / T.Lt * 512, 30, sy, gold, goldD);
    fleur(g, x0 + 128, (T.top - .465) / T.Lt * 512, 74, 1, gold);
   } else fleur(g, x0 + 128, (T.top - .52) / T.Lt * 512, 56, 1, gold);
  }
  return c;
 }
 // the cape: outer side (left half) and lining (right half). u runs across her back, v down from the collar; the texture's
 // v is the drop from 1.46 m so its scale is the same in every column, and the gold hem follows the pointed hem.
 const CT = 1.58, CTOP = 1.46, CLEN = .93;
 const hem = (tp) => .53 + .23 * Math.pow(Math.min(1, Math.abs(tp) / CT), 1.1);
 function capeCanvas() {
  const c = cvs(1024, 512), g = c.getContext('2d'), gold = '#dfa844', goldHi = '#fbd987', goldD = '#8a5a18';
  const hy = (x) => (CTOP - hem(lerp(-CT, CT, x / 512))) / CLEN * 512;
  for (let k = 0; k < 2; k++) {
   const x0 = k * 512;
   const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, k ? '#1a2142' : '#26326a'); gr.addColorStop(1, k ? '#141a36' : '#1e2856');
   g.fillStyle = gr; g.fillRect(x0, 0, 512, 512); weave(g, x0, 0, 512, 512, .05); grain(g, x0, 0, 512, 512, 6);
   for (let i = 0; i < 16; i++) { const x = x0 + rnd() * 512, gg = g.createLinearGradient(x - 22, 0, x + 22, 0); gg.addColorStop(0, 'rgba(6,8,30,0)'); gg.addColorStop(.5, 'rgba(6,8,30,.2)'); gg.addColorStop(1, 'rgba(6,8,30,0)'); g.fillStyle = gg; g.fillRect(x - 22, 0, 44, 512); }
   // gold edging all round: the sides and the pointed hem, with a thin inner line
   const band = (ins, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0 + ins, -4); for (let i = 0; i <= 64; i++) { const x = lerp(ins, 512 - ins, i / 64); g.lineTo(x0 + x, hy(x) - ins); } g.lineTo(x0 + 512 - ins, -4); g.stroke(); };
   band(9, 20, gold); band(4, 2, goldHi); band(27, 3, gold);
   if (k) continue;
   // a large sun between her shoulders: the cape is about 0.53 m across there and 0.93 m long
   sun(g, x0 + 256, (CTOP - 1.19) / CLEN * 512, 44, (512 / CLEN) / (512 / .63), gold, goldD);
   // and the ornament lower down, with smaller ones near the hem corners
   fleur(g, x0 + 256, (CTOP - .74) / CLEN * 512, 120, .9, gold);
   for (const s of [-1, 1]) { g.save(); g.translate(x0 + 256 + s * 150, hy(256 + s * 150) - 58); g.rotate(s * .5); fleur(g, 0, 0, 44, 1, gold); g.restore(); }
  }
  return c;
 }
 // brushed, worn bronze: fine streaks, darker patina and scratches; tinted per part by vertex colour
 function bronzeCanvas() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#e2cfae'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 520; i++) { g.fillStyle = rnd() < .5 ? 'rgba(70,44,18,.08)' : 'rgba(255,244,220,.1)'; g.fillRect(0, rnd() * S, S, .5 + rnd() * 1.3); }
  const wrapB = (x, y, r, col) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) blob(g, x + ox, y + oy, r, col); };
  for (let i = 0; i < 30; i++) wrapB(rnd() * S, rnd() * S, 10 + rnd() * 26, 'rgba(66,46,24,.2)');
  for (let i = 0; i < 10; i++) wrapB(rnd() * S, rnd() * S, 6 + rnd() * 12, 'rgba(56,76,58,.12)');
  for (let i = 0; i < 40; i++) { const x = rnd() * S, y = rnd() * S, a = rnd() * PI, L = 6 + rnd() * 22; g.strokeStyle = rnd() < .6 ? 'rgba(255,246,226,.3)' : 'rgba(50,30,12,.25)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  return c;
 }
 function heightCanvas(W, H, fn, str) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = fn(x, y);
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = h[y * W + (x + 1) % W] - h[y * W + (x + W - 1) % W], dy = h[((y + 1) % H) * W + x] - h[((y + H - 1) % H) * W + x];
   const nx = -dx * str, ny = dy * str, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (.5 / l + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }

 const skinT = tex(skinCanvas()), irisT = tex(irisCanvas()), hairT = tex(hairCanvas()), mouthC = mouthCanvas();
 const clothT = tex(clothCanvas()), tabT = tex(tabardCanvas()), capeT = tex(capeCanvas()), bronzeT = tex(bronzeCanvas(), 2, 2);
 const leatherN = tex(heightCanvas(128, 128, (x, y) => Math.sin(x * .7 + Math.sin(y * .31) * 2) * .3 + Math.sin(y * .9 + x * .13) * .25 + (rnd() - .5) * .5, 1.4), 3, 3);
 const dents = []; for (let i = 0; i < 28; i++) dents.push([rnd() * 128, rnd() * 128, 5 + rnd() * 9]);
 // hammered dents on a tile that wraps: only the nearest copy of each dent can reach a pixel
 const hammerN = tex(heightCanvas(128, 128, (x, y) => { let v = 0; for (const d of dents) { let dx = x - d[0], dy = y - d[1]; dx -= Math.round(dx / 128) * 128; dy -= Math.round(dy / 128) * 128; const r2 = (dx * dx + dy * dy) / (d[2] * d[2]); if (r2 < 1) v -= (1 - r2) * .6; } return v + (rnd() - .5) * .06; }, 1.6), 2, 2);
 const nv2 = (k) => new THREE.Vector2(k, k), GREY = (k) => new THREE.Color(k, k, k);
 const M = {
  skin: std(0xffffff, .58, { map: skinT, vertexColors: true, emissive: 0x2a140a }, .8),
  eye: std(0xffffff, .5, { vertexColors: true, morphTargets: true, emissive: 0x2a140a }, .4),
  iris: std(0xffffff, .3, { map: irisT, emissiveMap: irisT, emissive: 0x7a5a3a }, .2),
  mouth: std(0xffffff, .55, { map: tex(mouthC), transparent: true, depthWrite: false, emissive: 0x2a140c, polygonOffset: true, polygonOffsetFactor: -2 }, 0),
  mouth2: null,
  hair: std(0xffffff, .58, { map: hairT, vertexColors: true, emissive: 0x240a04 }, .9),
  bronze: std(0xffffff, .44, { metalness: .5, map: bronzeT, normalMap: hammerN, normalScale: nv2(.32), vertexColors: true, emissive: 0x261a0c }),
  gold: std(0xf0b448, .3, { metalness: .55, emissive: 0x4c3008 }, 1.2),
  leather: std(0xffffff, .64, { normalMap: leatherN, normalScale: nv2(.55), vertexColors: true, emissive: 0x160a04 }),
  cloth: std(0xffffff, .86, { map: clothT, emissive: GREY(.09), emissiveMap: clothT }),
  tabard: std(0xffffff, .74, { map: tabT, emissive: GREY(.15), emissiveMap: tabT, side: THREE.DoubleSide }),
  cape: std(0xffffff, .8, { map: capeT, emissive: GREY(.2), emissiveMap: capeT }, 1.2),
  lining: std(0xffffff, .72, { map: capeT, emissive: GREY(.14), emissiveMap: capeT, side: THREE.BackSide }),
  steel: std(0xe0a24a, .28, { metalness: .45, emissive: 0x5a2a06 }),
  edge: std(0xffe0a0, .25, { metalness: .2, emissive: 0x000000 }),
  stone: std(0xff9c2a, .15, { emissive: 0xff6a10, emissiveIntensity: .55 }, 0)
 };
 M.mouth2 = M.mouth.clone(); M.mouth2.map = M.mouth.map.clone(); M.mouth2.map.needsUpdate = true;

 // ---------- geometry helpers ----------
 const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
 const YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
 function mkGeo(P, U, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); return g;
 }
 // parametric grid surface; f(u, v, out). wrap welds the u seam normals.
 function surf(nu, nv, f, wrap, flip) {
  const P = [], U = [], I = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); P.push(o[0], o[1], o[2]); U.push(u, 1 - v); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
  }
  const g = mkGeo(P, U, I);
  if (wrap) {
   const n = g.attributes.normal;
   for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1), b = a + nu;
    _v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, _v.x, _v.y, _v.z); n.setXYZ(b, _v.x, _v.y, _v.z);
   }
  }
  return g;
 }
 // profile [[r, y], ...] listed top to bottom; angle 0 faces +Z
 function lathe(prof, segs, o) {
  o = o || {};
  const cx = o.cx || 0, cz = o.cz || 0, n = prof.length - 1;
  const out = [0, 0, 0];
  return surf(segs, n * (o.sub || 1), (u, v, p) => {
   const k = v * n, i = Math.min(n - 1, Math.floor(k)), f = k - i;
   const r = lerp(prof[i][0], prof[i + 1][0], f * f * (3 - 2 * f)), y = lerp(prof[i][1], prof[i + 1][1], f), a = lerp(-PI, PI, u);
   out[0] = cx + Math.sin(a) * r; out[1] = y; out[2] = cz + Math.cos(a) * r;
   if (o.fn) o.fn(out, a, v, r);
   p[0] = out[0]; p[1] = out[1]; p[2] = out[2];
  }, true);
 }
 // tube along a Catmull-Rom curve; rFn(t) radius, flat squashes the side facing upFn(point)
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
 function tube(pts, ns, nr, rFn, flat, upFn, twist) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const P = [], U = [], I = [];
  for (let i = 0; i <= ns; i++) {
   const t = i / ns; cv.getPointAt(t, _c); cv.getTangentAt(t, _t);
   if (upFn) upFn(_c, _n, t); else _n.set(0, 0, 1);
   _n.addScaledVector(_t, -_n.dot(_t)); if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x); _n.normalize();
   _b.crossVectors(_t, _n).normalize();
   const r = rFn(t), tw = twist ? twist * t : 0;
   for (let j = 0; j <= nr; j++) {
    const a = j / nr * TAU + tw, ca = Math.cos(a), sa = Math.sin(a);
    P.push(_c.x + (_n.x * ca * flat + _b.x * sa) * r, _c.y + (_n.y * ca * flat + _b.y * sa) * r, _c.z + (_n.z * ca * flat + _b.z * sa) * r);
    U.push(t, j / nr);
   }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + 1, c = a + nr + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = mkGeo(P, U, I);
  const nm = g.attributes.normal;
  for (let i = 0; i <= ns; i++) { const a = i * (nr + 1), b = a + nr; _v.set(nm.getX(a) + nm.getX(b), nm.getY(a) + nm.getY(b), nm.getZ(a) + nm.getZ(b)).normalize(); nm.setXYZ(a, _v.x, _v.y, _v.z); nm.setXYZ(b, _v.x, _v.y, _v.z); }
  return g;
 }
 // closed thin plate from a surface f(u, v, out): outer face, inner face offset by th, and rims
 function slab(nu, nv, f, th, inset) {
  const P = [], U = [], I = [], o = [0, 0, 0], o2 = [0, 0, 0], N = [];
  const e = 1e-3;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, v = j / nv; f(u, v, o);
   f(Math.min(1, u + e), v, o2); const du = [o2[0] - o[0], o2[1] - o[1], o2[2] - o[2]]; if (u + e > 1) { f(u - e, v, o2); du[0] = o[0] - o2[0]; du[1] = o[1] - o2[1]; du[2] = o[2] - o2[2]; }
   f(u, Math.min(1, v + e), o2); const dv = [o2[0] - o[0], o2[1] - o[1], o2[2] - o[2]]; if (v + e > 1) { f(u, v - e, o2); dv[0] = o[0] - o2[0]; dv[1] = o[1] - o2[1]; dv[2] = o[2] - o2[2]; }
   _v.set(du[0], du[1], du[2]); _v2.set(dv[0], dv[1], dv[2]); _v.cross(_v2).normalize();
   const k = inset ? inset(u, v) : 1;
   P.push(o[0], o[1], o[2]); N.push(_v.x * th * k, _v.y * th * k, _v.z * th * k); U.push(u, 1 - v);
  }
  const n0 = P.length / 3;
  for (let k = 0; k < n0; k++) { P.push(P[k * 3] - N[k * 3], P[k * 3 + 1] - N[k * 3 + 1], P[k * 3 + 2] - N[k * 3 + 2]); U.push(U[k * 2], U[k * 2 + 1]); }
  const id = (i, j) => j * (nu + 1) + i;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
   I.push(a, b, c, b, d, c); I.push(a + n0, c + n0, b + n0, b + n0, c + n0, d + n0);
  }
  const g = mkGeo(P, U, I);
  // rims as separate quads so plate edges read as thick
  const R = [], RU = [], RI = [];
  const edge = (list) => {
   const base = R.length / 3;
   for (const k of list) { R.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2], P[(k + n0) * 3], P[(k + n0) * 3 + 1], P[(k + n0) * 3 + 2]); RU.push(0, 0, 0, 1); }
   for (let q = 0; q < list.length - 1; q++) { const a = base + q * 2; RI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const top = [], bot = [], lef = [], rig = [];
  for (let i = 0; i <= nu; i++) { top.push(id(i, 0)); bot.push(id(nu - i, nv)); }
  for (let j = 0; j <= nv; j++) { rig.push(id(nu, j)); lef.push(id(0, nv - j)); }
  edge(top); edge(rig); edge(bot); edge(lef);
  const rg = mkGeo(R, RU, RI);
  return mergeGeos([g, rg]);
 }
 function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, vo * 2);
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.setIndex(new THREE.BufferAttribute(I, 1)); return g;
 }
 const dummy = new THREE.Object3D();
 function place(geo, p, r, s, q) {
  if (!p && !r && !s && !q) return geo;
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (q) dummy.quaternion.copy(q); else dummy.rotation.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0, r && r[3] ? r[3] : 'XYZ');
  if (s === undefined || s === null) dummy.scale.set(1, 1, 1); else if (typeof s === 'number') dummy.scale.set(s, s, s); else dummy.scale.set(s[0], s[1], s[2]);
  dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix); return g;
 }
 // quaternion that turns +Y toward d (for orienting cylinders and plates along a direction)
 const qY = (d) => new THREE.Quaternion().setFromUnitVectors(YA, _v.set(d[0], d[1], d[2]).normalize());
 function seg(mat, w, a, b, r0, r1, rs, caps) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, true), mat, w, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, qY(d));
  if (caps) { add(new THREE.SphereGeometry(r0, rs, Math.max(4, rs >> 1)), mat, w, a); add(new THREE.SphereGeometry(r1, rs, Math.max(4, rs >> 1)), mat, w, b); }
 }

 // ---------- skinned buckets: pieces are weighted, tinted, then merged per material into one SkinnedMesh ----------
 // TINT (an [r, g, b] or a function of the vertex) colours what add() takes next, for materials that use vertex colours.
 const BUCK = new Map();
 let TINT = null;
 const tinted = (col, fn) => { const was = TINT; TINT = col; fn(); TINT = was; };
 function add(geo, mat, w, p, r, s, q) {
  const g = place(geo, p, r, s, q);
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  if (typeof w === 'number') for (let i = 0; i < n; i++) { si[i * 4] = w; sw[i * 4] = 1; }
  else for (let i = 0; i < n; i++) {
   let inf = w(pos.getX(i), pos.getY(i), pos.getZ(i), i);
   if (inf.length > 1) { inf = inf.filter((e) => e[1] > 1e-4); if (inf.length > 4) inf = inf.sort((x, y) => y[1] - x[1]).slice(0, 4); }
   let tot = 0; for (const e of inf) tot += e[1];
   if (!tot) { si[i * 4] = 0; sw[i * 4] = 1; continue; }
   for (let k = 0; k < inf.length; k++) { si[i * 4 + k] = inf[k][0]; sw[i * 4 + k] = inf[k][1] / tot; }
  }
  let col = null;
  if (TINT) { col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const c = typeof TINT === 'function' ? TINT(pos.getX(i), pos.getY(i), pos.getZ(i), i) : TINT; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } }
  let L = BUCK.get(mat); if (!L) BUCK.set(mat, (L = []));
  L.push({ g, si, sw, col });
 }
 function buildSkinned(parent, skeleton, list) {
  for (const [mat, L] of BUCK) {
   const geo = mergeGeos(L.map((e) => e.g));
   const nv = geo.attributes.position.count, SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
   let o = 0; for (const e of L) { SI.set(e.si, o); SW.set(e.sw, o); o += e.si.length; }
   geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
   geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
   if (L.some((e) => e.col)) { const C = new Float32Array(nv * 3).fill(1); let q = 0; for (const e of L) { if (e.col) C.set(e.col, q); q += e.g.attributes.position.count * 3; } geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); mat.vertexColors = true; }
   geo.computeBoundingSphere();
   mat.skinning = true;
   const m = new THREE.SkinnedMesh(geo, mat); m.frustumCulled = false;
   if (mat.transparent) m.renderOrder = 2;
   parent.add(m); m.bind(skeleton); list.push(m);
  }
  BUCK.clear();
 }

 // ---------- skeleton (54 bones) ----------
 const root = new THREE.Group(); root.name = 'Sol';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const pelvis = bone('pelvis', root, 0, .97, 0);
 const spine = bone('spine', pelvis, 0, .11, 0);
 const chest = bone('chest', spine, 0, .15, 0);
 const neck = bone('neck', chest, 0, .195, -.008);
 const head = bone('head', neck, 0, .095, .008);
 const braid = [];
 { let p = head; const off = [[0, .085, -.098], [0, -.075, -.05], [0, -.096, -.012], [0, -.096, -.004], [0, -.096, 0], [0, -.096, 0]];
  for (let i = 0; i < 6; i++) { p = bone('braid' + i, p, off[i][0], off[i][1], off[i][2]); braid.push(p); } }
 const TUFT = ['tuftR', 'tuftL', 'tuftF', 'tuftC'];
 const tufts = [bone('tuftR', head, -.088, .1, .005), bone('tuftL', head, .088, .1, .005), bone('tuftF', head, .0, .19, .07), bone('tuftC', head, .0, .21, -.06)];
 const arms = [], elbows = [], wrists = [], fing = [], thumb = [];
 for (const sd of [-1, 1]) {
  const s = bone('shoulder' + sd, chest, .195 * sd, .165, -.01);
  const e = bone('elbow' + sd, s, 0, -.285, 0);
  const w = bone('wrist' + sd, e, 0, -.255, 0);
  const f1 = bone('fing1' + sd, w, -sd * .004, -.088, 0), f2 = bone('fing2' + sd, f1, 0, -.045, 0), f3 = bone('fing3' + sd, f2, 0, -.03, 0);
  const t1 = bone('thumb1' + sd, w, -sd * .006, -.032, .03), t2 = bone('thumb2' + sd, t1, 0, -.036, .008);
  arms.push(s); elbows.push(e); wrists.push(w); fing.push([f1, f2, f3]); thumb.push([t1, t2]);
 }
 const pauld = bone('pauld', arms[1], .04, .035, 0);
 const legs = [], knees = [], ankles = [], toes = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, .095 * sd, -.06, 0);
  const k = bone('knee' + sd, h, 0, -.415, .008);
  const a = bone('ankle' + sd, k, 0, -.41, -.012);
  const t = bone('toe' + sd, a, 0, -.06, .135);
  legs.push(h); knees.push(k); ankles.push(a); toes.push(t);
 }
 const tabF = [bone('tabF1', pelvis, 0, .04, .128)]; tabF.push(bone('tabF2', tabF[0], 0, -.25, .012));
 const tabB = [bone('tabB1', pelvis, 0, .03, -.132)]; tabB.push(bone('tabB2', tabB[0], 0, -.22, -.012));
 root.updateMatrixWorld(true);
 const bw = (b) => { b.getWorldPosition(_v); return [_v.x, _v.y, _v.z]; };
 const HW = bw(head);

 // ---------- skin weight functions (bind pose, world space) ----------
 function wTorso(x, y) {
  let w;
  if (y > 1.17) { const t = sm(1.17, 1.27, y); w = [[BI.spine, 1 - t], [BI.chest, t]]; }
  else if (y > 1.0) { const t = sm(1.0, 1.1, y); w = [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  else w = [[BI.pelvis, 1]];
  const ax = Math.abs(x);
  if (y > 1.24 && ax > .11) { const k = sm(.11, .17, ax) * sm(1.24, 1.36, y) * .45; for (const e of w) e[1] *= 1 - k; w.push([BI['shoulder' + (x < 0 ? -1 : 1)], k]); }
  return w;
 }
 function wNeck(x, y) {
  if (y < 1.45) { const t = sm(1.4, 1.45, y); return [[BI.chest, 1 - t], [BI.neck, t]]; }
  const t = sm(1.5, 1.55, y); return [[BI.neck, 1 - t], [BI.head, t]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd], A = BI['ankle' + sd];
  if (y > .84) { const t = sm(.97, .86, y); return [[BI.pelvis, 1 - t], [H, t]]; }
  if (y > .44) { const t = sm(.55, .45, y); return [[H, 1 - t], [K, t]]; }
  const t = sm(.13, .07, y); return [[K, 1 - t], [A, t]];
 }
 function wFoot(x, y, z) {
  const sd = x < 0 ? -1 : 1, K = BI['knee' + sd], A = BI['ankle' + sd], T = BI['toe' + sd];
  const tk = sm(.1, .15, y), tt = sm(.085, .15, z);
  return [[K, tk], [A, (1 - tk) * (1 - tt)], [T, (1 - tk) * tt]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd], Wr = BI['wrist' + sd];
  if (y > 1.36) { const t = sm(1.46, 1.37, y); return [[BI.chest, (1 - t) * .6], [S, 1 - (1 - t) * .6]]; }
  if (y > 1.155) return [[S, 1]];
  if (y > 1.06) { const t = sm(1.155, 1.07, y); return [[S, 1 - t], [E, t]]; }
  if (y > .875) return [[E, 1]];
  const t = sm(.875, .85, y); return [[E, 1 - t], [Wr, t]];
 }
 // weights along a bone chain: nearest segment, blended across joints
 function wChain(names, pts, parent, rootK) {
  const idx = names.map((n) => BI[n]), P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), pb = parent ? BI[parent] : -1;
  const A = new THREE.Vector3(), D = new THREE.Vector3(), X = new THREE.Vector3();
  return (x, y, z) => {
   X.set(x, y, z); let best = 1e9, bi = 0, bt = 0;
   for (let i = 0; i < idx.length; i++) {
    D.subVectors(P[i + 1], P[i]); const L2 = D.lengthSq(), t = A.subVectors(X, P[i]).dot(D) / L2;
    const d = A.copy(P[i]).addScaledVector(D, cl(t, 0, 1)).distanceToSquared(X);
    if (d < best) { best = d; bi = i; bt = t; }
   }
   if (bi === 0 && bt < .3 && pb >= 0) { const k = sm(.3, -.15, bt) * (rootK || .6); return [[pb, k], [idx[0], 1 - k]]; }
   if (bt < .3 && bi > 0) { const k = sm(.3, 0, bt) * .5; return [[idx[bi - 1], k], [idx[bi], 1 - k]]; }
   if (bt > .7 && bi < idx.length - 1) { const k = sm(.7, 1, bt) * .5; return [[idx[bi], 1 - k], [idx[bi + 1], k]]; }
   return [[idx[bi], 1]];
  };
 }

 // ---------- head: a sculpted egg; X and Y (-1.1 to 1.1) are both its front view and the face texture ----------
 const HC = [0, 1.632, .008], HR = [.078, .12, .096];
 const xSq = (Y) => 1 - .1 * sm(-.05, -.95, Y) + .05 * G2(0, Y + .5, 1, .2); // a round face: the lower face kept full, the jaw soft
 function faceD(X, Y) {
  let d = 0;
  for (const s of [-1, 1]) {
   d -= .085 * G2(X - s * .37, Y - .04, .15, .1);       // eye sockets
   d += .04 * G2(X - s * .36, Y - .19, .22, .06);       // brow ridge
   d += .055 * G2(X - s * .55, Y + .12, .19, .13);      // cheekbones
   d += .034 * G2(X - s * .45, Y + .3, .2, .15);        // full, round cheeks, lifted by her smile
   d += .03 * G2(X - s * .12, Y + .37, .055, .045);     // the wings of the nose
   d -= .012 * G2(X - s * .32, Y + .5, .05, .11);       // smile lines
   d -= .009 * G2(X - s * .31, Y + .515 - (s > 0 ? .024 : .008), .035, .032); // the corners of her half-smile, her left one higher
  }
  d += .012 * G2(X, Y - .14, .1, .07);                                           // between the brows, kept low: no bulb at the bridge
  d += Math.exp(-X * X / .0075) * win(Y, -.34, .05, .05) * (.05 + .15 * sm(.04, -.3, Y)); // a straight nose
  d += .078 * G2(X, Y + .32, .1, .065); d -= .018 * G2(X, Y + .41, .07, .03);   // its rounded tip, and under it
  d += .034 * G2(X, Y + .48, .27, .042); d += .045 * G2(X, Y + .585, .23, .048);  // full lips
  d -= .022 * G2(X, Y + .533, .3, .016); d -= .022 * G2(X, Y + .69, .2, .04);    // the mouth line, under the lip
  d += .06 * G2(X, Y + .82, .23, .1);                                            // chin
  return d;
 }
 // head point from a direction on the unit sphere, in head units; the jaw is shortened so her chin sits at Y = -.86
 const yJ = (Y0) => (Y0 < 0 ? Y0 * (1 - .14 * Y0 * Y0) : Y0);
 const yJinv = (Y) => { if (Y >= 0) return Y; let y = Y; for (let i = 0; i < 5; i++) y -= (y * (1 - .14 * y * y) - Y) / (1 - .42 * y * y); return y; };
 function headU(X0, Y0, Z0, o) {
  const Y = yJ(Y0), X = X0 * xSq(Y);
  let Z = Z0 > 0 ? Z0 * (1 - .08 * sm(-.05, -.95, Y)) : Z0 * 1.08;
  // the lower face is brought forward from the sphere so her mouth and chin sit under her brow in profile
  if (Z > 0) Z += Math.exp(-X * X / .3) * .8 * Math.max(0, .95 - Math.sqrt(Math.max(0, 1 - Y * Y))) * sm(-.1, -.5, Y) * sm(0, .5, Z0);
  if (Z > 0) Z += faceD(X, Y) * sm(0, .35, Z);
  o[0] = X; o[1] = Y; o[2] = Z; return o;
 }
 const _hu = [0, 0, 0];
 const headW = (o, out) => out.set(HC[0] + o[0] * HR[0], HC[1] + o[1] * HR[1], HC[2] + o[2] * HR[2]);
 // the face point whose front view is (X, Y), and the way it faces
 function faceAt(X, Y, off) {
  const P = (x, y, out) => { const y0 = yJinv(y), x0 = x / xSq(y), z0 = Math.sqrt(Math.max(0, 1 - x0 * x0 - y0 * y0)); return headW(headU(x0, y0, z0, _hu), out); };
  const p = P(X, Y, new THREE.Vector3()), px = P(X + 1e-3, Y, new THREE.Vector3()), py = P(X, Y + 1e-3, new THREE.Vector3());
  const n = new THREE.Vector3().crossVectors(px.sub(p), py.sub(p)).normalize(); if (n.z < 0) n.negate();
  if (off) p.addScaledVector(n, off);
  return { p, n };
 }
 const PLAIN = [.985, .985]; // the clean skin swatch in the atlas
 const plainUV = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, PLAIN[0], PLAIN[1]); return g; };
 {
  const g = surf(Q(72, 36), Q(54, 28), (u, v, o) => { const th = (u - .5) * TAU, ph = v * PI; headU(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th), o); o[0] = HC[0] + o[0] * HR[0]; o[1] = HC[1] + o[1] * HR[1]; o[2] = HC[2] + o[2] * HR[2]; }, true);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { let X = (p.getX(i) - HC[0]) / HR[0]; const Y = (p.getY(i) - HC[1]) / HR[1]; if (p.getZ(i) < HC[2]) X = (X < 0 ? -1 : 1) * 1.07; uv.setXY(i, (cl(X, -1.08, 1.08) / 1.1 * .5 + .5) * .5, Y / 1.1 * .5 + .5); }
  add(g, M.skin, BI.head);
 }
 // a strong neck, shaded under the jaw
 tinted((x, y) => { const k = 1 - .22 * sm(1.47, 1.53, y); return [k, k * .97, k * .95]; }, () => add(plainUV(lathe([[.05, 1.57], [.054, 1.5], [.058, 1.45], [.066, 1.405]], Q(20), { cz: -.01, sub: 2 })), M.skin, wNeck));
 // ears, with gold hoops
 for (const sd of [-1, 1]) {
  const ph = PI / 2 + .1, th = sd * 1.64; headU(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th), _hu);
  const e = [HC[0] + _hu[0] * HR[0], HC[1] + _hu[1] * HR[1], HC[2] + _hu[2] * HR[2]], q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * .3, sd * .1));
  const L = (v) => [e[0] + v[0], e[1] + v[1], e[2] + v[2]];
  tinted([.86, .8, .77], () => {
   add(plainUV(new THREE.SphereGeometry(1, Q(12), Q(10))), M.skin, BI.head, L([sd * .002, -.002, -.006]), null, [.0065, .019, .012], q);
   add(plainUV(new THREE.TorusGeometry(.0125, .0032, Q(6), Q(14), PI * 1.15)), M.skin, BI.head, L([sd * .005, .002, -.008]), [0, sd * PI / 2 + sd * .3, PI * .05]);
   add(plainUV(new THREE.SphereGeometry(.006, Q(8), Q(6))), M.skin, BI.head, L([sd * .006, -.017, -.001]));
  });
  tinted([.62, .4, .32], () => add(plainUV(new THREE.SphereGeometry(1, Q(10), Q(8))), M.skin, BI.head, L([sd * .0085, .002, -.003]), null, [.003, .013, .008], q));
  add(new THREE.TorusGeometry(.0098, .0017, Q(5), Q(18)), M.gold, BI.head, L([sd * .0075, -.03, .002]), [0, PI / 2 + sd * .55, 0]);
 }

 // ---------- face: eyes with real lids, brows, painted mouth shapes ----------
 const face = new THREE.Group(); head.add(face);
 const SX = .0178, SY = .0116, SZ = .0078, IRX = .0079, IRY = .0082;
 const EF = [-1, 1].map((sd) => {
  const { p, n } = faceAt(sd * .37, .045);
  const zA = n.clone().lerp(ZA, .5).normalize(), xA = new THREE.Vector3().crossVectors(YA, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
  const o = p.clone().addScaledVector(zA, -SZ * .55);
  return { sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(o.x - HW[0], o.y - HW[1], o.z - HW[2]) };
 });
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 // irises: one mesh, its vertices re-seated on the eyeball when the gaze moves
 const ir = { base: null, g: null, nper: 0, ox: [9, 9], oy: [9, 9] };
 {
  const rg = new THREE.RingGeometry(0, 1, Q(28, 12), 4), gs = [EF[0], EF[1]].map(() => rg.clone()); ir.nper = rg.attributes.position.count;
  ir.base = Float32Array.from(rg.attributes.position.array);
  ir.g = mergeGeos(gs); face.add(new THREE.Mesh(ir.g, M.iris));
  const nm = ir.g.attributes.normal;
  for (let e = 0; e < 2; e++) { _v.setFromMatrixColumn(EF[e].m, 2).normalize(); for (let i = 0; i < ir.nper; i++) nm.setXYZ(e * ir.nper + i, _v.x, _v.y, _v.z); }
 }
 function setGaze(ox, oy) {
  const p = ir.g.attributes.position;
  for (let e = 0; e < 2; e++) {
   if (Math.abs(ox - ir.ox[e]) < 1e-5 && Math.abs(oy - ir.oy[e]) < 1e-5) continue;
   ir.ox[e] = ox; ir.oy[e] = oy;
   for (let i = 0; i < ir.nper; i++) {
    const X = ir.base[i * 3] * IRX + ox, Y = ir.base[i * 3 + 1] * IRY + oy;
    _v.set(X, Y, zS(X, Y) + .0003).applyMatrix4(EF[e].m); p.setXYZ(e * ir.nper + i, _v.x, _v.y, _v.z);
   }
  }
  p.needsUpdate = true;
 }
 // eye whites, lids and lashes, and brows in one vertex-coloured mesh: morph 0 closes the lids, morph 1 knits the brows
 let eyeMesh;
 {
  const P = [], PB = [], PF = [], C = [], I = [];
  const V = (b, k, f, col) => { P.push(b.x, b.y, b.z); PB.push(k.x, k.y, k.z); PF.push(f.x, f.y, f.z); C.push(col[0], col[1], col[2]); };
  for (const f of EF) {
   const g = new THREE.SphereGeometry(1, Q(20), Q(14)); g.scale(SX, SY, SZ);
   const p = g.attributes.position, b0 = P.length / 3;
   for (let i = 0; i < p.count; i++) { const k = 1.3 - .32 * sm(.5, 1, Math.abs(p.getX(i)) / SX) - .3 * sm(.1, SY, p.getY(i)); _v.fromBufferAttribute(p, i).applyMatrix4(f.m); V(_v, _v, _v, [k, k * .96, k * .92]); }
   for (let k = 0; k < g.index.count; k++) I.push(g.index.array[k] + b0);
  }
  const skin = [.64, .4, .27], crease = [.36, .18, .11], lash = [.05, .025, .02], lowL = [.36, .19, .13], under = [.72, .47, .32];
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const _a = new THREE.Vector3(), _k = new THREE.Vector3();
  const put = (f, x, y, yc, zl, col) => {
   const z = Math.max(zS(x, y) + .0009, .0024) + zl, zc = Math.max(zS(x, yc) + .0009, .0024) + zl;
   _a.set(x, y, z).applyMatrix4(f.m); _k.set(x, yc, zc).applyMatrix4(f.m); V(_a, _k, _a, col);
  };
  const grid = (nx, ny, fn, flip) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; if (flip) I.push(a, a + 1, c, a + 1, c + 1, c); else I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd;
   const yE = (x) => SY * (.62 - .44 * x * x + .13 * x * sd), yC = (x) => SY * (-.5 + .22 * x * x), yT = (x) => SY * (1.45 - .3 * x * x);
   grid(Q(12, 8), 5, (s, r) => { const x = lerp(-1.15, 1.15, s); put(f, x * SX, lerp(yT(x), yE(x), r), lerp(yT(x), yC(x), r), 0, mix3(skin, crease, sm(.3, 1, r))); });
   // the lash line, dark and a little winged at the outer corner
   grid(Q(16, 8), 2, (s, r) => {
    const o = lerp(-1.04, 1.3, s), x = o * sd, xc = Math.min(1, Math.abs(o)) * Math.sign(x), wing = Math.max(0, o - .98);
    const th = .0034 * (o > .85 ? Math.max(.2, 1 - (o - .85) / .5) : 1) * (o < -.85 ? .5 : 1);
    const y0 = o <= .98 ? yE(x) : yE(xc) + wing * .024, y1 = o <= .98 ? yC(x) : yC(xc) - wing * .005;
    put(f, o > .98 ? xc * SX + sd * wing * SX * .85 : x * SX, y0 - r * th, y1 - r * th * .7, .001, lash);
   }, sd < 0);
   grid(Q(12, 6), 1, (s, r) => { const o = lerp(-.8, .97, s), x = o * sd, y = -SY * (.7 - .32 * x * x) - r * .0009; put(f, x * SX, y, y, .0006, mix3(lash, lowL, .55)); }, sd < 0);
   grid(Q(12, 6), 3, (s, r) => { const x = lerp(-1.12, 1.12, s), y0 = -SY * (.7 - .32 * x * x) - .0009, y = lerp(y0, -SY * 1.4, r); put(f, x * SX, y, y, 0, lowL.map((c, i) => lerp(c, under[i], sm(0, 1, r)))); });
  }
  // brows: thick, dark and defined, a little arched toward the tail
  const browPts = (sd, k) => [[.12 - .015 * k, .18 - .03 * k], [.29 - .01 * k, .218 - .012 * k], [.46, .226 + .004 * k], [.63, .175 + .006 * k]].map(([x, y]) => { const p = faceAt(sd * x, y, .0034).p; return [p.x - HW[0], p.y - HW[1], p.z - HW[2]]; });
  const browUp = (c, n) => n.set(c.x - HC[0] + HW[0], c.y - HC[1] + HW[1], c.z - HC[2] + HW[2]);
  for (const sd of [-1, 1]) {
   const g0 = tube(browPts(sd, 0), Q(12, 6), Q(6, 4), (t) => .0054 * Math.pow(1 - t, .55) + .0012, .4, browUp), g1 = tube(browPts(sd, 1), Q(12, 6), Q(6, 4), (t) => .0054 * Math.pow(1 - t, .55) + .0012, .4, browUp);
   const b0 = P.length / 3, p0 = g0.attributes.position, p1 = g1.attributes.position;
   for (let i = 0; i < p0.count; i++) { _a.fromBufferAttribute(p0, i); _k.fromBufferAttribute(p1, i); V(_a, _a, _k, [.2, .1, .06]); }
   for (let k = 0; k < g0.index.count; k++) I.push(g0.index.array[k] + b0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  g.setIndex(I); g.computeVertexNormals();
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(PB, 3), new THREE.Float32BufferAttribute(PF, 3)];
  eyeMesh = new THREE.Mesh(g, M.eye); eyeMesh.morphTargetInfluences = [0, 0]; face.add(eyeMesh);
 }
 {
  const g = surf(Q(12, 6), Q(5, 3), (u, v, o) => { const p = faceAt(lerp(-.42, .42, u), lerp(-.44, -.64, v), .0011).p; o[0] = p.x - HW[0]; o[1] = p.y - HW[1]; o[2] = p.z - HW[2]; });
  for (const mat of [M.mouth, M.mouth2]) { mat.map.repeat.set(.25, 1); const m = new THREE.Mesh(g, mat); m.renderOrder = 3; face.add(m); }
 }

 // ---------- hair: copper, short and tousled, full on top, swept from a part on her right; her ears show ----------
 const HAIRC = [[.5, .18, .08], [.57, .22, .1], [.43, .15, .065], [.63, .27, .12], [.52, .2, .09]];
 const tmpS = [0, 0, 0];
 function scalpPt(az, el, off) {
  const ph = PI / 2 - cl(el, -1.25, 1.565); headU(Math.sin(ph) * Math.sin(az), Math.cos(ph), Math.sin(ph) * Math.cos(az), tmpS);
  const x = tmpS[0] * HR[0], y = tmpS[1] * HR[1] + .004, z = tmpS[2] * HR[2], L = Math.hypot(x, y, z), k = (L + off) / L;
  return [HC[0] + x * k, HC[1] + y * k, HC[2] + z * k];
 }
 {
  const elMin = (az) => { const a = Math.abs(az); return a < 1.0 ? lerp(.55, .34, sm(.3, 1.0, a)) : a < 1.5 ? .28 : lerp(.28, -.62, sm(1.5, 2.05, a)); };
  tinted([.34, .11, .045], () => add(surf(Q(48, 24), Q(16, 8), (u, v, o) => { const az = lerp(-PI, PI, u), p = scalpPt(az, lerp(PI / 2, elMin(az), v), .005); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, true), M.hair, BI.head));
 }
 const HUP = (c, n) => n.set(c.x - HC[0], c.y - HC[1] + .02, c.z - HC[2]);
 function lock(az0, el0, az1, el1, o) {
  const n = 7, pts = [];
  for (let i = 0; i <= n; i++) {
   const t = i / n, az = lerp(az0, az1, t) + (o.bend || 0) * Math.sin(PI * t), el = lerp(el0, el1, t) + (o.arc || 0) * Math.sin(PI * t);
   pts.push(scalpPt(az, el, lerp(o.r0 === undefined ? -.003 : o.r0, (o.r1 === undefined ? .025 : o.r1) * .7, t) + (o.bulge || 0) * .58 * Math.sin(PI * Math.min(1, t * 1.15))));
  }
  if (o.flick) { const f = o.flick; for (const [i, k] of [[n, .55], [n - 1, .22], [n - 2, .05]]) { pts[i][0] += f[0] * k; pts[i][1] += f[1] * k; pts[i][2] += f[2] * k; } }
  // wispy: every lock is slimmer than its listed width and tapers to a fine point
  const ns = Q(o.seg || 14, 7), nr = Q(o.rs || 6, 5), w0 = (o.w || .038) * .74, tp = o.taper || .62;
  const g = tube(pts, ns, nr, (t) => w0 * Math.pow(1 - t, tp) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 2))) + .0006, o.flat || .42, HUP);
  const tf = o.tuft === undefined ? -1 : o.tuft, amt = o.amt || .8;
  tinted(o.col || HAIRC[(rnd() * HAIRC.length) | 0], () => add(g, M.hair, tf < 0 ? BI.head : (x, y, z, i) => { const k = amt * sm(.12, 1, Math.floor(i / (nr + 1)) / ns); return [[BI.head, 1 - k], [BI[TUFT[tf]], k]]; }));
 }
 const out = (az, k, up) => [Math.sin(az) * k, up || 0, Math.cos(az) * k];
 // crown: three rings sweeping out and down, the side locks stopping above the ears, tips curling out
 const elEnd = (a) => a < 1.25 ? lerp(.46, .4, sm(.7, 1.25, a)) : a < 1.9 ? .4 : lerp(.3, -.32, sm(1.9, PI, a));
 [[21, 1.1, .03, .05, .044], [18, 1.32, .038, .05, .042], [9, 1.46, .05, .03, .038]].forEach(([N, el0, r1, bul, w], ring) => {
  for (let k = 0; k < N; k++) {
   const az = -PI + (k + .5 + ring * .33) / N * TAU + (rnd() - .5) * .12, a = Math.abs(az);
   if (a < .75 && ring < 2) continue;
   lock(az, el0, az + (rnd() - .5) * .35, elEnd(a) + ring * .14, { r1, bulge: bul, w: w * (.9 + rnd() * .25), flick: out(az, .014, .01 + rnd() * .01), tuft: a > 2.2 ? 3 : -1 });
  }
 });
 // the fringe: swept from the part over her right eye across her forehead toward her left temple
 for (let k = 0; k < 9; k++) {
  const t = k / 8, az0 = lerp(-.52, -.28, t) + (rnd() - .5) * .05, el0 = lerp(.9, 1.24, t);
  lock(az0, el0, az0 + lerp(.6, 1.1, t), lerp(.18, .38, t), { w: .036 + .006 * Math.sin(PI * t), r1: .013 + .012 * t, bulge: .022 + .012 * t, arc: .12, bend: .06, flick: [.006, -.002, .008], tuft: 2, amt: .55, flat: .42 });
 }
 // strands falling on the part side, by her right temple
 lock(-.58, .95, -.84, .32, { w: .03, r1: .016, bulge: .016, arc: .06, flick: [-.006, -.004, .008], tuft: 2, amt: .5 });
 lock(-.7, .9, -1.02, .38, { w: .03, r1: .018, bulge: .016, flick: [-.008, -.002, .006], tuft: 0, amt: .5 });
 lock(-.42, 1.0, -.5, .3, { w: .026, r1: .012, bulge: .012, flick: [0, -.004, .01], tuft: 2, amt: .5 });
 lock(-.34, 1.2, -.08, .66, { w: .038, r1: .046, bulge: .02, flick: [0, .016, .016], tuft: 2 });
 lock(.04, 1.26, .3, .66, { w: .038, r1: .046, bulge: .02, flick: [.01, .018, .014], tuft: 2 });
 // sides: short, tousled, cut above the ears; her left side carries more of the sweep
 for (const sd of [-1, 1]) {
  const L = sd > 0 ? 1 : 0; // [az0, el0, az1, el1, width, tip lift, bulge, flick out, up, forward]
  for (const h of [[.92, .7, 1.08, .3 - .06 * L, .034, .02, .018, .012, -.004, .012], [1.18, .78, 1.36, .36 - .05 * L, .042, .042, .032, .026, .008, .006], [1.46, .8, 1.58, .12, .046, .03, .03, .02, .002, -.004], [1.32, .62, 1.5, .22, .036, .016, .016, .01, -.002, .002],
   [1.84, .68, 2.02, .02, .04, .032, .024, .02, -.004, -.01], [2.16, .6, 2.3, -.24, .04, .032, .022, .016, -.006, -.012], [1.62, .96, 1.76, .42, .042, .054, .03, .028, .016, -.008], [1.02, .9, 1.22, .42, .038, .042, .018, .02, .012, .01]])
   lock(sd * h[0], h[1], sd * h[2], h[3], { w: h[4], r1: h[5], bulge: h[6], flick: [sd * h[7], h[8], h[9]], tuft: L });
 }
 // back: layered locks drawn down and in toward the braid at the back of her head
 for (let k = 0; k < 12; k++) {
  const az = PI + (k - 5.5) * .2 + (rnd() - .5) * .08, b = (k - 5.5) / 5.5;
  lock(az, .82 - Math.abs(b) * .12, PI + (az - PI) * .4, -.12 - .22 * Math.abs(b), { w: .042, r1: .012, bulge: .026, flick: [b * .01, -.004, -.01], tuft: 3, amt: .45 });
 }
 // and shorter layers over them, loose at the nape behind her ears
 for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) lock(sd * (1.95 + k * .3), .55 - k * .05, sd * (2.05 + k * .3), -.42 + k * .04, { w: .036, r1: .02, bulge: .02, flick: [sd * .012, -.006, -.012], tuft: 3, amt: .4 });
 // fine stray wisps over the crown, the sides and the fringe, flicking out: what makes the cut read as tousled
 for (let k = 0; k < 26; k++) {
  const az = -PI + rnd() * TAU, a = Math.abs(az), el0 = .75 + rnd() * .7;
  if (a > 2.3) continue;
  lock(az, el0, az + (rnd() - .5) * .5, Math.max(elEnd(a) + .05, el0 - .35 - rnd() * .3), { w: .02 + rnd() * .008, r1: .03 + rnd() * .02, bulge: .02, flick: out(az, .02 + rnd() * .012, .006 + rnd() * .012), taper: .8, rs: 5, seg: 10, tuft: a > 2.2 ? 3 : a < .75 ? 2 : -1, amt: .5 });
 }

 // ---------- the braid: chunky lobes, gold bands near its top and end, a spiral gold cord and a loose tuft ----------
 const BJ = braid.map(bw); BJ.push([BJ[5][0], BJ[5][1] - .096, BJ[5][2]]);
 {
  const wB = wChain(braid.map((b) => b.name), BJ, 'head', .7);
  const cv = new THREE.CatmullRomCurve3(BJ.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const T = new THREE.Vector3(), C = new THREE.Vector3(), Xl = new THREE.Vector3(1, 0, 0), N = new THREE.Vector3(), mtx = new THREE.Matrix4();
  const frame = (s) => { cv.getPointAt(s, C); cv.getTangentAt(s, T); N.crossVectors(Xl, T).normalize(); };
  const NL = Q(18, 10);
  for (let k = 0; k < NL; k++) {
   const s = .06 + k / (NL - 1) * .76, side = k % 2 ? 1 : -1, sc = lerp(.95, .7, s); frame(s);
   const ax = T.clone().applyAxisAngle(N, side * .62), lat = new THREE.Vector3().crossVectors(ax, N).normalize();
   mtx.makeBasis(lat, ax, N);
   tinted(HAIRC[k % 3], () => add(new THREE.SphereGeometry(1, Q(12, 8), Q(8, 6)), M.hair, wB, [C.x + side * .0082 * sc, C.y, C.z], null, [.019 * sc, .031 * sc, .015 * sc], new THREE.Quaternion().setFromRotationMatrix(mtx)));
  }
  const cpts = []; for (let i = 0; i <= 12; i++) { frame(.03 + i / 12 * .82); cpts.push([C.x, C.y, C.z]); }
  tinted(HAIRC[2], () => add(tube(cpts, Q(24, 12), Q(8, 5), (t) => .0138 * lerp(1, .72, t), 1, (c, n) => n.set(0, 0, -1)), M.hair, wB));
  // a thin gold cord spiralling down the braid
  const spr = []; for (let i = 0; i <= 40; i++) { const s = .07 + i / 40 * .72, a = i * .9; frame(s); const lat = new THREE.Vector3().crossVectors(T, N).normalize(), r = .0175 * lerp(.95, .72, s); spr.push([C.x + (lat.x * Math.cos(a) + N.x * Math.sin(a)) * r, C.y + (lat.y * Math.cos(a) + N.y * Math.sin(a)) * r, C.z + (lat.z * Math.cos(a) + N.z * Math.sin(a)) * r]); }
  add(tube(spr, Q(80, 30), 4, () => .0016, 1, null), M.gold, wB);
  for (const [s, r, h] of [[.035, .0225, .03], [.845, .0172, .024]]) {
   frame(s); const q = new THREE.Quaternion().setFromUnitVectors(YA, T);
   add(new THREE.CylinderGeometry(r, r, h, Q(18, 10), 1, true), M.gold, wB, [C.x, C.y, C.z], null, null, q);
   for (const e of [-.5, .5]) add(new THREE.TorusGeometry(r, .0024, Q(5, 4), Q(18, 10)), M.gold, wB, [C.x + T.x * h * e, C.y + T.y * h * e, C.z + T.z * h * e], null, null, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)));
  }
  frame(.86); const c0 = C.clone();
  for (let i = 0; i < 7; i++) {
   const dx = (i - 3) * .0085, dz = (i % 2 ? 1 : -1) * .006;
   tinted(HAIRC[i % 4], () => add(tube([[c0.x + dx * .3, c0.y, c0.z], [c0.x + dx * .8, c0.y - .042, c0.z + dz], [c0.x + dx * 1.4, c0.y - .09 + Math.abs(i - 3) * .004, c0.z + dz * 1.5]], Q(8, 5), Q(5, 4), (t) => .0088 * Math.pow(1 - t, .8) + .0005, .6, (c, n) => n.set(0, 0, -1)), M.hair, wB));
  }
 }

 // ---------- torso: a quilted gambeson under the plate, an orange band at the waist ----------
 const TP = [[1.445, .064, .056, .06], [1.425, .092, .072, .078], [1.4, .125, .085, .092], [1.37, .15, .098, .103], [1.32, .16, .11, .108], [1.26, .157, .112, .106], [1.2, .15, .106, .1], [1.14, .14, .099, .096], [1.08, .13, .094, .092], [1.02, .128, .093, .094], [.97, .14, .1, .108], [.92, .152, .104, .118], [.87, .15, .1, .115], [.84, .13, .088, .098], [.82, .06, .05, .05]];
 function crv(tab, c, y) {
  const n = tab.length; if (y >= tab[0][0]) return tab[0][c]; if (y <= tab[n - 1][0]) return tab[n - 1][c];
  let i = 0; while (i < n - 2 && y < tab[i + 1][0]) i++;
  const p0 = tab[Math.max(0, i - 1)][c], p1 = tab[i][c], p2 = tab[i + 1][c], p3 = tab[Math.min(n - 1, i + 2)][c];
  const t = (tab[i][0] - y) / (tab[i][0] - tab[i + 1][0]), t2 = t * t;
  return .5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t2 * t);
 }
 const bust = (x, y) => .019 * Math.exp(-(((Math.abs(x) - .066) / .048) ** 2) - ((y - 1.236) / .05) ** 2);
 function bodyPt(a, y, off, o) {
  const rx = crv(TP, 1, y), rf = crv(TP, 2, y), rb = crv(TP, 3, y), c = Math.cos(a), s = Math.sin(a), rz = c > 0 ? rf : rb;
  const x = s * rx; let z = c * rz; if (c > 0) z += bust(x, y) * c;
  const nx = s / rx, nz = c / rz, L = Math.hypot(nx, nz) || 1;
  o[0] = x + nx / L * off; o[1] = y; o[2] = z + nz / L * off; return o;
 }
 add(toTorso(surf(Q(64, 32), Q(44, 22), (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(1.445, .82, v), 0, o), true)), M.cloth, wTorso);

 // ---------- the breastplate: brushed bronze shaped to her, gold-edged, with a small gold sun on the chest ----------
 const BRZ = [.64, .48, .3], BRZd = [.5, .37, .22], BRZl = [.72, .55, .34];
 const bpTop = (a) => { const A = Math.abs(a); return A < .38 ? lerp(1.386, 1.416, sm(0, .38, A)) : A < .9 ? lerp(1.416, 1.396, sm(.38, .9, A)) : A < 1.55 ? lerp(1.396, 1.272, sm(.9, 1.55, A)) : lerp(1.272, 1.3, sm(1.55, 2.1, A)); };
 const bpBot = (a) => 1.106 + .016 * sm(.05, .6, Math.abs(a));
 function bpPt(a, y, off, o) {
  bodyPt(a, y, off, o);
  const c = Math.cos(a); if (c > 0) { const x = o[0]; o[2] += c * (.008 * Math.exp(-(((Math.abs(x) - .066) / .05) ** 2) - ((y - 1.245) / .06) ** 2) + .004 * Math.exp(-x * x / .0005) * sm(1.23, 1.15, y)); }
  return o;
 }
 tinted(BRZ, () => add(slab(Q(40, 20), Q(16, 8), (u, v, o) => { const a = lerp(-2.05, 2.05, u); bpPt(a, lerp(bpTop(a), bpBot(a), v), .013, o); }, .005), M.bronze, wTorso));
 // the lame below it, with rivets
 tinted(BRZd, () => add(slab(Q(36, 18), 2, (u, v, o) => { const a = lerp(-1.95, 1.95, u); bodyPt(a, lerp(1.112, 1.078, v), .019, o); }, .004), M.bronze, wTorso));
 const trim = (pts, r, w) => add(tube(pts, Q(pts.length * 2, 10), Q(5, 4), () => r, 1, null), M.gold, w || wTorso);
 {
  const top = [], bot = [], lb = [];
  for (let i = 0; i <= 30; i++) { const a = lerp(-2.05, 2.05, i / 30); top.push(bpPt(a, bpTop(a) - .002, .0175, [0, 0, 0])); bot.push(bpPt(a, bpBot(a) + .002, .0175, [0, 0, 0])); }
  for (let i = 0; i <= 24; i++) { const a = lerp(-1.95, 1.95, i / 24); lb.push(bodyPt(a, 1.08, .0235, [0, 0, 0])); }
  trim(top, .0036); trim(bot, .0032); trim(lb, .0026);
  for (let k = -3; k <= 3; k++) { const p = bodyPt(k * .42, 1.095, .0235, [0, 0, 0]); add(new THREE.SphereGeometry(.0042, Q(8, 5), Q(6, 4)), M.gold, wTorso, p); }
 }
 {
  // the sun on her chest: long rays across and down, shorter ones up and between
  const L = [.054, .034, .092, .034, .1, .034, .092, .034], sh = new THREE.Shape();
  for (let k = 0; k < 8; k++) { const f = PI / 2 - k * PI / 4, fv = f - PI / 8; if (k) sh.lineTo(Math.cos(f) * L[k], Math.sin(f) * L[k]); else sh.moveTo(Math.cos(f) * L[k], Math.sin(f) * L[k]); sh.lineTo(Math.cos(fv) * .018, Math.sin(fv) * .018); }
  sh.closePath();
  const p0 = bpPt(0, 1.33, .0172, [0, 0, 0]), p1 = bpPt(.01, 1.33, .0172, [0, 0, 0]), p2 = bpPt(0, 1.34, .0172, [0, 0, 0]);
  const n = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).cross(new THREE.Vector3(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2])).normalize(); if (n.z < 0) n.negate();
  const q = new THREE.Quaternion().setFromUnitVectors(ZA, n);
  add(new THREE.ExtrudeGeometry(sh, { depth: .0026, bevelEnabled: false, curveSegments: 2 }), M.gold, wTorso, p0, null, null, q);
  add(new THREE.CylinderGeometry(.015, .017, .006, Q(16, 8)), M.gold, wTorso, [p0[0] + n.x * .003, p0[1] + n.y * .003, p0[2] + n.z * .003], null, null, new THREE.Quaternion().setFromUnitVectors(YA, n));
 }
 // a dark leather collar standing round her neck, open at the throat, piped in gold
 tinted([.26, .2, .17], () => add(slab(Q(28, 14), 3, (u, v, o) => { const a = lerp(.42, TAU - .42, u), r = lerp(.073, .063, v); o[0] = Math.sin(a) * r; o[1] = lerp(1.402, 1.492 - .03 * Math.max(0, Math.cos(a)) ** 2, v); o[2] = Math.cos(a) * r * .94 - .008; }, .004), M.leather, wNeck));
 { const pts = []; for (let i = 0; i <= 20; i++) { const a = lerp(.42, TAU - .42, i / 20); pts.push([Math.sin(a) * .064, 1.493 - .03 * Math.max(0, Math.cos(a)) ** 2, Math.cos(a) * .064 * .94 - .008]); } trim(pts, .0022, wNeck); }

 // ---------- the hood on her shoulders; a chain and sun clasps fasten the cape ----------
 function hoodPt(u, v, o) {
  const a = lerp(.6, TAU - .6, u), b = 1 - Math.abs(a - PI) / (PI - .6);
  const r = lerp(.08, lerp(.152, .182, b), v) + .032 * Math.sin(PI * v) * (.35 + .65 * b) + .008 * Math.sin(a * 9) * v;
  const y = lerp(1.462 - .008 * b, 1.425 - .14 * b * b * b, v) + .026 * Math.sin(PI * v) * (.5 + .5 * b);
  o[0] = Math.sin(a) * r; o[1] = y; o[2] = Math.cos(a) * r * .93 - .012; return o;
 }
 {
  const g = slab(Q(40, 20), Q(8, 5), hoodPt, .006), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .75, .985); // the lining's deeper navy, so the hood reads against the cape
  add(g, M.cape, BI.chest);
  const e = []; for (let i = 0; i <= 30; i++) { const p = hoodPt(i / 30, 1, [0, 0, 0]); e.push([p[0] * 1.012, p[1] - .002, p[2] * 1.012]); }
  trim(e, .0045, BI.chest);
  const cl2 = [hoodPt(0, .42, [0, 0, 0]), hoodPt(1, .42, [0, 0, 0])];
  for (const c of cl2) {
   c[2] += .008; const qn = new THREE.Quaternion().setFromUnitVectors(YA, _v.set(c[0] * 1.2, .3, 1).normalize());
   add(new THREE.CylinderGeometry(.013, .014, .006, Q(16, 8)), M.gold, BI.chest, c, null, null, qn);
   for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(qn); add(new THREE.ConeGeometry(.0034, k % 2 ? .008 : .012, 4), M.gold, BI.chest, [c[0] + d.x * .018, c[1] + d.y * .018, c[2] + d.z * .018], null, null, new THREE.Quaternion().setFromUnitVectors(YA, d)); }
  }
  add(new THREE.SphereGeometry(.0062, Q(10, 6), Q(8, 4)), M.stone, BI.chest, [cl2[1][0] + .002, cl2[1][1] + .001, cl2[1][2] + .006]);
  const ch = []; for (let i = 0; i <= 16; i++) { const t = i / 16, p = [lerp(cl2[0][0], cl2[1][0], t), lerp(cl2[0][1], cl2[1][1], t) - .03 * Math.sin(PI * t), 0]; p[2] = bodyPt(Math.atan2(p[0], .1), p[1], .022, [0, 0, 0])[2] + .004; ch.push(p); }
  add(tube(ch, Q(48, 24), 4, (t) => .0022 + .0009 * Math.cos(t * PI * 26) ** 2, 1, null), M.gold, BI.chest);
 }

 // ---------- two leather belts with gold buckles, and pouches at her hips ----------
 tinted([.42, .25, .14], () => {
  add(slab(Q(48, 24), 2, (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(1.045, 1.017, v), .015, o), .004), M.leather, wTorso);
  add(slab(Q(48, 24), 2, (u, v, o) => { const a = lerp(-PI, PI, u), yc = .985 - .026 * Math.sin(a); return bodyPt(a, yc + lerp(.013, -.013, v), .02, o); }, .004), M.leather, wTorso);
 });
 for (const [ab, yc, off] of [[0, 1.031, .02], [.55, .985 - .026 * Math.sin(.55), .025]]) {
  const p = bodyPt(ab, yc, off, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0));
  for (const [dx, dy, sx, sy] of [[-.02, 0, .005, .036], [.02, 0, .005, .036], [0, .0155, .045, .005], [0, -.0155, .045, .005]])
   add(new THREE.BoxGeometry(sx, sy, .006), M.gold, wTorso, [p[0] + Math.cos(ab) * dx, yc + dy, p[2] - Math.sin(ab) * dx], null, null, q);
  add(new THREE.BoxGeometry(.004, .03, .005), M.gold, wTorso, [p[0] + Math.sin(ab) * .002, yc, p[2] + Math.cos(ab) * .002], null, null, q);
 }
 const wHip = (sd) => (x, y) => [[BI.pelvis, .7], [BI['hip' + sd], .3]];
 for (const [ab, top, sd] of [[-1.3, 1.02, -1], [1.32, .968, 1]]) {
  const p = bodyPt(ab, top - .045, .045, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0));
  tinted([.36, .21, .11], () => add(new THREE.BoxGeometry(.064, .076, .032, 2, 2, 1), M.leather, wHip(sd), p, null, null, q));
  tinted([.27, .15, .08], () => add(new THREE.BoxGeometry(.068, .034, .036), M.leather, wHip(sd), [p[0] + Math.sin(ab) * .002, p[1] + .025, p[2] + Math.cos(ab) * .002], null, null, q));
  add(new THREE.SphereGeometry(.0045, Q(8, 5), Q(6, 4)), M.gold, wHip(sd), [p[0] + Math.sin(ab) * .02, p[1] + .01, p[2] + Math.cos(ab) * .02]);
 }

 // cream underskirt panels at her hips, either side of the tabard, falling to mid-thigh; the cape covers the back
 const wSkirt = (x, y) => { const k = .82 * sm(.97, .74, y), sL = sm(-.05, .05, x); return [[BI.pelvis, 1 - k], [BI['hip-1'], k * (1 - sL)], [BI['hip1'], k * sL]]; };
 for (const sd of [-1, 1]) add(toLinen(slab(Q(18, 9), Q(8, 4), (u, v, o) => { const a = sd * lerp(.3, 1.85, u), y = lerp(.995, .73 + .03 * Math.cos(a), v); bodyPt(a, Math.max(y, .88), .03 + .062 * sm(-.1, .8, v) + .005 * v * Math.sin(9 * a), o); o[1] = y; }, .003)), M.cloth, wSkirt);
 // the tabard, front and back: burnt orange, gold-bordered, pointed; the front carries the sun crest
 const tabW = (bonesT) => (x, y) => {
  if (y > .99) return [[BI.pelvis, 1]];
  if (y > .93) { const t = sm(.99, .94, y); return [[BI.pelvis, 1 - t], [BI[bonesT[0]], t]]; }
  const t = sm(.8, .74, y); return [[BI[bonesT[0]], 1 - t], [BI[bonesT[1]], t]];
 };
 for (const T of TAB) {
  const back = T.back, nu = Q(10, 6), nv = Q(26, 14);
  const g = surf(nu, nv, (u, v, o) => {
   const y = T.top - v * tabL(T, u), hw = lerp(T.hw0, T.hw1, v), x = (u - .5) * 2 * hw;
   const base = back ? -(.138 + .028 * sm(.95, .6, y)) : .108 + .04 * sm(1.0, .56, y);
   o[0] = x; o[1] = y; o[2] = base - (back ? -1 : 1) * 1.9 * x * x * (1 - .6 * v);
  }, false, back);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i); uv.setXY(i, (back ? .5 : 0) + u * .5, 1 - v * tabL(T, u) / T.Lt); }
  add(g, M.tabard, tabW(back ? ['tabB1', 'tabB2'] : ['tabF1', 'tabF2']));
 }

 // ---------- arms: full linen sleeves pushed to the elbows, bronze vambraces, dark leather gloves ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .195, cz = -.01;
  add(toLinen(lathe([[.02, 1.47], [.06, 1.457], [.08, 1.425], [.089, 1.375], [.09, 1.31], [.087, 1.245], [.081, 1.19], [.073, 1.145], [.066, 1.118], [.062, 1.105]], Q(28, 14), { cx, cz, sub: 2, fn: (p, a, v) => { const k = 1 + .06 * Math.sin(8 * a + sd) * sm(.15, .6, v) + .04 * Math.sin(5 * a - sd) * sm(.6, 1, v); p[0] = cx + (p[0] - cx) * k; p[2] = cz + (p[2] - cz) * k; } })), M.cloth, wArm);
  add(toLinen(new THREE.TorusGeometry(.061, .0135, Q(8, 5), Q(24, 12))), M.cloth, wArm, [cx, 1.104, cz], [PI / 2, 0, 0]);
  add(toLinen(new THREE.TorusGeometry(.066, .01, Q(8, 5), Q(24, 12))), M.cloth, wArm, [cx, 1.124, cz], [PI / 2, .1 * sd, 0]);
  const fa = lathe([[.041, 1.17], [.0405, 1.11], [.0435, 1.05], [.042, .99], [.036, .92], [.031, .875], [.029, .855]], Q(20, 12), { cx, cz, sub: 2 });
  const uv = fa.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, .5 + (sd < 0 ? 0 : .25) + uv.getX(i) * .25);
  add(fa, M.skin, wArm);
  tinted(BRZ, () => add(lathe([[.056, 1.046], [.052, 1.034], [.0485, 1.0], [.045, .96], [.041, .92], [.0392, .888], [.0385, .868]], Q(22, 12), { cx, cz, sub: 2 }), M.bronze, BI['elbow' + sd]));
  tinted(BRZl, () => add(slab(Q(4, 3), Q(8, 4), (u, v, o) => { const a = lerp(-.42, .42, u) + sd * PI / 2, y = lerp(1.03, .885, v), r = lerp(.0505, .041, v) + .003; o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r; }, .003), M.bronze, BI['elbow' + sd]));
  for (const [y, r] of [[1.045, .057], [.87, .0395]]) add(new THREE.TorusGeometry(r, .0036, Q(6, 4), Q(22, 12)), M.gold, BI['elbow' + sd], [cx, y, cz], [PI / 2, 0, 0]);
  // gloved hand
  const W0 = bw(wrists[sd < 0 ? 0 : 1]), H = (p) => [W0[0] + p[0], W0[1] + p[1], W0[2] + p[2]];
  const wr = BI['wrist' + sd], f = ['fing1' + sd, 'fing2' + sd, 'fing3' + sd].map((n) => BI[n]);
  tinted([.3, .17, .1], () => {
   add(lathe([[.0405, .876], [.043, .862], [.047, .846], [.046, .836]], Q(18, 10), { cx, cz, sub: 1 }), M.leather, (x, y) => [[BI['elbow' + sd], sm(.85, .876, y)], [wr, 1 - sm(.85, .876, y)]]);
   add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.leather, wr, H([-sd * .002, -.05, 0]), null, [.0178, .05, .041]);
   add(new THREE.SphereGeometry(1, Q(12, 6), Q(8, 5)), M.leather, wr, H([-sd * .008, -.036, .022]), null, [.012, .026, .014]);
   const zs = [.026, .0088, -.0088, -.026], ls = [.97, 1, .95, .8];
   for (let k = 0; k < 4; k++) {
    const z = zs[k], s = ls[k], r = .0092 * (k === 3 ? .86 : 1), x = -sd * .004;
    const j = [[x, -.088, z], [x, -.088 - .045 * s, z], [x, -.088 - .075 * s, z], [x, -.088 - .098 * s, z]].map(H);
    seg(M.leather, f[0], j[0], j[1], r, r * .95, Q(8, 5), true);
    seg(M.leather, f[1], j[1], j[2], r * .95, r * .88, Q(8, 5), true);
    seg(M.leather, f[2], j[2], j[3], r * .88, r * .8, Q(8, 5), true);
   }
   const t1 = BI['thumb1' + sd], t2 = BI['thumb2' + sd], tb = [[-sd * .006, -.032, .03], [-sd * .006, -.068, .038], [-sd * .006, -.094, .042]].map(H);
   seg(M.leather, t1, tb[0], tb[1], .0105, .0095, Q(8, 5), true);
   seg(M.leather, t2, tb[1], tb[2], .0095, .0085, Q(8, 5), true);
  });
 }

 // ---------- pauldrons: kestrel feathers and a sunstone boss on the left, a small plain plate on the right ----------
 for (const sd of [-1, 1]) {
  const C = [sd * .205, 1.398, -.008], R = sd > 0 ? .096 : .086, Pz = new THREE.Vector3(sd * .5, 1, 0).normalize();
  const E1 = new THREE.Vector3(0, 0, 1), E2 = new THREE.Vector3().crossVectors(Pz, E1).normalize(), D = new THREE.Vector3();
  const S = BI['shoulder' + sd], wP = [[BI.chest, .25], [S, .75]];
  const capP = (al, be, rr) => { D.copy(Pz).multiplyScalar(Math.cos(be)).addScaledVector(E1, Math.cos(al) * Math.sin(be)).addScaledVector(E2, Math.sin(al) * Math.sin(be)); return [C[0] + D.x * rr, C[1] + D.y * rr, C[2] + D.z * rr * 1.12]; };
  const BE = sd > 0 ? 1.15 : 1.02;
  tinted(BRZ, () => add(slab(Q(28, 14), Q(8, 5), (u, v, o) => { const p = capP(u * TAU, v * BE, R); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, .006), M.bronze, () => wP));
  { const rim = []; for (let i = 0; i <= 28; i++) rim.push(capP(i / 28 * TAU, BE, R + .004)); trim(rim, .0034, () => wP); }
  if (sd < 0) {
   for (let k = 0; k < 2; k++) {
    tinted(k ? BRZd : BRZ, () => add(slab(Q(16, 8), 3, (u, v, o) => { const ph = lerp(-1.4, 1.4, u), r = .086 + .006 * k + .013 * v, y = 1.37 - .03 * k - .044 * v; o[0] = C[0] - Math.cos(ph) * r; o[1] = y; o[2] = C[2] + Math.sin(ph) * r * 1.08; }, .0045), M.bronze, () => [[BI.chest, .12], [S, .88]]));
   }
   const e = []; for (let i = 0; i <= 16; i++) { const ph = lerp(-1.4, 1.4, i / 16), r = .1 + .0045; e.push([C[0] - Math.cos(ph) * r, 1.37 - .03 - .044, C[2] + Math.sin(ph) * r * 1.08]); }
   trim(e, .003, () => [[BI.chest, .12], [S, .88]]);
   continue;
  }
  // the sun boss and its sunstone
  const bd = new THREE.Vector3(.55, .62, .56).normalize(), bp = [C[0] + .052, C[1] + .066, C[2] + .05], bq = new THREE.Quaternion().setFromUnitVectors(YA, bd);
  const at = (k) => [bp[0] + bd.x * k, bp[1] + bd.y * k, bp[2] + bd.z * k];
  add(new THREE.CylinderGeometry(.027, .03, .01, Q(22, 10)), M.gold, () => wP, bp, null, null, bq);
  add(new THREE.TorusGeometry(.0165, .0032, Q(6, 4), Q(18, 10)), M.gold, () => wP, at(.006), null, null, bq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)));
  add(new THREE.SphereGeometry(.0145, Q(14, 8), Q(10, 6)), M.stone, () => wP, at(.004), null, [1, .55, 1], bq);
  for (let k = 0; k < 12; k++) {
   const a = k / 12 * TAU, L = k % 2 ? .013 : .022, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(bq);
   add(new THREE.ConeGeometry(.0048, L, 4), M.gold, () => wP, [bp[0] + dir.x * (.028 + L / 2), bp[1] + dir.y * (.028 + L / 2), bp[2] + dir.z * (.028 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, dir));
  }
  // four rows of long bronze feathers fanning down and back over the upper arm
  const F = new THREE.Vector3(), N = new THREE.Vector3(), Sv = new THREE.Vector3();
  [[8, .1, .084, .036], [8, .13, .08, .014], [7, .16, .074, -.01], [7, .19, .068, -.034]].forEach(([n, L, rad, yo], row) => {
   for (let k = 0; k < n; k++) {
    const be = lerp(-.9, 1.25, (k + .5 * (row % 2)) / (n - .5)), rt = [C[0] + Math.cos(be) * rad * .9, C[1] + yo, C[2] + Math.sin(be) * rad];
    F.set(.42 + .07 * row, -1, .42 * Math.sin(be) + .12).normalize();
    N.set(Math.cos(be), .28, Math.sin(be)).normalize(); N.addScaledVector(F, -N.dot(F)).normalize(); Sv.crossVectors(F, N);
    const len = L * (1 + .12 * Math.sin(be)), Wd = .02;
    tinted(row % 2 ? BRZd : (k % 2 ? BRZ : BRZl), () => add(slab(Q(4, 3), Q(8, 5), (u, v, o) => {
     const w = Wd * (v < .7 ? lerp(.62, 1, sm(0, .45, v)) : Math.sqrt(Math.max(0, 1 - ((v - .7) / .3) ** 2)) * .95 + .05), s = (u - .5) * 2;
     const lift = .005 * (1 - s * s) + .02 * v * v;
     o[0] = rt[0] + F.x * v * len + Sv.x * s * w + N.x * lift; o[1] = rt[1] + F.y * v * len + Sv.y * s * w + N.y * lift; o[2] = rt[2] + F.z * v * len + Sv.z * s * w + N.z * lift;
    }, .0035), M.bronze, BI.pauld));
   }
  });
 }

 // ---------- legs: dark trousers, round knee cops, bronze greaves over strapped leather boots ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .095, K = BI['knee' + sd];
  add(toTrousers(lathe([[.072, .975], [.088, .93], [.092, .86], [.09, .77], [.083, .67], [.072, .585], [.063, .53], [.059, .48], [.058, .43]], Q(24, 12), { cx, cz: .004, sub: 2, fn: (p) => { if ((p[0] - cx) * sd < 0) p[0] = cx + (p[0] - cx) * .84; } })), M.cloth, wLeg);
  tinted([.4, .25, .14], () => {
   add(lathe([[.061, .462], [.0585, .44], [.059, .39], [.058, .31], [.051, .23], [.046, .16], [.047, .12], [.05, .1]], Q(22, 12), { cx, cz: .002, sub: 2 }), M.leather, wLeg);
   add(new THREE.TorusGeometry(.06, .006, Q(6, 4), Q(22, 12)), M.leather, wLeg, [cx, .458, .002], [PI / 2, 0, 0]);
  });
  // straps with gold buckles round the boot shafts
  for (const y of [.375, .29, .2]) {
   const br = crv([[.448, .059], [.39, .059], [.31, .058], [.23, .051], [.16, .046], [.12, .047]], 1, y) + .0035;
   tinted([.25, .14, .08], () => add(slab(Q(20, 10), 1, (u, v, o) => { const a = lerp(-PI, PI, u); o[0] = cx + Math.sin(a) * br; o[1] = y + lerp(.007, -.007, v); o[2] = .002 + Math.cos(a) * br; }, .002), M.leather, wLeg));
   add(new THREE.BoxGeometry(.004, .014, .012), M.gold, wLeg, [cx + sd * (br + .002), y, .002]);
  }
  // knee cop: a round dome with a fan on the outside, rimmed in gold
  const kw = [[BI['hip' + sd], .4], [K, .6]], kc = [cx, .51, .05];
  const kp = (al, be, o) => { o[0] = kc[0] + Math.sin(be) * Math.cos(al) * .058; o[1] = kc[1] + Math.sin(be) * Math.sin(al) * .064; o[2] = kc[2] + Math.cos(be) * .028 - .012 * Math.sin(be) ** 2; return o; };
  tinted(BRZ, () => add(slab(Q(18, 9), Q(8, 5), (u, v, o) => kp(u * TAU, v * 1.35, o), .004), M.bronze, () => kw));
  { const rim = []; for (let i = 0; i <= 24; i++) rim.push(kp(i / 24 * TAU, 1.35, [0, 0, 0])); trim(rim, .003, () => kw); }
  tinted(BRZ, () => add(slab(Q(7, 4), Q(5, 3), (u, v, o) => { const a = lerp(-1.1, 1.1, u), r = .016 + .04 * v; o[0] = cx + sd * (.068 + .012 * v); o[1] = .51 + Math.sin(a) * r; o[2] = .006 + Math.cos(a) * r * .85; }, .0035), M.bronze, () => kw));
  // greave over the front of the shin, gold-trimmed top and bottom
  const gr = (a, y, o) => { const br = crv([[.448, .059], [.39, .059], [.31, .058], [.23, .051], [.16, .046], [.12, .047]], 1, y); const r = br + .008 + .005 * Math.cos(a) ** 10 + .006 * sm(.37, .4, y), cz = lerp(-.004, .008, (y - .085) / .41); o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r; return o; };
  tinted(BRZ, () => add(slab(Q(16, 8), Q(10, 5), (u, v, o) => gr(lerp(-1.3, 1.3, u), lerp(.42, .145, v), o), .0045), M.bronze, wLeg));
  for (const y of [.418, .147]) { const e = []; for (let i = 0; i <= 14; i++) { const p = gr(lerp(-1.3, 1.3, i / 14), y, [0, 0, 0]); e.push([p[0] + (p[0] - cx) * .06, p[1], p[2] + (p[2] - .002) * .06]); } trim(e, .0032, wLeg); }
  const A0 = bw(ankles[sd < 0 ? 0 : 1]), Fp = (p) => [A0[0] + p[0], A0[1] + p[1], A0[2] + p[2]], wf = wFoot;
  // boot: one sculpted shell (heel, instep, rounded toe), a sole and a heel block, a strap across the instep
  const li = (tab, x) => { for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], cl((x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]), 0, 1)); return tab[tab.length - 1][1]; };
  const BW = [[-.075, .032], [-.04, .039], [0, .043], [.09, .047], [.15, .042], [.178, .034]], BT = [[-.075, -.03], [-.03, .022], [.01, .032], [.06, .002], [.11, -.028], [.178, -.052]];
  const bootPt = (u, v, off, o) => {
   const a = lerp(-PI, PI, u), z = lerp(-.075, .178, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), top = li(BT, z), bot = -.079;
   const w = li(BW, z) * e + off, h = (top - bot) / 2 * Math.sqrt(e) + off, sa = Math.sin(a), ca = Math.cos(a);
   const p = Fp([Math.sign(sa) * Math.pow(Math.abs(sa), .8) * w, (top + bot) / 2 + Math.sign(ca) * Math.pow(Math.abs(ca), .8) * h, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2];
  };
  tinted([.4, .24, .13], () => add(surf(Q(22, 12), Q(18, 10), (u, v, o) => bootPt(u, v, 0, o), true), M.leather, wf));
  tinted([.25, .14, .08], () => add(slab(Q(10, 5), 1, (u, v, o) => bootPt(lerp(.25, .75, u), lerp(.5, .58, v), .0025, o), .002), M.leather, wf));
  add(new THREE.BoxGeometry(.012, .004, .012), M.gold, wf, Fp([sd * .046, -.005, .045]));
  tinted([.16, .1, .065], () => {
   add(slab(Q(10, 6), Q(14, 8), (u, v, o) => { const z = lerp(-.078, .182, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), p = Fp([lerp(-1, 1, u) * (li(BW, z) * e + .005), -.077, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, .009), M.leather, wf);
   add(new THREE.CylinderGeometry(.03, .032, .02, Q(12, 6)), M.leather, wf, Fp([0, -.075, -.045]));
  });
 }

 // ---------- cape: midnight blue edged in gold, a sun on the back, falling to a point behind her knees ----------
 function capePt(u, v, o) {
  // past a right angle from the back, cos turns negative and the edge comes forward over the shoulder
  const tp = lerp(-CT, CT, u), s = Math.sin(tp), ct = Math.cos(tp), c = Math.sign(ct) * Math.pow(Math.abs(ct), .35);
  if (v < .1) {
   const k = v / .1, kk = sm(0, 1, k);
   // the top arches out over the shoulder caps (their tops are near 1.45 m), then the cape falls outside the arms
   o[0] = s * lerp(.1, .275, kk); o[2] = -c * lerp(.08, .14, kk); o[1] = lerp(1.458 - .012 * s * s, 1.432 - .045 * s * s, k) + .036 * Math.sin(PI * k) * (.4 + .6 * s * s);
  } else {
   const k = (v - .1) / .9, yH = hem(tp), fold = (.016 * Math.sin(6.5 * tp + 1.0) + .007 * Math.sin(13 * tp + .3)) * Math.pow(k, 1.2);
   const rx = lerp(.275, .35, Math.pow(k, 1.1)) + fold, rz = lerp(.14, .235, Math.pow(k, .85)) + fold;
   o[0] = s * rx; o[2] = -c * rz - .012 * Math.sin(PI * Math.min(1, k * 2.2)); o[1] = lerp(1.432 - .045 * s * s, yH, k);
  }
  return o;
 }
 const chW = bw(chest), capeU = [], capeL = [], capeTip = [];
 for (let k = 0; k < 5; k++) {
  const u = k / 4, a = capePt(u, .1, [0, 0, 0]), b = capePt(u, .56, [0, 0, 0]), t = capePt(u, 1, [0, 0, 0]);
  const U = bone('capeU' + k, chest, a[0] - chW[0], a[1] - chW[1], a[2] - chW[2]); const L = bone('capeL' + k, U, b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  capeU.push(U); capeL.push(L); capeTip.push(new THREE.Vector3(t[0] - b[0], t[1] - b[1], t[2] - b[2]));
 }
 {
  const nu = Q(44, 22), nv = Q(32, 16), g = surf(nu, nv, capePt, false, true);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .5, 1 - (CTOP - p.getY(i)) / CLEN);
  const gl = g.clone(), ul = gl.attributes.uv; for (let i = 0; i < ul.count; i++) ul.setX(i, ul.getX(i) + .5);
  const wC = (x, y, z, i) => {
   const u = (i % (nu + 1)) / nu, v = Math.floor(i / (nu + 1)) / nv, f = Math.min(3.999, u * 4), k0 = Math.floor(f), fr = f - k0;
   const t1 = sm(.08, .2, v), t2 = sm(.48, .64, v);
   return [[BI.chest, 1 - t1], [BI['capeU' + k0], t1 * (1 - t2) * (1 - fr)], [BI['capeU' + (k0 + 1)], t1 * (1 - t2) * fr], [BI['capeL' + k0], t1 * t2 * (1 - fr)], [BI['capeL' + (k0 + 1)], t1 * t2 * fr]];
  };
  add(g, M.cape, wC); add(gl, M.lining, wC);
 }

 // ---------- the sunsteel sword, built along +Y, edge toward +Z, then put in her right fist ----------
 const GRIP = new THREE.Matrix4().compose(new THREE.Vector3(.03, -.08, .02), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), new THREE.Vector3(1, 1, 1));
 const SWB = new THREE.Matrix4().multiplyMatrices(wrists[0].matrixWorld, GRIP);
 const swAdd = (geo, mat, p, r, s, q) => { let g = place(geo, p, r, s, q); if (g === geo) g = geo.clone(); g.applyMatrix4(SWB); add(g, mat, BI['wrist-1']); };
 const BL0 = .07, BL1 = .975;
 const spineZ = (y) => { const t = sm(.84, BL1, y); return lerp(-.021, .016, t * t); };
 const edgeZ = (y) => lerp(.03 - .006 * (y - BL0) / (BL1 - BL0), .016, sm(.9, BL1, y));
 const thick = (y) => lerp(.0034, .0011, sm(.75, BL1, y));
 const bladeFace = (side, u0, u1, lift) => surf(3, Q(28, 14), (u, v, o) => { const y = lerp(BL0, BL1, v), uu = lerp(u0, u1, u); o[0] = side * (thick(y) * (1 - uu * uu) + lift); o[1] = y; o[2] = lerp(spineZ(y), edgeZ(y), uu); }, false, side < 0);
 for (const sd of [-1, 1]) {
  swAdd(bladeFace(sd, 0, 1, 0), M.steel);
  swAdd(bladeFace(sd, .72, 1, .0005), M.edge);
  // the fuller: a darker line down the middle of each face
  tinted([.42, .27, .12], () => swAdd(surf(1, 8, (u, v, o) => { const y = lerp(.09, .74, v), zc = lerp(spineZ(y), edgeZ(y), .32); o[0] = sd * (thick(y) * .92 + .0005); o[1] = y; o[2] = zc + (u - .5) * .0055; }, false, sd < 0), M.bronze));
 }
 swAdd(surf(1, Q(28, 14), (u, v, o) => { const y = lerp(BL0, BL1, v); o[0] = lerp(-1, 1, u) * thick(y); o[1] = y; o[2] = spineZ(y); }), M.steel);
 // the crossguard: a spiky gold sun holding an orange sunstone, with two long quillons
 swAdd(new THREE.CylinderGeometry(.025, .025, .02, Q(20, 10)), M.gold, [0, .055, 0], [0, 0, PI / 2]);
 swAdd(new THREE.TorusGeometry(.034, .0046, Q(6, 4), Q(26, 12)), M.gold, [0, .055, 0], [0, PI / 2, 0]);
 for (const s of [-1, 1]) {
  swAdd(new THREE.ConeGeometry(.0095, .09, Q(8, 4)), M.gold, [0, .055, s * .081], [s * PI / 2, 0, 0], [1, 1, .62]);
  swAdd(new THREE.SphereGeometry(.0085, Q(8, 5), Q(6, 4)), M.gold, [0, .055, s * .037]);
 }
 swAdd(new THREE.ConeGeometry(.009, .044, Q(8, 4)), M.gold, [0, .108, .004], null, [.5, 1, 1]);
 for (let k = 0; k < 12; k++) {
  const a = (k + .5) / 12 * TAU, dy = Math.sin(a), dz = Math.cos(a);
  if (Math.abs(dz) > .95) continue;
  swAdd(new THREE.ConeGeometry(.0052, k % 2 ? .022 : .032, 4), M.gold, [0, .055 + dy * .05, dz * .05], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz)));
 }
 swAdd(new THREE.SphereGeometry(.0158, Q(14, 8), Q(10, 6)), M.stone, [0, .055, 0], null, [.92, 1, 1]);
 // a dark leather grip with gold bands, and a round sun pommel
 tinted([.2, .11, .06], () => swAdd(lathe([[.0146, .047], [.0158, .0], [.0163, -.06], [.0157, -.12], [.0148, -.163]], Q(14, 8), { sub: 3, fn: (p, a, v) => { const k = 1 + .06 * Math.sin(v * 38 + a * 2) ** 2; p[0] *= k; p[2] *= k; } }), M.leather));
 for (const y of [.046, -.06, -.162]) swAdd(new THREE.TorusGeometry(.0162, .0031, Q(5, 4), Q(16, 8)), M.gold, [0, y, 0], [PI / 2, 0, 0]);
 swAdd(new THREE.CylinderGeometry(.011, .013, .016, Q(12, 6)), M.gold, [0, -.17, 0]);
 swAdd(new THREE.CylinderGeometry(.025, .025, .016, Q(20, 10)), M.gold, [0, -.192, 0], [0, 0, PI / 2]);
 swAdd(new THREE.SphereGeometry(.0085, Q(10, 6), Q(8, 5)), M.stone, [0, -.192, 0], null, [1.3, 1, 1]);
 for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, dy = Math.sin(a), dz = Math.cos(a), L = k % 2 ? .009 : .014; swAdd(new THREE.ConeGeometry(.0042, L, 4), M.gold, [0, -.192 + dy * (.025 + L / 2), dz * (.025 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz))); }

 // ---------- bind ----------
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const skinned = []; buildSkinned(root, skeleton, skinned);
 setGaze(0, 0);

 // ---------- effects in world space (the scene adds fx) ----------
 const fx = new THREE.Group(); fx.name = 'SolFX';
 const addB = (map, color, x) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, x || {});
 function softC(inner, mid) { const c = cvs(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(.4, mid); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; }
 function haloC() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m, 20, m, m, m); gr.addColorStop(0, 'rgba(255,240,200,.5)'); gr.addColorStop(.42, 'rgba(255,200,110,.22)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, L = i % 2 ? .7 : .97, w = i % 2 ? .035 : .05; g.fillStyle = i % 2 ? 'rgba(255,214,140,.5)' : 'rgba(255,238,190,.75)'; g.beginPath(); g.moveTo(m + Math.cos(a - w) * 52, m + Math.sin(a - w) * 52); g.lineTo(m + Math.cos(a) * m * L, m + Math.sin(a) * m * L); g.lineTo(m + Math.cos(a + w) * 52, m + Math.sin(a + w) * 52); g.fill(); }
  g.strokeStyle = 'rgba(255,246,214,.95)'; g.lineWidth = 5; g.shadowColor = '#ffcf7a'; g.shadowBlur = 14; g.beginPath(); g.arc(m, m, 50, 0, TAU); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(m, m, 62, 0, TAU); g.stroke();
  return c;
 }
 function shimmerC() {
  const c = cvs(64, 128), g = c.getContext('2d');
  for (let y = 0; y < 128; y += 2) {
   const env = Math.sin(PI * y / 128) ** 1.5, x0 = 32 + 6 * Math.sin(y * .09) + 3 * Math.sin(y * .23 + 1), a = (.05 + .07 * Math.sin(y * .05 + .5) ** 2) * env;
   const gr = g.createLinearGradient(x0 - 22, 0, x0 + 22, 0); gr.addColorStop(0, 'rgba(255,220,170,0)'); gr.addColorStop(.5, 'rgba(255,220,170,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,220,170,0)');
   g.fillStyle = gr; g.fillRect(x0 - 22, y, 44, 2);
  }
  return c;
 }
 const glowT = tex(softC('rgba(255,255,255,1)', 'rgba(255,255,255,.3)')), emberT = tex(softC('rgba(255,255,255,1)', 'rgba(255,240,200,.5)'));
 const bladeGlow = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xff9a3a))); bladeGlow.renderOrder = 6; fx.add(bladeGlow);
 const stoneGlow = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xffb050))); stoneGlow.renderOrder = 7; fx.add(stoneGlow);
 const tipFlare = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xfff0c0))); tipFlare.renderOrder = 8; fx.add(tipFlare);
 const shimmerT = tex(shimmerC());
 const shimmer = new THREE.Sprite(new THREE.SpriteMaterial(addB(shimmerT, 0xffd8a8))); shimmer.renderOrder = 6; fx.add(shimmer);
 const aura = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(softC('rgba(255,170,90,.7)', 'rgba(255,120,40,.25)')), 0xff8030))); aura.renderOrder = 1; fx.add(aura);
 const halo = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(haloC()), 0xffe2a8))); halo.renderOrder = 1; fx.add(halo);
 const sunL = new THREE.PointLight(0xffa040, 0, 4.5, 2); fx.add(sunL);
 const upC = cvs(64, 256), ug = upC.getContext('2d');
 for (let y = 0; y < 256; y += 2) { const v = y / 256, a = Math.sin(PI * Math.pow(v, 1.4)) * (.55 + .45 * Math.sin(y * .19) ** 2), x0 = 32 + 5 * Math.sin(y * .06), gr = ug.createLinearGradient(x0 - 30, 0, x0 + 30, 0); gr.addColorStop(0, 'rgba(255,190,110,0)'); gr.addColorStop(.5, 'rgba(255,190,110,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,190,110,0)'); ug.fillStyle = gr; ug.fillRect(0, y, 64, 2); }
 const updraft = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(upC), 0xffa850))); updraft.renderOrder = 5; fx.add(updraft);
 const burst = new THREE.Sprite(new THREE.SpriteMaterial(addB(halo.material.map, 0xffd890))); burst.renderOrder = 8; fx.add(burst);
 const _pw = new THREE.Vector3();
 // trail: an additive ribbon of the last 14 tip positions
 const TRN = 14, trPos = new Float32Array(TRN * 6), trCol = new Float32Array(TRN * 6), trIdx = [];
 for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const trTip = [], trMid = []; for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 // embers and sparks
 const NE = 48, eP = new Float32Array(NE * 3), eC = new Float32Array(NE * 3), eV = new Float32Array(NE * 3), eL = new Float32Array(NE), eM = new Float32Array(NE);
 const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(eP, 3)); eGeo.setAttribute('color', new THREE.BufferAttribute(eC, 3));
 const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: .045, map: emberT, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
 embers.frustumCulled = false; embers.renderOrder = 7; fx.add(embers);
 let eNext = 0;
 function emit(p, vx, vy, vz, life) { const i = eNext; eNext = (eNext + 1) % NE; eP[i * 3] = p.x; eP[i * 3 + 1] = p.y; eP[i * 3 + 2] = p.z; eV[i * 3] = vx; eV[i * 3 + 1] = vy; eV[i * 3 + 2] = vz; eL[i] = life; eM[i] = life; }
 function stepEmbers(dt) {
  for (let i = 0; i < NE; i++) {
   if (eL[i] <= 0) { eC[i * 3] = eC[i * 3 + 1] = eC[i * 3 + 2] = 0; continue; }
   eL[i] -= dt; const k = Math.max(0, eL[i] / eM[i]);
   eV[i * 3 + 1] += (eM[i] < .5 ? -4.5 : .9) * dt; eV[i * 3] *= 1 - dt * 1.5; eV[i * 3 + 2] *= 1 - dt * 1.5;
   eP[i * 3] += eV[i * 3] * dt; eP[i * 3 + 1] += eV[i * 3 + 1] * dt; eP[i * 3 + 2] += eV[i * 3 + 2] * dt;
   eC[i * 3] = k; eC[i * 3 + 1] = .55 * k * k + .12 * k; eC[i * 3 + 2] = .12 * k * k * k;
  }
  eGeo.attributes.position.needsUpdate = true; eGeo.attributes.color.needsUpdate = true;
 }
 // sword-space points
 const TIP = new THREE.Vector3(0, .965, .017), MIDB = new THREE.Vector3(0, .5, .005), BASEB = new THREE.Vector3(0, .12, .004), STONE = new THREE.Vector3(0, .055, 0);
 const swM = new THREE.Matrix4();
 const swordMatrix = () => swM.multiplyMatrices(wrists[0].matrixWorld, GRIP);

 // ---------- motion: poses are flat objects of channels ----------
 // pelvis offset y/x/z and rotations; spine s, chest c, neck n, head h (YXZ euler);
 // feet as IK targets in root space (r/l F x y z, yaw r, pitch p); sword grip g, blade dir d, edge e (root space), elbow poles;
 // left hand: two = on the hilt, lik = reach for lt, lbl = palm on the blade; FK fallback lS/lE/lW; finger curls; face br/bl/mo.
 const D3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
 const READY = {
  y: -.07, x: 0, z: 0, pX: .06, pY: -.32, pZ: 0, sX: .02, sY: .06, sZ: 0, cX: .04, cY: .14, cZ: 0, nX: 0, nY: .05, hX: .03, hY: .08, hZ: 0,
  rFx: -.2, rFy: 0, rFz: -.17, rFr: -.62, rFp: 0, lFx: .17, lFy: 0, lFz: .2, lFr: .12, lFp: 0,
  gx: -.05, gy: 1.0, gz: .29, dx: .18, dy: .55, dz: .82, ex: 0, ey: -.83, ez: .56,
  rPx: -.8, rPy: -.45, rPz: -.35,
  two: 1, lik: 0, lbl: 0, ltx: .2, lty: .95, ltz: .1, lPx: .8, lPy: -.45, lPz: -.25,
  lSX: -.1, lSY: 0, lSZ: .15, lE: -.3, lWX: 0, lWZ: 0,
  fR: 1, fL: 1, br: .12, bl: 0, cs: 0, bs: 0, mo: 0
 };
 const CH = Object.keys(READY).filter((k) => k !== 'mo');
 const cp = (a, b) => { for (const k of CH) a[k] = b[k]; a.mo = b.mo; return a; };
 const mix = (a, b, w) => { if (w <= 0) return a; for (const k of CH) a[k] += (b[k] - a[k]) * w; if (w >= .5) a.mo = b.mo; return a; };
 const GUARD = Object.assign({}, READY, {
  y: -.13, pX: .1, pY: -.18, cX: .06, cY: .06, hX: .08, hY: .1,
  rFx: -.25, rFz: -.12, rFr: -.55, lFx: .22, lFz: .2, lFr: .28,
  gx: -.25, gy: 1.2, gz: .3, dx: .97, dy: .1, dz: .2, ex: 0, ey: .25, ez: 1, rPx: -.5, rPy: -.85, rPz: -.1,
  two: 0, lik: 1, lbl: 1, lPx: .6, lPy: -.7, lPz: -.3, fL: .15, br: .6, mo: 1
 });
 function K(u, o, s) {
  const k = Object.assign({}, o || {});
  if (s) { k.gx = s[0]; k.gy = s[1]; k.gz = s[2]; const d = D3(s[3], s[4], s[5]); k.dx = d[0]; k.dy = d[1]; k.dz = d[2]; if (s.length > 6) { k.ex = s[6]; k.ey = s[7]; k.ez = s[8]; } }
  return [u, k];
 }
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = READY;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, hits: [], hold: false, interrupt: false, bi: .12, bo: .16, dash: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p, n = T.length;
  let i = 0; while (i < n - 2 && u > T[i + 1]) i++;
  const t0 = T[i], t1 = T[i + 1], f = cl((u - t0) / (t1 - t0), 0, 1), ia = Math.max(0, i - 1), id = Math.min(n - 1, i + 2);
  const a = Pk[ia], b = Pk[i], c = Pk[i + 1], d = Pk[id], ta = T[ia], td = T[id], h = t1 - t0;
  const f2 = f * f, f3 = f2 * f, h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = 3 * f2 - 2 * f3, h11 = f3 - f2;
  for (const k of CH) {
   const m0 = (c[k] - a[k]) / Math.max(1e-6, t1 - ta) * h, m1 = (d[k] - b[k]) / Math.max(1e-6, td - t0) * h;
   out[k] = h00 * b[k] + h10 * m0 + h01 * c[k] + h11 * m1;
  }
  out.mo = f >= 1 ? c.mo : b.mo;
  return out;
 }

 // ---------- two-bone IK ----------
 const _S = new THREE.Vector3(), _E = new THREE.Vector3(), _Tt = new THREE.Vector3(), _Dd = new THREE.Vector3(), _Pp = new THREE.Vector3(), _B = new THREE.Vector3();
 const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _mm = new THREE.Matrix4();
 const _qp = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const restFix = (b) => new THREE.Quaternion().setFromUnitVectors(b.position.clone().normalize(), new THREE.Vector3(0, -1, 0));
 function ik2(b1, b2, L1, L2, T, pole, back, fix1, fix2) {
  b1.getWorldPosition(_S); b1.parent.getWorldQuaternion(_qp);
  _Dd.subVectors(T, _S); let d = _Dd.length(); _Dd.multiplyScalar(1 / (d || 1));
  d = cl(d, Math.abs(L1 - L2) + .02, L1 + L2 - 1e-4);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _Pp.copy(pole).addScaledVector(_Dd, -pole.dot(_Dd)); if (_Pp.lengthSq() < 1e-8) _Pp.set(0, 0, back ? 1 : -1); _Pp.normalize();
  _E.copy(_S).addScaledVector(_Dd, a).addScaledVector(_Pp, hh);
  _Tt.copy(_S).addScaledVector(_Dd, d);
  _Y.subVectors(_S, _E).normalize(); _B.subVectors(_Tt, _E).normalize();
  _Z.copy(_B).addScaledVector(_Y, -_B.dot(_Y)); if (_Z.lengthSq() < 1e-6) _Z.copy(_Pp).negate(); _Z.normalize(); if (back) _Z.negate();
  _X.crossVectors(_Y, _Z).normalize(); _Z.crossVectors(_X, _Y);
  _q1.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix1) _q1.multiply(fix1);
  _Y.subVectors(_E, _Tt).normalize(); _Z.crossVectors(_X, _Y).normalize();
  _q2.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix2) _q2.multiply(fix2);
  b1.quaternion.copy(_qp).invert().multiply(_q1);
  b2.quaternion.copy(_q1).invert().multiply(_q2);
  return _q2;
 }
 const legFix = legs.map((h, i) => [restFix(knees[i]), restFix(ankles[i])]);

 // ---------- actions (keys inherit from the previous key; u is 0..1 through the action) ----------
 const bump = (a, b, v) => (u) => (u > a && u < b ? v * Math.sin(PI * (u - a) / (b - a)) : 0);
 const G = (o) => Object.assign({}, GUARD, o || {});
 const ONE = { two: 0, lik: 0, lSX: -.25, lSZ: .3, lE: -.45, fL: .35 };
 // the attack
 act('combo', 1.5, [
  K(0, {}),
  K(.1, { pY: -.55, cY: -.25, cX: -.06, y: -.06, br: .6, mo: 1, rPx: -.7, rPy: -.1, rPz: -.6 }, [-.22, 1.45, .12, -.25, .65, -.72, .2, .75, .6]),
  K(.22, { pY: .2, cY: .25, cX: .04, y: -.09, lFz: .24, rPx: -.8, rPy: -.5, rPz: -.2 }, [.06, 1.08, .46, .55, -.2, .81, .7, -.7, 0]),
  K(.3, { pY: .32, cY: .32 }, [.2, .92, .32, .75, -.5, .42]),
  K(.36, { pY: .36, cY: .35 }, [.22, .9, .28, .72, -.45, .35, -.3, .6, .6]),
  K(.45, { pY: -.25, cY: -.25, y: -.05, rPx: -.6, rPy: -.7, rPz: -.2 }, [-.06, 1.25, .46, -.55, .45, .7]),
  K(.53, { pY: -.38, cY: -.3 }, [-.25, 1.42, .25, -.6, .72, -.35]),
  K(.62, { pY: -.42, cY: -.2, cX: -.12, y: -.03, br: .85, rPx: -.7, rPy: -.2, rPz: -.5 }, [-.15, 1.66, .05, .1, .55, -.83, 0, .83, .55]),
  K(.72, { y: -.18, pX: .28, pY: .2, cY: .25, cX: .12, lFz: .44, rFz: -.3, mo: 2, br: 1, rPx: -.8, rPy: -.5, rPz: -.2 }, [.08, .98, .6, .35, -.5, .79]),
  K(.82, { y: -.16, pY: .32, cY: .3, mo: 1 }, [.22, .8, .42, .55, -.8, .25]),
  K(1, READY)
 ], { hits: [.22, .45, .72], dash: bump(.62, .76, 5.5), trail: [[.12, .3], [.33, .54], [.63, .84]] });

 // sword arts
 act('flareCut', 1.7, [
  K(0, {}),
  K(.2, Object.assign({}, ONE, { y: -.14, pY: -.62, cY: -.3, pX: .12, lSX: -.75, lSZ: .35, lE: -.5, fL: .15, br: .8, mo: 1, lFz: .2, rFz: -.18, rPx: -.6, rPy: -.3, rPz: -.7 }), [-.3, .78, -.08, -.35, -.3, -.89, 0, -1, 0]),
  K(.44, { y: -.18, pY: -.66 }, [-.34, .7, -.14, -.3, -.4, -.86]),
  K(.55, { y: -.04, pY: .35, cY: .3, pX: -.02, cX: -.06, lSX: .25, lSZ: .65, lE: -.25, mo: 2, rFz: -.02, rPx: -.8, rPy: -.55, rPz: 0 }, [.08, 1.3, .46, .42, .7, .58]),
  K(.64, { y: 0, pY: .45, cY: .35 }, [.25, 1.62, .18, .3, .94, -.15]),
  K(.85, { two: 1, y: -.04, pY: -.1, cY: .1, mo: 0, br: .3, rFz: -.1 }, [.04, 1.2, .3, .1, .8, .6]),
  K(1, READY)
 ], { hits: [.55], fire: [[.22, .72]], trail: [[.47, .7]] });
 act('sunder', 1.6, [
  K(0, {}),
  K(.22, { y: -.01, pX: -.1, cX: -.14, hX: -.12, pY: -.15, cY: .05, br: .7, mo: 1, lFz: .22, rPx: -.7, rPy: .2, rPz: -.5, lPx: .7, lPy: .2, lPz: -.5 }, [-.04, 1.78, -.02, 0, .3, -.95, 0, .95, .3]),
  K(.44, { y: -.03, lFz: .3 }, [-.04, 1.8, -.06, 0, .2, -.98]),
  K(.58, { y: -.21, pX: .32, cX: .18, hX: .1, mo: 2, br: 1, lFz: .44, rFz: -.26, rPx: -.7, rPy: -.55, rPz: -.1, lPx: .7, lPy: -.55, lPz: -.1 }, [0, .95, .52, 0, -.45, .89]),
  K(.68, { y: -.23 }, [0, .78, .45, 0, -.78, .62]),
  K(.88, { y: -.08, pX: .1, cX: .05, mo: 0, br: .3, lPx: .8, lPy: -.45, lPz: -.25 }, [0, .95, .3, .05, .3, .95]),
  K(1, READY)
 ], { hits: [.58], sparks: [.58], dash: bump(.44, .6, 1.6), trail: [[.46, .7]] });
 const emberKeys = [
  K(0, {}),
  K(.12, Object.assign({}, ONE, { y: -.14, pX: .38, pY: -.1, cY: 0, cX: .1, lSX: .55, lSZ: .25, lE: -.9, fL: .8, br: .8, mo: 1, rFz: -.25, lFz: .25 }), [-.3, .85, -.18, -.25, -.25, -.94, 0, -1, 0]),
  K(.2, { y: -.1, pX: .42, rFz: .22, lFz: -.28, lFy: .14, lFp: .5 }),
  K(.26, { rFz: .3, lFz: -.2, lFy: 0, lFp: 0, rFy: .02 }),
  K(.3, { pY: .32, cY: .25, pX: .2, y: -.12, lSX: -.3, lSZ: .6, lE: -.4, rFy: 0 }, [.12, 1.1, .5, .75, .05, .66]),
  K(.36, { pY: .42 }, [.25, 1.18, .32, .85, .3, -.4]),
  K(.42, { pY: -.3, cY: -.25 }, [-.12, 1.15, .5, -.72, .1, .68]),
  K(.48, { pY: -.36, y: -.06 }, [-.2, 1.55, .15, -.2, .7, -.68]),
  K(.54, { pY: .2, cY: .2, y: -.15 }, [.06, 1.0, .52, .42, -.5, .76]),
  K(.6, { pY: .36 }, [.22, .85, .3, .6, -.55, -.58]),
  K(.66, { pY: -.2, cY: -.15, y: -.04, mo: 2 }, [-.04, 1.32, .5, -.32, .72, .62]),
  K(.78, { pY: -.3, mo: 1 }, [-.2, 1.55, .2, -.3, .9, -.3]),
  K(1, READY)
 ];
 act('emberRush', 2.0, emberKeys, { hits: [.3, .42, .54, .66], dash: (u) => (u < .14 ? 0 : u < .3 ? 8 * sm(.14, .18, u) * (1 - sm(.26, .3, u)) : u < .7 ? 1.2 * (1 - sm(.62, .7, u)) : 0), fire: [[.15, .74]], fireK: .6, trail: [[.27, .72]] });
 act('solarCrest', 2.1, [
  K(0, {}),
  K(.14, { y: -.25, pX: .26, cX: .08, br: .8, mo: 1, lFz: .2, rFz: -.18 }, [-.05, .76, .26, .05, .15, .99]),
  K(.24, { y: .24, pX: .05, cX: 0, rFy: .04, lFy: .06, rFp: .6, lFp: .6 }, [-.04, 1.5, .2, 0, .7, .71]),
  K(.32, { y: .85, rFy: 1.05, lFy: 1.15, rFz: -.06, lFz: .1, rFp: .4, lFp: .3, hX: -.15 }, [-.02, 2.62, .02, 0, .85, -.5, 0, .5, .85]),
  K(.45, { y: 1.4, rFy: 1.62, lFy: 1.72, hX: -.3, cX: -.12, pX: -.08, mo: 2 }, [0, 3.28, -.05, 0, .95, -.3]),
  K(.55, { y: .75, rFy: .55, lFy: .62, hX: 0, cX: .05, pX: .1 }, [0, 2.45, .38, 0, .3, .95]),
  K(.62, { y: -.27, rFy: 0, lFy: 0, rFp: 0, lFp: 0, rFz: -.2, lFz: .3, pX: .35, cX: .15, br: 1 }, [0, .72, .56, 0, -.82, .57]),
  K(.74, { y: -.29, mo: 1 }, [0, .68, .52, 0, -.88, .47]),
  K(.9, { y: -.1, pX: .1, cX: .04, mo: 0, br: .3 }, [-.02, .95, .3, .05, .45, .89]),
  K(1, READY)
 ], { hits: [.62], sparks: [.62], dash: bump(.22, .6, 2.6), trail: [[.47, .7]], fire: [[.3, .68]], flare: [[.36, .56]] });
 act('guardStep', .5, [K(0, {}), K(.4, G({ lFz: .24, y: -.13 })), K(1, G())], { interrupt: true, bi: .06, dash: bump(0, .6, 3.0) });

 // Dawnbreaker
 act('daybreak', 1.9, [
  K(0, {}),
  K(.1, { pY: -.5, cY: -.25, y: -.05, br: .7, mo: 1 }, [-.22, 1.48, .1, -.25, .65, -.72, .2, .75, .6]),
  K(.18, { pY: .2, cY: .25, y: -.09, lFz: .24 }, [.06, 1.08, .46, .55, -.2, .81]),
  K(.25, { pY: .35, cY: .32 }, [.22, .9, .3, .72, -.45, .35]),
  K(.32, { pY: -.25, cY: -.25, y: -.05 }, [-.06, 1.25, .46, -.55, .45, .7]),
  K(.39, { pY: .3, cY: .2 }, [.2, 1.55, .15, .3, .6, -.74]),
  K(.46, { pY: -.22, cY: -.2, y: -.1 }, [-.08, 1.0, .5, -.45, -.45, .77]),
  K(.53, { pY: -.42 }, [-.25, .9, .3, -.7, -.4, -.6]),
  K(.6, { pY: .3, cY: .25, y: -.08 }, [.12, 1.12, .5, .78, .05, .62]),
  K(.7, { y: -.01, pX: -.1, cX: -.14, pY: -.15, cY: .05, lFz: .2, rPx: -.7, rPy: .2, rPz: -.5, lPx: .7, lPy: .2, lPz: -.5 }, [-.04, 1.8, -.02, 0, .35, -.94, 0, .94, .35]),
  K(.8, { y: -.21, pX: .32, cX: .18, mo: 2, br: 1, lFz: .44, rFz: -.26, rPx: -.7, rPy: -.55, rPz: -.1, lPx: .7, lPy: -.55, lPz: -.1 }, [0, .95, .55, 0, -.45, .89]),
  K(.9, { y: -.2, mo: 1 }, [0, .8, .46, 0, -.75, .66]),
  K(1, READY)
 ], { hits: [.18, .32, .46, .6, .8], sparks: [.8], dash: bump(.7, .82, 4), trail: [[.08, .64], [.72, .9]] });
 const hn = [K(0, {})], HS = [
  [{ pY: -.5, cY: -.25 }, [-.22, 1.48, .1, -.25, .65, -.72], { pY: .2, cY: .25, y: -.09 }, [.06, 1.08, .46, .55, -.2, .81]],
  [{ pY: .35, cY: .3 }, [.22, .9, .3, .72, -.45, .35], { pY: -.25, cY: -.25, y: -.05 }, [-.06, 1.25, .46, -.55, .45, .7]],
  [{ pY: .3, cY: .2 }, [.2, 1.55, .15, .3, .6, -.74], { pY: -.22, cY: -.2, y: -.1 }, [-.08, 1.0, .5, -.45, -.45, .77]],
  [{ pY: -.42 }, [-.25, .9, .3, -.7, -.4, -.6], { pY: .3, cY: .25, y: -.08 }, [.12, 1.12, .5, .78, .05, .62]],
  [{ pY: .36 }, [.22, .85, .3, .6, -.55, -.58], { pY: -.2, cY: -.15, y: -.04 }, [-.04, 1.32, .5, -.32, .72, .62]],
  [{ pY: -.42, cY: -.2, cX: -.12 }, [-.15, 1.66, .05, .1, .55, -.83], { y: -.18, pX: .28, pY: .2, cY: .25, cX: .12, mo: 2 }, [.08, .98, .6, .35, -.5, .79]]
 ];
 HS.forEach((h, i) => { const u = .12 + i * .1; hn.push(K(u - .055, Object.assign({ br: .8, mo: 1 }, h[0]), h[1])); hn.push(K(u, h[2], h[3])); });
 hn.push(K(.7, { y: -.2, pX: .2, pY: -.1, cY: .05, cX: .05, two: 1, mo: 1 }, [0, .85, .3, 0, .2, .98]));
 hn.push(K(.77, { y: .04, pX: -.06, cX: -.12, hX: -.35, lFz: .12, rFz: -.12, mo: 1 }, [0, 1.84, .12, 0, 1, .03, 0, 0, 1]));
 hn.push(K(.85, { y: -.24, pX: .3, cX: .2, hX: .04, pY: .25, cY: .15, lFz: .44, rFz: -.34, mo: 2, br: 1 }, [.1, .86, .56, .45, -.45, .77]));
 hn.push(K(.93, { y: -.22, pY: .32, cY: .2 }, [.24, .76, .42, .78, -.4, .48]));
 hn.push(K(1, READY));
 act('highNoon', 3.2, hn, { hits: [.12, .22, .32, .42, .52, .62, .85], dash: (u) => (u > .05 && u < .62 ? .9 : 0), trail: [[.05, .66], [.77, .92]], flare: [[.78, .97]] });
 act('transform', 2.6, [
  K(0, {}),
  K(.2, { y: -.07, hX: .28, pY: -.15, cY: .08, br: .25, bl: .75, mo: 3, rPx: -.7, rPy: -.6, rPz: .1, lPx: .7, lPy: -.6, lPz: .1 }, [0, 1.25, .22, 0, 1, .05, 0, 0, 1]),
  K(.38, { y: -.1, hX: .3 }),
  K(.52, Object.assign({}, ONE, { y: .01, pX: -.08, cX: -.2, hX: -.42, bl: .85, mo: 0, br: 0, lSX: -.05, lSZ: 1.15, lE: -.12, fL: 0, pY: -.1, cY: .05 }), [-.36, .9, .2, -.28, -.6, .75]),
  K(.66, { y: .02, cX: -.22, hX: -.45 }),
  K(.76, { y: -.04, pX: .02, cX: -.04, hX: -.05, bl: 0, lSZ: .5, lSX: -.2, lE: -.3, fL: .1, pY: -.4, cY: -.1 }, [-.42, 1.1, .22, -.8, -.15, .55]),
  K(.86, { two: 1, pY: -.32, cY: .14, rPx: -.8, rPy: -.45, rPz: -.35, lPx: .8, lPy: -.45, lPz: -.25 }, [-.03, 1.0, .3, .06, .55, .83, 0, -.83, .55]),
  K(1, READY)
 ], { flare: [[.18, .7]] });
 act('kestrel', 1.6, [
  K(0, {}),
  K(.2, { two: 0, lik: 1, ltx: .2, lty: 1.42, ltz: .64, lPx: .4, lPy: -.8, lPz: -.4, fL: 0, pY: -.05, cY: .12, hX: -.05, hY: .04, mo: 2, br: .65, rFz: -.18, lFz: .22 }, [-.3, .88, .18, -.15, -.45, .88, 0, -1, 0]),
  K(.6, { mo: 2, lty: 1.45 }),
  K(.75, { mo: 0, br: .3 }),
  K(1, READY)
 ]);

 // Kestrel Stoop, turn one: she crouches, springs about 3 m up and hangs there like a kestrel, her cape spread like wings,
 // her braid streaming, her sword drawn back over her shoulder, bobbing slowly over a faint amber updraft until she stoops.
 const UP = 2.95;
 const HOVER = Object.assign({}, READY, { y: UP, pX: .2, pY: -.12, cX: .08, cY: .06, hX: -.1, hY: .06,
  rFx: -.13, rFy: UP + .22, rFz: -.2, rFr: -.2, rFp: .55, lFx: .13, lFy: UP + .3, lFz: -.02, lFr: .15, lFp: .7,
  two: 0, lik: 0, lbl: 0, lSX: .2, lSY: 0, lSZ: .9, lE: -.35, fL: .25, rPx: -.5, rPy: .25, rPz: -.8, cs: 1, bs: 1, br: .55, mo: 0 });
 const HSW = [-.2, 1.6 + UP, -.1, -.12, .42, -.9, 0, .9, .42];
 const hsw = (dy) => [HSW[0], HSW[1] + dy, HSW[2], HSW[3], HSW[4], HSW[5], HSW[6], HSW[7], HSW[8]];
 act('stoopRise', 1.4, [
  K(0, {}),
  K(.16, Object.assign({}, ONE, { y: -.26, pX: .38, cX: .16, hX: -.05, rFz: -.2, lFz: .2, br: .7, mo: 1, cs: .15, rPx: -.5, rPy: .2, rPz: -.7 }), [-.24, 1.28, -.12, -.2, .5, -.84, 0, .84, .5]),
  K(.3, { y: .14, pX: -.12, cX: -.1, hX: -.2, rFp: .5, lFp: .45, rFy: .02, lFy: .04, cs: .4, bs: .3, mo: 2 }, [-.2, 1.76, -.1, -.12, .45, -.88, 0, .88, .45]),
  K(.5, { y: 2.2, pX: .1, cX: .04, hX: -.15, rFy: 2.45, lFy: 2.5, rFz: -.15, lFz: -.05, rFp: .5, lFp: .6, lSX: .2, lSZ: .8, cs: .85, bs: .8, mo: 1 }, hsw(2.2 - UP)),
  K(.7, Object.assign({}, HOVER, { y: UP + .1, rFy: UP + .32, lFy: UP + .4 }), hsw(.1)),
  K(1, HOVER, HSW)
 ], { hold: true, interrupt: false, bi: .1, updraft: [[.32, 1.2]],
  post: (u, P, t) => { if (u < .62) return; const k = sm(.62, .9, u), b = .055 * Math.sin(t * 2.1) * k; for (const c of ['y', 'rFy', 'lFy', 'gy', 'lty']) P[c] += b; P.pX += .03 * Math.sin(t * 2.1 + 1.2) * k; P.pZ += .025 * Math.sin(t * 1.3) * k; } });
 // turn two: she folds and dives sword-first at state.target (dash carries her there), lands the biggest blow in the game
 // with a sunburst and a splash of sparks, and rises out of the landing crouch
 let stoopD = 2.5;
 act('stoop', 1.4, [
  K(0, HOVER, HSW),
  K(.1, { y: UP + .12, pX: .5, cX: .25, hX: -.35, rFy: UP + .45, lFy: UP + .5, rFz: -.3, lFz: -.22, two: 1, cs: .4, bs: .2, br: .9, mo: 1, rPx: -.8, rPy: -.45, rPz: -.35, lPx: .8, lPy: -.45, lPz: -.25 }, [0, 1.37 + UP, .3, 0, .55, .83, 0, .83, -.55]),
  K(.24, { y: 1.8, pX: 1.05, cX: .32, hX: -.75, rFy: 2.62, lFy: 2.7, rFz: -.78, lFz: -.66, rFp: .9, lFp: .9, cs: 0, bs: 0, mo: 2 }, [0, 2.62, .62, 0, -.7, .71, 0, .71, .7]),
  K(.36, { y: .7, pX: .95, cX: .3, hX: -.68, rFy: 1.38, lFy: 1.3, rFz: -.68, lFz: -.42, rFp: .6, lFp: .5 }, [0, 1.52, .66, 0, -.62, .78]),
  K(.45, { y: -.32, pX: .42, cX: .22, hX: -.1, rFy: 0, lFy: 0, rFz: -.36, lFz: .36, rFp: 0, lFp: 0, br: 1, mo: 2 }, [0, .98, .58, 0, -.36, .93]),
  K(.6, { y: -.36, pX: .45, cX: .24, hX: 0, mo: 1 }, [0, .88, .54, 0, -.62, .78]),
  K(.82, { y: -.14, pX: .16, cX: .08, br: .4, mo: 0, rFz: -.2, lFz: .22 }, [-.02, .95, .32, .05, .4, .92]),
  K(1, READY)
 ], { hits: [.45], sparks: [.45], sparkN: 40, burst: .45, aim: true, fire: [[.08, .48]], fireK: .7, trail: [[.1, .5]],
  dash: (u) => (u > .1 && u < .45 ? stoopD * PI / (2 * 1.4 * .35) * Math.sin(PI * (u - .1) / .35) : 0) });

 // reactions
 act('hurt', .6, [
  K(0, {}),
  K(.18, { pX: -.3, cX: -.26, hX: -.42, y: -.09, two: 0, lik: 0, lSX: -1.5, lSZ: .55, lE: -.75, fL: .1, mo: 2, br: 1, bl: .5 }, [-.24, 1.0, .16, -.5, -.2, .84]),
  K(.45, { pX: -.05, cX: -.05, hX: 0, mo: 3, bl: .2 }),
  K(1, READY)
 ], { interrupt: true, bi: .05, dash: (u) => (u < .4 ? -2.2 * Math.sin(PI * u / .4) : 0) });
 act('block', .45, [K(0, {}), K(.3, G({ y: -.14, pX: .04, cX: .0, mo: 1 })), K(.7, G()), K(1, READY)], { interrupt: true, bi: .05, dash: (u) => (u < .35 ? -1.2 * Math.sin(PI * u / .35) : 0) });
 const KNEEL = { y: -.43, pX: .26, pY: -.12, cX: .16, cY: .05, hX: .38, hY: 0, mo: 3, bl: .6, br: .6, rFx: -.12, rFz: -.4, rFy: 0, rFp: 1.3, rFr: -.15, lFx: .13, lFz: .34, lFr: .1, two: 0, lik: 1, ltx: .14, lty: .58, ltz: .3, lPx: .7, lPy: .1, lPz: -.6, fL: .6, rPx: -.6, rPy: -.3, rPz: -.5, gx: .02, gy: .74, gz: .38, dx: .02, dy: -1, dz: .06, ex: 0, ey: 0, ez: 1 };
 act('kneel', 1.4, [K(0, {}), K(.3, { pX: -.1, y: -.1, mo: 2, bl: .5, br: 1 }), K(.65, KNEEL), K(1, { cX: .21, hX: .46 })], { hold: true, interrupt: true });
 act('rise', 1.0, [K(0, Object.assign({}, KNEEL, { cX: .21, hX: .46 })), K(.5, { y: -.2, rFz: -.22, rFp: .4, rFx: -.14, pX: .15, cX: .08, hX: .1, lik: 0, two: 1, mo: 3, bl: .2 }, [-.02, .9, .3, .05, .4, .92]), K(1, READY)], { bi: .22 });
 act('victory', 2.0, [
  K(0, {}),
  K(.25, Object.assign({}, ONE, { pY: -.45, cY: -.2, y: -.05 }), [-.42, 1.0, .26, -.7, -.35, .62]),
  K(.45, { pY: -.35, cY: -.1 }, [-.36, 1.45, .2, -.3, .9, .3]),
  K(.65, { pY: -.25, cY: .12, y: -.03, lik: 1, ltx: .17, lty: .98, ltz: .02, lPx: .8, lPy: 0, lPz: -.6, fL: .7, hY: .16, hZ: .08, hX: -.04, mo: 0, br: 0, rFz: -.08, lFz: .12, rPx: -.6, rPy: -.7, rPz: .2 }, [-.1, 1.28, .22, -.3, .6, -.74, 0, .6, .8]),
  K(1, { hZ: .1 })
 ], { hold: true });

 // ---------- secondary motion: spring chains on 1/120 s substeps, with body colliders ----------
 const DOWN = new THREE.Vector3(0, -1, 0), PH = 1 / 120;
 const COL = []; for (let i = 0; i < 10; i++) COL.push({ a: new THREE.Vector3(), b: new THREE.Vector3(), r: 0, seg: false });
 function updateColliders() {
  chest.localToWorld(COL[0].a.set(0, .07, -.005)); COL[0].r = .152;
  spine.localToWorld(COL[1].a.set(0, 0, -.005)); COL[1].r = .128;
  pelvis.localToWorld(COL[2].a.set(0, -.05, -.005)); COL[2].r = .16;
  for (let i = 0; i < 2; i++) {
   legs[i].getWorldPosition(COL[3 + i].a); knees[i].getWorldPosition(COL[3 + i].b); COL[3 + i].r = .092; COL[3 + i].seg = true;
   knees[i].getWorldPosition(COL[5 + i].a); ankles[i].getWorldPosition(COL[5 + i].b); COL[5 + i].r = .07; COL[5 + i].seg = true;
   arms[i].getWorldPosition(COL[7 + i].a); elbows[i].getWorldPosition(COL[7 + i].b); COL[7 + i].r = .075; COL[7 + i].seg = true;
  }
  head.localToWorld(COL[9].a.set(0, .11, 0)); COL[9].r = .13;
 }
 const _ca = new THREE.Vector3(), _cb = new THREE.Vector3();
 function collide(p, v, ids, m) {
  for (const k of ids) {
   const c = COL[k];
   if (c.seg) { _cb.subVectors(c.b, c.a); const t = cl(_ca.subVectors(p, c.a).dot(_cb) / Math.max(1e-8, _cb.lengthSq()), 0, 1); _ca.copy(c.a).addScaledVector(_cb, t); } else _ca.copy(c.a);
   _cb.subVectors(p, _ca); const d = _cb.length(), R = c.r + m;
   if (d < R) { if (d < 1e-6) _cb.set(0, 0, -1); else _cb.multiplyScalar(1 / d); p.copy(_ca).addScaledVector(_cb, R); const vn = v.dot(_cb); if (vn < 0) v.addScaledVector(_cb, -vn); }
  }
 }
 function chain(bs, tip, o) {
  const offs = bs.slice(1).map((b) => b.position.clone()); offs.push(tip.clone());
  return Object.assign({ bs, offs, L: offs.map((v) => v.length()), p: offs.map(() => new THREE.Vector3()), v: offs.map(() => new THREE.Vector3()), T: offs.map(() => new THREE.Vector3()), rest: bs.map(() => new THREE.Quaternion()), K: 40, C: 5, gk: .4, cols: [], m: .02, breeze: 0, init: false }, o);
 }
 const chBraid = chain(braid, new THREE.Vector3(0, -.096, 0), { K: 42, C: 4.2, gk: .55, cols: [0, 1, 2, 9], m: .03, breeze: .006 });
 const chCape = capeU.map((b, k) => chain([b, capeL[k]], capeTip[k], { K: 36, C: 4.6, gk: .45, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8], m: .032, breeze: .012, wing: new THREE.Vector3((k - 2) * .55, -.55 + .22 * Math.abs(k - 2), -.75 + .2 * Math.abs(k - 2)).normalize() }));
 const chTabF = chain(tabF, new THREE.Vector3(0, -.4, .004), { K: 46, C: 5.5, gk: .6, cols: [3, 4, 5, 6], m: .022, breeze: .004 });
 const chTabB = chain(tabB, new THREE.Vector3(0, -.35, -.004), { K: 46, C: 5.5, gk: .6, cols: [2, 3, 4, 5, 6], m: .02 });
 const TT = [[-.02, -.07, .006], [.02, -.07, .006], [.02, -.05, .05], [0, -.03, -.075]];
 const chTuft = tufts.map((b, i) => chain([b], new THREE.Vector3(TT[i][0], TT[i][1], TT[i][2]), { K: 58, C: 5.5, gk: .12, hair: true }));
 const chPauld = chain([pauld], new THREE.Vector3(.012, -.13, 0), { K: 60, C: 5, gk: .08 });
 const CHAINS = [chBraid, ...chCape, chTabF, chTabB, ...chTuft, chPauld];
 const _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _cq4 = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cw = new THREE.Vector3(), _cj = new THREE.Vector3();
 function physics(t, dt, tk, reset) {
  updateColliders();
  let ci = 0;
  const fl = Math.max(tk, cl(FIN.bs, 0, 1)), wing = cl(FIN.cs, 0, 1);
  if (wing > .001) chest.getWorldQuaternion(_cq4);
  for (const ch of CHAINS) {
   ci++;
   const gk = ch === chBraid ? lerp(ch.gk, -.3, fl) : ch.hair ? lerp(ch.gk, -.55, fl) : ch.gk;
   ch.bs[0].getWorldPosition(_cj);
   for (let i = 0; i < ch.bs.length; i++) {
    ch.bs[i].getWorldQuaternion(_cq); _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize().lerp(DOWN, gk);
    if (ch.wing && wing > .001) _cv.lerp(_cw.copy(ch.wing).applyQuaternion(_cq4), wing * (i ? .85 : .7));
    if (ch.breeze) { const bz = ch.breeze * (ch === chBraid ? 1 + 3 * fl : 1); _cv.x += bz * Math.sin(t * 1.3 + ci * .9 + i); _cv.z += bz * .7 * Math.sin(t * .9 + ci * 1.7 + i * .5); }
    _cv.normalize(); ch.T[i].copy(_cj).addScaledVector(_cv, ch.L[i]); _cj.copy(ch.T[i]);
   }
   if (!ch.init || reset) { for (let i = 0; i < ch.p.length; i++) { ch.p[i].copy(ch.T[i]); ch.v[i].set(0, 0, 0); } ch.init = true; }
  }
  if (dt > 0) {
   const n = Math.max(1, Math.ceil(dt / PH - 1e-6)), h = dt / n;
   for (const ch of CHAINS) {
    const p = ch.p, v = ch.v, T = ch.T, K = ch.K, C = ch.C;
    for (let s = 0; s < n; s++) {
     for (let i = 0; i < p.length; i++) { v[i].x += (K * (T[i].x - p[i].x) - C * v[i].x) * h; v[i].y += (K * (T[i].y - p[i].y) - C * v[i].y) * h; v[i].z += (K * (T[i].z - p[i].z) - C * v[i].z) * h; p[i].addScaledVector(v[i], h); }
     ch.bs[0].getWorldPosition(_cj);
     for (let i = 0; i < p.length; i++) { _cv.subVectors(p[i], _cj); const L = _cv.length() || 1; p[i].copy(_cj).addScaledVector(_cv, ch.L[i] / L); if (ch.cols.length) collide(p[i], v[i], ch.cols, ch.m); _cj.copy(p[i]); }
    }
   }
  }
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) {
   const b = ch.bs[i]; b.getWorldPosition(_cj); b.getWorldQuaternion(_cq);
   _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize(); _cw.subVectors(ch.p[i], _cj).normalize();
   _cq2.setFromUnitVectors(_cv, _cw); _cq3.copy(_cq).invert().multiply(_cq2).multiply(_cq);
   b.quaternion.multiply(_cq3); b.updateMatrixWorld(true);
  }
 }

 // ---------- applying a pose: FK spine, IK legs onto foot targets, IK arms onto the sword ----------
 const qRoot = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _eu = new THREE.Euler(), _g = new THREE.Vector3(), _dw = new THREE.Vector3(), _ew = new THREE.Vector3(), _xs = new THREE.Vector3();
 const _qs = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _wp = new THREE.Vector3(), _pole = new THREE.Vector3(), _tg = new THREE.Vector3(), _lq = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()], _tq = new THREE.Quaternion();
 const QG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), QGI = QG.clone().invert();
 const GP = new THREE.Vector3().setFromMatrixPosition(GRIP), GPL = new THREE.Vector3(-GP.x, GP.y, GP.z - .02), LFC = new THREE.Vector3(0, -.095, 0);
 const LT = knees[0].position.length(), LS = ankles[0].position.length(), LU = elbows[0].position.length(), LFa = wrists[0].position.length();
 function setFingers(i, c) {
  const s = i === 0 ? 1 : -1;
  fing[i][0].rotation.set(0, 0, s * 1.3 * c); fing[i][1].rotation.set(0, 0, s * 1.5 * c); fing[i][2].rotation.set(0, 0, s * .95 * c);
  thumb[i][0].rotation.set(.3 * c, -s * .2 * c, s * .6 * c); thumb[i][1].rotation.set(0, 0, s * .75 * c);
 }
 function applyPose(P) {
  pelvis.position.set(P.x, .97 + P.y, P.z); pelvis.rotation.set(P.pX, P.pY, P.pZ, 'YXZ');
  spine.rotation.set(P.sX, P.sY, P.sZ, 'YXZ'); chest.rotation.set(P.cX, P.cY, P.cZ, 'YXZ');
  neck.rotation.set(P.nX, P.nY, 0, 'YXZ'); head.rotation.set(P.hX, P.hY, P.hZ, 'YXZ');
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) ch.bs[i].quaternion.copy(ch.rest[i]);
  arms[1].rotation.set(P.lSX, P.lSY, P.lSZ); elbows[1].rotation.set(P.lE, 0, 0); wrists[1].rotation.set(P.lWX, 0, P.lWZ);
  root.updateMatrixWorld(true); root.getWorldQuaternion(qRoot);
  for (let i = 0; i < 2; i++) {
   const c = i ? 'l' : 'r', fr = P[c + 'Fr'], fp = P[c + 'Fp'], up = Math.max(0, fp);
   _tg.set(P[c + 'Fx'], P[c + 'Fy'] + .085 * Math.cos(fp) + .13 * Math.sin(up), P[c + 'Fz'] - .13 * (1 - Math.cos(up)));
   root.localToWorld(_tg);
   _pole.set(Math.sin(fr) + (i ? .12 : -.12), 0, Math.cos(fr)).applyQuaternion(qRoot);
   const q2 = ik2(legs[i], knees[i], LT, LS, _tg, _pole, true, legFix[i][0], legFix[i][1]);
   _qa.setFromEuler(_eu.set(fp, fr, 0, 'YXZ')).premultiply(qRoot);
   ankles[i].quaternion.copy(q2).invert().multiply(_qa);
   toes[i].rotation.set(-up * .85, 0, 0);
  }
  _g.set(P.gx, P.gy, P.gz); root.localToWorld(_g);
  _dw.set(P.dx, P.dy, P.dz).normalize().applyQuaternion(qRoot);
  _ew.set(P.ex, P.ey, P.ez).applyQuaternion(qRoot); _ew.addScaledVector(_dw, -_ew.dot(_dw));
  if (_ew.lengthSq() < 1e-6) { _ew.set(0, -1, 0).addScaledVector(_dw, _dw.y); if (_ew.lengthSq() < 1e-6) _ew.set(0, 0, 1); }
  _ew.normalize(); _xs.crossVectors(_dw, _ew);
  _qs.setFromRotationMatrix(_mm.makeBasis(_xs, _dw, _ew)); _qw.copy(_qs).multiply(QGI);
  _tg.copy(GP).applyQuaternion(_qw); _tg.subVectors(_g, _tg);
  _pole.set(P.rPx, P.rPy, P.rPz).applyQuaternion(qRoot);
  let q2 = ik2(arms[0], elbows[0], LU, LFa, _tg, _pole, false);
  wrists[0].quaternion.copy(q2).invert().multiply(_qw);
  const wI = Math.max(P.two, P.lik);
  if (wI > .001) {
   _lq[0].copy(arms[1].quaternion); _lq[1].copy(elbows[1].quaternion); _lq[2].copy(wrists[1].quaternion);
   const onHilt = P.two >= P.lik;
   if (onHilt) { _tg.copy(LFC).applyQuaternion(_qs).add(_g); _tg.sub(_wp.copy(GPL).applyQuaternion(_qw)); }
   else {
    _tg.set(P.ltx, P.lty, P.ltz); root.localToWorld(_tg);
    if (P.lbl > 0) { _wp.copy(_g).addScaledVector(_dw, .5).addScaledVector(_ew, -.05); _tg.lerp(_wp, cl(P.lbl, 0, 1)); }
   }
   _pole.set(P.lPx, P.lPy, P.lPz).applyQuaternion(qRoot);
   q2 = ik2(arms[1], elbows[1], LU, LFa, _tg, _pole, false);
   if (onHilt) wrists[1].quaternion.copy(q2).invert().multiply(_qw);
   if (wI < .999) for (const [b, q] of [[arms[1], _lq[0]], [elbows[1], _lq[1]], [wrists[1], _lq[2]]]) { _tq.copy(b.quaternion); b.quaternion.copy(q).slerp(_tq, wI); }
  }
  setFingers(0, P.fR); setFingers(1, Math.max(P.fL, P.two));
  root.updateMatrixWorld(true);
 }

 // ---------- base layer: idle stance with breath, walk/run cycle, guard ----------
 const BP = {}, WP = {}, GP2 = {}, AP = {}, AP2 = {}, AP3 = {}, FIN = {}, SNAP = {};
 cp(FIN, READY); cp(SNAP, READY);
 const HALF = PI / 4.4;
 function idlePose(t, out) {
  cp(out, READY); const b = Math.sin(t * 2.0);
  out.cX += .012 * b; out.gy += .008 * Math.sin(t * 2.0 - .6); out.gz += .004 * b; out.y += .004 * Math.sin(t * 2.0 + 1);
  out.x = .008 * Math.sin(t * .6); out.pZ = .012 * Math.sin(t * .6); out.hY += .04 * Math.sin(t * .37);
  return out;
 }
 function walkPose(phase, spd, out) {
  cp(out, READY);
  const run = sm(2.6, 4.2, spd), zs = [0, 0];
  for (let i = 0; i < 2; i++) {
   const ph = ((phase + (i ? PI : 0)) % TAU + TAU) % TAU, s = ph / PI, c = i ? 'l' : 'r';
   let z, y, p;
   if (s < 1) { z = lerp(HALF / 2, -HALF / 2, s); y = 0; p = .55 * sm(.7, 1, s); }
   else { const q = s - 1; z = lerp(-HALF / 2, HALF / 2, sm(0, 1, q)); y = (.09 + .08 * run) * Math.sin(PI * q); p = lerp(.55, -.25, sm(0, .7, q)) * (1 - sm(.85, 1, q)); }
   zs[i] = z; out[c + 'Fx'] = i ? .1 : -.1; out[c + 'Fz'] = z; out[c + 'Fy'] = y; out[c + 'Fp'] = p; out[c + 'Fr'] = i ? .08 : -.08;
  }
  const sw = (zs[0] - zs[1]) / HALF;
  out.y = -.055 + .03 * Math.abs(Math.sin(phase)) - .03 * run;
  out.pX = .06 + .14 * run; out.cX = .02 + .06 * run; out.hX = -.03 - .06 * run;
  out.pY = .12 * sw; out.sY = -.05 * sw; out.cY = -.12 * sw; out.hY = .03 * sw; out.nY = 0; out.pZ = .035 * Math.cos(phase);
  out.two = 0; out.lik = 0; out.fL = .35; out.br = .1; out.mo = 0;
  out.lSX = -.42 * sw * (1 + .6 * run); out.lSY = 0; out.lSZ = .14; out.lE = -.35 - .25 * Math.max(0, sw) - .9 * run;
  const d = D3(-.12, -.42 + .3 * run, .9 - 1.4 * run);
  out.gx = -.25; out.gy = .86 + .06 * run; out.gz = .1 - .09 * sw * (1 - run) - .1 * run; out.dx = d[0]; out.dy = d[1]; out.dz = d[2]; out.ex = 0; out.ey = -1; out.ez = 0;
  out.rPx = -.6; out.rPy = -.3; out.rPz = -.75;
  return out;
 }
 // the leading edge turns toward the swing direction when the blade moves fast
 const _ev = new THREE.Vector3(), _ed = new THREE.Vector3(), _e2 = new THREE.Vector3(), _e3 = new THREE.Vector3();
 function edgeLead(def, u, P) {
  const du = .012; evalKeys(def, Math.min(1, u + du), AP3);
  _ev.set(AP3.gx + AP3.dx * .9 - P.gx - P.dx * .9, AP3.gy + AP3.dy * .9 - P.gy - P.dy * .9, AP3.gz + AP3.dz * .9 - P.gz - P.dz * .9).multiplyScalar(1 / (du * def.dur));
  const sp = _ev.length(); if (sp < 1.2) return;
  _ed.set(P.dx, P.dy, P.dz).normalize(); _ev.addScaledVector(_ed, -_ev.dot(_ed)); if (_ev.lengthSq() < 1e-6) return; _ev.normalize();
  _e2.set(P.ex, P.ey, P.ez).addScaledVector(_ed, -P.ex * _ed.x - P.ey * _ed.y - P.ez * _ed.z); if (_e2.lengthSq() < 1e-6) _e2.copy(_ev); _e2.normalize();
  const ang = Math.atan2(_e3.crossVectors(_e2, _ev).dot(_ed), _e2.dot(_ev)) * sm(1.2, 3.5, sp);
  _e3.crossVectors(_ed, _e2); _e2.multiplyScalar(Math.cos(ang)).addScaledVector(_e3, Math.sin(ang));
  P.ex = _e2.x; P.ey = _e2.y; P.ez = _e2.z;
 }

 // ---------- per-frame update ----------
 const state = { heat: 0, sunburn: 0, trance: 0 };
 const st = { init: false, px: 0, pz: 0, ry: 0, ph: 0, spd: 0 };
 let actv = null, gOn = false, gW = 0, dashV = 0, liftV = 0, fadeV = 1, prevU = 0, eAcc = 0, uAcc = 0, trOn = 0, rbT = 0;
 let blinkIn = 2, blinkT = -1, lookT = 1.2, gzX = 0, gzY = 0, gzTX = 0, gzTY = 0, mCur = 0, mNext = 0, mK = 1;
 const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3();
 const AMB = new THREE.Color(1.0, .45, .08), WHT = new THREE.Color(1.0, .92, .76), STL = M.steel.emissive.clone(), _col = new THREE.Color();
 const winK = (list, u) => { let k = 0; if (list) for (const r of list) k = Math.max(k, sm(r[0] - .03, r[0] + .02, u) * (1 - sm(r[1] - .03, r[1] + .02, u))); return k; };
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  root.updateMatrixWorld();
  // a teleport or a sudden turn (a model sheet's view) settles the cloth and hair at once instead of whipping them round
  const rx = root.position.x, rz = root.position.z, ry = root.rotation.y, jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2 || Math.abs(Math.atan2(Math.sin(ry - st.ry), Math.cos(ry - st.ry))) > .6;
  if (dt > 0 && st.init) st.spd += (Math.abs(phase - st.ph) / 4.4 / dt - st.spd) * Math.min(1, dt * 6);
  st.px = rx; st.pz = rz; st.ry = ry; st.ph = phase; st.init = true;
  gW += ((gOn ? 1 : 0) - gW) * (1 - Math.exp(-(dt || .016) * 9));
  walk = cl(walk || 0, 0, 1);
  idlePose(t, BP);
  if (walk > .001) mix(BP, walkPose(phase, st.spd, WP), walk);
  if (gW > .001) { cp(GP2, GUARD); GP2.cX += .01 * Math.sin(t * 2.2); mix(BP, GP2, gW * (1 - .6 * walk)); }
  let u = 0, def = null, W = 0;
  if (actv) {
   actv.t += dt; def = actv.def; u = Math.min(1, actv.t / def.dur);
   if (u >= 1 && !def.hold) { actv = null; def = null; u = 0; }
  }
  if (def) {
   evalKeys(def, u, AP); edgeLead(def, u, AP); if (def.post) def.post(u, AP, t);
   cp(AP2, SNAP); mix(AP2, AP, sm(0, actv.bi, actv.t));
   W = def.hold ? 1 : 1 - sm(def.dur - def.bo, def.dur, actv.t);
   cp(FIN, BP); mix(FIN, AP2, W);
  } else if (rbT > 0) { rbT -= dt; cp(FIN, SNAP); mix(FIN, BP, 1 - Math.max(0, rbT) / .18); } else cp(FIN, BP);
  dashV = def && def.dash ? def.dash(u) * W : 0;
  liftV = Math.max(0, FIN.y + .045);
  applyPose(FIN);
  const tk = cl(+state.trance || 0, 0, 1);
  physics(t, dt, tk, jump);
  // face: blinks, gaze, brows, painted mouth shapes cross-faded
  if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2 + rnd() * 3.5; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const k = blinkT / .17; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) blinkT = -1; }
  eyeMesh.morphTargetInfluences[0] = Math.max(bk, cl(FIN.bl, 0, 1));
  eyeMesh.morphTargetInfluences[1] = cl(FIN.br, 0, 1);
  lookT -= dt; if (lookT <= 0) { lookT = .8 + rnd() * 2.2; gzTX = (rnd() - .5) * .004; gzTY = (rnd() - .5) * .002; }
  const gx = def ? 0 : gzTX, gy = def ? -.0006 : gzTY; gzX += (gx - gzX) * Math.min(1, dt * 20); gzY += (gy - gzY) * Math.min(1, dt * 20);
  setGaze(gzX, gzY + .0006);
  const mo = Math.round(FIN.mo);
  if (mo !== mNext) { mCur = mK > .5 ? mNext : mCur; mNext = mo; mK = 0; }
  mK = Math.min(1, mK + (dt || .016) * 14); if (mK >= 1) mCur = mNext;
  M.mouth.map.offset.x = mCur * .25; M.mouth2.map.offset.x = mNext * .25;
  M.mouth.opacity = (mCur === mNext ? 1 : 1 - mK) * fadeV; M.mouth2.opacity = (mCur === mNext ? 0 : mK) * fadeV;
  updateFX(def, u, t, dt, tk);
  prevU = u;
 }
 function updateFX(def, u, t, dt, tk) {
  swordMatrix();
  _p1.copy(TIP).applyMatrix4(swM); _p2.copy(MIDB).applyMatrix4(swM); _p3.copy(STONE).applyMatrix4(swM); _p4.copy(BASEB).applyMatrix4(swM);
  const heat = cl(+state.heat || 0, 0, 1), sb = state.sunburn ? 1 : 0, k1 = sm(.05, .7, heat), k2 = Math.max(sm(.7, 1, heat), tk);
  const trK = def ? winK(def.trail, u) : 0, fiK = def ? winK(def.fire, u) * (def.fireK || 1) : 0, flK = def ? winK(def.flare, u) : 0;
  // sunsteel glows amber-gold at rest, brighter with Heat, white-hot in Sunburn and the trance
  _col.copy(AMB).lerp(WHT, k2).multiplyScalar(.55 + .8 * k1 + .6 * k2 + .6 * fiK + .6 * flK); M.edge.emissive.copy(_col);
  M.steel.emissive.copy(STL).lerp(_col.set(.62, .32, .07), Math.max(.5 * k1, fiK * .6)).lerp(WHT, .45 * k2);
  RIM.k.value = .1 + .08 * k1 + .3 * tk + .2 * flK;
  M.stone.emissiveIntensity = .55 + 1.2 * heat + 1.0 * tk + fiK + flK;
  bladeGlow.position.copy(_p2); bladeGlow.scale.setScalar(.55 + .35 * k1 + .35 * tk + .3 * fiK); bladeGlow.material.opacity = (.1 + .2 * k1 + .22 * k2 + .35 * fiK) * fadeV;
  bladeGlow.material.color.copy(AMB).lerp(WHT, k2 * .7);
  stoneGlow.position.copy(_p3); stoneGlow.scale.setScalar(.16 + .12 * heat + .1 * tk); stoneGlow.material.opacity = (.32 + .35 * heat + .3 * tk) * fadeV;
  tipFlare.position.copy(_p1); tipFlare.scale.setScalar(.2 + 1.5 * flK); tipFlare.material.opacity = flK * fadeV;
  shimmer.position.copy(_p2).y += .12; shimmer.scale.set(.36 + .03 * Math.sin(t * 4.3), .95 + .06 * Math.sin(t * 5.1), 1); shimmer.material.rotation = .05 * Math.sin(t * 3.7); shimmer.material.opacity = (.5 * sm(.7, 1, heat) + .15 * tk) * fadeV;
  chest.localToWorld(aura.position.set(0, .0, .02)); aura.scale.setScalar(2.1 + .08 * Math.sin(t * 3.1)); aura.material.opacity = .22 * sb * (.85 + .15 * Math.sin(t * 7.3)) * fadeV;
  chest.localToWorld(halo.position.set(0, .24, -.34)); halo.scale.setScalar(1.25 + .04 * Math.sin(t * 2)); halo.material.opacity = Math.min(1, .7 * tk + .35 * flK) * fadeV; halo.material.rotation = t * .12;
  sunL.position.copy(_p2); sunL.color.copy(AMB).lerp(WHT, k2); sunL.intensity = (.3 * k1 + .9 * tk + 1.2 * fiK + 1.2 * flK) * fadeV;
  // Kestrel Stoop: a faint amber updraft beneath her while she hangs in the air, a sunburst where she lands
  const upK = def && def.updraft ? winK(def.updraft, u) : 0;
  pelvis.getWorldPosition(_pw);
  updraft.position.set(_pw.x, liftV * .5 + .05, _pw.z); updraft.scale.set(.8 + .06 * Math.sin(t * 3.1), liftV + .3, 1); updraft.material.opacity = .7 * upK * (.85 + .15 * Math.sin(t * 4.3)) * fadeV; updraft.material.rotation = .04 * Math.sin(t * 2.3);
  const bu = def && def.burst !== undefined ? (u - def.burst) / .2 : -1, bk = bu >= 0 && bu < 1 ? 1 - bu : 0;
  burst.position.copy(_p1); burst.scale.setScalar(.5 + 2.8 * Math.sqrt(Math.max(0, bu))); burst.material.opacity = bk * bk * fadeV; burst.material.rotation = t * .5;
  if (bk > 0) { tipFlare.position.copy(_p1); tipFlare.scale.setScalar(.3 + 1.6 * bk); tipFlare.material.opacity = Math.max(tipFlare.material.opacity, bk * fadeV); sunL.intensity = Math.max(sunL.intensity, 2.2 * bk * fadeV); }
  // trail
  const on = trK > .01 || fiK > .2;
  if (on && trOn === 0) for (let i = 0; i < TRN; i++) { trTip[i].copy(_p1); trMid[i].copy(_p2); }
  trOn = on ? Math.max(trK, fiK) : 0; trail.visible = on;
  if (on && dt > 0) {
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   trTip[0].copy(_p1); trMid[0].copy(_p2);
  }
  if (on) {
   _col.copy(AMB).lerp(WHT, Math.max(k2, .25));
   const fr = fiK > .1;
   for (let i = 0; i < TRN; i++) {
    const k = trOn * Math.pow(1 - i / (TRN - 1), 1.5) * fadeV, a = trTip[i], b = trMid[i];
    trPos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    if (fr) trCol.set([k, .55 * k, .12 * k, .5 * k, .12 * k, .02 * k], i * 6);
    else trCol.set([_col.r * k, _col.g * k, _col.b * k, .3 * _col.r * k, .3 * _col.g * k, .3 * _col.b * k], i * 6);
   }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
  // embers from the blade, sparks at impacts
  if (dt > 0) {
   eAcc += dt * (70 * fiK + 10 * sm(.85, 1, heat) + 14 * tk * (.3 + trK));
   while (eAcc >= 1) { eAcc -= 1; const s = rnd(); _p3.copy(_p4).lerp(_p1, s); emit(_p3, (rnd() - .5) * .5, .35 + rnd() * .7, (rnd() - .5) * .5, .6 + rnd() * .7); }
   if (upK > .05) { uAcc += dt * 16 * upK; while (uAcc >= 1) { uAcc -= 1; _p3.set(_pw.x + (rnd() - .5) * .7, rnd() * liftV * .8, _pw.z + (rnd() - .5) * .7); emit(_p3, (rnd() - .5) * .2, 1.2 + rnd() * 1.4, (rnd() - .5) * .2, .8 + rnd() * .8); } }
   if (def && def.sparks) for (const h of def.sparks) if (prevU < h && u >= h) for (let i = 0; i < (def.sparkN || 18); i++) { const a = rnd() * TAU, sp = .8 + rnd() * 2.2; emit(_p1, Math.cos(a) * sp, .6 + rnd() * 2.0, Math.sin(a) * sp, .3 + rnd() * .2); }
   stepEmbers(dt);
  }
  embers.material.opacity = fadeV;
 }

 // ---------- public interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && !force && !def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  if (def.aim) { const T = state.target, yaw = root.rotation.y; stoopD = 2.5; if (T && isFinite(T.x) && isFinite(T.z)) stoopD = cl((T.x - root.position.x) * Math.sin(yaw) + (T.z - root.position.z) * Math.cos(yaw) - 1.15, 0, 7); }
  const air = FIN.y > .5; cp(SNAP, FIN); actv = { name, def, t: 0, bi: def.aim ? (air ? def.bi : .3) : air ? Math.max(def.bi, .38) : def.bi }; prevU = 0; rbT = 0; return true;
 }
 const fadeMats = [...new Set(skinned.map((m) => m.material).concat([M.eye, M.iris]))], fadeT = fadeMats.map((m) => m.transparent);
 function setFade(f) {
  f = cl(+f, 0, 1); if (Math.abs(f - fadeV) < 1e-4) return;
  const was = fadeV < .999, now = f < .999; fadeV = f;
  fadeMats.forEach((m, i) => { m.transparent = now || fadeT[i]; m.opacity = f; if (was !== now) m.needsUpdate = true; });
  root.visible = f > .002;
 }
 const ANC = { chest: [chest, new THREE.Vector3(0, .08, .1)], head: [head, new THREE.Vector3(0, .14, .03)] };
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  if (name === 'hit') return out.copy(TIP).applyMatrix4(swordMatrix());
  if (name === 'blade') return out.copy(MIDB).applyMatrix4(swordMatrix());
  if (name === 'sunstone') return out.copy(STONE).applyMatrix4(swordMatrix());
  const a = ANC[name] || ANC.chest; a[0].updateWorldMatrix(true, false); return a[0].localToWorld(out.copy(a[1]));
 }
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isSprite || o.isPoints) draws++; });
 animate(0, 0, 0, 0);
 return {
  root, fx, skeleton, bones, animate, play,
  guard(on) { gOn = !!on; },
  reset() { cp(SNAP, FIN); actv = null; gOn = false; gW = 0; rbT = .18; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade, anchor, ACTIONS,
  stats: { triangles: Math.round(tri), bones: bones.length, drawCalls: draws, textures: texs.size }
 };
}

/* ---------- copies/sounds.js ---------- */
// sounds.js: every sound in the field study, made in code (the project has no recordings of nature).
// Two families. The Bramble's own sounds, organic ones: green wood creaking under strain, leathery leaves rustling, roots
// tearing out of the frozen soil as a leg lifts and frost crunching as it plants, canes swishing through the air, a cane
// driven into the earth, its heartbeat muffled in the thicket, steam breathed out of the bud. And round it a quiet,
// sparse night: wind in the spruce in gusts, owls, the lake ice singing, redwings passing over, a tree cracking in the
// frost, wolves far off. Each is built sample by sample once the page may make sound (after a click), and all of them
// play through one reverb shaped like a snowy meadow ringed by forest.
// Defines makeFieldSounds() only. Returns { init(), ready, renderMs, bramble(id, { gain, pan, far, delay }),
//   night(id, { gain, pan, far, pick }), tick(dt), hush(seconds), setQuiet(on), setHold(on), setWind(v), list,
//   setLevel(id, v), level(id), setOn(id, on), on(id), setGroup('bramble' | 'night', v), group(name), setMuted(on),
//   reset(), settings(), load(saved) }.
// cutscene: this copy (envoi-final-draft/cutscenes/colossus-first-meeting/) also gives the cutscene's own sounds a way in
//   (ctx, bus(group), wet: its context, its two groups' buses and its reverb) and close() (the context is shut and freed
//   when the cutscene ends); each line marked "cutscene:".
function makeFieldSounds() {
  'use strict';
  const TAU = Math.PI * 2;
  let SR = 44100, ctx = null, master = null, wet = null, ready = false, renderMs = 0, muted = false;
  const GROUP = { bramble: { v: .9, bus: null }, night: { v: .55, bus: null } };
  let windGain = null, windV = .6, quiet = false, hold = false;
  let seed = 4242;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---------- what there is ----------
  // the Bramble's: [id, name, what it is, level, variations]
  const BR = [
    ['creak', 'A cane creaking', 'Green wood bending under its own weight, catching and slipping.', .55, 4],
    ['rustle', 'Its leaves', 'Leathery winter leaves moving against each other.', .45, 3],
    ['step', 'A leg coming down', 'A cane’s tip planting through the frost into frozen soil, its rootlets catching.', .5, 4],
    ['pull', 'Roots tearing free', 'A tip lifting: the roots it put down snapping out of the ground.', .4, 3],
    ['heart', 'Its heartbeat', 'Two soft, deep beats, muffled in the thicket. Only heard close to.', .5, 1],
    ['breath', 'Steam breathed out', 'A long, hollow exhale out of the bud.', .35, 1],
    ['groan', 'The whole thicket straining', 'Every cane creaking at once as it heaves itself up.', .8, 1],
    ['swish', 'A cane swung', 'Air torn round a cane as it whips past, its leaves fluttering.', .55, 3],
    ['impact', 'A cane into the ground', 'A spear of cane through the frost crust into the earth, and clods falling back.', .85, 2],
    ['heavy', 'Hammerfall', 'Both arms coming down as one club, and the ground taking it.', .95, 1],
    ['bloom', 'The flower opening', 'Sepals peeling apart, petals creaking as they spread, a breath of pollen.', .65, 1],
    ['gulp', 'Swallowing', 'The bud shutting on what it holds: a wet, low squeeze.', .6, 1],
    ['shoots', 'Thornwood', 'The soil splitting and cane after cane bursting up out of it.', .85, 1],
    ['thorns', 'Thorn volley', 'Thorns flicked off the canes whistling out and pattering down.', .5, 1],
    ['sizzle', 'Fire on it', 'Sap hissing and spitting, leaves crackling as they curl.', .55, 1],
    ['crash', 'Felled', 'The spire’s wood giving way, a split, and the fall.', .95, 1]
  ];
  // the night's: [id, name, what it is, level, seconds between calls (fewest, most)]; the wind is always there
  const NI = [
    ['wind', 'Wind in the spruce', 'Gusts coming through the forest and dying away. It follows the Wind slider in Explore.', .35, null],
    ['owl', 'Eagle owl', 'A deep “oo-HOO” from the forest edge, a few times over.', .7, [60, 140]],
    ['tawny', 'Tawny owl', 'A long hoot, a pause, then a quavering answer.', .5, [90, 200]],
    ['ice', 'The lake ice', 'Frostmere’s ice shifting in the cold: falling, ringing notes, now and then a deep boom.', .55, [45, 110]],
    ['redwings', 'Redwings overhead', 'The thin “tseep” of thrushes flying south in the dark.', .4, [80, 180]],
    ['trees', 'Trees in the frost', 'A trunk splitting with a crack in the cold, or creaking.', .45, [70, 160]],
    ['wolves', 'Wolves on the pass', 'Two wolves howling far off, up toward the snow.', .45, [220, 420]]
  ];
  const L = {};
  for (const [id, name, desc, level, n] of BR) L[id] = { id, name, desc, level, start: level, on: true, n, fam: 'bramble', last: -1 };
  for (const [id, name, desc, level, every] of NI) L[id] = { id, name, desc, level, start: level, on: true, every, fam: 'night', next: 0, bed: !every };
  const BUF = {};

  // ---------- tools for building a sound sample by sample (a sound is an array of channels) ----------
  const buf = (secs) => new Float32Array(Math.ceil(secs * SR));
  // a smooth envelope: rises over a, holds for h, falls over r
  const env = (x, a, h, r) => { if (x < 0) return 0; if (x < a) return .5 - .5 * Math.cos(Math.PI * x / a); if (x < a + h) return 1; if (x < a + h + r) return .5 + .5 * Math.cos(Math.PI * (x - a - h) / r); return 0; };
  // a state-variable filter, one sample at a time: f.run(x, Hz, q) leaves f.lo, f.bp and f.hi
  function svf() { const f = { lo: 0, bp: 0, hi: 0 }; f.run = (x, hz, q) => { const F = 2 * Math.sin(Math.PI * Math.min(hz, SR * .2) / SR); f.lo += F * f.bp; f.hi = x - f.lo - f.bp / Math.max(q, .5); f.bp += F * f.hi; }; return f; }
  const lpK = (hz) => 1 - Math.exp(-TAU * hz / SR);
  function peak(d) { let m = 1e-9; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); return m; }
  function norm(d, to) { const k = to / peak(d); for (let i = 0; i < d.length; i++) d[i] *= k; return d; }
  function fadeEnds(d, secs) { const n = Math.min(d.length >> 1, Math.round(secs * SR)); for (let i = 0; i < n; i++) { const k = i / n; d[i] *= k; d[d.length - 1 - i] *= k; } return d; }
  function lowpass(d, hz) { let y = 0; const k = lpK(hz); for (let i = 0; i < d.length; i++) { y += (d[i] - y) * k; d[i] = y; } return d; }
  function sat(d, k) { for (let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * k); return d; }
  function mix(d, s, g) { for (let i = 0; i < d.length && i < s.length; i++) d[i] += s[i] * g; return d; }
  // a soft knock: a short raised-cosine push (as strong as a click of a, but rounder), for things that land rather than click
  function push(x, t, w, a) { const n0 = Math.round(t * SR), n = Math.max(2, Math.round(w * SR)); for (let i = 0; i < n && n0 + i < x.length; i++) x[n0 + i] += a * 2 / n * (.5 - .5 * Math.cos(TAU * i / n)); }
  // the ringing of a body (wood, soil, ice) struck by x: a damped resonance per [Hz, seconds to die by 1/e, loudness]
  function modes(x, list) {
    const y = new Float32Array(x.length);
    for (const [f, tau, g] of list) {
      const r = Math.exp(-1 / (tau * SR)), w = TAU * Math.min(f, SR * .45) / SR, a1 = 2 * r * Math.cos(w), a2 = -r * r, s = Math.sin(w); let y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const v = x[i] * s + a1 * y1 + a2 * y2; y2 = y1; y1 = v; y[i] += v * g; }
    }
    return y;
  }
  // one small hit with its own ringing (a fibre snapping, a clod landing): modes of Hz each nudged at random
  function ping(d, t, list, g) {
    const n0 = Math.round(t * SR);
    for (const [f0, tau, a] of list) {
      const f = f0 * rr(.8, 1.25), w = TAU * Math.min(f, SR * .45) / SR, dk = Math.exp(-1 / (tau * SR)), n = Math.min(d.length - n0, Math.round(tau * 6 * SR)); let e = g * a;
      for (let i = 0; i < n; i++) { d[n0 + i] += Math.sin(w * i) * e; e *= dk; }
    }
  }
  // crackle: tiny clicks arriving at dens(t) a second, each a burst of noise dying over tau, most faint and a few loud,
  // kept to the band lo to hi. Leaves, frost, soil and fibres are all made of it, at different rates and bands.
  function crackle(d, t0, dur, dens, tau, lo, hi, g) {
    const n0 = Math.round(t0 * SR), n = Math.round(dur * SR), dk = Math.exp(-1 / (tau * SR)), kL = lpK(hi), kH = lpK(lo); let e = 0, y = 0, h = 0;
    for (let i = 0; i < n && n0 + i < d.length; i++) {
      if (rnd() < dens(i / SR) / SR) e += Math.pow(rnd(), 2.5);
      e *= dk; y += ((rnd() * 2 - 1) * e - y) * kL; h += (y - h) * kH; d[n0 + i] += (y - h) * g;
    }
  }
  // stick and slip: wood or bark catching and letting go, rate(t) times a second, as loud as amp(t)
  function stick(x, t0, dur, rate, amp, jit) {
    let t = 0;
    while (t < dur) { const i = Math.round((t0 + t) * SR), a = amp(t); if (i >= 0 && i + 1 < x.length) { x[i] += a * (.7 + .6 * rnd()); x[i + 1] -= a * .4 * rnd(); } t += (1 / Math.max(1, rate(t))) * (1 + (rnd() - .5) * jit); }
  }
  // a voice: harmonics on a pitch curve fn(t) in Hz with a loudness curve amp(t), and a little breath (owls, wolves)
  function voice(out, t0, dur, fn, amp, harm, breath) {
    let ph = 0; const n0 = Math.round(t0 * SR), n = Math.round(dur * SR), f = svf();
    for (let i = 0; i < n && n0 + i < out.length; i++) {
      const t = i / SR, hz = fn(t), a = amp(t); ph += TAU * hz / SR;
      let s = 0; for (let k = 0; k < harm.length; k++) s += harm[k] * Math.sin(ph * (k + 1));
      if (breath) { f.run(rnd() * 2 - 1, hz, 4); s += f.bp * breath; }
      out[n0 + i] += s * a;
    }
  }
  const wood = (f) => [[170 * f, .03, 1], [390 * f, .018, .8], [820 * f, .01, .5], [1650 * f, .005, .3], [2900 * f, .003, .15]];

  // ---------- the Bramble ----------
  function makeCreak() { // a cane bending under its own weight: green wood catching and slipping
    const dur = rr(.7, 1.5), x = buf(dur + .3), r0 = rr(25, 60), r1 = r0 * rr(1.3, 2.4), wob = rr(3, 7), flut = rr(9, 17);
    stick(x, .02, dur, (t) => r0 + (r1 - r0) * sm(0, dur, t) + 6 * Math.sin(t * wob), (t) => env(t, dur * .25, dur * .35, dur * .4) * (.5 + .5 * Math.sin(t * flut)) * (.4 + .6 * rnd()), .55);
    return [norm(fadeEnds(modes(x, wood(rr(.8, 1.25))), .01), .7)];
  }
  function makeRustle(len) { // leathery winter leaves moving against each other, with the soft swish of their faces sliding
    const d = buf(len + .1), fl = rr(11, 19), f = svf();
    const e = (t) => Math.pow(env(t, len * .3, len * .15, len * .55), 1.3);
    crackle(d, .02, len, (t) => 1300 * e(t) * (.6 + .4 * Math.sin(t * fl)), .0012, 900, 4500, 1);
    for (let i = 0; i < d.length; i++) { f.run(rnd() * 2 - 1, 1800, .8); d[i] += f.bp * e(i / SR - .02) * .12; }
    return [norm(fadeEnds(d, .01), .55)];
  }
  function makeStep() { // a leg planting: down through the frost into frozen soil, a weighty thud, rootlets catching
    const d = buf(.7), x = buf(.7); push(x, .006, .012, 1);
    mix(d, sat(modes(x, [[rr(70, 95), .05, 1], [rr(150, 190), .03, .6], [rr(330, 420), .012, .3]]), 2.5), .8);
    crackle(d, .006, .2, (t) => 2500 * Math.exp(-t / .05), .0004, 1500, 7000, .45);  // frost crunching
    crackle(d, .01, .25, (t) => 600 * Math.exp(-t / .08), .002, 250, 1400, .35);     // soil
    const n = 2 + Math.floor(rnd() * 4); for (let k = 0; k < n; k++) ping(d, rr(.05, .35), [[1300, .004, 1], [2800, .002, .5]], rr(.1, .3)); // rootlets catching
    return [norm(fadeEnds(d, .004), .7)];
  }
  function makePull() { // a tip tearing its roots out of the frozen ground: fibres snapping faster and faster, then free
    const dur = rr(.35, .6), d = buf(dur + .5);
    let t = .02, gap = rr(.04, .07); while (t < dur) { ping(d, t, [[1100, .005, 1], [2400, .003, .6], [450, .01, .5]].map(([f, tau, a]) => [f * rr(.6, 1.5), tau, a]), rr(.2, .7)); t += gap * rr(.6, 1.4); gap = Math.max(.008, gap * .86); }
    crackle(d, .02, dur, (u) => 400 + 1800 * sm(0, dur, u), .0006, 700, 3500, .3);   // fibres tearing
    crackle(d, dur * .8, .45, (u) => 300 * Math.exp(-u / .15), .003, 150, 900, .45); // soil falling away
    return [norm(fadeEnds(d, .004), .6)];
  }
  function makeHeart() { // its heartbeat, heard through the thicket: two soft, deep beats
    const x = buf(1); push(x, .01, .018, 1); push(x, .29, .02, .7);
    const y = sat(modes(x, [[52, .09, 1], [104, .05, .6], [150, .035, .45], [230, .02, .28], [380, .01, .12]]), 2);
    return [norm(lowpass(fadeEnds(y, .01), 900), .7)];
  }
  function makeBreath() { // steam out of the bud: a long, slow, hollow exhale
    const dur = 2.6, d = buf(dur + .2), f1 = svf(), f2 = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR, e = env(t, .7, .4, 1.4), w = rnd() * 2 - 1; f1.run(w, 300 + 50 * e, 5); f2.run(w, 740, 4); d[i] = (f1.bp + f2.bp * .6) * e; }
    return [norm(lowpass(fadeEnds(d, .02), 1400), .45)];
  }
  function makeGroan() { // the whole thicket straining at once: slow creaks deep in many canes, and its leaves
    const dur = 3.2, d = buf(dur + .6);
    for (let k = 0; k < 4; k++) {
      const x = buf(dur + .6), st = rr(0, .6), ln = rr(1.6, 2.6), r0 = rr(9, 18), r1 = r0 * rr(1.5, 2.5), f = rr(.7, 1.3);
      stick(x, st, ln, (t) => r0 + (r1 - r0) * sm(0, ln, t), (t) => env(t, ln * .3, ln * .3, ln * .4), .4);
      mix(d, modes(x, [[85 * f, .09, 1], [160 * f, .06, .8], [310 * f, .03, .6], [640 * f, .012, .3], [1300 * f, .006, .15]]), k ? .7 : 1);
    }
    crackle(d, .2, dur, (t) => 300 + 900 * env(t, 1.2, .8, 1.2), .0008, 900, 4500, .2);
    return [norm(fadeEnds(d, .02), .8)];
  }
  function makeSwish(len) { // a cane swung fast: air torn round it, rising as it speeds up and falling as it slows; leaves fluttering
    const d = buf(len + .15), f = svf();
    for (let i = 0; i < d.length; i++) { const u = cl(i / SR / len, 0, 1), v = Math.pow(Math.sin(Math.PI * u), 2.2); f.run(rnd() * 2 - 1, 250 + 1300 * v, 2.2); d[i] = f.bp * v * .7; }
    crackle(d, len * .25, len * .7, (t) => 900 * Math.sin(Math.PI * cl(t / (len * .7), 0, 1)), .0006, 1500, 6000, .3);
    return [norm(fadeEnds(d, .01), .7)];
  }
  function clods(d, t0, spread, n, g) { // clods of soil falling back onto the frozen ground
    for (let k = 0; k < n; k++) { const t = t0 + Math.pow(rnd(), 1.4) * spread; if (t < d.length / SR - .1) ping(d, t, [[360, .009, 1], [1000, .004, .5]], rr(.1, .6) * (1 - .6 * (t - t0) / spread) * g); }
  }
  function makeImpact() { // a cane driven into frozen earth: the frost crust breaking, a heavy thud, clods after
    const d = buf(1.2), x = buf(1.2); push(x, .004, .006, 1);
    mix(d, sat(modes(x, [[rr(55, 70), .12, 1], [rr(110, 140), .07, .7], [rr(240, 300), .03, .4], [rr(520, 640), .012, .2]]), 3), .9);
    crackle(d, 0, .25, (t) => 5000 * Math.exp(-t / .04), .0003, 1800, 9000, .55);
    crackle(d, .01, .5, (t) => 900 * Math.exp(-t / .12), .0015, 200, 1500, .45);
    clods(d, .15, .8, 12, .5);
    return [norm(fadeEnds(d, .004), .85)];
  }
  function makeHeavy() { // Hammerfall: the ground takes both arms at once; a rumble rolls away; clods rain back down
    const d = buf(2.4), x = buf(2.4); push(x, .004, .008, 1); push(x, .03, .01, .5);
    mix(d, sat(modes(x, [[48, .2, 1], [92, .12, .7], [180, .05, .4], [380, .02, .25]]), 3.5), 1);
    let br = 0, y = 0; const k = lpK(160);
    for (let i = 0; i < d.length; i++) { const t = i / SR; br = (br + .02 * (rnd() * 2 - 1)) / 1.02; y += (br * 12 - y) * k; d[i] += y * Math.exp(-t / .6) * Math.min(1, t / .02) * .6; }
    crackle(d, 0, .35, (t) => 6000 * Math.exp(-t / .05), .0003, 1500, 8000, .6);
    crackle(d, .01, .9, (t) => 1200 * Math.exp(-t / .2), .002, 150, 1200, .55);
    clods(d, .2, 1.8, 30, .6);
    const s = buf(2.4); stick(s, .05, .8, (t) => 40 - 20 * t, (t) => Math.exp(-t / .3), .4); mix(d, modes(s, [[140, .04, 1], [330, .02, .6], [700, .01, .3]]), .4);
    return [norm(fadeEnds(d, .01), .9)];
  }
  function makeBloom() { // the flower opening: sepals peeling apart, petals creaking as they spread, then a breath of pollen
    const dur = 2.6, d = buf(dur + .4), f = svf();
    crackle(d, .05, 1.5, (t) => 120 + 500 * sm(0, 1.2, t), .0012, 500, 2600, .4);
    for (let k = 0; k < 5; k++) {
      const x = buf(dur + .4), t0 = .2 + k * .32 + rr(0, .15), ln = rr(.25, .5), r0 = rr(70, 140);
      stick(x, t0, ln, (t) => r0 * (1 + .8 * t / ln), (t) => env(t, ln * .3, ln * .2, ln * .5), .2);
      mix(d, modes(x, [[rr(500, 700), .012, 1], [rr(1200, 1600), .006, .5], [rr(2500, 3200), .003, .25]]), .4);
    }
    for (let i = 0; i < d.length; i++) { const e = env(i / SR - 1.6, .3, .2, .9); f.run(rnd() * 2 - 1, 900, 1.2); d[i] += f.bp * e * .3; }
    return [norm(fadeEnds(d, .02), .65)];
  }
  function makeGulp() { // the bud shutting on what it holds: a wet, low squeeze, and fibres creaking round it
    const d = buf(.9), f = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR; f.run(rnd() * 2 - 1, 260 - 120 * cl(t / .4, 0, 1), 6); d[i] = f.bp * env(t, .06, .1, .35); }
    const x = buf(.9); for (let k = 0; k < 6; k++) x[Math.round(rr(.03, .4) * SR)] = rr(.3, 1);
    mix(d, modes(x, [[rr(700, 900), .006, 1], [rr(1500, 1900), .003, .5]]), .25);
    const s = buf(.9); stick(s, .1, .5, (t) => 60 + 40 * t, (t) => env(t, .1, .2, .2), .3); mix(d, modes(s, [[220, .02, 1], [520, .01, .5]]), .3);
    return [norm(lowpass(fadeEnds(d, .01), 2500), .7)];
  }
  function makeShoots() { // Thornwood: the soil splitting, then cane after cane bursting up out of it
    const dur = 2.2, d = buf(dur + .6);
    crackle(d, 0, .6, (t) => 3000 * Math.exp(-t / .2), .0006, 300, 3000, .5);
    for (let k = 0; k < 7; k++) {
      const t0 = .25 + k * .17 + rr(0, .06), x = buf(dur + .6), f = svf(), ln = rr(.18, .3);
      push(x, t0, .008, rr(.6, 1)); mix(d, sat(modes(x, [[rr(80, 120), .04, 1], [rr(200, 280), .02, .5]]), 2), .5);
      crackle(d, t0, .15, (t) => 2500 * Math.exp(-t / .04), .0005, 800, 5000, .4);
      const n0 = Math.round(t0 * SR); for (let i = 0; i < ln * SR && n0 + i < d.length; i++) { const u = i / SR / ln, v = Math.sin(Math.PI * u); f.run(rnd() * 2 - 1, 300 + 1200 * u, 2); d[n0 + i] += f.bp * v * .35; }
      const s = buf(dur + .6); stick(s, t0 + .05, .3, (t) => 90 + 60 * t, (t) => env(t, .05, .1, .15), .3); mix(d, modes(s, wood(rr(.9, 1.3))), .3);
    }
    return [norm(fadeEnds(d, .01), .85)];
  }
  function makeThorns() { // a volley: thorns flicked off the canes whistle out, then patter down on the frozen ground
    const d = buf(1.8);
    for (let k = 0; k < 14; k++) { const t0 = rr(0, .35), f0 = rr(2500, 4200), len = rr(.07, .16), a = rr(.1, .25), n0 = Math.round(t0 * SR); let ph = 0; for (let i = 0; i < len * SR; i++) { const t = i / SR; ph += TAU * f0 * (1 - .35 * t / len) / SR; d[n0 + i] += Math.sin(ph) * env(t, .01, len * .3, len * .6) * a; } }
    const c = buf(1.8); for (let k = 0; k < 26; k++) c[Math.round((.45 + Math.pow(rnd(), .8) * 1.1) * SR)] = rr(.1, .5);
    mix(d, modes(c, [[rr(1800, 2600), .003, 1], [rr(4000, 5200), .0015, .4]]), .5);
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeSizzle() { // fire on it: sap hissing and spitting, leaves crackling as they curl
    const dur = 1.8, d = buf(dur + .2), f = svf();
    crackle(d, 0, dur, (t) => 500 * env(t, .1, .6, 1.1), .0003, 2500, 9000, .5);
    const x = buf(dur + .2); for (let k = 0; k < 25; k++) x[Math.round(rr(0, dur) * SR)] = rr(.2, 1);
    mix(d, modes(x, [[rr(1500, 2500), .002, 1], [rr(500, 900), .004, .5]]), .6);
    for (let i = 0; i < d.length; i++) { f.run(rnd() * 2 - 1, 5000, .7); d[i] += f.hi * env(i / SR, .15, .5, 1.1) * .05; }
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeCrash() { // felled: the spire's wood giving way in a long tearing creak, a split, and the fall into its thicket
    const d = buf(4.2), s = buf(4.2), x = buf(4.2), y = buf(4.2);
    stick(s, 0, 1.6, (t) => 15 + 35 * t, (t) => .3 + .7 * sm(0, 1.6, t), .4); mix(d, modes(s, [[110, .05, 1], [240, .03, .7], [520, .015, .4], [1100, .006, .2]]), .6);
    push(x, 1.6, .003, 1); mix(d, modes(x, [[220, .1, 1], [560, .06, .6], [1200, .03, .3], [2600, .015, .2]]), .7);
    crackle(d, 1.6, .4, (t) => 4000 * Math.exp(-t / .06), .0004, 800, 7000, .55);
    push(y, 2.4, .01, 1); push(y, 2.43, .01, .6); mix(d, sat(modes(y, [[45, .25, 1], [90, .15, .7], [190, .06, .4]]), 3), .9);
    crackle(d, 2.3, 1.6, (t) => 2500 * Math.exp(-t / .4), .0007, 1000, 6000, .35);
    return [norm(fadeEnds(d, .02), .9)];
  }

  // ---------- the night ----------
  // the wind: a 36 second loop in stereo that joins up without a seam. Not a steady hiss: gusts of different strengths
  // every few seconds with calm spells between, dark and low when it is light, opening as a gust comes through, and
  // reaching one ear a moment before the other.
  function makeWind() {
    const N = 36, X = 3, len = Math.round((N + X) * SR), nN = Math.round(N * SR), nX = Math.round(X * SR), out = [];
    const pts = []; let t = 0; while (t < N - 2) { pts.push([t, .15 + .85 * Math.pow(rnd(), 1.4)]); t += rr(2.5, 6); } pts.push([N, pts[0][1]]);
    for (let i = 0; i < 3; i++) { const j = 1 + Math.floor(rnd() * (pts.length - 2)); pts[j][1] = .04; }
    const G = (tt) => { tt = ((tt % N) + N) % N; let i = 0; while (i < pts.length - 2 && tt > pts[i + 1][0]) i++; const [a, va] = pts[i], [b, vb] = pts[i + 1], s = sm(a, b, tt); return va + (vb - va) * s; };
    for (let c = 0; c < 2; c++) {
      const d = new Float32Array(len), fLow = svf(), fRush = svf(), lag = c ? .5 : 0;
      let br = 0, p0 = 0, p1 = 0, p2 = 0, lp = 0, flut = 0, gs = G(-lag);
      for (let i = 0; i < len; i++) {
        const g = G(i / SR - lag), w = rnd() * 2 - 1;
        gs += (g - gs) * .0005;
        br = (br + .02 * w) / 1.02;
        p0 = .99765 * p0 + w * .099046; p1 = .963 * p1 + w * .2965164; p2 = .57 * p2 + w * 1.0526913;
        fLow.run(br * 7, 140 + 520 * gs, .8);                                       // the roar of it in the trees
        fRush.run((p0 + p1 + p2 + w * .1848) * .2, 300 + 900 * gs, 1.1);             // the rush through the needles
        lp += (w - lp) * lpK(2600); flut += (rnd() - flut) * lpK(9);
        d[i] = fLow.lo * .6 * Math.pow(gs, 1.6) + fRush.bp * .5 * gs * gs + lp * .02 * gs * gs * gs * (.3 + .7 * flut);
      }
      for (let i = 0; i < nX; i++) { const k = i / nX; d[i] = d[i] * Math.sqrt(k) + d[nN + i] * Math.sqrt(1 - k); }
      out.push(d.slice(0, nN));
    }
    const m = Math.max(peak(out[0]), peak(out[1])); out.forEach((d) => { for (let i = 0; i < d.length; i++) d[i] *= .6 / m; });
    return out;
  }
  function makeEagleOwl(v) { // "oo-HOO": a soft short note, then the deep one, rising a little and falling away
    const d = buf(1.7), f0 = 290 + v * 16;
    voice(d, .05, .32, (t) => f0 * (.97 + .05 * Math.sin(Math.PI * t / .32)), (t) => env(t, .06, .1, .16) * .5, [1, .16, .05], .06);
    voice(d, .5, .95, (t) => f0 * 1.12 * (1 + .04 * Math.sin(Math.PI * Math.min(1, t / .5)) - .06 * t), (t) => env(t, .08, .35, .5), [1, .18, .06], .06);
    return [norm(lowpass(fadeEnds(d, .02), 1600), .8)];
  }
  function makeTawny() { // "hoooo" ... then "hu", and "hu-hoo-oo-oo-oo", quavering
    const d = buf(7.6), f = 600;
    voice(d, .05, 1.1, (t) => f * (1.02 - .07 * t), (t) => env(t, .1, .5, .5), [1, .1, .03], .07);
    voice(d, 4.1, .22, () => f * .96, (t) => env(t, .03, .05, .12) * .7, [1, .1], .06);
    voice(d, 4.95, 2.4, (t) => f * (1.03 - .06 * t / 2.4) * (1 + .02 * Math.sin(TAU * 6.5 * t)), (t) => env(t, .08, 1.4, .85) * (.66 + .34 * Math.sin(TAU * (7.5 - .5 * t) * t)), [1, .12, .03], .07);
    return [norm(lowpass(fadeEnds(d, .02), 2200), .7)];
  }
  // ice sings: a crack sends a wave through the sheet whose high notes travel faster than its low ones, so each crack
  // arrives as a falling, ringing note, with the far shore's echoes after it
  function chirp(d, t0, f0, f1, tau, dec, g) {
    let ph = 0; const n0 = Math.round(t0 * SR), n = Math.round(dec * 6 * SR);
    for (let i = 0; i < n && n0 + i < d.length; i++) { const t = i / SR; ph += TAU * (f1 + (f0 - f1) * Math.exp(-t / tau)) / SR; d[n0 + i] += Math.sin(ph) * g * Math.exp(-t / dec) * Math.min(1, t / .002); }
  }
  function makeIce() {
    const d = buf(3), base = rr(.75, 1.25), n = 1 + Math.floor(rnd() * 3); let t0 = .05;
    for (let k = 0; k < n; k++) {
      const g = k ? rr(.4, .8) : 1, f0 = rr(3000, 5000) * base, f1 = rr(170, 320) * base, tau = rr(.05, .1);
      chirp(d, t0, f0, f1, tau, rr(.18, .3), g); chirp(d, t0 + rr(.05, .09), f0 * .9, f1 * 1.05, tau * 1.2, .2, g * .45); chirp(d, t0 + rr(.13, .2), f0 * .8, f1, tau * 1.4, .25, g * .22);
      const c0 = Math.round(t0 * SR); for (let i = 0; i < 120; i++) d[c0 + i] += (rnd() * 2 - 1) * g * .35 * Math.exp(-i / 20);
      t0 += rr(.2, .6);
    }
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeBoom() { // the ice settling: a deep boom rolling across the lake, rich enough to hear on small speakers
    const d = buf(4); let ph = 0, br = 0; const f = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR; ph += TAU * (52 + 30 * Math.exp(-t / .25)) / SR; br = (br + .02 * (rnd() * 2 - 1)) / 1.02; f.run(br * 10, 260 + 300 * Math.exp(-t / .3), .9); d[i] = Math.tanh(2.2 * Math.sin(ph)) * Math.exp(-t / .9) * Math.min(1, t / .012) * .7 + f.lo * Math.exp(-t / 1.3) * Math.min(1, t / .04) * .9; }
    chirp(d, .06, 1100, 80, .14, .5, .3);
    return [norm(fadeEnds(d, .01), .85)];
  }
  function makeTseep() { const d = buf(.5), f = rr(6600, 7600); voice(d, .02, .38, (t) => f * (1 - .1 * t / .38), (t) => env(t, .05, .08, .22), [1], 0); return [norm(fadeEnds(d, .01), .5)]; }
  function makeTreeCrack() { // a trunk splitting in the cold: a sharp report, the ring of the wood, a short tearing
    const d = buf(1.4), md = [[rr(180, 260), .12], [rr(480, 640), .07], [rr(1000, 1400), .04], [rr(2200, 2900), .02]];
    for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; for (const [fq, dc] of md) s += Math.sin(TAU * fq * t) * Math.exp(-t / dc); d[i] = s * .5 + (rnd() * 2 - 1) * Math.exp(-t / .006) * 1.4 + (t > .02 && t < .3 ? (rnd() * 2 - 1) * .12 * Math.exp(-(t - .02) / .08) : 0); }
    return [norm(lowpass(fadeEnds(d, .004), 5200), .8)];
  }
  function howl(d, t0, f0, len, g) {
    const fall = .9;
    voice(d, t0, len, (t) => { const up = Math.min(1, t / .7); let hz = f0 * (.66 + .34 * (1 - Math.pow(1 - up, 2))); if (t > len - fall) hz *= 1 - .3 * Math.pow((t - (len - fall)) / fall, 1.5); return hz * (1 + .012 * Math.sin(TAU * 4.6 * t)); }, (t) => env(t, .45, len - 1.2, .7) * g, [1, .3, .1, .04], .05);
  }
  function makeWolves() { const d = buf(6.4); howl(d, .05, 520, 4.3, 1); howl(d, 1.5, 625, 3.7, .7); return [norm(lowpass(fadeEnds(d, .05), 1800), .6)]; }
  // the place: a snowy meadow ringed by forest, about two and a half seconds of tail, darker as it dies, the forest edge
  // throwing an echo back
  function makeVerb() {
    const len = Math.round(3 * SR), out = [];
    for (let c = 0; c < 2; c++) {
      const d = new Float32Array(len); let y = 0;
      for (let i = 0; i < len; i++) { const t = i / SR, k = .5 - .45 * Math.min(1, t / 2.4); y += (rnd() * 2 - 1 - y) * k; d[i] = t < .012 ? 0 : y * Math.exp(-t * 2.6); }
      for (const [t, g] of [[.031, .5], [.047, .35], [.073, .3], [.38, .2], [.41, .16], [.47, .1]]) { const n = Math.round((t + (c ? .004 : 0)) * SR); for (let j = 0; j < 220; j++) d[n + j] += (rnd() * 2 - 1) * g * Math.exp(-j / 60); }
      out.push(d);
    }
    return out;
  }

  // what to build, in the order it is needed: the Bramble's quiet sounds first, the night last
  const MAKE = { verb: makeVerb, heart0: makeHeart };
  const add = (id, fns) => fns.forEach((f, i) => { MAKE[id + i] = f; });
  add('creak', [makeCreak, makeCreak, makeCreak, makeCreak]); add('rustle', [() => makeRustle(.8), () => makeRustle(1.3), () => makeRustle(2)]);
  add('step', [makeStep, makeStep, makeStep, makeStep]); add('pull', [makePull, makePull, makePull]);
  MAKE.breath0 = makeBreath; MAKE.groan0 = makeGroan; add('swish', [() => makeSwish(.45), () => makeSwish(.7), () => makeSwish(1)]); add('impact', [makeImpact, makeImpact]);
  MAKE.heavy0 = makeHeavy; MAKE.bloom0 = makeBloom; MAKE.gulp0 = makeGulp; MAKE.shoots0 = makeShoots; MAKE.thorns0 = makeThorns; MAKE.sizzle0 = makeSizzle; MAKE.crash0 = makeCrash;
  Object.assign(MAKE, { wind: makeWind, owl0: () => makeEagleOwl(0), owl1: () => makeEagleOwl(1), ice0: makeIce, ice1: makeIce, ice2: makeIce, boom: makeBoom,
    tseep0: makeTseep, tseep1: makeTseep, tseep2: makeTseep, treeCrack: makeTreeCrack, treeCreak0: makeCreak, treeCreak1: makeCreak, tawny: makeTawny, wolves: makeWolves });
  const PICK = { owl: ['owl0', 'owl1'], tawny: ['tawny'], ice: ['ice0', 'ice1', 'ice2', 'ice0', 'boom'], redwings: ['tseep0', 'tseep1', 'tseep2'], trees: ['treeCrack', 'treeCreak0', 'treeCreak1'], wolves: ['wolves'] };

  // ---------- playing ----------
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC({ sampleRate: 44100 }); } catch (e) { ctx = new AC(); }
    SR = ctx.sampleRate;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
    master.connect(comp); comp.connect(ctx.destination);
    for (const g in GROUP) { const b = ctx.createGain(); b.gain.value = GROUP[g].v; b.connect(master); GROUP[g].bus = b; }
    wet = ctx.createGain(); wet.connect(master);
    const t0 = performance.now(), names = Object.keys(MAKE); let i = 0;
    const step = () => { // one at a time, so the page keeps moving while they are made
      if (!ctx) return; // cutscene: closed before they were all made
      if (i >= names.length) { renderMs = performance.now() - t0; ready = true; return; }
      const k = names[i++];
      try { const chs = MAKE[k](), b = ctx.createBuffer(chs.length, chs[0].length, SR); chs.forEach((d, c) => b.copyToChannel(d, c)); BUF[k] = b; } catch (e) { /* that one is left out */ }
      if (k === 'verb' && BUF.verb) { const v = ctx.createConvolver(); v.buffer = BUF.verb; wet.disconnect(); wet.connect(v); v.connect(master); }
      if (k === 'wind') startWind();
      if (k === 'wolves') for (const id in L) if (L[id].every) L[id].next = rr(8, L[id].every[0] * .5);
      setTimeout(step, 0);
    };
    step();
  }
  function windTarget() { return L.wind.on ? L.wind.level * Math.pow(cl(windV / .6, 0, 2), .8) : 0; }
  function startWind() {
    if (!BUF.wind) return;
    const s = ctx.createBufferSource(); s.buffer = BUF.wind; s.loop = true;
    windGain = ctx.createGain(); windGain.gain.value = 0; s.connect(windGain); windGain.connect(GROUP.night.bus);
    const send = ctx.createGain(); send.gain.value = .15; windGain.connect(send); send.connect(wet);
    s.start(ctx.currentTime + .05, rr(0, 30)); windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, 2);
  }
  // one sound, placed: pan -1 (left) to 1 (right); far 0 (close) to 1 (far off: quieter, duller, more of the meadow)
  function place(b, bus, at, pan, far, g, bright) {
    const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (rnd() - .5) * .05;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 15000 : 12000 - 9000 * far; lp.Q.value = .5;
    const gn = ctx.createGain(); gn.gain.value = g * (1 - .55 * far);
    s.connect(lp); lp.connect(gn); let tail = gn;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = cl(pan || 0, -1, 1); gn.connect(p); tail = p; }
    const dry = ctx.createGain(); dry.gain.value = 1 - .6 * far; tail.connect(dry); dry.connect(bus);
    const send = ctx.createGain(); send.gain.value = .12 + .6 * far; tail.connect(send); send.connect(wet);
    s.start(at);
  }
  // one of the Bramble's sounds; a few of them silence the night for a while
  function bramble(id, o) {
    const l = L[id]; o = o || {}; if (!ready && !(l && BUF[id + '0'])) return; if (!ctx || !l || l.fam !== 'bramble' || (!l.on && !o.force)) return;
    let v = Math.floor(rnd() * l.n); if (l.n > 1 && v === l.last) v = (v + 1) % l.n; l.last = v;
    const b = BUF[id + v] || BUF[id + '0']; if (!b) return;
    place(b, GROUP.bramble.bus, ctx.currentTime + .01 + (o.delay || 0), o.pan || 0, cl(o.far || 0, 0, 1), (o.gain === undefined ? 1 : o.gain) * l.level);
    if (id === 'groan' || id === 'heavy' || id === 'crash' || id === 'shoots') hush(35);
  }
  // one of the night's
  function night(id, o) {
    const l = L[id], names = PICK[id]; if (!ready || !ctx || !l || !names) return; o = o || {};
    const t = ctx.currentTime + .03, g = (o.gain === undefined ? 1 : o.gain) * l.level, one = () => BUF[names[Math.floor(rnd() * names.length)]];
    const pan = o.pan === undefined ? rr(-.9, .9) : o.pan, far = o.far === undefined ? rr(.45, .9) : o.far, bus = GROUP.night.bus;
    if (l.next < l.every[0] * .5) l.next = l.every[0] * .5;
    if (id === 'owl') { const n = 2 + Math.floor(rnd() * 2), b = one(); for (let k = 0; k < n; k++) place(b, bus, t + k * rr(5.5, 8.5), pan, far, g); return; }
    if (id === 'redwings') { const n = 2 + Math.floor(rnd() * 3); let p = pan, at = t; for (let k = 0; k < n; k++) { place(one(), bus, at, p, cl(far - .35, .1, .6), g * rr(.6, 1), true); p = cl(p + rr(-.45, .45), -1, 1); at += rr(.6, 2.6); } return; }
    const pick = o.pick && BUF[o.pick] ? o.pick : names[Math.floor(rnd() * names.length)];
    place(BUF[pick], bus, t, pan, id === 'wolves' ? Math.max(.85, far) : far, g * (pick === 'boom' ? 1.1 : 1));
  }
  function hush(secs) { for (const id in L) if (L[id].every) L[id].next = Math.max(L[id].next, secs + rr(0, 10)); }
  // each kind of night sound calls again after a while; quiet (while the Bramble hunts) and hold (in the sound check) stop them
  function tick(dt) {
    if (!ready || muted || quiet || hold) return;
    for (const id in L) { const l = L[id]; if (!l.every || !l.on) continue; l.next -= dt; if (l.next <= 0) { night(id); l.next = rr(l.every[0], l.every[1]); } }
  }
  function settings() { const o = { groups: {}, layers: {} }; for (const g in GROUP) o.groups[g] = GROUP[g].v; for (const id in L) o.layers[id] = [L[id].on ? 1 : 0, L[id].level]; return o; }
  function load(s) {
    if (!s || typeof s !== 'object') return;
    if (s.groups) for (const g in GROUP) if (typeof s.groups[g] === 'number') api.setGroup(g, s.groups[g]);
    if (s.layers) for (const id in L) { const v = s.layers[id]; if (Array.isArray(v)) { api.setOn(id, !!v[0]); if (typeof v[1] === 'number') api.setLevel(id, v[1]); } }
  }
  const api = {
    init, bramble, night, tick, hush, settings, load,
    list: Object.values(L).map((l) => ({ id: l.id, name: l.name, desc: l.desc, fam: l.fam, start: l.start, bed: !!l.bed })),
    setQuiet(on) { on = !!on; if (quiet && !on) for (const id in L) if (L[id].every) L[id].next = rr(4, L[id].every[0] * .4); quiet = on; },
    setHold(on) { hold = !!on; },
    setWind(v) { windV = v; if (windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .8); },
    setLevel(id, v) { const l = L[id]; if (!l) return; l.level = cl(v, 0, 1.5); if (l.bed && windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .2); },
    level: (id) => (L[id] ? L[id].level : 0), on: (id) => (L[id] ? L[id].on : false),
    setOn(id, on) { const l = L[id]; if (!l) return; l.on = !!on; if (l.bed && windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .4); },
    setGroup(g, v) { if (!GROUP[g]) return; GROUP[g].v = cl(v, 0, 1.5); if (GROUP[g].bus) GROUP[g].bus.gain.setTargetAtTime(GROUP[g].v, ctx.currentTime, .1); },
    group: (g) => (GROUP[g] ? GROUP[g].v : 0),
    setMuted(on) { muted = !!on; if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .08); },
    reset() { for (const id in L) { api.setOn(id, true); api.setLevel(id, L[id].start); } api.setGroup('bramble', .9); api.setGroup('night', .55); },
    get muted() { return muted; }, get ready() { return ready; }, get renderMs() { return renderMs; }, get started() { return !!ctx; },
    get ctx() { return ctx; }, get wet() { return wet; }, bus: (g) => (GROUP[g] ? GROUP[g].bus : null), // cutscene: a way in for the cutscene's own sounds
    close() { const c = ctx; ctx = null; ready = false; if (c && c.close) return c.close().catch(() => {}); }, // cutscene: shut the context when it ends
    // for headless checks: build one sound and give back its channels
    _build(name, sr) { SR = sr || 44100; return MAKE[name](); }, _names: () => Object.keys(MAKE)
  };
  return api;
}

/* ---------- src/place.js ---------- */
// place.js: where the Colossus is first met: the meadow below the frozen pass by Frostmere Lake (frostmere.js, the field
// study's), with the frozen road through it, which is new here. The road comes up from the south and bends north toward
// the pass: old paving stones under packed snow, two wheel ruts worn into it, snow banked at its edges, and a few old
// waymarker stones. Where it passes the thicket it runs through the warm ring: there the snow has melted off it, and the
// stones are wet and dark, with puddles holding the sky. Nothing grows on it.
// Defines cutscenePlace(renderer, quality, data) only, for player.js. data: { road: { points: [[x, z], ...], width },
//   frost, wind }. Returns { scene, moonDir, heightAt, update, shadowAt, setWarm, impact, set, dispose, road }.
function cutscenePlace(renderer, quality, data) {
  'use strict';
  const R = data.road || { points: [[0, 60], [0, -60]], width: 4.6 }, HW = R.width / 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  // the road's line: a Catmull-Rom curve through its points, every half metre
  const line = (() => {
    const P = R.points, out = [];
    const at = (i) => P[cl(i, 0, P.length - 1)];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(len / .5));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(P[P.length - 1].slice());
    let s = 0; return out.map((p, i) => { if (i) s += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]); return { x: p[0], z: p[1], s }; });
  })();
  for (let i = 0; i < line.length; i++) { const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], d = Math.hypot(b.x - a.x, b.z - a.z) || 1; line[i].tx = (b.x - a.x) / d; line[i].tz = (b.z - a.z) / d; }
  // how far a point is from the road's middle (a coarse search, then the nearest segment)
  function roadDist(x, z) {
    let best = 1e9;
    for (let i = 0; i < line.length - 1; i += 6) { const d = Math.hypot(line[i].x - x, line[i].z - z); if (d < best) best = d; }
    if (best > HW + 12) return best;
    best = 1e9;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], ex = b.x - a.x, ez = b.z - a.z, L2 = ex * ex + ez * ez || 1, t = cl(((x - a.x) * ex + (z - a.z) * ez) / L2, 0, 1);
      const d = Math.hypot(a.x + ex * t - x, a.z + ez * t - z); if (d < best) best = d;
    }
    return best;
  }
  const QW = {
    light: { quality: 'medium', grass: .38, reflect: false, shadowSize: 1024 },
    phone: { quality: 'medium', grass: .55, reflect: 256, reflectEvery: 2, shadowSize: 2048 },
    laptop: { quality: 'high', grass: 1, reflect: 512, shadowSize: 4096 }
  }[quality] || { quality: 'high' };
  const world = makeFrostmere(renderer, Object.assign({ keepOff: (x, z) => roadDist(x, z) < HW + .45 }, QW));
  const scene = world.scene, WU = world.uniforms;

  // ---------- the road's stones: a tile of old setts, painted in code, with a height for its relief ----------
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let seed = 7121; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stones = (() => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), hc = cvs(S, S), h = hc.getContext('2d');
    g.fillStyle = '#2a2622'; g.fillRect(0, 0, S, S); h.fillStyle = '#000'; h.fillRect(0, 0, S, S);
    // rows of setts, staggered, each a rounded block of its own grey
    const rows = 8, rh = S / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 60; const y = r * rh;
      while (x < S) {
        const w = 44 + rnd() * 34, v = 70 + rnd() * 50, warm = rnd() * 12;
        for (const ox of [-S, 0, S]) {
          const x0 = x + ox + 2.5, y0 = y + 2.5, ww = w - 5, hh = rh - 5, rr = 9;
          const grd = g.createLinearGradient(x0, y0, x0 + ww * .3, y0 + hh);
          grd.addColorStop(0, 'rgb(' + (v + warm + 14) + ',' + (v + 10) + ',' + (v + 4) + ')'); grd.addColorStop(1, 'rgb(' + (v + warm - 18) + ',' + (v - 20) + ',' + (v - 24) + ')');
          g.fillStyle = grd; g.beginPath(); g.roundRect ? g.roundRect(x0, y0, ww, hh, rr) : g.rect(x0, y0, ww, hh); g.fill();
          const hg = h.createRadialGradient(x0 + ww / 2, y0 + hh / 2, 2, x0 + ww / 2, y0 + hh / 2, Math.max(ww, hh) * .62);
          hg.addColorStop(0, '#fff'); hg.addColorStop(.75, '#bbb'); hg.addColorStop(1, '#444');
          h.fillStyle = hg; h.beginPath(); h.roundRect ? h.roundRect(x0, y0, ww, hh, rr) : h.rect(x0, y0, ww, hh); h.fill();
        }
        x += w;
      }
    }
    // wear, lichen and grit
    for (let i = 0; i < 4200; i++) { const x = rnd() * S, y = rnd() * S, r = .6 + rnd() * 2.4; g.fillStyle = rnd() < .5 ? 'rgba(20,18,16,.35)' : rnd() < .6 ? 'rgba(160,150,135,.18)' : 'rgba(90,100,70,.16)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding;
    const W = S, src = h.getImageData(0, 0, W, W).data, n = g.createImageData(W, W), d = n.data, hv = (x, y) => src[(((y + W) % W) * W + (x + W) % W) * 4] / 255;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = hv(x + 1, y) - hv(x - 1, y), dy = hv(x, y + 1) - hv(x, y - 1), nx = -dx * 3, ny = dy * 3, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4; d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255; }
    const nc = cvs(W, W); nc.getContext('2d').putImageData(n, 0, 0); const tn = new THREE.CanvasTexture(nc); tn.wrapS = tn.wrapT = THREE.RepeatWrapping; tn.anisotropy = 8;
    return { map: t, normal: tn };
  })();

  // ---------- the road itself: a ribbon along the line, laid on the ground ----------
  const road = (() => {
    const AC = 10, pos = [], uv = [], ac = [], idx = [];
    for (let i = 0; i < line.length; i++) {
      const p = line[i], nx = p.tz, nz = -p.tx; // to the road's right
      // its edges wander a little, as a worn road's do
      const wl = 1 + .07 * Math.sin(p.s * .23) + .05 * Math.sin(p.s * .71 + 1.3), wr = 1 + .07 * Math.sin(p.s * .19 + 2.1) + .05 * Math.sin(p.s * .83 + .4);
      for (let k = 0; k <= AC; k++) {
        const u = k / AC, o = (u - .5) * 2 * HW * (u < .5 ? wl : wr), x = p.x + nx * o, z = p.z + nz * o;
        // a slight crown, and the edges sunk into the verge
        const y = world.heightAt(x, z) + .035 + .03 * (1 - Math.pow(2 * u - 1, 2)) - .03 * Math.pow(Math.abs(2 * u - 1), 6);
        pos.push(x, y, z); uv.push(o / 1.9, p.s / 1.9); ac.push(u);
      }
    }
    for (let i = 0; i < line.length - 1; i++) for (let k = 0; k < AC; k++) { const a = i * (AC + 1) + k, b = a + AC + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aAcross', new THREE.Float32BufferAttribute(ac, 1)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ map: stones.map, normalMap: stones.normal, normalScale: new THREE.Vector2(.9, .9), roughness: .85, color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uWC: WU.uWC, uWR: WU.uWR, uFR: WU.uFR, uTime: WU.uTime });
      sh.vertexShader = 'attribute float aAcross; varying float vAc; varying vec3 vRW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vAc = aAcross; vRW = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = 'uniform vec3 uWC; uniform float uWR, uFR, uTime; varying float vAc; varying vec3 vRW;\n' +
        'float rh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }\nfloat rn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(rh(i), rh(i + vec2(1, 0)), f.x), mix(rh(i + vec2(0, 1)), rh(i + vec2(1, 1)), f.x), f.y); }\n' +
        // the meadow's own frost line (frostmere.js frostAt), so the road melts where the grass greens
        'float rFrost(vec2 p){ float d = length(p - uWC.xz); float n = rn(p * .23) * 6. + rn(p * 1.3) * 1.5; return smoothstep(uWR - 3., uWR + 5., d + n - 3.); }\n' +
        sh.fragmentShader
          .replace('#include <map_fragment>', '#include <map_fragment>\n' +
            ' float fr = rFrost(vRW.xz) * uFR; float n1 = rn(vRW.xz * 1.3), n2 = rn(vRW.xz * 5.1), n3 = rn(vRW.xz * .37), n4 = rn(vRW.xz * .11 + 7.);\n' +
            // two wheel ruts worn through the snow to the stones, banks of it at the edges, thin and patchy between
            ' float rut = smoothstep(.085, .025, abs(vAc - .3 + .025 * sin(vRW.z * .4))) + smoothstep(.085, .025, abs(vAc - .7 + .025 * sin(vRW.z * .37 + 1.)));\n' +
            ' float bank = smoothstep(.16, .0, vAc) + smoothstep(.84, 1., vAc);\n' +
            ' float cover = clamp(.42 + .5 * (n1 - .5) + .45 * (n4 - .5) + .2 * (n3 - .5) - .7 * rut + .9 * bank + .14 * (n2 - .5), 0., 1.);\n' +
            ' float snow = smoothstep(.3, .58, cover) * smoothstep(.15, .7, fr); float slush = smoothstep(.05, .35, fr) * (1. - smoothstep(.35, .8, fr)) * smoothstep(.2, .5, cover);\n' +
            ' float wet = 1. - smoothstep(.0, .45, fr); float pud = wet * smoothstep(.42, .3, n3 + .25 * (n1 - .5)) * (1. - bank);\n' +
            // the stones: rimed where the snow is thin out in the cold, dark and wet inside the warm ring
            ' vec3 stone = diffuseColor.rgb * mix(.85, .5, wet) * mix(1., .35, pud);\n' +
            ' vec3 packed = vec3(.24, .25, .3) * (.8 + .35 * n2); vec3 fresh = vec3(.5, .53, .62) * (.88 + .2 * n2);\n' +
            ' vec3 sn = mix(fresh, packed, clamp(rut * 1.3 + (1. - bank) * .35, 0., 1.));\n' +
            ' diffuseColor.rgb = mix(mix(stone, vec3(.22, .23, .27), slush * .7), sn, snow);\n' +
            ' float rimeS = fr * (1. - snow) * .3; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.36, .38, .46), rimeS * n2);\n')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(mix(mix(.85, .32, wet), .05, pud), mix(.7, .38, rut), snow);')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(mix(normal, normalize(vNormal), clamp(snow * .85 + pud, 0., 1.)));');
    };
    m.customProgramCacheKey = () => 'cs-road';
    const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.name = 'road'; scene.add(mesh);
    return mesh;
  })();

  // ---------- old waymarker stones along the road, capped with snow outside the warm ring ----------
  {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }), geos = [];
    let along = 6;
    for (const p of line) {
      if (p.s < along) continue; along += 26 + rnd() * 18;
      const side = rnd() < .5 ? -1 : 1, o = side * (HW + .7 + rnd() * .5), x = p.x + p.tz * o, z = p.z - p.tx * o;
      const warm = Math.hypot(x - WU.uWC.value.x, z - WU.uWC.value.z) < 23, hgt = .7 + rnd() * .35;
      const gg = new THREE.CylinderGeometry(.17, .22, hgt, 7, 3); gg.translate(0, hgt / 2 - .05, 0);
      const pp = gg.attributes.position, col = [];
      for (let i = 0; i < pp.count; i++) {
        const y = pp.getY(i), top = y > hgt - .12, k = .85 + rnd() * .3;
        pp.setX(i, pp.getX(i) * (1 + (rnd() - .5) * .12)); pp.setZ(i, pp.getZ(i) * (1 + (rnd() - .5) * .12));
        const c = top && !warm ? [.66, .69, .78] : [.17 * k, .16 * k, .15 * k];
        col.push(...c.map((v) => Math.pow(v, 2.2)));
      }
      gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
      gg.rotateY(rnd() * 3); gg.rotateZ((rnd() - .5) * .12); gg.translate(x, world.heightAt(x, z), z); gg.deleteAttribute('uv'); geos.push(gg);
    }
    if (geos.length) {
      let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
      const out = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'color']) { const a = new Float32Array(nv * 3); let o = 0; for (const g of geos) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(a, 3)); }
      const I = new Uint32Array(ni); let io = 0, vo = 0; for (const g of geos) { for (let i = 0; i < g.index.count; i++) I[io++] = g.index.array[i] + vo; vo += g.attributes.position.count; g.dispose(); }
      out.setIndex(new THREE.BufferAttribute(I, 1));
      const ms = new THREE.Mesh(out, mat); ms.castShadow = ms.receiveShadow = true; scene.add(ms);
    }
  }

  return {
    scene, moonDir: world.moonDir, heightAt: world.heightAt, road: { line, dist: roadDist, width: R.width },
    update(t, dt, cam) { world.update(t, dt, cam); },
    shadowAt(x, z) { world.shadowAt(x, z); },
    setWarm(p, r) { world.setWarm(p, r); }, impact: world.impact, set: world.set,
    dispose() { if (world.lakeRT) world.lakeRT.dispose(); }
  };
}

/* ---------- src/cast.js ---------- */
// cast.js: the models this cutscene may use, how each is built at each detail (light, phone, laptop), and what each
// needs from the player: a creature's move sounds and tremors, a person's walk, breath and footsteps. A new creature's
// first meeting adds its model here, with its sounds, and needs no new player.
// Defines cutsceneCast() only. Each entry: { kind: 'person' | 'creature', make(quality, castEntry), stride (walk-cycle
//   radians a metre), mouth ([across, up, ahead] from her head anchor, for her breath), steps (her footstep sound),
//   pose(actor, name), cue(actor, what, args), anchor(actor, part, out), after(model, actor, dt), sound(snd, id, o),
//   sounds ({ move: [[progress, sound, gain], ...] }), hitShake, cueShake ({ move: [[progress, shake, ground ring]] }),
//   warm (its warm ring's radius), heart (its heartbeat is heard close to) }.
function cutsceneCast() {
  'use strict';
  // the game's models are painted for a plain renderer: their colours are turned linear so they sit in the film camera's
  // light as they do in the game's, as the Io study puts the game's Io beside its own; they cast and take the moon's shadow
  function filmLight(m) {
    const seen = new Set();
    for (const g of [m.root, m.fx]) if (g) g.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; }
      if (!o.material) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
        if (seen.has(mt)) continue; seen.add(mt);
        if (mt.color) mt.color.convertSRGBToLinear(); if (mt.emissive) mt.emissive.convertSRGBToLinear();
        for (const k of ['map', 'emissiveMap']) if (mt[k]) { mt[k].encoding = THREE.sRGBEncoding; mt[k].needsUpdate = true; }
        mt.needsUpdate = true;
      }
    });
    return m;
  }
  // Sol's blade sets its glow every frame in the game's colours; here they are turned linear after each frame as well
  // (its two materials are found by their colours before filmLight turns them linear)
  function solBlade(m) {
    const mats = { edge: null, steel: null };
    m.root.traverse((o) => {
      if (!o.material) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!mt.color || !mt.emissive) continue;
        if (mt.color.getHex() === 0xffe0a0 && Math.abs(mt.metalness - .2) < 1e-3) mats.edge = mt;
        if (mt.color.getHex() === 0xe0a24a && Math.abs(mt.metalness - .45) < 1e-3) mats.steel = mt;
      }
    });
    return mats;
  }
  const BRAMBLE_SOUNDS = {
    // the field study's (page.js, SOUNDS): wood, leaves, soil, roots and air, nothing that roars
    appear: [[0, 'shoots', .8], [.12, 'groan', 1], [.42, 'step', 1], [.45, 'step', .8], [.58, 'groan', .7], [.62, 'rustle', 1], [.66, 'breath', .8]],
    alert: [[.04, 'creak', .8], [.12, 'rustle', .8]],
    bloom: [[.08, 'bloom', 1], [.4, 'breath', .5]],
    rest: [[0, 'creak', .5], [.25, 'rustle', .5], [.5, 'breath', .45]]
  };
  return {
    colossus: {
      kind: 'creature', warm: 20, heart: true,
      // the game meets it at levels 16 to 20: its level darkens it and lengthens its thorns, as the fight's model does
      make: (q, c) => {
        const m = makeBrambleColossus({ shadows: true, detail: { light: .25, phone: .25, laptop: 1 }[q] || .25, level: c.level || 18 });
        m.state.frost = .55; m.state.wind = { x: .36, z: .12 };
        return m;
      },
      pose(a, name) {
        const m = a.m; m.reset(); m.state.open = 0; m.state.target = null;
        if (name === 'rest') m.play('rest', true);
      },
      sound: (snd, id, o) => snd.bramble(id, o),
      sounds: BRAMBLE_SOUNDS,
      // its blows and its waking shake the camera and run a ring of wind out through the grass
      hitShake: { lance: 1, slam: 1.7 },
      cueShake: { appear: [[.04, .7, 1.2], [.42, .6, 0], [.5, .8, .8], [.62, 1, 1.2]], alert: [[.22, .2, 0]] },
      cue(a, what, arg, E) {
        const m = a.m;
        // one cane lifts and tastes the air: the one whose tip is nearest to whoever it has felt
        if (what === 'taste') {
          let k = typeof arg[0] === 'number' ? arg[0] : -1;
          if (k < 0) {
            const t = E.actors[String(arg[0] || '').replace('toward:', '')], v = new THREE.Vector3(); let best = 1e9;
            for (let i = 0; i < 10; i++) { m.anchor('cane' + i, v); const d = t ? Math.hypot(v.x - t.x, v.z - t.z) - (i < 4 ? 3 : 0) : i; if (d < best) { best = d; k = i; } }
          }
          a.tasting = k; m.taste(k);
          if (E.snd) { E.snd.bramble('creak', { gain: .45, far: .1 }); E.snd.bramble('rustle', { gain: .35, far: .1 }); }
        } else if (what === 'target') {
          const t = E.actors[arg[0]]; m.state.target = t ? { x: t.x, y: 1.15, z: t.z } : null;
        } else if (what === 'pose') this.pose(a, arg[0]);
      },
      anchor(a, part, out) { if (part === 'taste') { a.m.anchor('cane' + (a.tasting >= 0 ? a.tasting : 7), out); return true; } return false; }
    },
    io: {
      kind: 'person', stride: 4.4, mouth: [0, -.075, .085], steps: 'step',
      // the cutscene Io (Chris's request: in cutscenes, her paper doll's face); her bones, clothes and moves are the game's
      make: (q) => makeIoCutscene({ detail: { light: .25, phone: .32, laptop: 1 }[q] || .32, shadows: true })
    },
    sol: {
      kind: 'person', stride: 4.2, mouth: [0, -.1, .1], steps: 'step',
      make: (q) => { const raw = makeSol({ detail: { light: .5, phone: .5, laptop: 1 }[q] || .5 }), blade = solBlade(raw); const m = filmLight(raw); m.blade = blade; return m; },
      after(m) { if (m.blade.edge) m.blade.edge.emissive.convertSRGBToLinear(); if (m.blade.steel) m.blade.steel.emissive.convertSRGBToLinear(); }
    }
  };
}

/* ---------- src/words.js ---------- */
// words.js: every line this cutscene shows, in one place, for the lore conversation to rewrite. They are the game's own
// placeholders: the Bramble Colossus fight's introMsg and introAfter (src/game/fights.js, colossus()), word for word. A
// line given as a list shows one part at a time; its parts joined with a space are the game's line.
// Defines cutsceneWords() only.
function cutsceneWords() {
  'use strict';
  return {
    // introMsg: as the party comes up the road
    thicket: 'Beside the frozen road stands a thicket as big as a house, green where nothing else is. The snow round it has melted.',
    // introAfter: as it rises, then as its bud opens
    rises: ['The ground splits. It heaves itself up out of the earth,', 'and a great thorned bud opens on a glowing heart: a Bramble Colossus.']
  };
}

/* ---------- src/scene.js ---------- */
// scene.js: the Colossus, first met: the place, the cast and the shots, as data; player.js plays it.
// The first time the party meets the Bramble Colossus in the wilds, on the frozen road by Frostmere: it ends where its
// fight begins, everyone standing as the fight stands them and seen through the fight's own camera.
//
// Units are meters and seconds. The Colossus stands at the middle of the meadow (the field study's place for it), facing
// the party; the moon is high in the north-north-west, so the party walks north toward it. The fight's numbers come from
// the game: the frozen road's painting and camera (src/stage/frozen-road.js) and where the fight stands Io, Sol and the
// Colossus on it (src/game/fights.js, COLOSSUS_AT), about 8.5 m apart. The place is laid so that the Colossus is at its
// middle, so the battle's own origin is a little to the south-west of it (battle.at).
//
// A shot: { id, d (seconds), cam, focus, ap, exp, bars, fade, slow, shadow, do, sound, say }
//   cam    { from, to, at, at2, fov: [from, to], ease, shake, roll } or { orbit } or { battle: true, from, at, fov, glide }:
//          points are [x, y, z], 'moon', 'actor.part' (an anchor: head, chest, eye, bud, heart, crown, taste, ...) or
//          ['actor.part', dx, dy, dz]; a camera point given by an anchor is fixed where it is when the shot begins
//   focus  meters, a point or an anchor; ap: aperture (blur), or keys [[t, v], ...]; exp: exposure, or keys
//   bars   the letterbox, 1 (2.39 to 1) to 0 (open), or keys; fade: [[t, 0 to 1], ...]; slow: [[t, timescale], ...]
//   do     [t, who, 'walk', [[x, z], ...], speed] | [t, who, 'face', yaw or a point or someone] | [t, who, 'play', move]
//          | [t, who, 'guard', on] | [t, who, 'state', key, [[dt, v], ...]] | [t, who, 'taste', 'toward:someone']
//          | [t, who, 'target', someone] | [t, 'snd', 'quiet' | 'hush' | 'wind', value]
//   sound  [t, 'night', id, gain, { pan, far }] (the meadow's night) | [t, 'sfx', id, gain, { at }] (the scene's own)
//   say    [[t0, t1, key], ...]: a line from words.js (key.n for its nth part); it may run on past the shot's end
// Defines cutsceneScene() only.
function cutsceneScene() {
  'use strict';
  // the fight's painting camera, and where it stands everyone (painting pixels)
  const B = { scene: 'frozen-road', width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54, io: [638, 704], sol: [712, 738], slot: [974, 557] };
  const ground = (() => {
    const A = B.width / B.height, P = B.pitch * Math.PI / 180, D = (B.height / 2) / (B.ppm * Math.tan(B.fov / 2 * Math.PI / 180));
    const cam = new THREE.PerspectiveCamera(B.fov, A, D * .6, D * 1.6); cam.position.set(0, D * Math.sin(P), D * Math.cos(P)); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const rc = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    return (p) => { rc.setFromCamera(new THREE.Vector2(p[0] / B.width * 2 - 1, 1 - p[1] / B.height * 2), cam); rc.ray.intersectPlane(plane, hit); return [hit.x, hit.z]; };
  })();
  const C0 = ground(B.slot), I0 = ground(B.io), S0 = ground(B.sol);
  const IO = [I0[0] - C0[0], I0[1] - C0[1]], SOL = [S0[0] - C0[0], S0[1] - C0[1]], MID = [(IO[0] + SOL[0]) / 2, (IO[1] + SOL[1]) / 2];
  const face = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]);
  // their facing in the fight: toward each other, turned a little toward the camera (the fight's yawBias)
  const YAW = { colossus: face([0, 0], MID), io: face(IO, [0, 0]) - .38, sol: face(SOL, [0, 0]) - .3 };
  // Sol's guard step carries her about 0.57 m toward it, so she stops that far short of where the fight stands her
  const toC = face(SOL, [0, 0]), SOL_STOP = [SOL[0] - Math.sin(toC) * .57, SOL[1] - Math.cos(toC) * .57];

  const shots = [
    // 1. the frozen road under the moon, no stars: Io and Sol small, walking north through the frost, their breath steaming
    { id: 'road', d: 7.5, cam: { from: [-1.6, 5.8, 45], to: [-4.4, 3.1, 33.5], at: 'moon', at2: [-8.2, .6, -2], fov: [40, 34], ease: 'io', shake: .05 },
      focus: 'io.chest', ap: .14, exp: 1.42, fade: [[0, 0], [2.6, 1]],
      do: [[0, 'io', 'walk', [[-7.15, 19], [-6.7, 11], [-6.35, 7.4], IO], 1.12], [0, 'sol', 'walk', [[-5.75, 19.6], [-5.35, 12], SOL_STOP], 1.12]],
      sound: [[.6, 'night', 'owl', .9, { pan: -.6, far: .8 }]] },
    // 2. low through the frosted grass toward a hill of brambles beside the road: green where nothing else is, the snow
    //    melted round it, its berries glinting. From its far side, with the moon behind the camera: the two of them small on
    //    the road beyond, coming up toward it
    { id: 'thicket', d: 6, cam: { from: [-7.6, 1.05, -31.5], to: [-6.5, 1.0, -26.6], at: [-.6, 1.5, .4], at2: [-1, 1.4, .8], fov: [30, 28], ease: 'l', shake: .1 },
      focus: 'colossus.crown', ap: .32, exp: 1.5,
      say: [[.5, 8.4, 'thicket']], sound: [[1.4, 'night', 'ice', .7, { pan: .6, far: .7 }]] },
    // 3. close, as they would see it: one cane lifts and tastes the air, toward them; its heartbeat glows down the canes
    { id: 'taste', d: 4.4, cam: { from: [6.9, 1.45, 13.4], to: [6.1, 1.4, 12.5], at: [-3.4, 1.25, 6.4], at2: [-3.2, 1.3, 6.2], fov: [29, 27], ease: 'io', shake: .1 },
      focus: [-1, 1.4, 5], ap: .38, exp: 1.5, shadow: [-2.5, 0, 6],
      do: [[.3, 'colossus', 'taste', 6], [2.1, 'colossus', 'taste', 5]] },
    // 4. Io stops; Sol puts out an arm and draws her sword, its edge lighting amber; then the ground starts to shake
    { id: 'stop', d: 6.1, cam: { from: [-3.45, 1.32, 3.75], to: [-3.7, 1.28, 4.15], at: [-5.55, 1.22, 6.75], at2: [-5.6, 1.25, 6.6], fov: [34, 31], ease: 'io', shake: .12 },
      focus: [[0, 'sol.head'], [3.6, 'io.head']], ap: .9, exp: 1.45,
      do: [[.3, 'io', 'face', [0, 0], 1.4], [.9, 'sol', 'face', [0, 0], 2], [1.1, 'sol', 'play', 'kestrel'], [2.7, 'sol', 'play', 'guardStep'], [2.7, 'sol', 'guard', true],
        [2.6, 'sol', 'state', 'heat', [[0, 0], [1.4, .78]]], [4.7, 'io', 'play', 'block'], [5.85, 'colossus', 'play', 'appear'], [5.85, 'snd', 'quiet', true]],
      sound: [[2.65, 'sfx', 'blade', 1, { at: 'sol.chest' }], [4.5, 'sfx', 'rumble', 1]] },
    // 5. the ground splits round it; it heaves itself up out of the earth, every cane rising; the camera pulls back and up
    //    over the two of them to take in all 7.5 m of it
    { id: 'rises', d: 9, cam: { from: [-3.1, 1.55, 6.1], to: [-11.4, 3.5, 15.6], at: [-.3, .2, .3], at2: [-.4, 3.4, .2], fov: [44, 38], ease: 'io', shake: .16 },
      focus: [[0, [0, .3, 0]], [2.6, 'colossus.chest']], ap: .3, exp: 1.42, slow: [[0, .66], [5.4, .66], [6.6, 1]],
      do: [[1.2, 'colossus', 'target', 'sol'], [.4, 'io', 'guard', true]],
      say: [[1.2, 6.8, 'rises.0']] },
    // 6. the bud parts on its glowing heart, steam breathing out of it into the cold; the moon behind it
    { id: 'heart', d: 6, cam: { from: [5.6, 2.7, 11.6], to: [4.7, 3.2, 10.4], at: 'colossus.bud', at2: 'colossus.heart', fov: [27, 23], ease: 'io', shake: .08 },
      focus: 'colossus.heart', ap: 1.1, exp: 1.38,
      do: [[.25, 'colossus', 'play', 'alert'], [.6, 'colossus', 'state', 'open', [[0, 0], [2.4, .9]]]],
      say: [[.5, 5.8, 'rises.1']] },
    // 7. the camera settles behind the party into the battle's framing: Io and Sol lower left, the Colossus upper right;
    //    the letterbox opens; hold, then hand over
    { id: 'handover', d: 6, cam: { battle: true, from: [-9.5, 6.2, 21], at: [-2.6, 2.4, 1.6], fov: [30, 30], glide: [0, 4.6] },
      focus: 'sol.chest', ap: [[0, .45], [4, 0]], exp: 1.4, bars: [[0, 1], [4.2, 0]], shadow: [-3, 0, 3],
      do: [[.1, 'colossus', 'state', 'open', [[0, .9], [2.6, 0]]], [.2, 'colossus', 'target', 'io'], [.3, 'io', 'guard', false], [.3, 'io', 'face', YAW.io, 2.2], [.6, 'sol', 'guard', false], [.6, 'sol', 'face', YAW.sol, 2.2],
        [.8, 'sol', 'state', 'heat', [[0, .78], [3, 0]]], [1, 'snd', 'wind', .42]] }
  ];

  return {
    id: 'colossus-first-meeting', title: 'The Colossus, first met', alt: 'The frozen road by Frostmere at night, and a thicket beside it',
    place: {
      cold: true, frost: 1, wind: { x: .6, z: .2, level: .5 },
      // the frozen road, up from the south and bending north toward the pass, past the thicket's west side
      road: { width: 4.6, points: [[2, 150], [-1, 96], [-3.6, 52], [-5.6, 25], [-6.85, 8], [-7.95, -4], [-9.7, -18], [-13, -40], [-19, -75], [-28, -120], [-42, -180], [-60, -250]] }
    },
    cast: {
      colossus: { model: 'colossus', at: [0, 0], yaw: YAW.colossus, level: 18, pose: 'rest' },
      io: { model: 'io', at: [-7.55, 27], yaw: Math.PI, breathAt: .4 },
      sol: { model: 'sol', at: [-6.05, 27.7], yaw: Math.PI, breathAt: 1.9, state: { heat: 0 } }
    },
    shots,
    // where everyone stands when it hands over, also when it is skipped: as the fight stands them (the fight starts Sol's
    // Heat at nothing, src/battle/screen.js resetHeroes)
    handover: {
      // (in the fight, while it waits, it is turned on Io: src/battle/screen.js aims every foe at her by default)
      colossus: { pose: 'base', state: { open: 0 }, target: 'io' },
      io: { at: IO, yaw: YAW.io },
      sol: { at: SOL, yaw: YAW.sol, state: { heat: 0 } }
    },
    // the fight's framing: its painting camera, the battle's origin in the place, and everyone standing in it (their
    // heights and the Colossus's width are the fight's: src/game/fights.js FOE_LOOK and hero)
    battle: {
      scene: B.scene, width: B.width, height: B.height, fov: B.fov, pitch: B.pitch, ppm: B.ppm, at: [-C0[0], 0, -C0[1]],
      field: [{ x: I0[0], z: I0[1], tall: 2.1 }, { x: S0[0], z: S0[1], tall: 1.9 }, { x: C0[0], z: C0[1], tall: 7.8, halfW: 5.4 }]
    },
    idleAt: 4.2
  };
}

/* ---------- src/sfx.js ---------- */
// sfx.js: this cutscene's own sounds, made in code, besides the field study's (sounds.js): footsteps in the frost, Sol's
// blade lighting amber, and the ground rumbling before it splits. They play through the field study's meadow (its
// context, its Bramble bus for effects, and its reverb), so they sit in the same night.
// Defines cutsceneSfx(snd, volume) only, for player.js. Returns { play(id, { gain, pan, far }) }.
function cutsceneSfx(snd, volume) {
  'use strict';
  const ctx = snd.ctx; if (!ctx) return null;
  const SR = ctx.sampleRate, TAU = Math.PI * 2;
  let seed = 9001; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const buf = (s) => new Float32Array(Math.ceil(s * SR));
  const env = (x, a, h, r) => (x < 0 ? 0 : x < a ? .5 - .5 * Math.cos(Math.PI * x / a) : x < a + h ? 1 : x < a + h + r ? .5 + .5 * Math.cos(Math.PI * (x - a - h) / r) : 0);
  function svf() { const f = { lo: 0, bp: 0, hi: 0 }; f.run = (x, hz, q) => { const F = 2 * Math.sin(Math.PI * Math.min(hz, SR * .2) / SR); f.lo += F * f.bp; f.hi = x - f.lo - f.bp / Math.max(q, .5); f.bp += F * f.hi; }; return f; }
  function norm(d, to) { let m = 1e-9; for (const v of d) m = Math.max(m, Math.abs(v)); for (let i = 0; i < d.length; i++) d[i] *= to / m; return d; }
  // a footstep in frosted grass over frozen ground: a soft thud, then the crunch of frost crystals giving way
  function makeStep() {
    const len = .3, d = buf(len), f = svf(), g = svf();
    let th = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / SR;
      th += (rnd() * 2 - 1 - th) * .02; g.run(th, 120, .7);
      const crunch = rnd() < .14 * Math.exp(-t / .07) ? (rnd() * 2 - 1) : 0; f.run(crunch + (rnd() * 2 - 1) * .05 * Math.exp(-t / .05), 2400 + 1800 * rnd(), 1.4);
      d[i] = g.lo * 3 * env(t, .004, .02, .09) + f.bp * .9 * env(t, .002, .05, .16);
    }
    return norm(d, .8);
  }
  // her sunsteel lighting: air drawn past the blade, then a warm hum rising with a shimmer over it
  function makeBlade() {
    const len = 2.2, d = buf(len), f = svf(); let ph = [0, 0, 0, 0];
    for (let i = 0; i < d.length; i++) {
      const t = i / SR, sw = Math.min(1, t / .45);
      f.run(rnd() * 2 - 1, 500 + 3200 * sw * sw, 2.2);
      const whoosh = f.bp * env(t, .25, .1, .5) * .9;
      const hz = 98 + 14 * Math.min(1, t / .8);
      ph[0] += TAU * hz / SR; ph[1] += TAU * hz * 2.003 / SR; ph[2] += TAU * hz * 3.01 / SR; ph[3] += TAU * 1180 * (1 + .002 * Math.sin(t * 9)) / SR;
      const hum = (Math.sin(ph[0]) * .6 + Math.sin(ph[1]) * .3 + Math.sin(ph[2]) * .12) * env(t, .5, .5, 1.1) * .5;
      const shimmer = Math.sin(ph[3]) * env(t, .35, .25, 1.2) * .07 * (.6 + .4 * Math.sin(t * 23));
      d[i] = whoosh + hum + shimmer;
    }
    return norm(d, .75);
  }
  // the ground under the frost groaning before it splits: a deep, slow swell
  function makeRumble() {
    const len = 2.6, d = buf(len), f = svf(), g = svf();
    for (let i = 0; i < d.length; i++) {
      const t = i / SR;
      f.run(rnd() * 2 - 1, 55 + 25 * Math.sin(t * 2.1), 1.2); g.run(rnd() * 2 - 1, 220, .8);
      d[i] = (f.bp * 2.4 + g.lo * .25 * (.5 + .5 * Math.sin(t * 17))) * env(t, 1.3, .6, .7);
    }
    return norm(d, .9);
  }
  const BUF = {};
  const make = { step0: makeStep, step1: makeStep, step2: makeStep, blade0: makeBlade, rumble0: makeRumble };
  for (const k in make) { try { const d = make[k](), b = ctx.createBuffer(1, d.length, SR); b.copyToChannel(d, 0); BUF[k] = b; } catch (e) { /* left out */ } }
  const LEVEL = { step: .32, blade: .7, rumble: .9 };
  let last = -1;
  return {
    play(id, o) {
      if (!snd.ctx || snd.muted) return; o = o || {};
      let b = BUF[id + '0'];
      if (id === 'step') { let v = Math.floor(rnd() * 3); if (v === last) v = (v + 1) % 3; last = v; b = BUF['step' + v]; }
      if (!b) return;
      const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (rnd() - .5) * (id === 'step' ? .16 : .04);
      const gn = ctx.createGain(); gn.gain.value = (o.gain === undefined ? 1 : o.gain) * (LEVEL[id] || .5) * (1 - .5 * (o.far || 0));
      let tail = gn; s.connect(gn);
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan || 0)); gn.connect(p); tail = p; }
      const bus = snd.bus('bramble'); if (bus) tail.connect(bus);
      if (snd.wet) { const send = ctx.createGain(); send.gain.value = .12 + .5 * (o.far || 0); tail.connect(send); send.connect(snd.wet); }
      s.start(ctx.currentTime + .01);
    }
  };
}

/* ---------- src/player.js ---------- */
// player.js: plays a cutscene written as data: a place, a cast and a list of shots (scene.js), with every line it shows
// in one file (words.js). It is general: a new scene, or a new creature's first meeting, is a new place and shot list
// for this player, not a new player. It builds everything inside the element it is given, plays it through the film
// camera (cinema.js: depth of field, bloom, moonlight shafts, a film grade, letterbox), and afterwards frees everything,
// its WebGL context and its sound included, so the battle can build its own.
//
// Defines makeCutscene(def) only. def: {
//   id, title,
//   scene()   the scene's data (scene.js), made fresh for each run
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
//     (start that many seconds in, for checking) }
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
    const SC = timeline(def.scene()), WORDS = def.words(), CAST = def.cast();
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
    function cameraStep(realT, cut, dt) {
      const s = SC.shots[film.shot], c = s.cam, cam = E.camera, st = film.t - s.start;
      if (cut) { delete c._from; delete c._to; }
      const e = (EASE[c.ease] || EASE.io)(cl(st / s.d, 0, 1));
      let fov = c.fov ? lerp(c.fov[0], c.fov[1], e) : 34, exact = false;
      if (c.battle) {
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
      if (exact) {
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

window.CUTSCENES = window.CUTSCENES || {};
window.CUTSCENES['colossus-first-meeting'] = makeCutscene({ id: 'colossus-first-meeting', title: 'The Colossus, first met', scene: cutsceneScene, words: cutsceneWords, place: cutscenePlace, cast: cutsceneCast, sfx: cutsceneSfx });
})();
