// emberback.js: the Emberback, a giant salamander of the Ember Line. three.js r128 (global THREE). Defines
// makeEmberback(opts) only. About seven metres from snout to tail tip and low and heavy, with a broad flat head and a
// wide mouth that glows inside, small amber eyes, black hide cracked all over like cooling lava with molten gold light
// in every crack, a tan belly of plates, four thick splayed legs with clawed feet, and a ridge of glowing sunstone
// crystals from its brow down its back to a cluster at the tip of its long tail. It lives in the veins of buried
// sunstone and basks on lit Warm Road nodes; Noctara's cold is dimming the nodes, so it is starving, and it comes up out
// of the earth hunting any warmth it can find. Beaten, it curls up asleep and cools to stone (from Chris's model and
// action sheets in `original/`, and art request 09).
// opts: { detail .5 to 1, size (an extra overall scale) }
function makeEmberback(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, its feet on the ground at y = 0. Its left side is +X.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 40917;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 // a second stream for the runtime (idle twitches, effects), so the build's shapes never depend on what has played
 let seed2 = 7213;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
 const SZ = opts.size > 0 ? +opts.size : 1;
 const root = new THREE.Group(), base = new THREE.Group(), fx = new THREE.Group();
 root.name = 'emberback'; root.add(base);

 // ---------- painted textures ----------
 // the hide: rounded plates of black basalt between molten cracks, a cellular pattern that tiles. One pass paints three
 // pictures: the plates' colour (dark charcoal, a little warmer where the heat has scorched their edges), the cracks'
 // glow (white-gold in the middle, orange at the edges, wider where three plates meet, some cracks hotter than others)
 // and the height (domed plates, sunken cracks), which also lifts the body's surface so its outline is lumpy with plates.
 const HS = 512 * (DET < .75 ? 1 : 2);
 const HIDE = (() => {
  const S = HS, N = 15, cs = S / N, P = [];
  // the plates' seeds, a little stretched along the body, each with its own tone and heat
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) P.push([(i + .12 + .76 * rnd()) * cs, (j + .12 + .76 * rnd()) * cs, rnd(), rnd()]);
  const cA = cvs(S, S), cE = cvs(S, S), cB = cvs(S, S);
  const gA = cA.getContext('2d'), gE = cE.getContext('2d'), gB = cB.getContext('2d');
  const iA = gA.createImageData(S, S), iE = gE.createImageData(S, S), iB = gB.createImageData(S, S), H = new Float32Array(S * S);
  const k = S / 1024; // the cracks keep their width in plate terms at any resolution
  // which cracks run hot: a slow wave over the picture that tiles, so some seams blaze and others are dark
  const hot = (x, y) => { const a = x / S * TAU, b = y / S * TAU; return cl(.5 + .32 * Math.sin(a * 2 + 1.3) * Math.sin(b * 3 + .4) + .26 * Math.sin(a * 3 + b * 2 + 2.1) + .12 * Math.sin(a * 7 - b * 5), 0, 1); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
   const gi = Math.floor(x / cs), gj = Math.floor(y / cs);
   let d1 = 1e9, d2 = 1e9, d3 = 1e9, k1 = 0;
   for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { // (the seeds sit well inside their cells, so the three nearest are always here)
    const ii = (gi + di + N) % N, jj = (gj + dj + N) % N, p = P[jj * N + ii];
    const dx = x - (p[0] + (gi + di - ii) * cs), dy = (y - (p[1] + (gj + dj - jj) * cs)) * 1.18, d = dx * dx + dy * dy; // (the wrapped copy beside this cell)
    if (d < d1) { d3 = d2; d2 = d1; d1 = d; k1 = jj * N + ii; } else if (d < d2) { d3 = d2; d2 = d; } else if (d < d3) d3 = d;
   }
   d1 = Math.sqrt(d1); d2 = Math.sqrt(d2); d3 = Math.sqrt(d3);
   const e = (d2 - d1) * .5, p = P[k1], o = (y * S + x) * 4, h = hot(x, y) * (.55 + .45 * p[3]);
   // the crack: a narrow seam, a little wider where it runs hot, swelling into a pool where three plates meet
   const jn = 1 - sm(0, cs * .3, d3 - d1), w = (1.3 + 1.7 * h + 4 * jn * jn) * k;
   const crack = 1 - sm(w * .45, w, e), core = 1 - sm(0, w * .5, e);
   // the plate: domed, a faint rim catching the light, small scale-bumps on it, scorched brown along the crack
   const dome = sm(0, cs * .5, e), rim = sm(w, w + 2.5 * k, e) * (1 - sm(w + 2.5 * k, w + 7 * k, e)), scorch = (1 - sm(w, w + 7 * k, e)) * (.3 + .7 * h);
   const tone = .78 + .44 * p[2], sc = .5 + .5 * Math.sin(x / k * .5 + p[3] * 9) * Math.sin(y / k * .46 + p[2] * 7);
   const r = (30 + 12 * dome + 16 * rim + 5 * sc) * tone + 40 * scorch, g = (27 + 10 * dome + 13 * rim + 4 * sc) * tone + 14 * scorch, b = (26 + 9 * dome + 11 * rim + 3 * sc) * tone + 3 * scorch;
   iA.data[o] = lerp(r, 40, crack); iA.data[o + 1] = lerp(g, 20, crack); iA.data[o + 2] = lerp(b, 12, crack); iA.data[o + 3] = 255;
   const glow = crack * (.22 + .78 * sm(.12, .7, h)) + core * jn * .4 * h;
   iE.data[o] = 255 * Math.min(1, glow * 1.1); iE.data[o + 1] = 255 * Math.min(1, glow * (.36 + .5 * core * h)); iE.data[o + 2] = 255 * Math.min(1, core * glow * h * .32); iE.data[o + 3] = 255;
   const ht = (1 - crack * .9) * (.4 + .44 * dome + .1 * rim + .06 * sc);
   H[y * S + x] = ht; iB.data[o] = iB.data[o + 1] = iB.data[o + 2] = 255 * ht; iB.data[o + 3] = 255;
  }
  gA.putImageData(iA, 0, 0); gE.putImageData(iE, 0, 0); gB.putImageData(iB, 0, 0);
  // the height at a texture coordinate (wrapping, bilinear), for the plates' relief in the geometry
  const at = (u, v) => {
   const fx = ((u % 1 + 1) % 1) * S - .5, fy = ((1 - v) % 1 + 1) % 1 * S - .5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
   const q = (x, y) => H[((y + S) % S) * S + (x + S) % S];
   return lerp(lerp(q(x0, y0), q(x0 + 1, y0), tx), lerp(q(x0, y0 + 1), q(x0 + 1, y0 + 1), tx), ty);
  };
  return { map: tex(cA, 1), glow: tex(cE, 1), bump: tex(cB, 1), at };
 })();
 // the belly: tan plates in rows across it like a crocodile's, darker in the seams, a faint glow in a few
 const BELLY = (() => {
  const W = 256 * (DET < .75 ? 1 : 2), H = W, c = cvs(W, H), g = c.getContext('2d'), e = cvs(W, H), ge = e.getContext('2d'), k = W / 512;
  g.fillStyle = '#4a3a2e'; g.fillRect(0, 0, W, H); ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
  const rows = 14, rh = H / rows, cols = 6, cw = W / cols;
  g.filter = 'blur(' + (1.5 * k).toFixed(1) + 'px)';
  for (let j = 0; j < rows; j++) {
   const off = (j % 2) * cw * .5 + rr(-.2, .2) * cw;
   for (let i = -1; i <= cols; i++) {
    const x = i * cw + off + rr(-5, 5) * k, y = j * rh + rr(-2, 2) * k, t = rr(.8, 1.08);
    const q = g.createLinearGradient(0, y, 0, y + rh);
    q.addColorStop(0, `rgb(${98 * t | 0},${80 * t | 0},${66 * t | 0})`); q.addColorStop(.55, `rgb(${88 * t | 0},${71 * t | 0},${58 * t | 0})`); q.addColorStop(1, `rgb(${56 * t | 0},${43 * t | 0},${36 * t | 0})`);
    g.fillStyle = q; g.beginPath();
    g.ellipse(x + cw / 2, y + rh / 2, cw / 2 - 2 * k, rh / 2 - 1.5 * k, 0, 0, TAU);
    g.fill();
    if (rnd() < .12) { ge.strokeStyle = `rgba(255,${90 + rnd() * 70 | 0},20,${rr(.15, .35).toFixed(2)})`; ge.lineWidth = 2.5 * k; ge.beginPath(); ge.ellipse(x + cw / 2, y + rh / 2, cw / 2 - 1.5 * k, rh / 2 - 1 * k, 0, 0, TAU); ge.stroke(); }
   }
  }
  g.filter = 'none';
  // fine speckle so the plates are not flat colour
  const id = g.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) { const p = i / 4, x = p % W, y = (p / W) | 0, n = (rnd() - .5) * 16 + 10 * Math.sin(x * .05 + y * .03) * Math.sin(y * .07 - x * .02); id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n * .8; }
  g.putImageData(id, 0, 0);
  return { map: tex(c, 1), glow: tex(e, 1) };
 })();
 // the eye: an amber iris that glows a little, ringed darker, a round black pupil and a wet highlight
 const eyeTex = (() => {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  g.fillStyle = '#1a0e08'; g.fillRect(0, 0, S, S);
  const q = g.createRadialGradient(m, m, 4, m, m, 60); q.addColorStop(0, '#ffd27a'); q.addColorStop(.42, '#ff9e22'); q.addColorStop(.78, '#c2560a'); q.addColorStop(.95, '#4a1a04'); q.addColorStop(1, '#2a1004');
  g.fillStyle = q; g.beginPath(); g.arc(m, m, 60, 0, TAU); g.fill();
  for (let i = 0; i < 70; i++) { const a = rnd() * TAU; g.strokeStyle = 'rgba(120,48,0,.32)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(m + Math.cos(a) * 24, m + Math.sin(a) * 24); g.lineTo(m + Math.cos(a) * 56, m + Math.sin(a) * 56); g.stroke(); }
  g.fillStyle = '#060302'; g.beginPath(); g.arc(m, m, 21, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(m - 17, m - 19, 9, 6, -.6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(m + 18, m + 16, 4, 0, TAU); g.fill();
  return tex(c);
 })();
 // sprites: a soft dot, a smoke puff, a flame tongue, a crystal glint, and a cracked crater for the ground
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, q = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) q.addColorStop(o, col); g.fillStyle = q; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']], 64);
 const haloT = radial([[0, 'rgba(255,255,255,.9)'], [.18, 'rgba(255,255,255,.45)'], [.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']], 128);
 const puffT = (() => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 36 + rnd() * 56, y = 36 + rnd() * 56, r = 12 + rnd() * 24, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.26)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 28, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); })();
 const flameT = (() => {
  const c = cvs(64, 128), g = c.getContext('2d');
  for (let i = 0; i < 3; i++) {
   const w = [26, 18, 10][i], a = [.45, .65, .95][i];
   const q = g.createRadialGradient(32, 96, 2, 32, 82, 64); q.addColorStop(0, `rgba(255,255,255,${a})`); q.addColorStop(.6, `rgba(255,255,255,${a * .45})`); q.addColorStop(1, 'rgba(255,255,255,0)');
   g.fillStyle = q; g.beginPath(); g.moveTo(32, 4 + i * 14); g.bezierCurveTo(32 + w, 50, 32 + w * 1.1, 92, 32, 122); g.bezierCurveTo(32 - w * 1.1, 92, 32 - w, 50, 32, 4 + i * 14); g.fill();
  }
  return tex(c);
 })();
 const glintT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.translate(32, 32); g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.moveTo(0, -30); g.lineTo(9, -4); g.lineTo(5, 26); g.lineTo(-6, 22); g.lineTo(-10, -2); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(0, -30); g.lineTo(9, -4); g.lineTo(0, 2); g.closePath(); g.fill(); return tex(c); })();
 // the crater: broken black ground, radial cracks whose cores glow (r: dark ground, g: glowing crack, b: rubble)
 const craterT = (() => {
  const S = 512, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const q = g.createRadialGradient(m, m, 0, m, m, m * .55); q.addColorStop(0, 'rgba(255,0,140,1)'); q.addColorStop(.7, 'rgba(230,0,90,.8)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const branch = (x, y, a, len, w, d) => {
   for (let s = 0; s < len; s += 9) {
    const nx = x + Math.cos(a) * 9, ny = y + Math.sin(a) * 9;
    g.strokeStyle = `rgba(150,0,40,${.9 * (1 - s / len)})`; g.lineWidth = w * 3.2 * (1 - s / len) + 1; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
    g.strokeStyle = `rgba(0,${255 * (1 - .6 * s / len) | 0},0,1)`; g.lineWidth = w * (1 - s / len) + .6; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
    x = nx; y = ny; a += (rnd() - .5) * .5;
    if (d < 2 && rnd() < .07) branch(x, y, a + (rnd() < .5 ? -1 : 1) * rr(.5, 1), len * .45, w * .6, d + 1);
   }
  };
  for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + rr(-.2, .2); branch(m + Math.cos(a) * 30, m + Math.sin(a) * 30, a, rr(150, 225), rr(3.5, 6), 0); }
  return tex(c);
 })();

 // ---------- materials ----------
 // Shared uniforms for every part of its body: time, how hot it burns (uHeat: the cracks' glow; 1 at rest), the crystals'
 // glow (uCry) and their blaze to white (uWhite), the mouth's glow, the lips', the eyes', a pulse of light running along
 // its body (uWave: x where along it, from the snout at 0 to the tail tip at 1, y how strong, z the steady ripple),
 // starving (uStarve: dim, dull red, frost creeping over it), turned to stone (uStone), a dissolve with a burning edge
 // (uDis), and a cut at the ground it bursts up through (uClip).
 const U = {
  time: { value: 0 }, heat: { value: 1 }, cry: { value: 1 }, white: { value: 0 }, mouth: { value: 1 }, lip: { value: 1 }, eye: { value: 1 },
  wave: { value: new THREE.Vector4(-1, 0, 1, 0) }, starve: { value: 0 }, stone: { value: 0 }, dis: { value: 0 }, disCol: { value: new THREE.Color(1, .55, .2) },
  clip: { value: -1e4 }, rim: { value: .28 }, rimC: { value: new THREE.Color(0x8c8ab8) }, belly: { value: BELLY.map }, bellyG: { value: BELLY.glow }
 };
 const NOISE = 'float ebH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float ebN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(ebH(i),ebH(i+vec3(1,0,0)),f.x),mix(ebH(i+vec3(0,1,0)),ebH(i+vec3(1,1,0)),f.x),f.y),mix(mix(ebH(i+vec3(0,0,1)),ebH(i+vec3(1,0,1)),f.x),mix(ebH(i+vec3(0,1,1)),ebH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 // aEB, per vertex: x how far along the body (0 the snout, 1 the tail's tip), y how strongly it glows (the hide: 1 along
 // the spine, low on the belly; a crystal: its brightness), z the belly (a crystal: how far up it, 0 base, 1 tip), w the
 // lips. kind: 'hide', 'cry', 'mouth', 'eye' or 'claw'.
 function patch(m, kind) {
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uHeat: U.heat, uCry: U.cry, uWhite: U.white, uMouth: U.mouth, uLip: U.lip, uEye: U.eye, uWave: U.wave, uStarve: U.starve, uStone: U.stone,
    uDis: U.dis, uDisCol: U.disCol, uClip: U.clip, uRim: U.rim, uRimC: U.rimC, uBelly: U.belly, uBellyG: U.bellyG });
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   const vary = 'varying vec3 vDP;\nvarying float vWY;\nvarying vec3 vWN;\nvarying vec4 vEB;\n';
   vs = vary + 'attribute vec4 aEB;\n' + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position; vEB = aEB;');
   vs = vs.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n vWN = normalize(mat3(modelMatrix) * objectNormal);');
   vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWY = (modelMatrix * vec4(transformed, 1.0)).y;');
   fs = vary + 'uniform float uTime, uHeat, uCry, uWhite, uMouth, uLip, uEye, uStarve, uStone, uDis, uClip, uRim;\nuniform vec4 uWave;\nuniform vec3 uDisCol, uRimC;\nuniform sampler2D uBelly, uBellyG;\n' + NOISE + fs;
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (vWY < uClip) discard;\n float ebE = 0.0, ebNz = .7 * ebN(vDP * 7.) + .3 * ebN(vDP * 19.);\n' +
    ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (ebNz < th) discard; ebE = 1. - smoothstep(0., .06, ebNz - th); }\n' +
    ' float ebPul = uWave.z * (.84 + .16 * sin(uTime * 1.6 - vEB.x * 9.)) + uWave.y * exp(-pow((vEB.x - uWave.x) * 7., 2.));\n' +
    // frost: on what faces the sky, in patches, and on the tail's tip
    ' float ebFr = ' + (kind === 'hide' || kind === 'cry' ? 'uStarve * clamp(smoothstep(.75, 1.1, vWN.y * .6 + ebN(vDP * 4.) * .7) * .6 + smoothstep(.84, .98, vEB.x) * .6, 0., 1.)' : '0.') + ';\n');
   // (each replace below goes in just after its include, so the last one written runs first)
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * ebE * 1.6;');
   if (kind === 'hide') {
    fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n { float tint = smoothstep(0., .5, vEB.z), bel = smoothstep(.5, 1., vEB.z);\n  { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.33, .26, .2) * (.45 + 2.2 * l), tint * .85); }\n  vec4 bt = texture2D(uBelly, vec2(vUv.y * 4.6, vUv.x * 2.5)); diffuseColor.rgb = mix(diffuseColor.rgb, bt.rgb, bel); }');
    fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .8, vEB.z * .7); roughnessFactor = mix(roughnessFactor, .92, max(uStone, ebFr * .8));');
    fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
     ' { vec3 g = totalEmissiveRadiance; float l = dot(g, vec3(.4, .45, .15));\n' +
     '  g = mix(g, vec3(1.25, .2, .08) * l * 1.1, uStarve * .85);\n' +
     '  g *= uHeat * mix(.12, 1., vEB.y) * ebPul * (1. - smoothstep(0., 1., vEB.z) * .75);\n' +
     '  g += texture2D(uBellyG, vec2(vUv.y * 4.6, vUv.x * 2.5)).rgb * smoothstep(.5, 1., vEB.z) * .35 * uHeat * (1. - uStarve);\n' +
     '  g += vec3(1., .5, .16) * vEB.w * uLip * 1.5 * (1. - uStarve * .6);\n' +
     '  totalEmissiveRadiance = g * (1. - uStone); }');
   } else if (kind === 'cry') {
    fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
     ' { float fa = abs(dot(normal, normalize(vViewPosition))), tip = vEB.z;\n' +
     '  vec3 c = mix(vec3(1., .3, .03), vec3(1., .58, .14), smoothstep(.1, .8, fa)); c += vec3(1., .85, .5) * pow(fa, 5.) * .5;\n' +
     '  c *= mix(1.15, .7, tip) * (.4 + .6 * fa) * .8;\n' +
     '  c = mix(c, vec3(1., .96, .86) * 1.4, uWhite * (.4 + .6 * fa));\n' +
     '  c = mix(c, vec3(.75, .07, .06) * (.4 + .9 * fa), uStarve * .9);\n' +
     '  totalEmissiveRadiance = c * vEB.y * uCry * ebPul * (1. - uStone); }');
   } else if (kind === 'mouth') fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = vColor * uMouth * .5 * (.6 + .4 * ebPul) * (1. - uStone) * mix(1., .45, uStarve);');
   else if (kind === 'eye') fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= uEye * (1. - uStone) * mix(1., .5, uStarve);');
   // stone: cooled basalt (the crystals smoky brown); frost whitens; then a cool rim of moonlight
   fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11));\n' +
    (kind === 'cry' ? '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.15, .1, .075) * (.8 + .4 * ebNz), uStone);\n' : '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.19, .18, .17) * (.55 + l * 1.8) * (.85 + .3 * ebNz), uStone);\n') +
    '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.78, .84, .92) * (.85 + .2 * ebNz), ebFr * .55); }');
   fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => 'emberback-' + kind;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .5, metalness: 0, skinning: true }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  // wet black hide: its colour, its plates' relief, and the glow of its cracks (scaled in the shader)
  hide: patch(std({ map: HIDE.map, bumpMap: HIDE.bump, bumpScale: .05, emissive: 0xffffff, emissiveMap: HIDE.glow, roughness: .4 }), 'hide'),
  cry: patch(std({ color: 0xc06a20, roughness: .18, metalness: .1, emissive: 0xffffff, flatShading: true }), 'cry'),
  claw: patch(std({ vertexColors: true, roughness: .3, metalness: .05 }), 'claw'),
  mouth: patch(std({ vertexColors: true, roughness: .35, emissive: 0xffffff }), 'mouth'),
  eye: patch(std({ map: eyeTex, emissiveMap: eyeTex, emissive: 0xffa040, emissiveIntensity: .32, roughness: .12 }), 'eye')
 };

 // ---------- its shape ----------
 // The body is one surface lofted along its length, its cross-sections wide-shouldered superellipses. Along it (z, from
 // the snout at 2.62 m to the tail's tip at -4.4 m): the height of its widest point (in the head, the mouth's line), how
 // far it rises above that and sinks below it, and its half-width (from the sheet's side, top and front views).
 const PZ = [2.62, 2.58, 2.52, 2.45, 2.3, 2.1, 1.9, 1.75, 1.55, 1.3, 1.0, .6, .2, -.2, -.6, -1.0, -1.4, -1.9, -2.4, -2.9, -3.4, -3.8, -4.15, -4.4];
 const PY = [1.1, 1.1, 1.106, 1.122, 1.155, 1.19, 1.215, 1.22, 1.15, 1.09, 1.055, 1.0, .945, .88, .82, .775, .70, .635, .57, .51, .48, .47, .48, .5];
 const PT = [0, .15, .24, .3, .37, .4, .405, .42, .47, .54, .61, .67, .655, .59, .51, .445, .40, .365, .31, .26, .22, .18, .12, 0];
 const PB = [0, .1, .16, .21, .29, .35, .42, .48, .53, .55, .6, .67, .655, .59, .51, .445, .40, .365, .31, .25, .2, .16, .1, 0];
 const PW = [.3, .45, .54, .6, .66, .71, .75, .76, .73, .77, .84, .87, .88, .85, .79, .70, .58, .48, .38, .31, .26, .2, .13, 0];
 // a smooth curve through a column of that table (cubic Hermite, slopes from the neighbours)
 function prof(T, z) {
  let i = 0; while (i < PZ.length - 2 && z < PZ[i + 1]) i++;
  const z0 = PZ[i], z1 = PZ[i + 1], t = cl((z0 - z) / (z0 - z1), 0, 1);
  const sl = (k) => (k <= 0 ? (T[1] - T[0]) / (PZ[0] - PZ[1]) : k >= PZ.length - 1 ? (T[k] - T[k - 1]) / (PZ[k - 1] - PZ[k]) : (T[k + 1] - T[k - 1]) / (PZ[k - 1] - PZ[k + 1]));
  const h = z0 - z1, m0 = sl(i) * h, m1 = sl(i + 1) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * T[i] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * T[i + 1] + (t3 - t2) * m1;
 }
 const ZS = 2.62, ZT = -4.4, ZC = 1.8; // the snout, the tail's tip, the mouth's corners
 const sOf = (z) => (ZS - z) / (ZS - ZT);
 // the cross-section's roundness: a flat broad head, a full body, a rounder tail; the belly flatter than the back
 const nTop = (z) => lerp(lerp(2.1, 2.25, sm(-1.6, -.8, z)), 1.95, sm(ZC - .2, ZC + .15, z)), nBot = (z) => lerp(lerp(2.2, 2.4, sm(-1.6, -.8, z)), 2.3, sm(ZC - .3, ZC + .1, z));
 // a point on the bind pose's surface: phi runs round the cross-section from the middle of the belly (0) up its left side
 // (.25, the mouth's line in the head) over the top (.5) and down its right side (.75)
 function surfP(z, phi, out) {
  const th = phi * TAU, s = Math.sin(th), c = -Math.cos(th), up = c >= 0;
  const ex = 2 / (up ? nTop(z) : nBot(z));
  const x = prof(PW, z) * Math.sign(s) * Math.pow(Math.abs(s), ex), y = (up ? prof(PT, z) : prof(PB, z)) * Math.sign(c) * Math.pow(Math.abs(c), ex);
  return out.set(x, prof(PY, z) + y, z);
 }
 // the eyes: on the head's upper slopes behind the snout, bulging out of it, gazing out and forward and a little up
 const EYEZ = 2.13, EYEPHI = .352, EYE = [], GAZE = [V3(.6, .26, .76).normalize(), V3(-.6, .26, .76).normalize()];
 { const p = surfP(EYEZ, EYEPHI, V3()); EYE.push(V3(p.x - .028, p.y - .02, p.z), V3(-p.x + .028, p.y - .02, p.z)); }

 // ---------- skeleton ----------
 // ground (stays put), pivot (the whole creature turns about its middle on it: Tail Lash), body (at the hips: it rears up
 // about them), the spine forward to the shoulders, the neck, the head with its jaw, its eyelids and its throat, eight
 // bones down the tail, and four for each leg (upper, lower, foot, toes).
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const PIVZ = -.3;
 const ground = bone('ground', base, 0, 0, 0), pivot = bone('pivot', ground, 0, 0, PIVZ, 'YXZ');
 const JZ = { body: -.85, sp1: -.2, sp2: .45, sp3: 1.05, neck: 1.48, head: ZC }; // the spine's joints along z
 const body = bone('body', pivot, 0, .82, JZ.body - PIVZ, 'YXZ');
 const sp1 = bone('sp1', body, 0, .1, JZ.sp1 - JZ.body, 'YXZ'), sp2 = bone('sp2', sp1, 0, .08, JZ.sp2 - JZ.sp1, 'YXZ'), sp3 = bone('sp3', sp2, 0, .05, JZ.sp3 - JZ.sp2, 'YXZ');
 // (the head sits on the mouth's line, 1.15 m up; the jaw hinges just in front of the mouth's corners)
 const neck = bone('neck', sp3, 0, .03, JZ.neck - JZ.sp3, 'YXZ'), head = bone('head', neck, 0, .07, JZ.head - JZ.neck, 'YXZ');
 const JAWZ = 1.9, jaw = bone('jaw', head, 0, prof(PY, JAWZ) - 1.15, JAWZ - JZ.head, 'YXZ'), throat = bone('throat', neck, 0, -.36, .26);
 const lids = EYE.map((p, i) => bone('lid' + i, head, p.x, p.y - 1.15, p.z - JZ.head));
 // the tail: joints at these z, sagging toward the ground
 const TZ = [-1.25, -1.7, -2.15, -2.6, -3.05, -3.5, -3.9, -4.22], TY = [.77, .71, .64, .58, .53, .5, .48, .48], NT = TZ.length;
 const TL = []; for (let i = 0; i < NT; i++) TL.push(bone('t' + i, i ? TL[i - 1] : body, 0, TY[i] - (i ? TY[i - 1] : .82), TZ[i] - (i ? TZ[i - 1] : JZ.body), 'YXZ'));
 // the legs: shoulder or hip, elbow or knee, wrist or ankle, and where the toes begin (bind positions, its left side);
 // the elbows sit out and back, the knees out and forward, as a lizard sprawls
 const LEGS = [
  { n: 'fl', s: 1, front: true, P: [V3(.56, 1.0, 1.08), V3(1.0, .64, .98), V3(1.17, .22, 1.2), V3(1.26, .07, 1.47)], pole: V3(1, .1, -.5), par: sp3 },
  { n: 'fr', s: -1, front: true, P: [V3(-.56, 1.0, 1.08), V3(-1.0, .64, .98), V3(-1.17, .22, 1.2), V3(-1.26, .07, 1.47)], pole: V3(-1, .1, -.5), par: sp3 },
  { n: 'hl', s: 1, front: false, P: [V3(.52, .8, -.86), V3(1.0, .72, -.6), V3(1.15, .22, -.84), V3(1.3, .07, -.6)], pole: V3(1, .3, .6), par: body },
  { n: 'hr', s: -1, front: false, P: [V3(-.52, .8, -.86), V3(-1.0, .72, -.6), V3(-1.15, .22, -.84), V3(-1.3, .07, -.6)], pole: V3(-1, .3, .6), par: body }
 ];
 root.updateMatrixWorld(true);
 for (const L of LEGS) {
  const pw = L.par.getWorldPosition(V3()), b = [];
  b.push(bone(L.n + '0', L.par, L.P[0].x - pw.x, L.P[0].y - pw.y, L.P[0].z - pw.z));
  for (let i = 1; i < 4; i++) b.push(bone(L.n + i, b[i - 1], L.P[i].x - L.P[i - 1].x, L.P[i].y - L.P[i - 1].y, L.P[i].z - L.P[i - 1].z));
  L.b = b; L.l1 = L.P[0].distanceTo(L.P[1]); L.l2 = L.P[1].distanceTo(L.P[2]);
  // its stance: the wrist's place over the ground (in the pivot's frame); the diagonal pairs step together, as a lizard's
  L.home = V3(L.P[2].x, L.P[2].y, L.P[2].z - PIVZ); L.ph = L.n === 'fl' || L.n === 'hr' ? 0 : PI; if (!L.front) L.ph += .25;
 }
 root.updateMatrixWorld(true);

 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function geo(pos, idx, uv) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; }
 function attr(g, name, size, fn) { const n = g.attributes.position.count, a = new Float32Array(n * size), o = new Array(size); for (let i = 0; i < n; i++) { fn(i, o); for (let k = 0; k < size; k++) a[i * size + k] = o[k]; } g.setAttribute(name, new THREE.BufferAttribute(a, size)); return g; }
 const ebAll = (g, x, y, z, w) => attr(g, 'aEB', 4, (i, o) => { o[0] = x; o[1] = y; o[2] = z; o[3] = w; });
 const colorAll = (g, c) => attr(g, 'color', 3, (i, o) => { o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; });
 function skinW(g, fn) {
  const p = g.attributes.position, n = p.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(p.getX(i), p.getY(i), p.getZ(i), i).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[BI.body, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g;
 }
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size);
    else if (k === 'color') arr.fill(1, vo * size, (vo + c) * size);
    else if (k === 'skinWeight') for (let i = 0; i < c; i++) arr[(vo + i) * 4] = 1;
    else if (k === 'aEB') for (let i = 0; i < c; i++) arr[(vo + i) * 4 + 1] = .3;
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 // the spine and the tail, snout to tail tip: each bone, and the z where its share of the body ends going tailward. Each
 // vertex is shared between neighbours smoothly across every joint.
 const CHB = [head, neck, sp3, sp2, sp1, body, ...TL], CHZ = [ZC, JZ.neck, JZ.sp3, JZ.sp2, JZ.sp1, TZ[0], ...TZ.slice(1)];
 function spineW(z, out, k) {
  out = out || []; k = k === undefined ? 1 : k;
  let prev = 0;
  for (let j = 0; j <= CHZ.length; j++) {
   const r = j < 6 ? .2 : .15, F = j < CHZ.length ? sm(CHZ[j] - r, CHZ[j] + r, z) : 1, w = F - prev; prev = F;
   if (w > 1e-4) out.push([BI[CHB[j].name], w * k]);
  }
  return out;
 }

 // ---------- the body: one surface from the snout to the tail's tip ----------
 // Rings close together in the head, then spaced to the girth. In the head the surface splits along the mouth's line:
 // above it rides the head, below it the jaw (shared with the neck toward the mouth's corners, so the cheeks stretch);
 // the line's vertices are doubled, so the mouth opens. The plates' relief lifts the surface (from the same picture
 // the hide is painted with), brows bulge over the eyes, and the lips glow.
 const NR = Math.max(48, Math.round(84 * DET / 4) * 4), Q1 = NR / 4, Q3 = 3 * NR / 4, NAR = .7; // vertices round a ring; hide tiles round the body
 const zr = []; { const nh = Math.round(36 * (.5 + .5 * DET)); for (let i = 0; i < nh; i++) zr.push(lerp(ZS, ZC, i / nh)); let z = ZC; while (z > ZT + .02) { zr.push(z); const g = TAU * (prof(PW, z) + .5 * (prof(PT, z) + prof(PB, z))) / 2; z -= Math.max(.034, 1.15 * g / NR) / (.55 + .45 * DET); } zr.push(ZT); }
 const KR = zr.length, KC = zr.indexOf(ZC); // ring count, and the ring at the mouth's corners
 const lipDist = (phi, C) => Math.min(Math.abs(phi - .25), Math.abs(phi - .75)) * C;
 const BODY = (() => {
  const pos = [], uv = [], eb = [], idx = [], PHI = [], P = V3(), ring = [], arc = new Float32Array(NR + 1);
  let u = 0;
  for (let k = 0; k < KR; k++) {
   const z = zr[k];
   for (let j = 0; j <= NR; j++) { surfP(z, j / NR, P); ring[j] = [P.x, P.y, P.z]; arc[j] = j ? arc[j - 1] + Math.hypot(P.x - ring[j - 1][0], P.y - ring[j - 1][1]) : 0; }
   const C = Math.max(arc[NR], 1e-3);
   if (k) u += (zr[k - 1] - z) * NAR / Math.max(C, .9);
   for (let j = 0; j <= NR; j++) {
    const phi = j / NR, h = -Math.cos(phi * TAU), head = z > ZC - .02;
    pos.push(ring[j][0], ring[j][1], ring[j][2]); uv.push(u, arc[j] / C * NAR); PHI.push(phi);
    const tail = sm(-1, -2, z), bel = .5 * sm(lerp(.15, -.1, tail), lerp(-.3, -.45, tail), h) + .5 * sm(lerp(-.5, -.6, tail), lerp(-.85, -.9, tail), h);
    const lip = head ? 1 - sm(.0, .07, lipDist(phi, C)) : 0;
    eb.push(sOf(z), sm(-.55, .85, h) * (1 - .35 * sm(3.6, 4.3, -z)), z > ZC && h > 0 ? 0 : bel, lip);
   }
  }
  // the faces; below the mouth's line in the head they use the line's doubles
  const dup = new Map(); // ring*2+side -> index of its double
  const nBase = pos.length / 3;
  for (let k = 0; k <= KC; k++) for (const [side, j] of [[0, Q1], [1, Q3]]) {
   const o = k * (NR + 1) + j; dup.set(k * 2 + side, pos.length / 3);
   pos.push(pos[o * 3], pos[o * 3 + 1], pos[o * 3 + 2]); uv.push(uv[o * 2], uv[o * 2 + 1]); eb.push(eb[o * 4], eb[o * 4 + 1], eb[o * 4 + 2], eb[o * 4 + 3]); PHI.push(PHI[o]);
  }
  const vi = (k, j, low) => (low && k <= KC && (j === Q1 || j === Q3) ? dup.get(k * 2 + (j === Q1 ? 0 : 1)) : k * (NR + 1) + j);
  for (let k = 0; k < KR - 1; k++) for (let j = 0; j < NR; j++) {
   const low = k + 1 <= KC && (j < Q1 || j >= Q3);
   const a = vi(k, j, low), b = vi(k, j + 1, low), c = vi(k + 1, j, low), d = vi(k + 1, j + 1, low);
   idx.push(a, c, b, b, c, d);
  }
  const g = geo(pos, idx, uv); g.setAttribute('aEB', new THREE.Float32BufferAttribute(eb, 4));
  // smooth normals over the whole closed surface (the doubles take their twins'), then the plates' relief, the brows and
  // the nostrils along them, then normals again
  const fixN = () => {
   g.computeVertexNormals(); const n = g.attributes.normal;
   for (let k = 0; k < KR; k++) { const a = k * (NR + 1), b = a + NR; _n.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize(); n.setXYZ(a, _n.x, _n.y, _n.z); n.setXYZ(b, _n.x, _n.y, _n.z); }
   for (const [key, d] of dup) { const k = key >> 1, o = k * (NR + 1) + (key & 1 ? Q3 : Q1); _n.set(n.getX(o) + n.getX(d), n.getY(o) + n.getY(d), n.getZ(o) + n.getZ(d)).normalize(); n.setXYZ(o, _n.x, _n.y, _n.z); n.setXYZ(d, _n.x, _n.y, _n.z); }
  };
  const _n = V3(); fixN();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
   const x = p.getX(i), y = p.getY(i), z = p.getZ(i), e = i * 4, lip = eb[e + 3], bel = eb[e + 2];
   const w = prof(PW, z), amp = .06 * cl(w / .8, .3, 1) * (1 - bel * .85) * (1 - lip) * sm(ZS, ZS - .1, z) * sm(ZT, ZT + .15, z);
   let d = (HIDE.at(uv[i * 2], uv[i * 2 + 1]) - .55) * amp;
   if (z > ZC - .1 && y > prof(PY, z)) {
    for (const sx of [1, -1]) {
     const ex = x * sx;
     d += .05 * Math.exp(-Math.pow((z - EYEZ + .03) / .1, 2) - Math.pow((ex - .43) / .12, 2)) * sm(1.3, 1.42, y); // brow
     d -= .016 * Math.exp(-Math.pow((z - 2.53) / .03, 2) - Math.pow((ex - .13) / .035, 2)); // nostril
    }
   }
   p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  fixN();
  // skin: the spine by z; below the mouth's line, the jaw takes over toward the snout; the throat under the neck
  const thr = (z, h) => Math.exp(-Math.pow((z - 1.72) / .26, 2)) * sm(.25, .85, -h) * .85;
  skinW(g, (x, y, z, i) => {
   const j = i < nBase ? i % (NR + 1) : -1, isDup = i >= nBase, lowSide = isDup || (z > ZC - 1e-4 && (j < Q1 || j > Q3));
   const wJ = lowSide && z > ZC - 1e-4 ? sm(ZC, ZC + .3, z) : 0, wT = thr(z, -Math.cos(PHI[i] * TAU)) * (1 - wJ);
   const o = spineW(z, [], 1 - wJ - wT); if (wJ > 0) o.push([BI.jaw, wJ]); if (wT > 0) o.push([BI.throat, wT]);
   return o;
  });
  return g;
 })();
 put(M.hide, BODY);
 // a point on the lips' line in the bind pose (side 1 its left, -1 its right) and the weights there, for the mouth's inside
 const lipW = (z, low) => { const wJ = low ? sm(ZC, ZC + .3, z) : 0, o = spineW(z, [], 1 - wJ); if (wJ > 0) o.push([BI.jaw, wJ]); return o; };

 // ---------- the mouth's inside: the palate, the floor with its broad tongue, the throat, the teeth ----------
 // They glow like a furnace's mouth, brightest deep in the throat. The palate and the floor run from lip to lip.
 {
  const MW = Q(14, 8), mk = (low) => {
   const pos = [], col = [], idx = [];
   for (let k = 0; k <= KC; k++) {
    const z = zr[k], w = prof(PW, z), yc = prof(PY, z), dP = Math.min(.6 * prof(PT, z), .15), dF = Math.min(.55 * prof(PB, z), .16), deep = sm(ZS - .05, ZC + .05, z);
    for (let i = 0; i <= MW; i++) {
     const x = w * (1 - 2 * i / MW), f = Math.pow(Math.max(0, 1 - x * x / (w * w)), .55);
     const tongue = low ? .07 * Math.exp(-Math.pow(x / (.45 * w + .01), 2)) * sm(ZC + .02, ZC + .25, z) * sm(2.42, 2.2, z) : 0;
     pos.push(x, low ? yc - dF * f + tongue * f : yc + dP * f, z);
     // (deep orange at the lips, bright and gold down in the throat; the tongue pinker; darker toward the gums)
     const g = 1 - .45 * Math.pow(Math.abs(x) / w, 3), tg = tongue / .07, c = low ? [lerp(1, .85, tg), lerp(.3, .26, tg) + .22 * deep, lerp(.14, .24, tg) + .06 * deep] : [1, .3 + .26 * deep, .13 + .08 * deep];
     const b = (.22 + .9 * deep * deep) * g * (low ? .9 : 1) * (low ? 1 : .78 + .22 * Math.cos(z * 70)); col.push(c[0] * b, c[1] * b, c[2] * b);
    }
   }
   for (let k = 0; k < KC; k++) for (let i = 0; i < MW; i++) { const a = k * (MW + 1) + i, b = a + 1, c = a + MW + 1, d = c + 1; if (low) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
   const g = geo(pos, idx); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
   ebAll(g, .05, 1, 0, 0); skinW(g, (x, y, z) => lipW(z, low)); return put(M.mouth, g);
  };
  mk(false); mk(true);
  // the throat: a glowing wall at the back of the mouth, between the palate and the floor at the mouth's corners
  const z = ZC, w = prof(PW, z), yc = prof(PY, z), dP = Math.min(.6 * prof(PT, z), .15), dF = Math.min(.55 * prof(PB, z), .16), pos = [], col = [], idx = [];
  for (let i = 0; i <= MW; i++) { const x = w * (1 - 2 * i / MW), f = Math.pow(Math.max(0, 1 - x * x / (w * w)), .55); for (let r = 0; r <= 2; r++) { pos.push(x, lerp(yc + dP * f, yc - dF * f, r / 2), z - .01); const b = 1.25 - .15 * Math.abs(r - 1); col.push(b, .6 * b, .26 * b); } }
  for (let i = 0; i < MW; i++) for (let r = 0; r < 2; r++) { const a = i * 3 + r, b = a + 1, c = a + 3, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = geo(pos, idx); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); ebAll(g, .1, 1, 0, 0);
  skinW(g, () => lipW(ZC, false)); put(M.mouth, g);
  // teeth: small and pointed, set just inside the lips, the lower row between the upper ones
  const tp = [], tc = [], ti = [], tw = [];
  const tooth = (x, y, z, len, rad, down, low) => {
   const b = tp.length / 3, n = 5;
   for (let i = 0; i < n; i++) { const a = i / n * TAU; tp.push(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad); tc.push(.36, .22, .14); tw.push(low); }
   tp.push(x, y + (down ? -len : len), z); tc.push(.66, .5, .34); tw.push(low);
   for (let i = 0; i < n; i++) { const c = b + i, d = b + (i + 1) % n; if (down) ti.push(c, d, b + n); else ti.push(d, c, b + n); }
  };
  for (const low of [0, 1]) {
   for (let z = ZS - .05 - low * .03; z > 2.0; z -= .065) {
    const w = prof(PW, z) - .07 - low * .012, yc = prof(PY, z), len = rr(.02, .034) * (z > 2.4 ? 1.15 : 1);
    for (const s of [1, -1]) tooth(s * w, yc + (low ? -.012 : .012), z, len, .014, !low, low);
   }
   for (let i = -2; i <= 2; i++) { const x = i * .085 + low * .042, z = ZS - .045 - Math.abs(x) * .2 - low * .015; if (Math.abs(x) < .24) tooth(x, prof(PY, ZS) + (low ? -.012 : .012), z, rr(.038, .055), .013, !low, low); }
  }
  const tg = geo(tp, ti); tg.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3)); tg.computeVertexNormals(); ebAll(tg, .05, 0, 0, 0);
  skinW(tg, (x, y, z, i) => lipW(z, !!tw[i])); put(M.claw, tg);
 }

 // ---------- the eyes: amber, bulging out of the head under heavy lids that blink and, asleep, close ----------
 const EYER = .08, EYEF = [];
 for (let e = 0; e < 2; e++) {
  const c = EYE[e], g0 = GAZE[e], up = V3(0, 1, 0).addScaledVector(g0, -g0.y).normalize(), rt = V3().crossVectors(up, g0).normalize();
  EYEF.push({ c, g: g0, up, rt });
  const s = new THREE.SphereGeometry(EYER, Q(18, 12), Q(14, 10)), p = s.attributes.position, uv = s.attributes.uv, _p = V3();
  for (let i = 0; i < p.count; i++) { _p.set(p.getX(i), p.getY(i), p.getZ(i)); uv.setXY(i, .5 + _p.dot(rt) / EYER * .5 * .98, .5 + _p.dot(up) / EYER * .5 * .98); p.setXYZ(i, c.x + _p.x, c.y + _p.y, c.z + _p.z); }
  s.computeVertexNormals(); ebAll(s, .1, 0, 0, 0); skinW(s, () => [[BI.head, 1]]); put(M.eye, s);
  // the lids: shells round the eye; the upper one turns down over it on its bone, the lower one stays
  for (const upper of [1, 0]) {
   const NA = Q(14, 8), NE = Q(7, 4), pos = [], uvs = [], idx = [], R = EYER * 1.12;
   for (let a = 0; a <= NA; a++) for (let el = 0; el <= NE; el++) {
    const az = lerp(-1.75, 1.75, a / NA), e2 = upper ? lerp(.05, 1.45, el / NE) : lerp(-1.35, -.32, el / NE), ce = Math.cos(e2);
    const d = V3().addScaledVector(g0, ce * Math.cos(az)).addScaledVector(rt, ce * Math.sin(az)).addScaledVector(up, Math.sin(e2));
    const rr2 = R * (upper ? 1 + .08 * sm(.3, 0, e2) : 1 + .05 * sm(-.5, -.32, e2)); // the lid's rim is thick
    pos.push(c.x + d.x * rr2, c.y + d.y * rr2, c.z + d.z * rr2); uvs.push(.3 + .2 * a / NA, .2 + .1 * el / NE);
   }
   for (let a = 0; a < NA; a++) for (let el = 0; el < NE; el++) { const i0 = a * (NE + 1) + el, i1 = i0 + NE + 1; idx.push(i0, i1, i0 + 1, i0 + 1, i1, i1 + 1); }
   const g = geo(pos, idx, uvs); g.computeVertexNormals();
   // (wound so they face outward: check one normal against the way out from the eye)
   if (V3(g.attributes.normal.getX(0), g.attributes.normal.getY(0), g.attributes.normal.getZ(0)).dot(V3(pos[0] - c.x, pos[1] - c.y, pos[2] - c.z)) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } g.computeVertexNormals(); }
   ebAll(g, .1, .18, 0, 0); skinW(g, () => [[upper ? BI['lid' + e] : BI.head, 1]]); put(M.hide, g);
  }
 }

 // ---------- the legs: thick and plated, a muscled shoulder or thigh, splayed out to broad clawed feet ----------
 // A tube along a curve through the shoulder, elbow and wrist (its frames carried along without twisting), widest where
 // it leaves the body. Skin: the spine near the body, then upper, lower and foot, blended across each joint.
 function ptTube(pts, segs, rs, rFn, uK) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), P = [], T = [], N = [], n = V3(0, 1, 0), ax = V3();
  for (let i = 0; i <= segs; i++) { const t = i / segs; P.push(curve.getPoint(t)); T.push(curve.getTangent(t).normalize()); }
  if (Math.abs(n.dot(T[0])) > .9) n.set(1, 0, 0);
  n.addScaledVector(T[0], -n.dot(T[0])).normalize(); N.push(n.clone());
  for (let i = 1; i <= segs; i++) { ax.crossVectors(T[i - 1], T[i]); const s = ax.length(); if (s > 1e-6) n.applyAxisAngle(ax.normalize(), Math.asin(cl(s, -1, 1))); n.addScaledVector(T[i], -n.dot(T[i])).normalize(); N.push(n.clone()); }
  const pos = [], uv = [], idx = [], D = V3(), Bn = V3(); let arc = 0;
  for (let i = 0; i <= segs; i++) {
   if (i) arc += P[i].distanceTo(P[i - 1]);
   Bn.crossVectors(T[i], N[i]);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU; D.copy(N[i]).multiplyScalar(Math.cos(th)).addScaledVector(Bn, Math.sin(th)); const r = rFn(i / segs, th, D, j / rs * uK[0], arc * uK[1]); pos.push(P[i].x + D.x * r, P[i].y + D.y * r, P[i].z + D.z * r); uv.push(arc * uK[1], j / rs * uK[0]); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = geo(pos, idx, uv); g.computeVertexNormals();
  // the seam where the rings close: one normal for both
  const nn = g.attributes.normal, _n = V3();
  for (let i = 0; i <= segs; i++) { const a = i * (rs + 1), b = a + rs; _n.set(nn.getX(a) + nn.getX(b), nn.getY(a) + nn.getY(b), nn.getZ(a) + nn.getZ(b)).normalize(); nn.setXYZ(a, _n.x, _n.y, _n.z); nn.setXYZ(b, _n.x, _n.y, _n.z); }
  return g;
 }
 // make a geometry face a way (flip its winding if its first normal disagrees)
 function face(g, dir, at) { const n = g.attributes.normal, p = g.attributes.position, k = at || 0; const d = dir(p.getX(k), p.getY(k), p.getZ(k)); if (n.getX(k) * d.x + n.getY(k) * d.y + n.getZ(k) * d.z < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } g.computeVertexNormals(); } return g; }
 const lin = (A, t) => { const x = cl(t, 0, 1) * (A.length - 1), i = Math.min(A.length - 2, Math.floor(x)), f = x - i; return lerp(A[i], A[i + 1], f * f * (3 - 2 * f)); };
 const CLAWS = { pos: [], idx: [], col: [], w: [] };
 for (const L of LEGS) {
  const [P0, P1, P2, P3] = L.P, d0 = L.P[1].clone().sub(P0).normalize(), d1 = P2.clone().sub(P1).normalize(), dF = P3.clone().sub(P2).normalize();
  const fr = L.front, RA = fr ? [.32, .4, .4, .33, .27, .28, .26, .23, .2, .185, .17] : [.33, .42, .43, .36, .28, .29, .25, .22, .195, .185, .17];
  const g = ptTube([P0.clone().addScaledVector(d0, -.24).add(V3(0, .03, 0)), P0, P1, P2, P2.clone().addScaledVector(d1, .05)], Q(44, 24), Q(26, 14),
   (t, th, D, u, v) => { const r = lin(RA, t) * (1 + .06 * Math.sin(th * 2 + 1)) * (D.y < 0 ? 1 - .06 * -D.y : 1); return r + (HIDE.at(v, u) - .55) * .028; }, [.38, .45]);
  const bE = d0.clone().add(d1).normalize(), bW = d1.clone().add(dF).normalize(), pb = BI[L.par.name], b = L.b.map((x) => BI[x.name]);
  const _x = V3();
  skinW(g, (x, y, z) => {
   _x.set(x, y, z); const wL = sm(-.08, .2, _x.clone().sub(P0).dot(d0)), wl = sm(-.09, .09, _x.clone().sub(P1).dot(bE)), wf = sm(-.05, .05, _x.clone().sub(P2).dot(bW));
   return [[pb, 1 - wL], [b[0], wL * (1 - wl)], [b[1], wL * wl * (1 - wf)], [b[2], wL * wl * wf]];
  });
  attr(g, 'aEB', 4, (i, o) => { const y = g.attributes.position.getY(i); o[0] = sOf(P0.z); o[1] = .3 + .5 * sm(.3, 1.1, y); o[2] = 0; o[3] = 0; });
  put(M.hide, g);
  // the foot: a broad wedge from the wrist down to where the toes spread, flat on its sole
  const f = V3(dF.x, 0, dF.z).normalize(), sd = V3(f.z, 0, -f.x), flen = Math.hypot(P3.x - P2.x, P3.z - P2.z) + .09, NF = Q(12, 7), NA = Q(18, 10), pos = [], uv = [], idx = [];
  for (let i = 0; i <= NF; i++) {
   const s = lerp(-.1, flen, i / NF), q = i / NF, wf = .09 + .21 * Math.sin(PI * .5 * Math.min(1, q * 1.6 + .1)) * (1 - .25 * sm(.85, 1, q)), hf = lerp(.17, .08, q) * (q < .08 ? .6 + 5 * q : 1) * (q > .92 ? 1 - 4 * (q - .92) : 1);
   const c = P2.clone().addScaledVector(f, s); c.y = lerp(P2.y - .02, .075, sm(0, 1, q));
   for (let j = 0; j <= NA; j++) { const th = j / NA * TAU, x = Math.cos(th) * wf, y = Math.sin(th) * hf; pos.push(c.x + sd.x * x, Math.max(.012, c.y + y), c.z + sd.z * x); uv.push(s * .9, j / NA * .25); }
  }
  for (let i = 0; i < NF; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, bb = a + NA + 1; idx.push(a, bb, a + 1, a + 1, bb, bb + 1); }
  const fg = geo(pos, idx, uv); fg.computeVertexNormals(); face(fg, () => V3(0, 1, 0), Math.round(NF / 2) * (NA + 1) + Math.round(NA / 4));
  skinW(fg, (x, y, z) => { const s = (x - P2.x) * f.x + (z - P2.z) * f.z, w = sm(-.06, .06, s); return [[b[1], 1 - w], [b[2], w]]; });
  ebAll(fg, sOf(P0.z), .45, 0, 0); put(M.hide, fg);
  // toes: four spread forward and one short inner one, each knuckled and ending in a dark hooked claw that reaches the
  // ground; the toes curl and spread on their bone
  const TA = fr ? [[-.95, .18, -.1], [-.4, .31, -.02], [-.08, .38, 0], [.26, .36, -.01], [.6, .29, -.06]] : [[-.9, .2, -.12], [-.36, .36, -.02], [0, .45, 0], [.32, .41, -.02], [.66, .32, -.07]];
  const tb = P3.clone(); tb.y = .085;
  for (let k = 0; k < 5; k++) {
   const [a0, Lt, back] = TA[k], a = a0 * L.s, d = V3(f.x * Math.cos(a) + sd.x * Math.sin(a), 0, f.z * Math.cos(a) + sd.z * Math.sin(a)).normalize();
   const off = (k - 2) * .1 * L.s, B = tb.clone().addScaledVector(sd, off).addScaledVector(f, back - .04);
   const tip = B.clone().addScaledVector(d, Lt); tip.y = .065;
   const tg = ptTube([B.clone().addScaledVector(d, -.06), B, B.clone().addScaledVector(d, Lt * .45).add(V3(0, .045, 0)), tip], Q(10, 6), Q(10, 7),
    (t, th) => (lerp(.078, .056, t) + .01 * Math.sin(t * PI * 3)) * (k === 0 ? .85 : 1) * (Math.sin(th) < 0 ? 1 - .2 * -Math.sin(th) : 1), [.3, .9]);
   skinW(tg, (x, y, z) => { const w = sm(-.03, .08, (x - B.x) * d.x + (z - B.z) * d.z); return [[b[2], 1 - w], [b[3], w]]; });
   ebAll(tg, sOf(P0.z), .3, 0, 0); put(M.hide, tg);
   // the claw: a curved cone hooking down
   const cb = CLAWS.pos.length / 3, NCs = 7, NCa = 6, cr = (k === 0 ? .044 : .056);
   for (let i = 0; i <= NCs; i++) {
    const t = i / NCs, c = tip.clone().addScaledVector(d, .02 + .15 * Math.sin(t * PI * .5)); c.y = lerp(.07, .006, t * t);
    const dir = V3(d.x * Math.cos(t * 1.3), -Math.sin(t * 1.3), d.z * Math.cos(t * 1.3)).normalize(), s2 = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), u2 = V3().crossVectors(s2, dir);
    for (let j = 0; j < NCa; j++) { const th = j / NCa * TAU, r = cr * (1 - t * .96); CLAWS.pos.push(c.x + (s2.x * Math.cos(th) + u2.x * Math.sin(th)) * r, c.y + (s2.y * Math.cos(th) + u2.y * Math.sin(th)) * r * 1.2, c.z + (s2.z * Math.cos(th) + u2.z * Math.sin(th)) * r); const k2 = .07 + .05 * t; CLAWS.col.push(k2, k2 * .86, k2 * .76); CLAWS.w.push(b[3]); }
   }
   for (let i = 0; i < NCs; i++) for (let j = 0; j < NCa; j++) { const a2 = cb + i * NCa + j, bb = cb + i * NCa + (j + 1) % NCa; CLAWS.idx.push(a2, a2 + NCa, bb, bb, a2 + NCa, bb + NCa); }
  }
 }
 {
  const g = geo(CLAWS.pos, CLAWS.idx); g.setAttribute('color', new THREE.Float32BufferAttribute(CLAWS.col, 3)); g.computeVertexNormals();
  ebAll(g, .3, 0, 0, 0); skinW(g, (x, y, z, i) => [[CLAWS.w[i], 1]]); put(M.claw, g);
 }

 // ---------- the crystals: jagged sunstone from its brow down its back, biggest over the shoulders, a flame of them at
 // the tail's tip. Each is a long six-sided prism with a pointed tip, its faces flat, leaning back and out; the largest
 // carry a soft halo. ----------
 const CRY = { pos: [], idx: [], eb: [], w: [] }, HALO = [];
 function crystal(B, D, len, rad, bright, wts) {
  const n = rnd() < .3 ? 5 : 6, e1 = V3().crossVectors(D, Math.abs(D.y) > .9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(), e2 = V3().crossVectors(D, e1), b0 = CRY.pos.length / 3;
  const rs = Array.from({ length: n }, () => rr(.82, 1.18)), tw = rr(-.2, .2), sOn = sOf(B.z);
  const RING = [[-.08, 1], [.64, .93], [.84, .5]];
  for (const [t, k] of RING) for (let i = 0; i < n; i++) {
   const a = i / n * TAU + tw * t, r = rad * k * rs[i];
   const p = B.clone().addScaledVector(D, t * len).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r);
   CRY.pos.push(p.x, p.y, p.z); CRY.eb.push(sOn, bright, Math.max(0, t), 0); CRY.w.push(wts);
  }
  const tip = B.clone().addScaledVector(D, len).addScaledVector(e1, rr(-.12, .12) * rad); CRY.pos.push(tip.x, tip.y, tip.z); CRY.eb.push(sOn, bright, 1, 0); CRY.w.push(wts);
  for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const a = b0 + r * n + i, b = b0 + r * n + (i + 1) % n; CRY.idx.push(a, b, a + n, b, b + n, a + n); }
  for (let i = 0; i < n; i++) CRY.idx.push(b0 + 2 * n + i, b0 + 2 * n + (i + 1) % n, b0 + 3 * n);
  if (len > .3) HALO.push({ p: B.clone().addScaledVector(D, len * .55), len, wts });
 }
 const ridgeH = (z) => (z > 1.92 ? lerp(.08, .15, sm(2.3, 1.95, z)) : z > 1.35 ? lerp(.2, .5, sm(1.92, 1.35, z)) : z > .6 ? lerp(.5, .82, sm(1.35, .75, z)) : z > -.5 ? lerp(.8, .42, sm(.6, -.5, z)) : z > -1.5 ? lerp(.42, .32, sm(-.5, -1.5, z)) : lerp(.36, .2, sm(-1.5, -3.55, z)));
 {
  const P = V3(), Pn = V3();
  const at = (z, lat) => { const w = prof(PW, z), phi = .5 - Math.asin(cl(lat / Math.max(.05, w), -.6, .6)) / TAU; surfP(z, phi, P); surfP(z - .02, phi, Pn); return P; };
  let z = 2.3;
  while (z > -3.56) {
   const H = ridgeH(z), big = H > .5, n = z > 1.92 ? 1 : big ? 4 + (rnd() < .6 ? 1 : 0) + (rnd() < .3 ? 1 : 0) : H > .28 ? 2 + (rnd() < .6 ? 1 : 0) : 2;
   const slope = Math.atan2(prof(PT, z + .1) + prof(PY, z + .1) - prof(PT, z - .1) - prof(PY, z - .1), .2), wts = spineW(z);
   for (let i = 0; i < n; i++) {
    const side = n === 1 ? rr(-.25, .25) : (i / (n - 1) - .5) * 2 + rr(-.2, .2), lat = side * Math.min(.13, .07 + .09 * H), main = n === 1 || Math.abs(side) < .45;
    const len = H * (main ? rr(.85, 1.12) : rr(.42, .75)), B = at(z + rr(-.04, .04), lat).clone(); B.y -= .07;
    const D = V3(side * rr(.12, .34) + rr(-.08, .08), 1, -Math.tan(rr(.3, .66) - slope * .6)).normalize();
    crystal(B, D, len + .07, len * rr(.15, .21) * (main ? 1 : 1.1), rr(.85, 1.15), wts);
   }
   // a few small ones at the feet of the big clusters
   if (big) for (let i = 0; i < 3; i++) { const s = rnd() < .5 ? -1 : 1, B = at(z + rr(-.08, .08), s * rr(.16, .26)).clone(); B.y -= .05; crystal(B, V3(s * rr(.4, .8), 1, -rr(.2, .5)).normalize(), rr(.12, .22), rr(.025, .04), rr(.8, 1.1), wts); }
   z -= .06 + .14 * H;
  }
  // the tail's tip: a fan of long crystals leaning back and up like a flame, the longest at the very end
  for (let i = 0; i < Q(20, 12); i++) {
   const f = Math.pow(rnd(), .7), zz = lerp(-3.62, -4.33, f), w = prof(PW, zz), side = rr(-1, 1), B = surfP(zz, .5 - side * .17, V3()); B.y -= .04; B.x *= .8;
   const D = V3(side * rr(.25, .6), rr(.55, 1.05), -rr(.45, 1.1)).normalize(), len = lerp(.28, .75, f) * rr(.75, 1.1);
   crystal(B, D, len, len * rr(.14, .19) + w * .05, rr(.9, 1.2), spineW(zz));
  }
  const g = geo(CRY.pos, CRY.idx); g.setAttribute('aEB', new THREE.Float32BufferAttribute(CRY.eb, 4)); g.computeVertexNormals();
  skinW(g, (x, y, z, i) => CRY.w[i]); put(M.cry, g);
 }

 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [];
 for (const [mat, list] of BK) { const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m); }
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone() };
 // a bind-pose point carried along by its skin weights, as the skinned meshes carry their vertices (for the halos, the
 // embers and the anchors): its place at the bind (the root still at the origin), then each bone's move since
 const B0 = base.matrixWorld.clone(), _sk = new THREE.Matrix4(), _sv = V3();
 function skinPt(pb, wts, out) { out.set(0, 0, 0); for (const [bi, w] of wts) { _sk.multiplyMatrices(bones[bi].matrixWorld, skeleton.boneInverses[bi]); out.addScaledVector(_sv.copy(pb).applyMatrix4(_sk), w); } return out; }
 const sk = (p, wts) => { const w = wts.filter((e) => e[1] > .02), t = w.reduce((a, e) => a + e[1], 0); return { p: p.clone().applyMatrix4(B0), wts: w.map((e) => [e[0], e[1] / t]) }; };
 const CSK = HALO.map((h) => Object.assign(sk(h.p, h.wts), { len: h.len }));

 // ---------- points: world-sized soft sprites with their own colour, size and spin ----------
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
  p.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), next: 0, live: 2 };
 }
 // embers and sparks (glowing), flames, smoke and dust, and the crystals' halos
 const EM = points(Q(360, 180), dotT, THREE.AdditiveBlending, 9), FL = points(Q(260, 130), flameT, THREE.AdditiveBlending, 9), DU = points(Q(200, 110), puffT, THREE.NormalBlending, 7);
 FL.upright = true; FL.end = new THREE.Color(.5, .05, .01);
 const GL = points(Q(60, 30), glintT, THREE.AdditiveBlending, 9);
 const HL = points(Math.max(1, CSK.length), haloT, THREE.AdditiveBlending, 6); HL.static = true;
 fx.add(EM.p, FL.p, DU.p, GL.p, HL.p);
 // rocks: torn up by its rise and its eruption, and swirled by Heat Drain; jagged basalt, some faces still glowing
 const rockG = (() => {
  const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, col = [];
  const J = new Map(); for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!J.has(k)) J.set(k, [rr(.7, 1.15), rr(.7, 1.15), rr(.6, 1)]); const j = J.get(k); p.setXYZ(i, p.getX(i) * j[0], p.getY(i) * j[1] * .75, p.getZ(i) * j[2]); }
  for (let f = 0; f < p.count / 3; f++) { const hot = rnd() < .18, c = hot ? [1, .4, .1] : [.15, .13, .12]; for (let k = 0; k < 3; k++) col.push(...c); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
 })();
 const rockM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, flatShading: true });
 const rockU = { value: 1 };
 rockM.onBeforeCompile = (sh) => { sh.uniforms.uRG = rockU; sh.fragmentShader = 'uniform float uRG;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor * step(.5, vColor.r - vColor.b) * .9 * uRG;'); };
 rockM.customProgramCacheKey = () => 'emberback-rock';
 const NRK = 44, ROCK = new THREE.InstancedMesh(rockG, rockM, NRK), M0 = new THREE.Matrix4().makeScale(0, 0, 0);
 ROCK.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ROCK.frustumCulled = false; fx.add(ROCK);
 const RK = Array.from({ length: NRK }, () => ({ t: -1, life: 1, p: V3(), v: V3(), ax: V3(1, 0, 0), w: 0, s: .2, orbit: 0, ang: 0, rad: 0, hy: 0 }));
 for (let i = 0; i < NRK; i++) ROCK.setMatrixAt(i, M0);
 // crystal shards: knocked off by its blows and flung by Tail Lash
 const shardG = (() => { const g = new THREE.OctahedronGeometry(1, 0); g.scale(.35, 1, .35); return g; })();
 const NSH = 26, SHD = new THREE.InstancedMesh(shardG, new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .62, .22), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }), NSH);
 SHD.instanceMatrix.setUsage(THREE.DynamicDrawUsage); SHD.frustumCulled = false; SHD.renderOrder = 9; fx.add(SHD);
 const SH = Array.from({ length: NSH }, () => ({ t: -1, life: 1, p: V3(), v: V3(), ax: V3(1, 0, 0), w: 0, s: .1 }));
 for (let i = 0; i < NSH; i++) SHD.setMatrixAt(i, M0);
 // Ember Spit's glob: a ball of molten fire with a halo, which splashes into flame where it lands
 const ballM = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vV;\nvoid main(){ vN = normalize(normalMatrix * normal); vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float uT, uA; varying vec3 vN; varying vec3 vP; varying vec3 vV;\n' + NOISE + 'void main(){ float f = abs(dot(vN, vV)), n = ebN(vP * 6. + vec3(0., -uT * 5., uT * 2.)) * .6 + ebN(vP * 13. - uT * 3.) * .4;\n vec3 c = mix(vec3(1., .3, .03), vec3(1., .75, .3), smoothstep(.3, .9, f * .7 + n * .5)); c = mix(c, vec3(1., .97, .85), pow(f, 4.) * .9);\n gl_FragColor = vec4(c * (1.2 + n), uA * (.35 + .65 * f)); }'
 });
 const ball = new THREE.Mesh(new THREE.SphereGeometry(.3, 18, 14), ballM); ball.visible = false; ball.frustumCulled = false; ball.renderOrder = 9;
 const ballHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, color: new THREE.Color(1, .55, .2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); ballHalo.scale.setScalar(2.2); ball.add(ballHalo);
 fx.add(ball);
 const BALL = { t: -1, T: .4, p0: V3(), p1: V3(), h: 1.2, hit: false };
 // the tail's blazing arc: a ribbon behind its tip and its last metre
 const TRN = 20, trPos = new Float32Array(TRN * 6), trCol = new Float32Array(TRN * 6), trIdx = [];
 for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trG.setIndex(trIdx);
 const trail = new THREE.Mesh(trG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 8; fx.add(trail);
 const TRK = { tip: Array.from({ length: TRN }, () => V3()), mid: Array.from({ length: TRN }, () => V3()), prev: 0 };
 // Heat Drain's ribbons: warmth torn off its prey, spiralling into its open mouth
 const DRN = 4, DRS = 30, drPos = new Float32Array(DRN * (DRS + 1) * 6), drCol = new Float32Array(DRN * (DRS + 1) * 6), drIdx = [];
 for (let r = 0; r < DRN; r++) for (let i = 0; i < DRS; i++) { const a = (r * (DRS + 1) + i) * 2; drIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const drG = new THREE.BufferGeometry(); drG.setAttribute('position', new THREE.BufferAttribute(drPos, 3).setUsage(THREE.DynamicDrawUsage)); drG.setAttribute('color', new THREE.BufferAttribute(drCol, 3).setUsage(THREE.DynamicDrawUsage)); drG.setIndex(drIdx);
 const drain = new THREE.Mesh(drG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); drain.frustumCulled = false; drain.visible = false; drain.renderOrder = 8; fx.add(drain);
 // craters: broken ground with glowing cracks, one where it bursts up and one where its eruption strikes
 const CRATER = [0, 1].map(() => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
   uniforms: { uMap: { value: craterT }, uOpen: { value: 0 }, uGlow: { value: 0 }, uFade: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
   vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform sampler2D uMap; uniform float uOpen, uGlow, uFade, uT; varying vec2 vUv;\n' +
    'void main(){ vec4 t = texture2D(uMap, vUv); float r = length(vUv - .5) * 2., o = 1. - smoothstep(uOpen - .12, uOpen, r);\n' +
    ' float fl = .75 + .25 * sin(uT * 7. + r * 9.); vec3 c = mix(vec3(.03, .02, .015), vec3(.12, .07, .05), t.b); c = mix(c, vec3(1., .5, .12) * 1.6 * fl, t.g * uGlow);\n' +
    ' float a = max(t.r * .92, t.g * uGlow) * o * uFade; if (a < .01) discard; gl_FragColor = vec4(c, a); }'
  }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 5; fx.add(m);
  return { m, u: m.material.uniforms, on: 0 };
 });
 // shockwaves: rings racing over the ground (its rise, Eruption's slam, the glob's splash)
 const SHK = [0, 1, 2].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.6, 1, Q(64, 32), 1), new THREE.ShaderMaterial({
   uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
   vertexShader: 'varying float vR;\nvoid main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR;\nvoid main(){ float e = smoothstep(.62, .92, vR) * (1. - smoothstep(.94, 1., vR)); if (e * uA < .004) discard; gl_FragColor = vec4(uC, e * uA); }' }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 6; fx.add(m);
  return { m, t: 0, dur: 1, r0: 0, r1: 1, a: 0 };
 });
 let shkN = 0;
 function shock(x, z, r0, r1, dur, col, a, glow) { const S = SHK[shkN++ % SHK.length]; S.m.position.set(x, .04, z); S.t = 0; S.dur = dur; S.r0 = r0; S.r1 = r1; S.a = a; S.m.material.uniforms.uC.value.copy(col); S.m.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.m.visible = true; }
 // its own light: the glow of its crystals and cracks over its back, and the fire of its glob, its eruption and its drain
 const glowL = new THREE.PointLight(0xff8a30, 0, 7 * SZ, 2), fireL = new THREE.PointLight(0xff7a2c, 0, 9 * SZ, 2); fx.add(glowL, fireL);

 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up, spin, sway) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1;
  P.drag[i] = drag || 0; P.up[i] = up || 0; P.spin[i] = spin || 0; P.sway[i] = sway || 0; P.rot[i] = P.upright ? 0 : rnd2() * TAU;
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
 // body: y sinks the whole creature (it rises out of the ground), low lowers the body on its legs, rear lifts its front
 //   about the hips (1.25 stands it up on its hind legs), bp pitches it nose-down, roll, spin turns it about its middle
 //   (Tail Lash), bend curves its trunk toward its left, curl coils it all up (asleep), sq its breath
 // neck and head: nk and hp pitch them down, ny and hy turn them to its left, hr rolls the head, look how much it turns
 //   them to its prey, jaw opens the mouth (radians), lid closes the eyes, thr swells the throat
 // tail: tl lifts it at the base, tu curls it up along its length, tc curls it toward its left, tw how much it sways
 // legs: fpl plants the front feet (0 lifts them to frx, fry, frz from the shoulders, in the chest's frame), fs and fz
 //   spread them and set them forward, hs and hz the hind feet, tuck folds the legs under it, claw spreads its toes
 // looks: heat the cracks' glow, cry the crystals', white their blaze, mg the mouth's glow, eye, emb embers, trail the
 //   tail's fire, drain Heat Drain's ribbons, stone, fade, dust, fire in its mouth, suck (breathing in fire), steam
 const BASE = { y: 0, low: 0, rear: 0, bp: 0, roll: 0, spin: 0, bend: 0, curl: 0, sq: 0, nk: -.04, ny: 0, hp: .02, hy: 0, hr: 0, look: 1, jaw: .13, lid: .16, thr: 0,
  tl: .03, tu: .015, tc: .02, tw: 1, fpl: 1, frx: 0, fry: 0, frz: 0, fs: 0, fz: 0, hs: 0, hz: 0, tuck: 0, claw: 0,
  heat: 1, cry: 1, white: 0, mg: 1, eye: 1, emb: 1, trail: 0, drain: 0, stone: 0, fade: 1, dust: 0, fire: 0, suck: 0, steam: 0 };
 const KEYS = Object.keys(BASE), K = (...a) => Object.assign({}, ...a);
 const GUARD = { low: -.12, nk: .22, hp: .2, jaw: .02, tc: .1, bend: -.08, cry: 1.25, lid: .25, fs: .1 };
 const WALK = { low: .02, nk: -.02, emb: 1.3, tw: 1.3, jaw: .08 };
 // starving: it hunches lower, its head hangs, its eyes half shut and its tail drags (with its looks, from state.starve)
 const STARVE = { low: -.07, nk: .14, hp: .1, jaw: .02, lid: .35, tw: .35, emb: .2, tl: -.02 };
 // asleep and turned to stone: curled up like a cat, its head laid on its tail
 const SLEEP = { rear: 0, low: -.3, bp: .02, curl: 1, tuck: 1, nk: .2, hp: .18, ny: .45, hy: .3, hr: -.12, look: 0, jaw: 0, lid: 1, thr: 0, tl: -.05, tu: 0, tc: .27, tw: 0, claw: -.3, sq: 0,
  heat: 0, cry: 0, white: 0, mg: 0, eye: 0, emb: 0, stone: 1, steam: 0, fpl: 1 };
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
 // Bursting Up: the ground cracks and glows, then it bursts up out of it front first, reared up and roaring, rocks
 // flying, and drops onto all fours
 act('appear', 3.6, [[0, { y: -3.3, rear: .95, nk: -.15, hp: .35, jaw: .1, fpl: 0, frx: .1, fry: .3, frz: .55, claw: .6, tl: .2, heat: 1.5, cry: 1.4, emb: 0, look: 0 }],
  [.08, { dust: .6 }], [.16, { y: -2.7, dust: 1 }, 'i'],
  [.32, { y: .12, rear: 1.05, jaw: .95, hp: .3, nk: -.22, dust: 1.6, emb: 3, white: .5, cry: 2, heat: 1.8, mg: 2.2, claw: 1, fry: .5, frz: .5 }, 'o'],
  [.44, { jaw: 1.02, hp: .22, nk: -.28, white: .8, dust: .8 }],
  [.6, { y: 0, rear: .85, jaw: .7, dust: .2, white: .4 }],
  [.74, K(BASE, { low: -.13, bp: .05, jaw: .3, dust: 1.4, cry: 1.5, heat: 1.4, look: .6 }), 'i'],
  [.84, { low: 0, bp: 0, dust: .2, jaw: .15 }], [1, BASE]],
  { snap: KEYS, cues: [.06, .3, .42, .74], rate: 11 });
 // Roar: it rears a little, flings its head up and roars, its crystals flaring
 act('roar', 1.8, [[0, {}], [.24, { rear: .38, nk: -.32, hp: .05, jaw: 1.0, cry: 1.9, white: .45, emb: 4, heat: 1.5, mg: 1.5, fpl: .55, fry: .15, frz: .3, claw: .6, look: .4 }, 'o'],
  [.62, { jaw: .9, nk: -.38 }], [1, BASE]], { cues: [.24], rate: 12 });
 // Tail Lash: it winds up, then spins right round, its tail swinging out in a blazing arc that sweeps through its prey,
 // and flinging off shards of crystal
 act('tailLash', 2.0, [[0, {}],
  [.22, { spin: -.55, bend: -.14, tc: .15, tl: .22, low: -.06, nk: .1, hp: .05, jaw: .25, cry: 1.3, look: 0, claw: .4 }, 'o'],
  [.4, { spin: 1.25, bend: .06, tc: -.05, tl: .4, tu: .02, trail: 1, emb: 2, cry: 1.7, jaw: .5 }, 'i'],
  [.55, { spin: PI, tc: -.09, tl: .44 }, 'l'], [.7, { spin: 5.15, tc: -.05, trail: .8 }, 'l'],
  [.85, { spin: TAU - .06, trail: 0, tl: .12, tc: .04, bend: 0, jaw: .15 }, 'o'], [1, K(BASE, { spin: TAU })]],
  { hits: [.55], cues: [.36], rate: 16 });
 // Ember Spit: it breathes in, swelling its throat as fire gathers in its mouth, then throws its head forward and spits
 // a glob of molten fire at its prey
 act('emberSpit', 1.8, [[0, {}],
  [.3, { rear: .2, nk: -.38, hp: -.16, jaw: .22, thr: 1, suck: 1, cry: 1.7, heat: 1.4, mg: 2.3, low: -.04, fz: -.06 }, 'o'],
  [.4, { rear: .04, bp: .07, nk: .16, hp: .12, jaw: 1.0, thr: 0, suck: 0, fire: 1, mg: 2.8 }, 'i'],
  [.5, { fire: .35, jaw: .85 }], [.75, { jaw: .25, fire: 0, mg: 1.3, nk: 0, hp: .05, bp: 0, rear: 0 }], [1, BASE]],
  { hits: [.62], cues: [.4], rate: 18 });
 // Heat Drain: it rears, plants its forefeet wide and opens its mouth wide, and draws ribbons of fire out of its prey,
 // its crystals blazing white-gold; then it gulps
 act('heatDrain', 3.6, [[0, {}],
  [.18, { rear: .45, low: .05, nk: -.45, hp: -.3, jaw: 1.05, fs: .28, fz: .2, cry: 1.9, white: .5, heat: 1.4, mg: 2.2, thr: .5, look: .7 }, 'o'],
  [.26, { drain: 1 }], [.42, { white: .9, cry: 2.4, heat: 1.7 }], [.56, { hp: -.24, nk: -.48 }], [.78, { drain: 1, white: 1 }],
  [.86, { drain: 0, jaw: .08, thr: 1, white: .7, cry: 2.3, nk: -.3 }, 'i'], [.93, { rear: .1, heat: 1.8, white: .3, thr: .3 }], [1, BASE]],
  { hits: [.4, .55, .7], cues: [.18, .86], rate: 9 });
 // Eruption: it rears right up on its hind legs, claws raised, and roars; then it slams its forefeet down, and the
 // ground cracks open in a line to its prey and erupts under it
 act('eruption', 3.0, [[0, {}],
  [.3, { rear: 1.08, low: -.08, hz: .22, nk: .05, hp: .5, jaw: .95, fpl: 0, frx: .36, fry: .32, frz: .38, claw: 1, cry: 2.1, white: .7, heat: 1.7, mg: 2.2, tl: -.1, emb: 3, look: .5 }, 'o'],
  [.42, { rear: 1.16, jaw: 1, fry: .42 }],
  [.52, { rear: -.08, low: -.18, bp: .1, nk: .12, hp: .12, jaw: .6, fpl: 1, frx: 0, fry: 0, frz: 0, claw: -.3, dust: 1.6, hz: 0, look: 1 }, 'i'],
  [.6, { dust: .3, low: -.1 }], [.8, { low: 0, bp: 0, jaw: .2, cry: 1.3, white: 0, heat: 1.2, claw: 0, dust: 0 }, 'o'], [1, BASE]],
  { hits: [.58], cues: [.3, .52], rate: 15 });
 act('hurt', .7, [[0, {}], [.15, { rear: .12, roll: .12, nk: -.25, ny: .2, hp: -.15, hy: .25, jaw: .55, cry: .5, heat: 1.6, tc: .1, low: .03, claw: .4 }, 'o'], [1, BASE]], { interrupt: true, rate: 18 });
 act('block', .5, [[0, {}], [.3, K(GUARD, { spin: -.3, low: -.14, ny: -.2, nk: .3, jaw: 0, lid: .5 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18 });
 // Asleep: beaten, it gives a last weak roar, curls up like a cat and cools to stone
 act('die', 5.2, [[0, {}],
  [.1, { rear: .3, nk: -.4, hp: -.2, jaw: .75, cry: 1.6, heat: 1.5, look: 0 }, 'o'], [.2, { jaw: .45, rear: .1, cry: 1.1 }],
  [.52, K(SLEEP, { heat: .6, cry: .7, mg: .4, eye: .5, emb: .3, stone: 0, steam: .4 })], [.64, { steam: 1, heat: .35, cry: .4 }],
  [.92, K(SLEEP, { steam: .5 })], [1, SLEEP]],
  { hold: true, interrupt: true, cues: [.1, .52, .8], rate: 4 });
 // Waking (Sol relights it, or it rises again): its cracks rekindle from its head to its tail, it opens its eyes,
 // uncurls and rises with a roar
 act('wake', 3.4, [[0, SLEEP], [.3, K(SLEEP, { stone: 0, heat: .8, cry: .9, eye: 1, mg: .8, emb: 1.5, steam: .6 })], [.48, { lid: 0, jaw: .25, steam: .2 }],
  [.74, K(BASE, { low: -.05, rear: .25, jaw: .8, cry: 1.7, nk: -.32, white: .3, emb: 3, look: .4 })], [1, BASE]], { snap: KEYS, cues: [.04, .74], rate: 7 });

 // ---------- runtime state ----------
 const state = { target: null, heat: 1, starve: 0 };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, dashV = 0, lastName = '', lastU = 0, playN = 0, starveV = 0, stoned = false;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const asleep = !!actv && actv.name === 'die';
  if (asleep && name === 'appear') { name = 'wake'; def = ACTS.wake; } // beaten, it is still there: it wakes rather than rises
  if (actv && !force) {
   if (asleep && name !== 'wake') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (asleep && name !== 'wake' && !force) return false;
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; for (const L of LEGS) L.init = false; TS.init = false; }
  actv = { name, def, t: 0, n: ++playN, far: 0 };
  // Tail Lash reaches about four metres from its middle; a prey further off, it closes on first
  if (name === 'tailLash') { const d = preyDist(); actv.far = Math.max(0, d - 4.3 * SZ); }
  return true;
 }
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qb = new THREE.Quaternion();
 function preyDist() { const tg = state.target; if (!tg) return 4 * SZ; root.updateMatrixWorld(true); pivot.getWorldPosition(_a); return Math.hypot(tg.x - _a.x, tg.z - _a.z); }

 // ---------- the walk, the legs, the springs ----------
 // A lizard's walk: the diagonal pairs step together, its body swinging side to side between its shoulders and hips,
 // its tail swaying after. A planted foot slides back at the game's pace (phase = metres walked x 4.4), so it stays put.
 const DUTY = .62, STRIDE = TAU / 4.4 * DUTY, PH = 1 / 120;
 const TS = { init: false, p: new Float32Array(NT), pv: new Float32Array(NT), y: new Float32Array(NT), yv: new Float32Array(NT) }; // the tail's springs
 const BL = { t: 0, wait: 2.5, on: 0 }, PUL = { t: 9, s: 0, sp: 1 };
 let acc = 0, aimY = 0, aimP = 0, spinPrev = 0, spinW = 0, thrIdle = 0, wobble = 0;
 const SP3B = sp3.getWorldPosition(V3()), BODYB = body.getWorldPosition(V3()); // (the bind positions, base space = world at the bind)
 for (const L of LEGS) { L.bd0 = L.P[1].clone().sub(L.P[0]).normalize(); L.bd1 = L.P[2].clone().sub(L.P[1]).normalize(); L.bp = L.pole.clone().normalize(); L.T = V3(); L.init = false; L.lift = 0; L.parB = L.front ? SP3B : BODYB; }
 const _x1 = V3(), _x2 = V3(), _y1 = V3(), _y2 = V3(), _e = V3(), _w = V3(), _pp = V3(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _qa = new THREE.Quaternion(), _qbi = new THREE.Quaternion();
 // turn a bone (in base space) so its bind direction bd points along d, and its bind pole bp toward p
 function aimBone(b, bd, bp, d, p) {
  _x1.copy(bp).addScaledVector(bd, -bp.dot(bd)).normalize(); _x2.crossVectors(bd, _x1);
  _y1.copy(p).addScaledVector(d, -p.dot(d)).normalize(); _y2.crossVectors(d, _y1);
  _m1.makeBasis(bd, _x1, _x2).transpose(); _m2.makeBasis(d, _y1, _y2).multiply(_m1);
  _qa.setFromRotationMatrix(_m2);
  b.parent.getWorldQuaternion(_q2); _q2.premultiply(_qbi);
  b.quaternion.copy(_q2.invert().multiply(_qa));
 }
 // a bind-space point near a leg's root, carried along by the bone it hangs from (its chest or its hips), into base space
 const parentPt = (L, x, y, z, out) => { out.set(x, y, z).sub(L.parB); L.par.localToWorld(out); return base.worldToLocal(out); };
 function legIK(L, P, phase, tt) {
  const [b0, b1, b2, b3] = L.b, T = L.T.copy(L.home);
  if (L.front) { T.x += L.s * P.fs; T.z += P.fz; } else { T.x += L.s * P.hs; T.z += P.hz; }
  let lift = 0, swing = 0;
  if (walkS > 1e-3) {
   const c = (((phase + L.ph) / TAU) % 1 + 1) % 1;
   if (c < DUTY) T.z += STRIDE * (.5 - c / DUTY) * walkS;
   else { const q = (c - DUTY) / (1 - DUTY); T.z += STRIDE * (q - .5) * walkS; swing = Math.sin(PI * q) * walkS; lift = .24 * swing; }
  }
  // spinning round (Tail Lash), its feet scramble
  if (spinW > .05) { const s = Math.max(0, Math.sin(P.spin * 2.2 + L.ph + (L.front ? 0 : 1.3))); lift += .2 * s * Math.min(1, spinW); swing = Math.max(swing, s * Math.min(1, spinW)); }
  T.y += lift;
  pivot.localToWorld(T); base.worldToLocal(T);
  // tucked under it, or lifted (rearing): toward points carried by its chest or its hips
  if (P.tuck > 1e-3) { parentPt(L, L.P[0].x + L.s * .12, L.P[0].y - .78, L.P[0].z + (L.front ? -.12 : .14), _a); T.lerp(_a, P.tuck); }
  if (L.front && P.fpl < .999) { parentPt(L, L.P[0].x + L.s * (.1 + P.frx), L.P[0].y - .52 + P.fry, L.P[0].z + .38 + P.frz, _a); T.lerp(_a, 1 - P.fpl); }
  if (P.y > -.05 && T.y < .16) T.y = .16; // never through the ground
  // the two bones: the elbow (or knee) bends out toward the pole, which turns with the chest (or hips)
  b0.getWorldPosition(_b); base.worldToLocal(_b);
  _c.subVectors(T, _b); const l1 = L.l1, l2 = L.l2, d = cl(_c.length(), Math.abs(l1 - l2) + .02, (l1 + l2) * .995); _c.normalize();
  L.par.getWorldQuaternion(_q); _q.premultiply(_qbi); _d.copy(L.bp).applyQuaternion(_q);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  _pp.copy(_d).addScaledVector(_c, -_d.dot(_c)).normalize();
  _e.copy(_b).addScaledVector(_c, a).addScaledVector(_pp, h); _w.copy(_b).addScaledVector(_c, d);
  aimBone(b0, L.bd0, L.bp, _a.subVectors(_e, _b).normalize(), _d); b0.updateMatrixWorld(true);
  aimBone(b1, L.bd1, L.bp, _a.subVectors(_w, _e).normalize(), _d); b1.updateMatrixWorld(true);
  // the foot: flat on the ground and turned with the body (rolled a little as it swings); lifted, it follows the forearm
  pivot.getWorldQuaternion(_qa); _qa.premultiply(_qbi);
  _q.setFromAxisAngle(_x1.set(1, 0, 0), .35 * swing); _qa.multiply(_q);
  b1.getWorldQuaternion(_q2); _q2.premultiply(_qbi);
  const raised = L.front ? cl(1 - P.fpl, 0, 1) : 0;
  if (raised > 0) { _q.copy(_q2).multiply(_q.setFromAxisAngle(_x1.set(1, 0, 0), -.5)); _qa.slerp(_q, raised); }
  b2.quaternion.copy(_q2.invert().multiply(_qa));
  b3.rotation.set(-P.claw * .42 + .3 * swing + .03 * Math.sin(tt * .7 + L.ph), 0, 0);
  b2.updateMatrixWorld(true);
  L.lift = lift;
 }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  if (name !== 'tailLash') FIN.spin = Math.atan2(Math.sin(FIN.spin), Math.cos(FIN.spin)); // after the lash's full turn, without unwinding it
  const k3 = (r) => (dt > 0 ? 1 - Math.exp(-dt * r) : 0);
  gW += ((gOn && !actv ? 1 : 0) - gW) * k3(7);
  walkS += ((actv ? 0 : walk) - walkS) * (dt > 0 ? k3(6) : 1);
  starveV += (cl(+state.starve || 0, 0, 1) - starveV) * (dt > 0 ? k3(1.5) : 1);
  const sleepy = name === 'die' || name === 'wake';
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  if (starveV > 1e-3 && !sleepy) for (const k in STARVE) TGT[k] = lerp(TGT[k], STARVE[k], starveV * (1 - .6 * (actv ? 1 : 0)));
  const rate = actv ? actv.def.rate : 6, kk = k3(rate);
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  const P = FIN, tt = t, life = 1 - P.stone;
  dashV = 0;
  if (name === 'hurt') dashV = -1.8 * SZ * (1 - sm(.1, .55, u));
  // (Tail Lash closes on a prey beyond its reach, then hops back to where it stood)
  else if (name === 'tailLash' && actv && actv.far > 0) dashV = u > .04 && u < .4 ? actv.far / (.36 * actv.def.dur) : u > .8 ? -actv.far / (.2 * actv.def.dur) : 0;
  else if (name === 'eruption') dashV = u > .44 && u < .53 ? 1.6 * SZ : 0;
  // ---------- body: breath, the walk's sway, rearing, bending, curling up ----------
  const br = Math.sin(tt * 1.15), ps = .02 * br * life * (1 - .5 * walkS);
  const wc = Math.cos(phase), A = .13 * walkS;
  const omega = dt > 0 ? Math.atan2(Math.sin(P.spin - spinPrev), Math.cos(P.spin - spinPrev)) / dt : 0; spinPrev = P.spin; spinW = Math.abs(omega) / 6;
  wobble = .012 * Math.sin(tt * .4) * life * (1 - walkS);
  pivot.position.set(0, P.y, PIVZ); pivot.rotation.set(0, P.spin + wobble, 0);
  body.position.set(0, .82 + P.low + .025 * walkS * Math.abs(Math.sin(phase * 2)) + .006 * br * life, JZ.body - PIVZ);
  body.rotation.set(-P.rear + P.bp + .008 * br * life, A * wc + P.bend * .25 + P.curl * .5, P.roll + .03 * walkS * Math.sin(phase));
  const sb = -2 * A * wc / 3 + P.bend * .25 + P.curl * .46;
  // (reared up, its back arches and its chest leans forward over its prey)
  sp1.rotation.set(-P.rear * .07, sb, 0); sp2.rotation.set(-P.rear * .05 - ps * .3, sb, 0); sp3.rotation.set(P.rear * .14 + ps * .3, sb, 0);
  sp2.scale.set(1 + ps * .6 + P.sq, 1 + ps + P.sq, 1); sp3.scale.set(1 + ps * .4, 1 + ps * .7, 1);
  root.updateMatrixWorld(true);
  base.getWorldQuaternion(_qbi).invert();
  // ---------- the head turns to its prey (smoothly, with small glances), the jaw, the eyes, the throat ----------
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.1, 7 * SZ));
  neck.getWorldPosition(_a); _b.copy(_tg).sub(_a); sp3.getWorldQuaternion(_q); _b.applyQuaternion(_q.invert());
  if (dt > 0) { BL.sac = (BL.sac || 0) - dt; if (BL.sac < 0) { BL.sac = r2(1.2, 3.5); BL.gy = r2(-.12, .12); BL.gp = r2(-.06, .06); } }
  const ay = cl(Math.atan2(_b.x, _b.z), -1.1, 1.1) + (BL.gy || 0) * life, ap = cl(Math.atan2(-_b.y, Math.hypot(_b.x, _b.z)), -.6, .7) + (BL.gp || 0) * life;
  aimY += (ay - aimY) * (dt > 0 ? k3(4) : 1); aimP += (ap - aimP) * (dt > 0 ? k3(4) : 1);
  const lk = P.look * (1 - .25 * walkS);
  neck.rotation.set(P.nk + aimP * .4 * lk - ps * 2, P.ny + aimY * .45 * lk + P.curl * .62 - A * wc * .5, 0);
  head.rotation.set(P.hp + aimP * .6 * lk, P.hy + aimY * .55 * lk + P.curl * .32, P.hr);
  jaw.rotation.set(P.jaw + (P.jaw > .6 ? .025 * Math.sin(tt * 38) : 0), 0, 0);
  // salamanders pump their throats as they breathe; it swells when it breathes in fire
  thrIdle = (.5 + .5 * Math.sin(tt * 2.4)) * .35 * life;
  const th = Math.max(P.thr, thrIdle * (1 - P.thr));
  throat.scale.set(1 + .18 * th, 1 + .5 * th, 1 + .22 * th); throat.position.y = -.36 - .05 * th;
  // blinking, every few seconds
  if (dt > 0) { BL.t += dt; if (BL.t > BL.wait) { BL.t = 0; BL.wait = r2(2.2, 6); BL.on = .16; } BL.on = Math.max(0, BL.on - dt); }
  const lidV = Math.max(P.lid, BL.on > 0 ? Math.sin(BL.on / .16 * PI) : 0);
  for (let e = 0; e < 2; e++) lids[e].quaternion.setFromAxisAngle(EYEF[e].rt, lerp(-.5, .42, lidV));
  root.updateMatrixWorld(true);
  // ---------- the tail: its pose, a slow sway (with the walk, a wave that follows the hips), dragged round as it
  // spins; each joint on a spring, softer toward the tip, and laid along the ground rather than through it ----------
  const nSteps = Math.min(8, Math.floor((acc + dt) / PH)); acc = nSteps === 8 ? 0 : acc + dt - nSteps * PH;
  for (let i = 0; i < NT; i++) {
   const f = i / (NT - 1);
   const tp = (i ? 0 : P.tl + (P.rear - P.bp) * .92) + P.tu * (.6 + f) - .012 * (1 - f) + .02 * Math.sin(tt * .7 + i * .5) * P.tw * life;
   const ty = -P.tc * (.7 + .6 * f) - P.curl * .2 - (i ? 1 : 0) * (A * .9 * Math.cos(phase - i * .65)) - .05 * P.tw * life * Math.sin(tt * .55 - i * .55) * (.4 + f) - .014 * omega * (.4 + f);
   if (!TS.init) { TS.p[i] = tp; TS.y[i] = ty; TS.pv[i] = TS.yv[i] = 0; }
   const Kp = 90 * (1 - .55 * f), Dp = 2 * .55 * Math.sqrt(Kp);
   for (let n = 0; n < nSteps; n++) { TS.pv[i] += (Kp * (tp - TS.p[i]) - Dp * TS.pv[i]) * PH; TS.p[i] += TS.pv[i] * PH; TS.yv[i] += (Kp * (ty - TS.y[i]) - Dp * TS.yv[i]) * PH; TS.y[i] += TS.yv[i] * PH; }
   TL[i].rotation.set(TS.p[i], TS.y[i], 0);
  }
  TS.init = true;
  if (P.y > -.05) for (let i = 0; i < NT; i++) {
   const b = TL[i]; b.updateMatrixWorld(true);
   const nxt = i < NT - 1 ? TL[i + 1].position : _c.set(0, 0, -.2), seg = nxt.length();
   _a.copy(nxt).applyMatrix4(b.matrixWorld); base.worldToLocal(_a);
   const minY = lerp(.26, .08, i / (NT - 1));
   if (_a.y < minY) { const dA = Math.asin(cl((minY - _a.y) / seg, 0, 1)); TS.p[i] += dA; TS.pv[i] = Math.max(0, TS.pv[i]); b.rotation.x = TS.p[i]; b.updateMatrixWorld(true); }
  }
  root.updateMatrixWorld(true);
  // ---------- the legs ----------
  for (const L of LEGS) legIK(L, P, phase, tt);
  root.updateMatrixWorld(true);
  // ---------- looks ----------
  const fk = cl(P.fade, 0, 1) * fadeE, hs = state.heat === undefined ? 1 : cl(+state.heat, 0, 2);
  if (dt > 0) { PUL.t += dt; if (PUL.t > (name === 'heatDrain' ? .7 : 4.2) && !sleepy && life > .5) { PUL.t = 0; PUL.s = name === 'heatDrain' ? 1.4 : .55; PUL.sp = name === 'heatDrain' ? 1.6 : .8; } }
  const px = name === 'wake' ? u * 1.6 - .2 : PUL.t * PUL.sp - .15, pS = name === 'wake' ? 1.6 * win(u, .05, .7, .05) : PUL.s * (1 - sm(1, 1.4, PUL.t * PUL.sp));
  U.time.value = tt;
  U.heat.value = P.heat * hs * (1 - .55 * starveV);
  U.cry.value = P.cry * (1 - .45 * starveV) * (.92 + .08 * Math.sin(tt * 2.1));
  U.white.value = cl(P.white, 0, 1); U.mouth.value = P.mg * (1 - .4 * starveV); U.lip.value = P.mg * (1.15 - .4 * cl(P.jaw, 0, 1)); U.eye.value = P.eye;
  U.starve.value = starveV * life; U.stone.value = cl(P.stone, 0, 1);
  U.wave.value.set(px, pS, life * (1 + .25 * (P.heat - 1)), 0);
  U.dis.value = 1 - fk; U.clip.value = P.y < -.02 ? root.position.y + .004 : -1e4;
  liftV = Math.max(0, P.y * SZ);
  updateFX(name, u, tt, dt, fk, P);
  lastName = name; lastU = u;
 }

 // ---------- effects ----------
 const EMBERC = new THREE.Color(1, .48, .12), GOLDC = new THREE.Color(1, .78, .36), WHITEC = new THREE.Color(1, .94, .78), REDC = new THREE.Color(1, .18, .07);
 const SMOKEC = new THREE.Color(.17, .14, .13), DUSTC = new THREE.Color(.3, .25, .2), STEAMC = new THREE.Color(.72, .72, .74), FROSTC = new THREE.Color(.82, .9, 1), FIREC = new THREE.Color(1, .72, .32);
 const fxS = { emb: 0, wisp: 0, dust: 0, flame: 0, suck: 0, steam: 0, drain: 0, tailF: 0, glint: 0, breath: 0 };
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 const mouthPt = (out) => { head.localToWorld(out.set(0, .04, .64)); jaw.localToWorld(_d.set(0, -.07, .5)); return out.lerp(_d, .5); };
 const tailPt = (f, out) => { const x = cl(f, 0, 1) * (NT - 1), i = Math.min(NT - 2, Math.floor(x)); TL[i].getWorldPosition(out); TL[i + 1].getWorldPosition(_d); return out.lerp(_d, x - i); };
 const tipPt = (out) => TL[NT - 1].localToWorld(out.set(0, .02, -.22));
 const backPt = (out) => { if (CSK.length && rnd2() < .7) { const c = CSK[(rnd2() * CSK.length) | 0]; return skinPt(c.p, c.wts, out); } tailPt(rnd2() * .9, out); return out.add(_d.set(0, .3 * SZ, 0)); };
 const _ra = V3(), _rq = new THREE.Quaternion(), _rs = V3(), _rm = new THREE.Matrix4(), _p0 = V3();
 function rock(p, v, s, life, orbit) { for (let n = 0; n < NRK; n++) { const R = RK[n]; if (R.t < 0) { R.t = 0; R.life = life; R.p.copy(p); R.v.copy(v); R.ax.set(r2(-1, 1), r2(-1, 1), r2(-1, 1)).normalize(); R.w = r2(3, 9); R.ang = r2(0, TAU); R.s = s; R.orbit = orbit || 0; R.ph = r2(0, TAU); R.f = r2(0, 1); return R; } } return null; }
 function shard(p, v, s) { for (let n = 0; n < NSH; n++) { const S = SH[n]; if (S.t < 0) { S.t = 0; S.life = r2(.9, 1.5); S.p.copy(p); S.v.copy(v); S.ax.set(r2(-1, 1), r2(-1, 1), r2(-1, 1)).normalize(); S.w = r2(6, 14); S.ang = 0; S.s = s; return; } } }
 function burst(P, p, n, sp, c, life, s0, s1, up, a) { for (let i = 0; i < n; i++) { const th = r2(0, TAU), ph = r2(-.3, 1.2); emit(P, p.x, p.y, p.z, Math.cos(th) * Math.cos(ph) * sp * r2(.4, 1), Math.sin(ph) * sp * r2(.5, 1.1), Math.sin(th) * Math.cos(ph) * sp * r2(.4, 1), life * r2(.7, 1.2), c, a === undefined ? 1 : a, s0 * SZ, s1 * SZ, 1.2, up); } }
 function flames(p, n, s, up, spread) { for (let i = 0; i < n; i++) emit(FL, p.x + r2(-1, 1) * spread, p.y, p.z + r2(-1, 1) * spread, r2(-.4, .4), up * r2(.6, 1.2), r2(-.4, .4), r2(.5, .9), rnd2() < .5 ? FIREC : WHITEC, .9, s * r2(.7, 1.2) * SZ, s * .25 * SZ, 1.5, .8); }
 function dustRing(c, r0, r1, n, s) { for (let i = 0; i < n; i++) { const a = r2(0, TAU), r = r2(r0, r1) * SZ; emit(DU, c.x + Math.cos(a) * r, .12, c.z + Math.sin(a) * r, Math.cos(a) * 1.6, r2(.3, .8), Math.sin(a) * 1.6, r2(1.4, 2.2), DUSTC, .5, .7 * s * SZ, 2 * s * SZ, 1.4, .1); } }
 function crater(k, x, z, R, glow) { const C = CRATER[k]; C.m.position.set(x, .02, z); C.m.scale.set(R * 2, R * 2, 1); C.m.rotation.z = r2(0, TAU); C.t = 0; C.R = R; C.g = glow; C.m.visible = true; }
 const ERU = { a: V3(), b: V3(), on: false }, DRK = []; // Eruption's line, from where it slams to its prey; the rocks swirling in Heat Drain
 function updateFX(name, u, t, dt, fk, P) {
  const life = 1 - cl(P.stone, 0, 1), amb = fk * life, st = starveV;
  // the steady glow: embers drifting up off its back, and faint wisps of heat
  fxS.emb += dt * P.emb * 7 * amb * (1 - .7 * st);
  while (fxS.emb >= 1) { fxS.emb -= 1; backPt(_a); emit(EM, _a.x, _a.y, _a.z, r2(-.15, .15), r2(.35, .9), r2(-.15, .15), r2(1.2, 2.4), st > .5 ? REDC : rnd2() < .6 ? EMBERC : GOLDC, .95, r2(.03, .055) * SZ, .012 * SZ, .4, .25, 0, .25); }
  fxS.wisp += dt * 1.6 * amb * (1 - st) * cl(P.heat, 0, 2);
  while (fxS.wisp >= 1) { fxS.wisp -= 1; backPt(_a); emit(DU, _a.x, _a.y + .2 * SZ, _a.z, r2(-.1, .1), r2(.4, .7), r2(-.1, .1), r2(2, 3), SMOKEC, .07, .35 * SZ, 1.3 * SZ, .3, .05, r2(-.3, .3)); }
  // starving: its breath steams in the cold, and frost glints on it
  if (st > .05 && life > .5) {
   const br = Math.sin(t * 1.15); if (fxS.lastBr !== undefined && fxS.lastBr > .6 && br <= .6) { mouthPt(_a); head.localToWorld(_b.set(0, -.1, 1.6)).sub(_a).normalize(); for (let i = 0; i < 5; i++) emit(DU, _a.x, _a.y, _a.z, _b.x * r2(.5, .9) + r2(-.1, .1), r2(-.05, .1), _b.z * r2(.5, .9) + r2(-.1, .1), r2(1.2, 1.8), FROSTC, .2 * st, .12 * SZ, .55 * SZ, 1.2, .08); }
   fxS.lastBr = br;
   fxS.glint += dt * 5 * st * fk; while (fxS.glint >= 1) { fxS.glint -= 1; backPt(_a); _a.x += r2(-.4, .4) * SZ; _a.y -= r2(0, .3) * SZ; emit(GL, _a.x, _a.y, _a.z, 0, 0, 0, r2(.3, .6), FROSTC, .9, r2(.06, .1) * SZ, .01 * SZ); }
  } else fxS.lastBr = undefined;
  // dust thrown up round it
  fxS.dust += dt * P.dust * 50 * fk; while (fxS.dust >= 1) { fxS.dust -= 1; pivot.getWorldPosition(_a); dustRing(_a, 1.6, 3.6, 1, 1); }
  // cooling to stone: steam rising off it
  fxS.steam += dt * P.steam * 24 * fk; while (fxS.steam >= 1) { fxS.steam -= 1; backPt(_a); emit(DU, _a.x + r2(-.3, .3) * SZ, _a.y, _a.z + r2(-.3, .3) * SZ, r2(-.1, .1), r2(.5, 1), r2(-.1, .1), r2(2.2, 3.4), STEAMC, .22, .3 * SZ, 1.6 * SZ, .3, .1, r2(-.3, .3)); }
  // ---------- Bursting Up ----------
  if (name === 'appear') {
   if (u < .04 && lastName !== 'appear') { pivot.getWorldPosition(_a); crater(0, _a.x, _a.z, 3.6 * SZ, 1.6); }
   if (u > .06 && u < .45) { fxS.flame += dt * 40 * fk; while (fxS.flame >= 1) { fxS.flame -= 1; const a = r2(0, TAU), r = r2(.4, 2.6) * SZ; pivot.getWorldPosition(_a); flames(_a.set(_a.x + Math.cos(a) * r, .05, _a.z + Math.sin(a) * r), 1, .55, 2.6, 0); } }
   if (crossed(name, u, 'appear', .28)) {
    pivot.getWorldPosition(_a); shock(_a.x, _a.z, .5 * SZ, 9 * SZ, 1.1, DUSTC, .6, false); shock(_a.x, _a.z, .3 * SZ, 6 * SZ, .7, EMBERC, .7, true);
    for (let i = 0; i < 28; i++) { const a = r2(0, TAU), r = r2(.3, 2.4) * SZ; rock(_b.set(_a.x + Math.cos(a) * r, .1, _a.z + Math.sin(a) * r), _c.set(Math.cos(a) * r2(1.5, 5), r2(3.5, 8), Math.sin(a) * r2(1.5, 5)), r2(.12, .34) * SZ, r2(2.6, 4)); }
    burst(EM, _a.set(_a.x, .4, _a.z), 70, 6 * SZ, EMBERC, 1.4, .06, .015, -2);
   }
   if (crossed(name, u, 'appear', .42)) { mouthPt(_a); burst(EM, _a, 40, 3.5 * SZ, GOLDC, 1.2, .05, .015, .5); }
   if (crossed(name, u, 'appear', .74)) { pivot.getWorldPosition(_a); shock(_a.x, _a.z, .5 * SZ, 7 * SZ, .9, DUSTC, .5, false); }
  }
  // ---------- Roar ----------
  if (crossed(name, u, 'roar', .24) || crossed(name, u, 'wake', .74)) { mouthPt(_a); burst(EM, _a, 45, 3.5 * SZ, GOLDC, 1.1, .05, .015, .6); pivot.getWorldPosition(_b); shock(_b.x, _b.z, 1 * SZ, 6 * SZ, .8, EMBERC, .35, true); for (let i = 0; i < 20; i++) { backPt(_a); emit(EM, _a.x, _a.y, _a.z, r2(-.6, .6), r2(1.5, 3), r2(-.6, .6), r2(.8, 1.4), WHITEC, 1, .05 * SZ, .01 * SZ, .8, -1); } }
  // ---------- Tail Lash: the blazing arc, fire along the tail, shards flung off ----------
  const tk = cl(P.trail, 0, 1) * fk;
  if (tk > .01) {
   tipPt(_a); tailPt(.55, _b);
   if (TRK.prev <= .01) for (let i = 0; i < TRN; i++) { TRK.tip[i].copy(_a); TRK.mid[i].copy(_b); }
   for (let i = TRN - 1; i > 0; i--) { TRK.tip[i].copy(TRK.tip[i - 1]); TRK.mid[i].copy(TRK.mid[i - 1]); }
   TRK.tip[0].copy(_a); TRK.mid[0].copy(_b);
   for (let i = 0; i < TRN; i++) {
    const k = tk * Math.pow(1 - i / (TRN - 1), 1.6), w = i / (TRN - 1), o = i * 6;
    trPos.set([TRK.tip[i].x, TRK.tip[i].y, TRK.tip[i].z, TRK.mid[i].x, TRK.mid[i].y, TRK.mid[i].z], o);
    trCol.set([lerp(1, .9, w) * k, lerp(.85, .25, w) * k, lerp(.5, .04, w) * k, .5 * k, .14 * k, .02 * k], o);
   }
   trail.visible = true; trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
   fxS.tailF += dt * 70 * tk; while (fxS.tailF >= 1) { fxS.tailF -= 1; tailPt(r2(.45, 1), _a); emit(FL, _a.x, _a.y + .1 * SZ, _a.z, r2(-.5, .5), r2(.5, 1.5), r2(-.5, .5), r2(.3, .55), rnd2() < .5 ? FIREC : WHITEC, .85, r2(.35, .6) * SZ, .1 * SZ, 2, .5); }
  } else if (trail.visible) { trail.visible = false; }
  TRK.prev = tk;
  if (name === 'tailLash' && u > .46 && u < .66 && rnd2() < dt * 30) { tipPt(_a); _b.subVectors(_a, TRK.tip[2]).multiplyScalar(1 / Math.max(dt * 2, .016)); shard(_a, _c.copy(_b).multiplyScalar(.45).add(_d.set(r2(-1, 1), r2(1, 3), r2(-1, 1))), r2(.06, .12) * SZ); }
  if (crossed(name, u, 'tailLash', .55)) { tipPt(_a); burst(EM, _a, 40, 5 * SZ, GOLDC, .8, .05, .012, -3); }
  // ---------- Ember Spit: fire drawn in, the glob, the splash ----------
  fxS.suck += dt * P.suck * 90 * fk;
  while (fxS.suck >= 1) { fxS.suck -= 1; mouthPt(_b); const a = r2(0, TAU), e = r2(-.6, .9), r = r2(.9, 1.6) * SZ; _a.set(_b.x + Math.cos(a) * Math.cos(e) * r, _b.y + Math.sin(e) * r, _b.z + Math.sin(a) * Math.cos(e) * r); const tm = r2(.25, .4); emit(EM, _a.x, _a.y, _a.z, (_b.x - _a.x) / tm, (_b.y - _a.y) / tm, (_b.z - _a.z) / tm, tm, rnd2() < .5 ? GOLDC : EMBERC, 1, .06 * SZ, .02 * SZ, 0, 0); }
  fxS.flame += dt * P.fire * 80 * fk;
  while (fxS.flame >= 1) { fxS.flame -= 1; mouthPt(_a); head.localToWorld(_b.set(0, 0, 1.2)).sub(_a).normalize(); emit(FL, _a.x, _a.y, _a.z, _b.x * r2(2, 4), _b.y * 3 + r2(0, .8), _b.z * r2(2, 4), r2(.25, .45), rnd2() < .5 ? FIREC : WHITEC, .9, r2(.3, .5) * SZ, .1 * SZ, 2.5, .6); }
  if (crossed(name, u, 'emberSpit', .42)) {
   mouthPt(BALL.p0); const tg = state.target; if (tg) BALL.p1.set(tg.x, Math.max(.4, tg.y), tg.z); else root.localToWorld(BALL.p1.set(0, .8, 6 * SZ));
   BALL.t = 0; BALL.T = Math.max(.15, (.62 - .42) * ACTS.emberSpit.dur); BALL.h = .7 * SZ; ball.visible = true; ball.scale.setScalar(SZ);
  }
  if (BALL.t >= 0) {
   BALL.t += dt; const s = Math.min(1, BALL.t / BALL.T);
   ball.position.lerpVectors(BALL.p0, BALL.p1, s); ball.position.y += BALL.h * 4 * s * (1 - s); ballM.uniforms.uT.value = t; ball.rotation.y += dt * 4;
   for (let i = 0; i < 3; i++) emit(FL, ball.position.x + r2(-.1, .1), ball.position.y + r2(-.1, .1), ball.position.z + r2(-.1, .1), r2(-.3, .3), r2(.2, .8), r2(-.3, .3), r2(.25, .45), rnd2() < .4 ? WHITEC : FIREC, .9, r2(.35, .55) * SZ, .08 * SZ, 2, .4);
   if (rnd2() < .6) emit(EM, ball.position.x, ball.position.y, ball.position.z, r2(-1, 1), r2(-.5, 1), r2(-1, 1), r2(.4, .8), EMBERC, 1, .05 * SZ, .01 * SZ, .8, -3);
   if (s >= 1) {
    BALL.t = -1; ball.visible = false; const p = BALL.p1;
    flames(_a.set(p.x, Math.max(.05, p.y - .5), p.z), 26, .7, 3, .5 * SZ); burst(EM, p, 50, 5 * SZ, EMBERC, 1, .06, .012, -5);
    crater(1, p.x, p.z, 1.6 * SZ, 1.2); shock(p.x, p.z, .2 * SZ, 3.5 * SZ, .6, EMBERC, .7, true); fxS.fireHit = 1; fireL.position.copy(p);
   }
  }
  // ---------- Heat Drain: ribbons of fire spiralling from its prey into its mouth, rocks swirling in them ----------
  const dk = cl(P.drain, 0, 1) * fk; drain.visible = dk > .01;
  if (drain.visible) {
   mouthPt(_b); const tg = state.target; if (tg) _a.set(tg.x, tg.y, tg.z); else root.localToWorld(_a.set(0, 1, 6 * SZ));
   _p0.subVectors(_b, _a);
   for (let r = 0, o = 0; r < DRN; r++) {
    const ph = r * TAU / DRN;
    for (let i = 0; i <= DRS; i++, o += 6) {
     const s = i / DRS, th = s * TAU * (1.3 + .25 * r) - t * (5 + r) + ph, rad = (.1 + (.4 + .18 * Math.sin(r * 2.3 + t)) * Math.sin(PI * s) * (1 - .6 * s) + .06 * Math.sin(s * 17 + t * 3 + r)) * SZ;
     _c.copy(_a).addScaledVector(_p0, s); _c.x += Math.cos(th) * rad; _c.y += Math.sin(th) * rad * .8 + Math.sin(PI * s) * .5 * SZ; _c.z += Math.sin(th) * rad * .6;
     const w = (.04 + .07 * Math.sin(PI * s)) * SZ, k = 1.6 * dk * sm(0, .1, s) * (.45 + .55 * s) * (.35 + .65 * Math.pow(Math.max(0, Math.sin(s * 12 + t * 9 + ph)), 2));
     drPos[o] = drPos[o + 3] = _c.x; drPos[o + 1] = _c.y - w; drPos[o + 4] = _c.y + w; drPos[o + 2] = drPos[o + 5] = _c.z;
     drCol[o] = drCol[o + 3] = k; drCol[o + 1] = drCol[o + 4] = k * lerp(.35, .85, s); drCol[o + 2] = drCol[o + 5] = k * lerp(.05, .4, s * s);
    }
   }
   drG.attributes.position.needsUpdate = drG.attributes.color.needsUpdate = true;
   fxS.drain += dt * 50 * dk; while (fxS.drain >= 1) { fxS.drain -= 1; const tm = r2(.5, .8); emit(EM, _a.x + r2(-.3, .3), _a.y + r2(-.4, .4), _a.z + r2(-.3, .3), _p0.x / tm, _p0.y / tm + .5, _p0.z / tm, tm, rnd2() < .5 ? GOLDC : EMBERC, 1, .06 * SZ, .03 * SZ, 0, 0, 0, .6); }
   if (DRK.length < 10 && rnd2() < dt * 14) { const R = rock(_a, _c.set(0, 0, 0), r2(.07, .16) * SZ, 99, 1); if (R) DRK.push(R); }
  }
  for (let i = DRK.length - 1; i >= 0; i--) { const R = DRK[i]; if (dk <= .01 || R.t < 0) { if (R.t >= 0) { R.orbit = 0; R.life = R.t + 1.2; R.v.set(r2(-1, 1), r2(1, 3), r2(-1, 1)); } DRK.splice(i, 1); } }
  if (crossed(name, u, 'heatDrain', .86)) { pivot.getWorldPosition(_a); shock(_a.x, _a.z, 1 * SZ, 6.5 * SZ, .7, GOLDC, .5, true); for (let i = 0; i < 40; i++) { backPt(_a); emit(EM, _a.x, _a.y, _a.z, r2(-1, 1), r2(1.5, 3.5), r2(-1, 1), r2(.8, 1.4), WHITEC, 1, .06 * SZ, .01 * SZ, .8, -1.5); } }
  // ---------- Eruption: the slam, the ground splitting toward its prey, the eruption under it ----------
  if (crossed(name, u, 'eruption', .52)) {
   LEGS[0].b[2].getWorldPosition(_a); LEGS[1].b[2].getWorldPosition(_b); _a.lerp(_b, .5); _a.y = 0;
   shock(_a.x, _a.z, .5 * SZ, 8 * SZ, 1, DUSTC, .65, false); shock(_a.x, _a.z, .3 * SZ, 5 * SZ, .6, EMBERC, .6, true); dustRing(_a, .5, 2.5, 26, 1.2);
   crater(0, _a.x, _a.z, 2.6 * SZ, 1.4);
   for (let i = 0; i < 10; i++) rock(_a, _c.set(r2(-2.5, 2.5), r2(2.5, 5), r2(-2.5, 2.5)), r2(.1, .24) * SZ, r2(2, 3));
   const tg = state.target; ERU.a.copy(_a); if (tg) ERU.b.set(tg.x, 0, tg.z); else root.localToWorld(ERU.b.set(0, 0, 6 * SZ)); ERU.b.y = 0; ERU.on = true;
  }
  if (name === 'eruption' && ERU.on && u > .52 && u < .6) { const s = sm(.52, .58, u); _a.lerpVectors(ERU.a, ERU.b, s); flames(_a, 3, .6, 3.5, .25 * SZ); if (rnd2() < .5) rock(_a, _c.set(r2(-1, 1), r2(2, 4), r2(-1, 1)), r2(.06, .14) * SZ, r2(1.2, 2)); }
  if (crossed(name, u, 'eruption', .58)) {
   const p = ERU.b; ERU.on = false;
   crater(1, p.x, p.z, 3 * SZ, 1.8); shock(p.x, p.z, .3 * SZ, 6 * SZ, .8, EMBERC, .85, true); shock(p.x, p.z, .5 * SZ, 8 * SZ, 1.1, DUSTC, .55, false);
   for (let i = 0; i < 46; i++) { const a = r2(0, TAU), r = r2(0, .9) * SZ; emit(FL, p.x + Math.cos(a) * r, .1, p.z + Math.sin(a) * r, Math.cos(a) * r2(.2, 1.2), r2(4, 9), Math.sin(a) * r2(.2, 1.2), r2(.5, .9), rnd2() < .45 ? WHITEC : FIREC, .95, r2(.6, 1.1) * SZ, .2 * SZ, 1.2, -2); }
   for (let i = 0; i < 18; i++) rock(_a.set(p.x + r2(-.6, .6), .2, p.z + r2(-.6, .6)), _c.set(r2(-3.5, 3.5), r2(4, 9), r2(-3.5, 3.5)), r2(.1, .3) * SZ, r2(2.4, 3.6));
   burst(EM, _a.set(p.x, .6, p.z), 70, 7 * SZ, EMBERC, 1.3, .06, .012, -4); fxS.fireHit = 1.4; fireL.position.set(p.x, 1.2, p.z);
  }
  // ---------- Hurt and Block: sparks, and a shard or two knocked off its ridge ----------
  if (crossed(name, u, 'hurt', .06) || crossed(name, u, 'block', .2)) { anchor('chest', _a); burst(EM, _a, name === 'hurt' ? 28 : 14, 4 * SZ, GOLDC, .6, .05, .01, -6); if (name === 'hurt') for (let i = 0; i < 3; i++) { backPt(_a); shard(_a, _b.set(r2(-2, 2), r2(2, 4), r2(-2, 2)), r2(.05, .09) * SZ); } }
  if (crossed(name, u, 'die', .1)) { mouthPt(_a); burst(EM, _a, 24, 2.5 * SZ, EMBERC, 1, .045, .01, .3); }
  // the fire's light: on the glob in flight, where it or the eruption strikes, in the mouth while it drains, over the
  // crater it bursts out of
  let fI = 0; if (fxS.fireHit > 0) { fxS.fireHit = Math.max(0, fxS.fireHit - dt * 1.4); fI = 5 * fxS.fireHit; }
  if (BALL.t >= 0) { fireL.position.copy(ball.position); fI = 4; }
  else if (dk > .01 && 2.5 * dk > fI) { mouthPt(fireL.position); fI = 2.5 * dk; }
  else if (name === 'appear' && u < .7) { pivot.getWorldPosition(fireL.position); fireL.position.y = .6 * SZ; fI = 3.5 * sm(.02, .2, u) * (1 - sm(.4, .7, u)); }
  fireL.intensity = fI * fk;
  // ---------- craters, rings, rocks, shards ----------
  for (const C of CRATER) if (C.m.visible) {
   C.t += dt; const op = sm(0, .5, C.t), fade = 1 - sm(4, 7, C.t);
   C.u.uOpen.value = .1 + .95 * op; C.u.uGlow.value = C.g * (1 - sm(.6, 3.5, C.t)) * (.8 + .2 * Math.sin(t * 9)); C.u.uFade.value = fade * fk; C.u.uT.value = t;
   if (fade <= 0) C.m.visible = false;
  }
  for (const S of SHK) if (S.m.visible) { S.t += dt; const f = S.t / S.dur; if (f >= 1) { S.m.visible = false; continue; } const r = lerp(S.r0, S.r1, 1 - Math.pow(1 - f, 2)); S.m.scale.set(r, r, 1); S.m.material.uniforms.uA.value = S.a * (1 - f) * (1 - f); }
  let anyR = false;
  for (let n = 0; n < NRK; n++) {
   const R = RK[n]; if (R.t < 0) continue; anyR = true;
   if (dt > 0) {
    R.t += dt;
    if (R.orbit) { // swirling along Heat Drain's ribbons toward its mouth
     R.f += dt * .45; if (R.f > 1) R.f -= 1;
     const s = R.f, th = s * TAU * 1.6 - t * 6 + R.ph, rad = (.3 + .65 * Math.sin(PI * s)) * SZ; mouthPt(_b); const tg = state.target; if (tg) _a.set(tg.x, tg.y, tg.z); else root.localToWorld(_a.set(0, 1, 6 * SZ));
     R.p.lerpVectors(_a, _b, s); R.p.x += Math.cos(th) * rad; R.p.y += Math.sin(th) * rad * .8 + Math.sin(PI * s) * .5 * SZ; R.p.z += Math.sin(th) * rad * .6;
    } else {
     R.v.y -= 9.8 * dt; R.p.addScaledVector(R.v, dt);
     if (R.p.y < R.s * .5) { R.p.y = R.s * .5; if (R.v.y < -1.5) R.v.y = -R.v.y * .3; else R.v.y = 0; R.v.x *= .6; R.v.z *= .6; R.w *= .7; }
    }
    R.ang += R.w * dt;
   }
   const sc = R.s * (1 - sm(R.life - .6, R.life, R.t)) * fk;
   if (R.t >= R.life) { R.t = -1; ROCK.setMatrixAt(n, M0); continue; }
   _rq.setFromAxisAngle(R.ax, R.ang); ROCK.setMatrixAt(n, _rm.compose(R.p, _rq, _rs.set(sc, sc, sc)));
  }
  if (anyR || fxS.anyR) ROCK.instanceMatrix.needsUpdate = true; fxS.anyR = anyR;
  rockU.value = .8 + .4 * Math.sin(t * 5);
  let anyS = false;
  for (let n = 0; n < NSH; n++) {
   const S = SH[n]; if (S.t < 0) continue; anyS = true;
   if (dt > 0) { S.t += dt; S.v.y -= 7 * dt; S.p.addScaledVector(S.v, dt); if (S.p.y < .05) { S.p.y = .05; S.v.set(S.v.x * .4, Math.abs(S.v.y) * .2, S.v.z * .4); } S.ang += S.w * dt; }
   if (S.t >= S.life) { S.t = -1; SHD.setMatrixAt(n, M0); continue; }
   const sc = S.s * (1 - sm(S.life * .6, S.life, S.t)) * fk; _rq.setFromAxisAngle(S.ax, S.ang); SHD.setMatrixAt(n, _rm.compose(S.p, _rq, _rs.set(sc, sc, sc)));
  }
  if (anyS || fxS.anyS) SHD.instanceMatrix.needsUpdate = true; fxS.anyS = anyS;
  // ---------- its light, and the crystals' halos ----------
  sp3.localToWorld(glowL.position.set(0, .9, -.3));
  glowL.intensity = (.55 + .3 * P.cry + .6 * P.white) * life * fk * (1 - .55 * st);
  glowL.color.setRGB(1, lerp(.55, .2, st), lerp(.2, .08, st));
  const hc = st > 0 ? C1.copy(GOLDC).lerp(REDC, st) : GOLDC, ha = .17 * U.cry.value * (1 + .8 * cl(P.white, 0, 1)) * life * fk;
  for (let i = 0; i < CSK.length; i++) {
   skinPt(CSK[i].p, CSK[i].wts, _a); HL.pos[i * 3] = _a.x; HL.pos[i * 3 + 1] = _a.y; HL.pos[i * 3 + 2] = _a.z;
   HL.col[i * 4] = hc.r; HL.col[i * 4 + 1] = hc.g; HL.col[i * 4 + 2] = hc.b; HL.col[i * 4 + 3] = ha * (.8 + .2 * Math.sin(t * 2.3 + i));
   HL.size[i] = CSK[i].len * 2 * SZ * (1 + .3 * cl(P.white, 0, 1));
  }
  HL.g.attributes.position.needsUpdate = HL.g.attributes.aCol.needsUpdate = HL.g.attributes.aSize.needsUpdate = true;
  stepP(EM, dt, .08, t); stepP(FL, dt, .1, t); stepP(DU, dt, .25, t); stepP(GL, dt, .3, t);
 }
 const C1 = new THREE.Color();

 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'head': return head.localToWorld(out.set(0, .3, .35));
   case 'mouth': return mouthPt(out);
   case 'hit': case 'tail': case 'tip': return tipPt(out);               // the tail's crystal tip (Tail Lash)
   case 'crest': case 'top': return sp3.localToWorld(out.set(0, 1.25, -.35)); // the tallest crystals, over its shoulders
   case 'impact': case 'erupt': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, 6 * SZ)); }
   case 'glob': return BALL.t >= 0 ? out.copy(ball.position) : mouthPt(out); // Ember Spit's glob while it flies
   case 'feet': return out.copy(root.position);
   default: return sp3.localToWorld(out.set(0, -.05, .45)); // 'chest' and anything else: the front of its chest
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh && o.geometry.index) tri += o.geometry.index.count / 3; for (const k of ['map', 'bumpMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) draws++; });
 return {
  root, fx, animate, play, ACTIONS, anchor,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); TS.init = false; for (const P of [EM, FL, DU, GL]) { P.life.fill(0); P.live = 2; } BALL.t = -1; ball.visible = false; drain.visible = trail.visible = false; for (const R of RK) R.t = -1; for (const S of SH) S.t = -1; for (let i = 0; i < NRK; i++) ROCK.setMatrixAt(i, M0); for (let i = 0; i < NSH; i++) SHD.setMatrixAt(i, M0); ROCK.instanceMatrix.needsUpdate = SHD.instanceMatrix.needsUpdate = true; DRK.length = 0; for (const C of CRATER) C.m.visible = false; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get asleep() { return !!actv && actv.name === 'die' && actv.t >= actv.def.dur - 1e-6; }, // curled up and turned to stone
  get gone() { return false; },                    // beaten, it stays on the field as stone (see asleep)
  get globFlying() { return BALL.t >= 0; },
  height: 1.66 * SZ, length: 7 * SZ, width: 2.6 * SZ, reach: 4.3 * SZ, variant: 'emberback',
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}
