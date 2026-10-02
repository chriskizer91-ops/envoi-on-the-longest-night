// wisp.js: the wisp, the low-level foe of Envoi on the Longest Night: a soul starting to go hollow, the early form of a
// wraith (lore answer 16). three.js r128 (global THREE). Defines makeWisp(opts) only.
// Built after reference/art/wisp-model.png, wisp-model-b.png, wisp-actions.png and wisp-actions-b.png.
function makeWisp(opts) {
 'use strict';
 // A teardrop flame of pale soul-green light about 0.85 m from the end of its smoke tail to the tip of its flame,
 // floating a little above the ground and facing +Z. A sorrowful face in the upper flame, a dark swirling hollow below
 // it, two tendrils of light for arms, a tail of grey-green smoke and leaf-shaped specks drifting around it.
 // Everything is drawn by shaders, with no textures: the face, its expressions and its blinks are uniforms, and so are
 // the frost variant (state.frost, 0 green to 1 frost) and the level look (state.level, 1 to 20: the hollow grows).
 // Every material uses premultiplied blending, so light adds to the painting behind it while smoke and the dark
 // hollow cover it. opts: { frost, level, detail 0.5 to 1, seed }.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 makeWisp.made = (makeWisp.made || 0) + 1;
 let seed = (Math.abs(Math.round((opts.seed === undefined ? makeWisp.made : +opts.seed) * 7919)) + 1013) % 2147483647;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 for (let i = 0; i < 5; i++) rnd();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = () => new THREE.Vector3();

 const root = new THREE.Group(); root.name = 'Wisp';
 const body = new THREE.Group(); body.position.y = .45; root.add(body);   // bob, lean, squash and size pivot at its middle
 const inner = new THREE.Group(); inner.position.y = -.45; body.add(inner); // every body part hangs here at the origin, so they sort together
 const fx = new THREE.Group(); fx.name = 'WispFX';
 const PIV = .45;

 const state = { target: { x: 0, y: .9, z: 4 }, frost: opts.frost ? 1 : 0, level: opts.level === undefined ? 1 : +opts.level };
 const U = {
  uTime: { value: 0 }, uFade: { value: 1 }, uFrost: { value: state.frost }, uLevel: { value: 0 },
  uSeed: { value: 3 + rnd() * 40 }, uGlow: { value: 1 }, uTear: { value: 0 }, uDis: { value: 0 },
 };

 // ---------- shared shader code: value noise, the green and frost palettes ----------
 const GL = `
uniform float uTime;
uniform float uFade;
uniform float uFrost;
uniform float uLevel;
uniform float uSeed;
uniform float uGlow;
uniform float uTear;
uniform float uDis;
float h13(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p) {
 vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3. - 2. * f);
 float a = h13(i), b = h13(i + vec3(1., 0., 0.)), c = h13(i + vec3(0., 1., 0.)), d = h13(i + vec3(1., 1., 0.));
 float e = h13(i + vec3(0., 0., 1.)), g = h13(i + vec3(1., 0., 1.)), h = h13(i + vec3(0., 1., 1.)), k = h13(i + vec3(1., 1., 1.));
 return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float fb(vec3 p) { return .55 * vn(p) + .3 * vn(p * 2.07 + 7.1) + .15 * vn(p * 4.13 + 3.7); }
vec3 pal(vec3 g, vec3 f) { return mix(g, f, uFrost); }
float sdE(vec2 p, vec2 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.) / max(k1, 1e-4); }
`;
 // the flame flickers along its normals (least on the face), its candle tip sways, and on release it twists apart
 const DEFORM = `
uniform vec3 uSway;
vec3 deform(vec3 p, vec3 n, float push) {
 float y = p.y;
 float top = smoothstep(.62, .9, y), low = 1. - smoothstep(.24, .44, y);
 float face = smoothstep(.35, .8, n.z) * (1. - top) * (1. - low);
 float amp = (.003 + .02 * top + .014 * low) * (1. - .85 * face) + .026 * uTear;
 float nz = vn(vec3(p.x * 11., p.y * 7. - uTime * 2.6, p.z * 11.) + uSeed) - .5;
 p += n * (nz * amp * 2. + push);
 float tk = top * top;
 p.x += tk * (.03 * sin(uTime * 2.3 + uSeed) + .012 * sin(uTime * 6.1 + y * 18.) + uSway.x);
 p.z += tk * (.018 * sin(uTime * 1.9 + uSeed * 1.7) + uSway.y);
 if (uDis > 0.) {
  // release: the lower body unwinds into a widening spiral and rises; the head stays to the end
  float lw = 1. - smoothstep(.3, .58, y);
  float k = uDis * (.35 + 6. * lw);
  float c = cos(k), s = sin(k);
  vec2 xz = p.xz * (1. + uDis * (.12 + .45 * lw));
  p.xz = vec2(c * xz.x - s * xz.y, s * xz.x + c * xz.y);
  p.y += uDis * (.06 + .22 * lw);
 }
 return p;
}
`;
 function PM(vs, fs, uni, o) {
  return new THREE.ShaderMaterial(Object.assign({
   uniforms: Object.assign({}, U, uni || {}), vertexShader: GL + vs, fragmentShader: GL + fs,
   transparent: true, depthWrite: false, depthTest: true,
   blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
   blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
   extensions: { derivatives: true },
  }, o || {}));
 }
 function addMesh(geo, mat, parent, order) { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order === undefined ? 2 : order; (parent || inner).add(m); return m; }
 function quads(n, fill) {
  const g = new THREE.BufferGeometry(), idx = [];
  for (let i = 0; i < n; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  g.setIndex(idx); if (fill) fill(g); return g;
 }

 // ---------- the smoke tail: strands of grey-green smoke braided into one curling column (drawn first) ----------
 const TL = { S: Q(30, 12), R: Q(7, 5) };
 const tailGeo = (function () {
  const pos = [], aS = [], aA = [], aK = [], idx = [];
  for (let k = 0; k < 5; k++) {
   const b0 = pos.length / 3;
   for (let j = 0; j <= TL.S; j++) for (let i = 0; i < TL.R; i++) { pos.push(0, 0, 0); aS.push(j / TL.S); aA.push(i / TL.R * TAU); aK.push(k); }
   for (let j = 0; j < TL.S; j++) for (let i = 0; i < TL.R; i++) { const a = b0 + j * TL.R + i, b = b0 + j * TL.R + (i + 1) % TL.R; idx.push(a, b, a + TL.R, b, b + TL.R, a + TL.R); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 1)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 1)); g.setIndex(idx);
  return g;
 })();
 const tailMat = PM(`
attribute float aS; attribute float aA; attribute float aK;
uniform vec3 uDrag;
varying float vS; varying float vNd; varying float vK; varying vec3 vQ;
vec3 scen(float s, float k) {
 float t = uTime + uSeed;
 // one S-curved column of smoke whose end curls into a hook
 vec3 C = vec3(.05 * (.25 + s) * sin(s * 4.2 - t * 1.4) + .02 * s * sin(s * 9. - t * 2.1), .345 - .35 * s, -.012 + .03 * s * cos(s * 3.1 - t * 1.05));
 float ck = smoothstep(.62, 1., s); C.x += ck * ck * .045; C.y += ck * ck * .035;
 vec3 c;
 if (k < 2.5) {
  // three strands braid around it, drawing together as it goes down; the shorter two peel off as wisps
  float lk = k < .5 ? 1. : (k < 1.5 ? .78 : .6);
  float ss = s * lk;
  vec3 Cs = vec3(.05 * (.25 + ss) * sin(ss * 4.2 - t * 1.4) + .02 * ss * sin(ss * 9. - t * 2.1), .345 - .35 * ss, -.012 + .03 * ss * cos(ss * 3.1 - t * 1.05));
  float ck2 = smoothstep(.62, 1., ss); Cs.x += ck2 * ck2 * .045; Cs.y += ck2 * ck2 * .035;
  float ang = k * 2.094 + ss * 7. - t * .8;
  float pe = k > .5 ? smoothstep(.55, 1., s) : 0.;
  float rad = .03 * (1. - .7 * ss) + .012 * pe;
  c = Cs + vec3(cos(ang) * rad, .03 * pe * pe, sin(ang) * rad * .7);
 } else {
  // two short curls of smoke off the sides of the hollow
  float sd = k < 3.5 ? 1. : -1.;
  float a = s * 2.6 - .2;
  c = vec3(sd * (.075 + .06 * sin(a)), .43 - .13 * s + .02 * sin(s * 5. - t * 1.3), -.02 + .02 * cos(a + t * .7));
 }
 c += uDrag * s * s;
 if (uDis > 0.) { float a = uDis * (2. + 4. * s); c.xz = vec2(cos(a) * c.x - sin(a) * c.z, sin(a) * c.x + cos(a) * c.z) * (1. + 1.5 * uDis * s); c.y += uDis * (.25 + .35 * s); }
 return c;
}
void main() {
 float s = aS;
 vec3 c = scen(s, aK);
 vec3 T = normalize(scen(min(s + .015, 1.), aK) - scen(max(s - .015, 0.), aK) + vec3(0., -1e-5, 0.));
 vec3 rf = abs(T.z) < .9 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
 vec3 Nn = normalize(cross(T, rf)); vec3 Bn = cross(T, Nn);
 vec3 d = Nn * cos(aA) + Bn * sin(aA);
 float r0 = aK < .5 ? .056 : (aK < 1.5 ? .044 : (aK < 2.5 ? .04 : .022));
 float r = mix(r0, .004, pow(s, .7));
 vec3 p = c + d * r;
 vec4 mv = modelViewMatrix * vec4(p, 1.);
 vNd = abs(dot(normalize(normalMatrix * d), normalize(-mv.xyz)));
 vS = s; vK = aK; vQ = p;
 gl_Position = projectionMatrix * mv;
}`, `
varying float vS; varying float vNd; varying float vK; varying vec3 vQ;
void main() {
 float st = fb(vec3(vQ.x * 30., vQ.y * 7. + uTime * .55, vQ.z * 30.) + uSeed + vK * 3.1);
 vec3 cTop = pal(vec3(.36, .46, .39), vec3(.34, .41, .6));
 vec3 cBot = pal(vec3(.36, .4, .38), vec3(.34, .38, .5));
 vec3 c = mix(cTop, cBot, smoothstep(0., .7, vS)) * (.72 + .55 * st);
 float wisp = smoothstep(.25, .6, fb(vec3(vQ.x * 16., vQ.y * 34. + uTime * 1.1, vQ.z * 16.) + uSeed * .7 + vK));
 float a = smoothstep(0., .5, vNd) * (.35 + .65 * st) * (.45 + .55 * wisp) * (1. - smoothstep(.82, 1., vS)) * smoothstep(0., .08, vS) * .98;
 float dk = smoothstep(0., .4, uDis);
 vec3 light = pal(vec3(.3, .6, .36), vec3(.32, .45, .75)) * (.22 * (1. - .6 * vS) + 1.6 * dk * st * (1. - smoothstep(.5, 1., uDis))) * a;
 a *= 1. - dk;
 gl_FragColor = vec4(c * a + light, a) * uFade;
}`, { uDrag: { value: V3() } });
 const tail = addMesh(tailGeo, tailMat);

 // ---------- the flame body: a teardrop lathe tapering into a curled candle-flame tip, with the face painted by its shader ----------
 const PROF = [[.2, 0], [.212, .03], [.24, .056], [.29, .088], [.34, .106], [.385, .112], [.43, .102], [.462, .088], [.495, .098], [.535, .112], [.575, .119], [.615, .118], [.65, .11], [.68, .097], [.705, .08], [.727, .062], [.748, .048], [.772, .037], [.8, .03], [.83, .021], [.86, .013], [.89, .006], [.92, 0]];
 function profR(y) {
  const P = PROF; if (y <= P[0][0] || y >= P[P.length - 1][0]) return 0;
  let i = 0; while (y > P[i + 1][0]) i++;
  const y0 = P[i][0], y1 = P[i + 1][0], r0 = P[i][1], r1 = P[i + 1][1], h = y1 - y0, f = (y - y0) / h;
  const m0 = i > 0 ? (r1 - P[i - 1][1]) / (y1 - P[i - 1][0]) * h : r1 - r0;
  const m1 = i < P.length - 2 ? (P[i + 2][1] - r0) / (P[i + 2][0] - y0) * h : r1 - r0;
  const f2 = f * f, f3 = f2 * f;
  return Math.max(0, (2 * f3 - 3 * f2 + 1) * r0 + (f3 - 2 * f2 + f) * m0 + (-2 * f3 + 3 * f2) * r1 + (f3 - f2) * m1);
 }
 // the candle-flame tip leans to one side and hooks back
 const TIPX = (y) => .036 * Math.sin(PI * 1.3 * sm(.7, .92, y)) * sm(.7, .78, y), TIPZ = (y) => -.035 * Math.pow(sm(.62, .92, y), 2);
 const BD = { R: Q(44, 18), Y: Q(66, 26) };
 const bodyGeo = (function () {
  const pos = [], idx = [];
  for (let j = 0; j <= BD.Y; j++) {
   const y = .2 + .72 * j / BD.Y, r = profR(y), ax = TIPX(y), az = TIPZ(y);
   for (let i = 0; i < BD.R; i++) { const a = i / BD.R * TAU; pos.push(ax + Math.sin(a) * r, y, az + Math.cos(a) * r * .96); }
  }
  for (let j = 0; j < BD.Y; j++) for (let i = 0; i < BD.R; i++) { const a = j * BD.R + i, b = j * BD.R + (i + 1) % BD.R; idx.push(a, b, a + BD.R, b, b + BD.R, a + BD.R); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
 })();
 const FACE = {
  uEyeP: { value: new THREE.Vector4(.041, .566, .0205, .028) }, uEyeQ: { value: new THREE.Vector4(.3, 0, .35, 0) },
  uMouP: { value: new THREE.Vector4(.513, 1, 0, 0) }, uMouQ: { value: new THREE.Vector4(0, 0, 0, 0) },
  uSway: { value: V3() },
 };
 const bodyMat = PM(DEFORM + `
varying vec3 vP; varying vec3 vNv; varying vec3 vVv;
void main() {
 vP = position;
 vec3 p = deform(position, normal, 0.);
 vec4 mv = modelViewMatrix * vec4(p, 1.);
 vVv = mv.xyz; vNv = normalize(normalMatrix * normal);
 gl_Position = projectionMatrix * mv;
}`, `
uniform vec4 uEyeP; uniform vec4 uEyeQ; uniform vec4 uMouP; uniform vec4 uMouQ;
varying vec3 vP; varying vec3 vNv; varying vec3 vVv;
float sdTri(vec2 p, vec2 q) {
 p.x = abs(p.x);
 vec2 a = p - q * clamp(dot(p, q) / dot(q, q), 0., 1.);
 vec2 b = p - q * vec2(clamp(p.x / q.x, 0., 1.), 1.);
 float s = -sign(q.y);
 vec2 d = min(vec2(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2(dot(b, b), s * (p.y - q.y)));
 return -sqrt(d.x) * sign(d.y);
}
float sdBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main() {
 vec3 Nn = normalize(vNv); vec3 V = normalize(-vVv);
 float ndv = clamp(dot(Nn, V), 0., 1.), fr = 1. - ndv;
 vec3 P = vP; float y = P.y;
 float head = smoothstep(.41, .53, y);
 float up = smoothstep(.49, .6, y) * (1. - smoothstep(.68, .86, y));
 float tip = smoothstep(.7, .9, y);
 float st = fb(vec3(P.x * 18., y * 7. - uTime * 1.6, P.z * 18.) + uSeed);
 float st2 = fb(vec3(P.x * 34., y * 5. - uTime * .9, P.z * 34.) + uSeed * 1.3);
 vec3 cCore = pal(vec3(.97, 1., .91), vec3(.95, .98, 1.));
 vec3 cPale = pal(vec3(.74, .9, .7), vec3(.74, .85, .99));
 vec3 cRim = pal(vec3(.48, .84, .52), vec3(.48, .66, .97));
 vec3 cLow = pal(vec3(.52, .62, .54), vec3(.48, .55, .72));
 vec3 cDeep = pal(vec3(.28, .34, .3), vec3(.25, .29, .41));
 float coreK = pow(ndv, 2.2) * (.25 + .75 * up) * (1. - .3 * tip);
 vec3 col = mix(cPale, cCore, coreK);
 col = mix(col, cRim, smoothstep(.4, 1., fr) * .85);
 // painted flame strokes running up the sides of the head into the tip
 col = mix(col, cRim * .9, clamp((st2 - .4) * 2.2, 0., 1.) * (.25 + .75 * smoothstep(.1, .7, fr)) * head * .75);
 col = mix(col, cCore, clamp((.36 - st2) * 3., 0., 1.) * up * .5);
 col = mix(col, cRim, tip * .45 * (.5 + .5 * st));
 float lowK = 1. - head;
 vec3 low = mix(cDeep, cLow, smoothstep(.25, .75, st)) * (1. - .35 * uLevel);
 col = mix(col, low, lowK);
 float a = mix(.97, .74, smoothstep(.55, 1., fr));
 a = mix(a, .55 + .42 * st, lowK);
 // smoke has ragged edges
 a *= 1. - lowK * smoothstep(.5, .95, fr) * smoothstep(.3, .62, st2);
 a *= 1. - .5 * tip * smoothstep(.3, 1., fr);
 a *= smoothstep(.2, .31, y);
 vec3 light = cRim * (pow(fr, 2.5) * .35 * head + .2 * tip * st) * uGlow;
 // the face: hollow eyes slanted sadly in sunken sockets, a small dark mouth; shapes and blinks come from uniforms
 float fm = smoothstep(.03, .075, P.z);
 vec2 e = vec2(abs(P.x) - uEyeP.x, y - uEyeP.y);
 float ca = cos(uEyeQ.x), sa = sin(uEyeQ.x);
 vec2 er = vec2(ca * e.x + sa * e.y, -sa * e.x + ca * e.y);
 float de = sdE(er, uEyeP.zw);
 de = max(de, (er.y - uEyeP.w * (1. - 2. * uEyeQ.y) + uEyeQ.z * er.x) * .8);
 float aw = fwidth(de) * .75 + 1e-5;
 float eyeIn = (1. - smoothstep(-aw, aw, de)) * fm;
 float dep = clamp(-de / (min(uEyeP.z, uEyeP.w) * .9), 0., 1.);
 float vy = clamp(er.y / uEyeP.w, -1., 1.);
 vec3 eRim = pal(vec3(.4, .47, .43), vec3(.4, .45, .57));
 vec3 eyeCol = mix(eRim, vec3(.03, .04, .035), smoothstep(.02, .9, dep) * (.66 + .34 * smoothstep(-.7, .5, vy)));
 eyeCol += pal(vec3(.13, .17, .14), vec3(.13, .15, .21)) * smoothstep(-.15, -.9, vy) * (1. - smoothstep(.15, .55, dep));
 float sock = exp(-max(de, 0.) / .011) * (.3 + .3 * smoothstep(-.3, .7, vy)) * fm * (1. - eyeIn);
 // a brow shadow over each eye, sloping down to the outside
 vec2 eb = er - vec2(.12 * uEyeP.z, .48 * uEyeP.w);
 float cb = cos(.3 + uEyeQ.z * .4), sb = sin(.3 + uEyeQ.z * .4);
 float dB = sdE(vec2(cb * eb.x + sb * eb.y, -sb * eb.x + cb * eb.y), vec2(uEyeP.z * 1.22, uEyeP.w * .85));
 sock = max(sock, (1. - smoothstep(-.006, .008, dB)) * .5 * fm * (1. - eyeIn));
 // mouth: calm, a small rounded arch; hungry, wide with fangs; wailing, long and open; breath, a round O
 vec2 m = vec2(P.x, y - uMouP.x);
 float dC = .5 * (sdTri(vec2(m.x, .0145 - m.y), vec2(.02, .029)) - .005) + .5 * sdE(m + vec2(0., .006), vec2(.0175, .021));
 dC = max(dC, -(m.y + .0135 - .005 * (1. - min(1., m.x * m.x / .0004))));
 float dH = sdBox(m, vec2(.02, .0185), .008);
 float dW = sdE(m * vec2(1. + .22 * clamp(m.y / .045, -1., 1.), 1.), vec2(.02, .045));
 float dO = sdE(m, vec2(.0165, .025));
 float dm = (uMouP.y * dC + uMouP.z * dH + uMouP.w * dW + uMouQ.y * dO) / max(uMouP.y + uMouP.z + uMouP.w + uMouQ.y, 1e-3);
 float amw = fwidth(dm) * .75 + 1e-5;
 float mouIn = (1. - smoothstep(-amw, amw, dm)) * fm;
 float tw = 1. - abs(fract(m.x / .0135 + .5) * 2. - 1.), tb = 1. - abs(fract(m.x / .0135) * 2. - 1.);
 tw *= step(abs(m.x), .0165); tb *= step(abs(m.x), .011);
 float fang = uMouQ.x;
 float teeth = step(0., m.y) * (1. - smoothstep(-amw, amw, -dm - fang * .012 * tw * tw * tw)) + (1. - step(0., m.y)) * (1. - smoothstep(-amw, amw, -dm - fang * .007 * tb * tb * tb));
 mouIn *= 1. - teeth * step(.01, fang);
 float mdep = clamp(-dm / .012, 0., 1.);
 float my = clamp(m.y / .02, -1., 1.);
 vec3 mouCol = mix(eRim, vec3(.02, .03, .025), smoothstep(0., .6, mdep) * (.75 + .25 * smoothstep(-.7, .3, my)));
 mouCol += pal(vec3(.1, .13, .11), vec3(.1, .12, .17)) * smoothstep(-.2, -.9, my) * (1. - smoothstep(.2, .6, mdep));
 sock += .3 * exp(-max(dm, 0.) / .006) * fm * (1. - mouIn);
 col = mix(col, pal(vec3(.47, .6, .5), vec3(.47, .54, .72)), clamp(sock, 0., .7));
 float feat = max(eyeIn, mouIn);
 col = mix(col, eyeCol, eyeIn); col = mix(col, mouCol, mouIn);
 a = mix(a, 1., feat);
 light *= 1. - feat;
 // hurt tears holes in it; on release it unravels into light
 float keep = 1.; vec3 edge = vec3(0.);
 if (uTear + uDis > .001) {
  float er2 = fb(vec3(P.x * 26., y * 20. + uTime * .8, P.z * 26.) + uSeed * 2.);
  float cut = uTear * .5 + smoothstep(0., .75, uDis) * (1. - smoothstep(.36, .6, y)) * .9 + smoothstep(.55, 1., uDis) * 1.1;
  keep = smoothstep(cut - .06, cut + .02, er2);
  edge = cRim * (1. - keep) * smoothstep(cut - .25, cut - .06, er2) * (1.5 * uDis + uTear);
 }
 light += pal(vec3(.6, 1., .65), vec3(.65, .82, 1.)) * uDis * (.3 * head + .9 * (1. - head));
 col = mix(col, cRim * 1.1, smoothstep(0., .35, uDis) * (1. - head));
 a *= 1. - .5 * smoothstep(0., .35, uDis) * (1. - head);
 col *= .85 + .15 * uGlow;
 a *= keep;
 if (a * uFade < .03 && dot(edge, edge) < 1e-4) discard;
 gl_FragColor = vec4(col * a + light * keep + edge, a) * uFade;
}`, FACE, { depthWrite: true });
 const flame = addMesh(bodyGeo, bodyMat);

 // ---------- the glow shell: the same flame pushed out, flickering tongues of light at its edge ----------
 const shellMat = PM(DEFORM + `
varying float vF; varying float vY; varying vec3 vQ;
void main() {
 vec3 p0 = position; float y = p0.y;
 float head = smoothstep(.4, .56, y), top = smoothstep(.6, .9, y);
 float lick = vn(vec3(p0.x * 16., y * 6. - uTime * 3.4, p0.z * 16.) + uSeed + 5.);
 lick *= lick;
 vec3 p = deform(p0, normal, .006 + (.008 + .03 * top) * lick * head);
 vec4 mv = modelViewMatrix * vec4(p, 1.);
 vF = 1. - abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
 vY = y; vQ = p0;
 gl_Position = projectionMatrix * mv;
}`, `
varying float vF; varying float vY; varying vec3 vQ;
void main() {
 float f = pow(vF, 1.5);
 float fl = fb(vec3(vQ.x * 20., vY * 11. - uTime * 3., vQ.z * 20.) + uSeed);
 float k = f * smoothstep(.3, .78, fl) * 1.5 * smoothstep(.38, .52, vY) * (1. - uDis);
 gl_FragColor = vec4(pal(vec3(.45, .9, .52), vec3(.5, .72, 1.)) * k * .42 * uGlow * uFade, 0.);
}`, { uSway: FACE.uSway });
 const shell = addMesh(bodyGeo, shellMat);

 // ---------- flame tongues: camera-facing ribbons licking up the sides and back of the head into the tip ----------
 const NTG = 16, TGS = Q(12, 6);
 const tongueGeo = (function () {
  const pos = [], aS = [], aSd = [], aB = [], aT = [], idx = [];
  for (let k = 0; k < NTG; k++) {
   // spread around the sides and back, never across the face
   const crown = k < 2, side = k % 2 ? 1 : -1;
   const th = crown ? (k ? 2.2 : -2.0) + (rnd() - .5) * .3 : side * (.85 + ((k - 2) / (NTG - 2)) * 2.2) + (rnd() - .5) * .3;
   const yb = crown ? .76 + rnd() * .05 : .57 + rnd() * .15, rb = profR(yb) * .9;
   const B = [TIPX(yb) + Math.sin(th) * rb, yb, TIPZ(yb) + Math.cos(th) * rb * .96];
   const L = crown ? .15 + rnd() * .05 : .08 + rnd() * .08, W = crown ? .02 : .014 + rnd() * .01;
   const b0 = pos.length / 3, ph = rnd() * TAU;
   for (let j = 0; j <= TGS; j++) for (const sd of [-1, 1]) { pos.push(0, 0, 0); aS.push(j / TGS); aSd.push(sd); aB.push(...B); aT.push(th, L, W, ph); }
   for (let j = 0; j < TGS; j++) { const a = b0 + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
  g.setAttribute('aSd', new THREE.Float32BufferAttribute(aSd, 1)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 4)); g.setIndex(idx);
  return g;
 })();
 const tongueMat = PM(`
attribute float aS; attribute float aSd; attribute vec3 aB; attribute vec4 aT;
uniform vec3 uSway;
varying float vS; varying float vX; varying float vF;
vec3 tc(float s) {
 vec3 o = vec3(sin(aT.x), 0., cos(aT.x));
 float t = uTime * (2.2 + aT.w * .3) + aT.w;
 float crown = step(.755, aB.y);
 vec3 c = aB + vec3(0., aT.y * s, 0.) + o * (aT.y * mix(.55 * s - .2 * s * s, .25 * s - .45 * s * s, crown));
 c += vec3(sin(t + s * 4.), 0., cos(t * .8 + s * 3.)) * .026 * s * s + o * .018 * sin(s * 6.5 + t * .7) * s;
 float top = smoothstep(.62, .9, c.y); float tk = top * top;
 c.x += tk * (.03 * sin(uTime * 2.3 + uSeed) + uSway.x); c.z += tk * (.018 * sin(uTime * 1.9 + uSeed * 1.7) + uSway.y);
 if (uDis > 0.) { float k = uDis * .35; c.xz = vec2(cos(k) * c.x - sin(k) * c.z, sin(k) * c.x + cos(k) * c.z) * (1. + uDis * .3); c.y += uDis * (.06 + .15 * s); }
 return c;
}
void main() {
 float s = aS;
 vec4 mv = modelViewMatrix * vec4(tc(s), 1.);
 vec4 m1 = modelViewMatrix * vec4(tc(max(s - .06, 0.)), 1.), m2 = modelViewMatrix * vec4(tc(min(s + .06, 1.)), 1.);
 vec2 dir = normalize(m2.xy - m1.xy + vec2(1e-6, 0.));
 float sc = length(modelViewMatrix[0].xyz);
 float w = aT.z * pow(1. - s, .85) * (.55 + .45 * smoothstep(0., .25, s)) * (1. + .6 * uTear);
 mv.xy += vec2(-dir.y, dir.x) * w * aSd * sc;
 vec3 ov = normalize((modelViewMatrix * vec4(sin(aT.x), 0., cos(aT.x), 0.)).xyz);
 vF = 1. - smoothstep(.15, .85, ov.z);
 vS = s; vX = aSd;
 gl_Position = projectionMatrix * mv;
}`, `
varying float vS; varying float vX; varying float vF;
void main() {
 float e = 1. - abs(vX);
 float a = smoothstep(0., 1., e) * (1. - smoothstep(.4, 1., vS)) * smoothstep(0., .12, vS) * .55 * (.25 + .75 * vF) * (1. - uDis);
 vec3 c = mix(pal(vec3(.74, .9, .7), vec3(.74, .85, 1.)), pal(vec3(.5, .84, .54), vec3(.5, .68, .97)), vS);
 vec3 light = pal(vec3(.4, .85, .48), vec3(.46, .66, 1.)) * a * .45 * uGlow;
 gl_FragColor = vec4(c * a + light, a) * uFade;
}`, { uSway: FACE.uSway }, { side: THREE.DoubleSide });
 const tongues = addMesh(tongueGeo, tongueMat);

 // ---------- the hollow: a dark vortex at its centre, ringed with black smoke and swirling green flame ----------
 const HOL = { uHC: { value: new THREE.Vector4(0, .375, 0, .11) } };
 const hollowMat = PM(`
uniform vec4 uHC;
varying vec2 vQ;
void main() {
 vec4 mv = modelViewMatrix * vec4(uHC.xyz, 1.);
 float sc = length(modelViewMatrix[0].xyz);
 mv.xy += position.xy * uHC.w * 2.6 * sc;
 mv.z += .17 * sc;
 vQ = position.xy * 2.6;
 gl_Position = projectionMatrix * mv;
}`, `
varying vec2 vQ;
void main() {
 float r = length(vQ);
 if (r > 1.3) discard;
 float th = atan(vQ.y, vQ.x);
 float lv = uLevel, lr = log(max(r, .02));
 float n = vn(vec3(cos(th) * 2.4 + uSeed, sin(th) * 2.4, lr * 3. - uTime * .25));
 float n2 = vn(vec3(cos(th) * 6. + uSeed, sin(th) * 6., lr * 7. - uTime * .4));
 // a sawtooth spiral: each torn layer has a pale lip and darkens as it winds down into the hole
 float band = fract((th / 6.2832 * 1.6 + lr * .8 - uTime * .14) * 4. + n * 1.5 + n2 * .45);
 float lip = pow(1. - band, 2.6) * (.6 + .4 * n2);
 float rr = r + .22 * (n - .5);
 float R0 = mix(.36, .6, lv);
 float core = 1. - smoothstep(R0 * .6, R0 * 1.15, rr);
 vec3 cS = pal(vec3(.5, .57, .52), vec3(.47, .53, .66));
 float lit = .55 + .45 * dot(vQ / max(r, .001), vec2(-.6, .8));
 float out_ = smoothstep(R0 * .85, 1., rr);
 vec3 c = cS * (.22 + .78 * out_) * (.5 + .5 * lip) * (.72 + .38 * lit) * (1. - .45 * lv);
 c = mix(c, vec3(.008, .01, .009), core);
 float a = (1. - smoothstep(.68, 1.08, rr + .18 * (n2 - .5))) * mix(.92, 1., core) * (1. - smoothstep(0., .45, uDis));
 // green flame licks curling round the rim
 float stk = pow(max(0., 1. - abs(band - .1) * 7.), 3.) * smoothstep(.6, .85, r) * (1. - smoothstep(.9, 1.2, r)) * n2;
 vec3 light = pal(vec3(.45, .86, .5), vec3(.5, .7, 1.)) * stk * .5 * uGlow * (1. - uDis);
 gl_FragColor = vec4(c * a + light, a) * uFade;
}`, HOL);
 const hollow = addMesh(new THREE.PlaneGeometry(1, 1), hollowMat);

 // ---------- the tendrils: two tubes of light whose centrelines are cubic curves set every frame ----------
 const TN = { S: Q(56, 20), R: Q(7, 5) };
 const tenGeo = (function () {
  const pos = [], aS = [], aA = [], aSide = [], idx = [];
  for (let k = 0; k < 2; k++) {
   const b0 = pos.length / 3;
   for (let j = 0; j <= TN.S; j++) for (let i = 0; i < TN.R; i++) { pos.push(0, 0, 0); aS.push(j / TN.S); aA.push(i / TN.R * TAU); aSide.push(k); }
   for (let j = 0; j < TN.S; j++) for (let i = 0; i < TN.R; i++) { const a = b0 + j * TN.R + i, b = b0 + j * TN.R + (i + 1) % TN.R; idx.push(a, b, a + TN.R, b, b + TN.R, a + TN.R); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 1)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(aSide, 1)); g.setIndex(idx);
  return g;
 })();
 const TU = {
  uA0: { value: V3() }, uA1: { value: V3() }, uA2: { value: V3() }, uA3: { value: V3() },
  uB0: { value: V3() }, uB1: { value: V3() }, uB2: { value: V3() }, uB3: { value: V3() },
  uTW: { value: new THREE.Vector4(.018, 5, 0, 0) }, uCoil: { value: new THREE.Vector4(0, .9, 3, .2) },
  uPulse: { value: new THREE.Vector4(0, 0, 0, 0) }, uTRad: { value: 1 },
 };
 const TA = [TU.uA0.value, TU.uA1.value, TU.uA2.value, TU.uA3.value], TB = [TU.uB0.value, TU.uB1.value, TU.uB2.value, TU.uB3.value];
 const tenMat = PM(`
attribute float aS; attribute float aA; attribute float aSide;
uniform vec3 uA0; uniform vec3 uA1; uniform vec3 uA2; uniform vec3 uA3;
uniform vec3 uB0; uniform vec3 uB1; uniform vec3 uB2; uniform vec3 uB3;
uniform vec4 uTW; uniform vec4 uCoil; uniform float uTRad;
varying float vS; varying float vNd; varying float vSide;
vec3 tcen(float s, float side) {
 vec3 p0 = mix(uA0, uB0, side), p1 = mix(uA1, uB1, side), p2 = mix(uA2, uB2, side), p3 = mix(uA3, uB3, side);
 float u = 1. - s;
 vec3 c = u * u * u * p0 + 3. * u * u * s * p1 + 3. * u * s * s * p2 + s * s * s * p3;
 float ph = side * 2.3 + uSeed;
 float w = uTW.x * s * (.35 + .65 * s);
 c += w * vec3(sin(s * 10. - uTime * uTW.y + ph), .8 * cos(s * 7.5 - uTime * uTW.y * .8 + ph * 1.3), .6 * sin(s * 6.5 - uTime * uTW.y * 1.1 + ph * .7));
 float coil = mix(uTW.z, uTW.w, side);
 if (coil > .001) {
  float k = smoothstep(.62, .8, s) * coil;
  float th = (s - .62) * 20. * coil + side * 3.14159 + uTime * .6;
  vec3 cp = uCoil.xyz + vec3(cos(th) * uCoil.w, (.8 - s) * .45 - .05 + side * .12, sin(th) * uCoil.w);
  c = mix(c, cp, k);
 }
 return c;
}
void main() {
 float s = aS;
 vec3 c = tcen(s, aSide);
 vec3 T = normalize(tcen(min(s + .012, 1.), aSide) - tcen(max(s - .012, 0.), aSide) + vec3(0., 1e-5, 0.));
 vec3 rf = abs(T.y) < .92 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
 vec3 Nn = normalize(cross(T, rf)); vec3 Bn = cross(T, Nn);
 vec3 d = Nn * cos(aA) + Bn * sin(aA);
 float r = mix(.017, .003, pow(s, .65)) * (1. - smoothstep(.9, 1., s) * .7) * uTRad * (.72 + .56 * vn(vec3(s * 9. - uTime * 3.2, aSide * 5., uSeed)));
 vec4 mv = modelViewMatrix * vec4(c + d * r, 1.);
 vNd = abs(dot(normalize(normalMatrix * d), normalize(-mv.xyz)));
 vS = s; vSide = aSide;
 gl_Position = projectionMatrix * mv;
}`, `
uniform vec4 uPulse;
varying float vS; varying float vNd; varying float vSide;
void main() {
 float core = pow(vNd, 2.);
 vec3 cW = pal(vec3(.9, 1., .84), vec3(.92, .97, 1.));
 vec3 cG = pal(vec3(.44, .82, .48), vec3(.46, .64, .96));
 vec3 c = mix(cG, cW, core * (1. - .5 * smoothstep(.3, .9, vS)));
 float endK = 1. - smoothstep(.78, .97, vS);
 float a = smoothstep(.05, .55, vNd) * endK * .8 * (1. - uDis);
 float pp = mix(uPulse.x, uPulse.y, vSide), ps = mix(uPulse.z, uPulse.w, vSide);
 float pulse = ps * exp(-pow((vS - pp) / .07, 2.));
 vec3 light = cG * (.3 + 1.6 * pulse + uDis) * smoothstep(0., .5, vNd) * (1. - .4 * vS) * uGlow * endK;
 gl_FragColor = vec4(c * a + light, a) * uFade;
}`, TU);
 const tendrils = addMesh(tenGeo, tenMat);

 // ---------- the specks: a halo of light, leaf-shaped green flame specks and, for frost, ice shards ----------
 const NLEAF = 12, NICE = 8, NMOTE = 1 + NLEAF + NICE;
 const moteGeo = quads(NMOTE, (g) => {
  const pos = [], aP = [], aK = [];
  for (let i = 0; i < NMOTE; i++) {
   const kind = i === 0 ? 0 : i <= NLEAF ? 1 : 2, P = [.16 + rnd() * .2, .16 + rnd() * .7, (rnd() < .5 ? -1 : 1) * (.25 + rnd() * .45), rnd() * TAU];
   if (kind === 2) { P[0] = .2 + rnd() * .17; P[2] *= .7; }
   const K = [kind, kind === 1 ? .022 + rnd() * .012 : .026 + rnd() * .016, rnd() * TAU, rnd()];
   for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0], c[1], 0); aP.push(...P); aK.push(...K); }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 4));
 });
 const MO = { uMo: { value: new THREE.Vector4(1, 0, 0, 1) }, uHalo: { value: new THREE.Vector4(0, .58, 0, .42) }, uHaloI: { value: .3 } };
 const moteMat = PM(`
attribute vec4 aP; attribute vec4 aK;
uniform vec4 uMo; uniform vec4 uHalo;
varying vec2 vC; varying float vKind; varying float vAl;
void main() {
 float kind = aK.x;
 vec3 c; float size = aK.y * uMo.w; float rot = aK.z; float al = 1.;
 if (kind < .5) { c = uHalo.xyz; size = uHalo.w; rot = 0.; }
 else {
  float ang = aP.w + uMo.y * aP.z;
  float rad = aP.x * uMo.x;
  float h = aP.y + .03 * sin(uTime * 1.3 + aP.w * 3.) + uMo.z * (aP.y - .2);
  c = vec3(cos(ang) * rad, h, sin(ang) * rad);
  rot += .5 * sin(uTime * 1.7 + aP.w * 5.);
  al = .55 + .45 * sin(uTime * (2.5 + aK.w * 3.) + aK.w * 20.);
  al *= kind < 1.5 ? 1. - uFrost : uFrost;
 }
 vec4 mv = modelViewMatrix * vec4(c, 1.);
 float sc = length(modelViewMatrix[0].xyz);
 float cr = cos(rot), sr = sin(rot);
 mv.xy += vec2(cr * position.x - sr * position.y, sr * position.x + cr * position.y) * size * sc;
 vC = position.xy; vKind = kind; vAl = al;
 gl_Position = projectionMatrix * mv;
}`, `
uniform float uHaloI;
varying vec2 vC; varying float vKind; varying float vAl;
void main() {
 if (vKind < .5) {
  float r2 = dot(vC, vC);
  float g = exp(-r2 * 5.) * (1. - smoothstep(.6, 1., r2));
  gl_FragColor = vec4(pal(vec3(.42, .95, .5), vec3(.48, .7, 1.)) * g * uHaloI * uFade, 0.);
  return;
 }
 if (vKind < 1.5) {
  float d = max(length(vC - vec2(.55, 0.)) - .82, length(vC + vec2(.55, 0.)) - .82);
  float aw = fwidth(d) + 1e-4;
  float m = 1. - smoothstep(-aw, aw, d);
  float core = 1. - smoothstep(-.25, 0., d);
  vec3 c = mix(pal(vec3(.6, .95, .45), vec3(.7, .85, 1.)), vec3(.96, 1., .86), core * .7);
  gl_FragColor = vec4(c * m * 1.1, m * .4) * vAl * uFade;
  return;
 }
 float d = abs(vC.x) / .34 + abs(vC.y) - 1.;
 float aw = fwidth(d) + 1e-4;
 float m = 1. - smoothstep(-aw, aw, d);
 vec3 c = mix(vec3(.55, .72, .98), vec3(.93, .97, 1.), vC.x < 0. ? .85 : .3) + (1. - smoothstep(0., .08, abs(vC.x))) * .25;
 gl_FragColor = vec4(c * m, m * .55) * vAl * uFade;
}`, MO);
 const motes = addMesh(moteGeo, moteMat);

 // ---------- its light on the ground ----------
 const GG = { uGI: { value: .3 } };
 const groundMat = PM(`
varying vec2 vC;
void main() { vC = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x * .6, .004, -position.y * .6, 1.); }`, `
uniform float uGI;
varying vec2 vC;
void main() { float r2 = dot(vC, vC) * 4.; gl_FragColor = vec4(pal(vec3(.35, .85, .45), vec3(.42, .62, 1.)) * exp(-r2 * 2.2) * (1. - smoothstep(.6, 1., r2)) * uGI * uFade, 0.); }`, GG);
 const ground = addMesh(new THREE.PlaneGeometry(1, 1), groundMat, root, 1.5);

 // ---------- effects in world space: one mesh of camera-facing particles of many kinds ----------
 // kinds: 0 glow, 1 leaf speck, 2 ice shard, 3 snowflake, 4 frost puff, 5 torn flake, 6 sound ring, 7 moth, 8 soul-fire spark
 const NP = 160, NSLOT = 8;
 const fPos = new Float32Array(NP * 12), fCol = new Float32Array(NP * 16), fPar = new Float32Array(NP * 16), fX = new Float32Array(NP * 8), fC = new Float32Array(NP * 8);
 for (let i = 0; i < NP; i++) fC.set([-1, -1, 1, -1, 1, 1, -1, 1], i * 8);
 const fxGeo = quads(NP, (g) => {
  g.setAttribute('position', new THREE.BufferAttribute(fPos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aC', new THREE.BufferAttribute(fC, 2));
  g.setAttribute('aCol', new THREE.BufferAttribute(fCol, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aPar', new THREE.BufferAttribute(fPar, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aX', new THREE.BufferAttribute(fX, 2).setUsage(THREE.DynamicDrawUsage));
 });
 const fxMat = PM(`
attribute vec2 aC; attribute vec4 aCol; attribute vec4 aPar; attribute vec2 aX;
varying vec2 vC; varying vec4 vCol; varying vec4 vPar; varying vec2 vX;
void main() {
 vec4 mv = modelViewMatrix * vec4(position, 1.);
 float cr = cos(aPar.z), sr = sin(aPar.z);
 mv.xy += vec2(cr * aC.x - sr * aC.y, sr * aC.x + cr * aC.y) * aPar.y;
 vC = aC; vCol = aCol; vPar = aPar; vX = aX;
 gl_Position = projectionMatrix * mv;
}`, `
varying vec2 vC; varying vec4 vCol; varying vec4 vPar; varying vec2 vX;
void main() {
 float k = vPar.x; vec2 p = vC; float m = 0.;
 vec3 col = vCol.rgb;
 if (k < .5) {
  float r2 = dot(p, p); m = exp(-r2 * 4.) * (1. - smoothstep(.7, 1., r2));
  col = mix(col, vec3(1.), exp(-r2 * 30.) * .5);
 } else if (k < 1.5) {
  float d = max(length(p - vec2(.55, 0.)) - .82, length(p + vec2(.55, 0.)) - .82);
  float aw = fwidth(d) + 1e-4; m = 1. - smoothstep(-aw, aw, d);
  col = mix(col, vec3(1.), (1. - smoothstep(-.25, 0., d)) * .5);
 } else if (k < 2.5) {
  float d = abs(p.x) / .34 + abs(p.y) - 1.;
  float aw = fwidth(d) + 1e-4; m = 1. - smoothstep(-aw, aw, d);
  col *= p.x < 0. ? 1.15 : .72;
  col += (1. - smoothstep(0., .08, abs(p.x))) * .25;
 } else if (k < 3.5) {
  float r = length(p); float a = atan(p.y, p.x);
  float sec = 1.0472;
  a = mod(a + sec * .5, sec) - sec * .5;
  vec2 q = vec2(cos(a), abs(sin(a))) * r;
  float arm = (1. - smoothstep(.025, .06, q.y)) * (1. - smoothstep(.86, .92, q.x));
  float br = 0.;
  for (int i = 1; i <= 3; i++) {
   vec2 b = q - vec2(float(i) * .22, 0.);
   vec2 bd = vec2(.5, .866); float tt = clamp(dot(b, bd), 0., .3 - float(i) * .06);
   br = max(br, 1. - smoothstep(.02, .05, length(b - bd * tt)));
  }
  m = max(arm, br) + exp(-r * r * 40.) * .6;
 } else if (k < 4.5) {
  float r2 = dot(p, p);
  float n = vn(vec3(p * 2.6, vX.x * 7.)) + .5 * vn(vec3(p * 5.3, vX.x * 3. + 1.7));
  m = exp(-r2 * 2.6) * smoothstep(.2, .9, n) * (1. - smoothstep(.75, 1., r2));
 } else if (k < 5.5) {
  float n = vn(vec3(p * 3., vX.x * 5.));
  float d = max(abs(p.x) * 1.4, abs(p.y) * .9) + .45 * (n - .5) - .6;
  float aw = fwidth(d) + 1e-4; m = 1. - smoothstep(-aw, aw, d);
 } else if (k < 6.5) {
  float r = length(p);
  float w = vX.y;
  m = exp(-pow((r - .88) / w, 2.)) + .4 * exp(-pow((r - .72) / (w * .7), 2.));
  m *= .5 + .5 * abs(cos(atan(p.y, p.x)));
 } else if (k < 7.5) {
  float fl = max(vX.y, .1);
  vec2 q = vec2(abs(p.x) / fl, p.y);
  vec2 f1 = q - vec2(.45, .16); float c1 = cos(.45), s1 = sin(.45);
  float dw = sdE(vec2(c1 * f1.x + s1 * f1.y, -s1 * f1.x + c1 * f1.y), vec2(.44, .28));
  vec2 f2 = q - vec2(.33, -.22); float c2 = cos(-.5), s2 = sin(-.5);
  dw = min(dw, sdE(vec2(c2 * f2.x + s2 * f2.y, -s2 * f2.x + c2 * f2.y), vec2(.3, .2)));
  float wing = 1. - smoothstep(-.03, .03, dw);
  float spot = exp(-dot(q - vec2(.52, .2), q - vec2(.52, .2)) * 60.);
  float bodyM = 1. - smoothstep(-.02, .02, sdE(p, vec2(.06, .34)));
  m = max(wing * (.85 - .25 * spot), bodyM);
  col = mix(col, vec3(1.), bodyM * .4);
 } else {
  float r2 = dot(p, p);
  float n = vn(vec3(p * 4. + vec2(0., -vX.y * 7.), vX.x));
  m = exp(-r2 * 3.2) * (.65 + .7 * n);
  col = mix(col, vec3(1.), exp(-r2 * 16.));
 }
 m = clamp(m, 0., 1.5);
 gl_FragColor = vec4(col * m * (vCol.a + vPar.w), min(1., m * vPar.w));
}`, null, { depthTest: false });
 const fxMesh = addMesh(fxGeo, fxMat, fx, 3);
 fxMesh.visible = false;

 // particle state
 const pl = new Float32Array(NP), pm = new Float32Array(NP), pk = new Float32Array(NP), pX = new Float32Array(NP * 3), pV = new Float32Array(NP * 3);
 const pS0 = new Float32Array(NP), pS1 = new Float32Array(NP), pR = new Float32Array(NP), pVR = new Float32Array(NP), pRGB = new Float32Array(NP * 3);
 const pLi = new Float32Array(NP), pPa = new Float32Array(NP), pDr = new Float32Array(NP), pGr = new Float32Array(NP), pSd = new Float32Array(NP);
 const pMode = new Uint8Array(NP), pAux = new Float32Array(NP * 4), pFi = new Float32Array(NP), pFo = new Float32Array(NP);
 let pNext = NSLOT, pAlive = 0, fxDirty = false;
 function put(i, x, y, z, kind, size, rot, r, g, b, light, paint, s0, s1) {
  for (let v = 0; v < 4; v++) {
   const j = i * 4 + v;
   fPos[j * 3] = x; fPos[j * 3 + 1] = y; fPos[j * 3 + 2] = z;
   fCol[j * 4] = r; fCol[j * 4 + 1] = g; fCol[j * 4 + 2] = b; fCol[j * 4 + 3] = light;
   fPar[j * 4] = kind; fPar[j * 4 + 1] = size; fPar[j * 4 + 2] = rot; fPar[j * 4 + 3] = paint;
   fX[j * 2] = s0; fX[j * 2 + 1] = s1;
  }
  fxDirty = true;
 }
 function hide(i) { if (fPar[i * 16 + 1] === 0) return; for (let v = 0; v < 4; v++) fPar[(i * 4 + v) * 4 + 1] = 0; fxDirty = true; }
 // o: { k kind, p [x,y,z], v [vx,vy,vz], life, s0, s1, c [r,g,b], li, pa, dr, gr, rot, vr, mode, aux, fi, fo }
 function emit(o) {
  let i = -1;
  for (let n = 0; n < NP - NSLOT; n++) { const j = NSLOT + (pNext - NSLOT + n) % (NP - NSLOT); if (pl[j] <= 0) { i = j; break; } }
  if (i < 0) i = pNext;
  pNext = NSLOT + (i - NSLOT + 1) % (NP - NSLOT);
  if (pl[i] <= 0) pAlive++;
  pl[i] = pm[i] = o.life; pk[i] = o.k;
  pX[i * 3] = o.p[0]; pX[i * 3 + 1] = o.p[1]; pX[i * 3 + 2] = o.p[2];
  const v = o.v || [0, 0, 0]; pV[i * 3] = v[0]; pV[i * 3 + 1] = v[1]; pV[i * 3 + 2] = v[2];
  pS0[i] = o.s0; pS1[i] = o.s1 === undefined ? o.s0 : o.s1; pR[i] = o.rot === undefined ? rnd() * TAU : o.rot; pVR[i] = o.vr || 0;
  pRGB[i * 3] = o.c[0]; pRGB[i * 3 + 1] = o.c[1]; pRGB[i * 3 + 2] = o.c[2];
  pLi[i] = o.li || 0; pPa[i] = o.pa || 0; pDr[i] = o.dr || 0; pGr[i] = o.gr || 0; pSd[i] = rnd();
  pMode[i] = o.mode || 0; pFi[i] = o.fi === undefined ? .12 : o.fi; pFo[i] = o.fo === undefined ? .5 : o.fo;
  const a = o.aux || [0, 0, 0, 0]; pAux[i * 4] = a[0]; pAux[i * 4 + 1] = a[1]; pAux[i * 4 + 2] = a[2]; pAux[i * 4 + 3] = a[3];
  return i;
 }
 function clearFx() { for (let i = 0; i < NP; i++) { pl[i] = 0; hide(i); } pAlive = 0; }

 // ---------- looks: palettes for effects ----------
 const COL = {
  green: [.55, .95, .55], pale: [.85, 1, .8], dark: [.16, .2, .17], smoke: [.3, .35, .32],
  ice: [.75, .88, 1], frostW: [.92, .96, 1], mist: [.84, .91, 1], shard: [.62, .78, .98], ring: [.8, 1, .82], moth: [1, .98, .92],
 };
 const tint = (g, f) => { const k = U.uFrost.value; return [lerp(g[0], f[0], k), lerp(g[1], f[1], k), lerp(g[2], f[2], k)]; };

 // ---------- poses: a flat set of numbers blended between the idle and each action's keys ----------
 const PK = ['x', 'y', 'z', 'lean', 'roll', 'yaw', 'sc', 'sx', 'sy', 'glow', 'flick', 'tear', 'dis', 'fade', 'eH', 'eW', 'mO', 'shut', 'tRaise', 'tTuck', 'tFlail', 'tBack', 'tFling', 'tReach', 'tCoil', 'tLimp', 'wave', 'spread', 'swirl', 'shake', 'bob'];
 const REST = { x: 0, y: 0, z: 0, lean: 0, roll: 0, yaw: 0, sc: 1, sx: 1, sy: 1, glow: 1, flick: 0, tear: 0, dis: 0, fade: 1, eH: 0, eW: 0, mO: 0, shut: 0, tRaise: 0, tTuck: 0, tFlail: 0, tBack: 0, tFling: 0, tReach: 0, tCoil: 0, tLimp: 0, wave: 1, spread: 1, swirl: 1, shake: 0, bob: 1 };
 const mk = () => Object.assign({}, REST);
 const cp = (d, s) => { for (const k of PK) d[k] = s[k]; return d; };
 const mixP = (d, s, w) => { if (w > 0) for (const k of PK) d[k] += (s[k] - d[k]) * w; return d; };
 const ACTS = {};
 function act(name, dur, keys, o) {
  ACTS[name] = Object.assign({ dur, keys: keys.map((k) => [k[0], Object.assign(mk(), k[1])]), hits: [], cues: [], hold: false, interrupt: false, bi: .12, bo: .2, dash: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const K = def.keys; let i = 0;
  while (i < K.length - 2 && u > K[i + 1][0]) i++;
  const a = K[i][1], b = K[i + 1][1], f = sm(K[i][0], K[i + 1][0], u);
  for (const k of PK) out[k] = a[k] + (b[k] - a[k]) * f;
  return out;
 }
 const H = { eH: 1 };
 const with_ = (a, b) => Object.assign({}, a, b);
 // flicker: draws back, darts forward and flings a spark of soul-fire that lands at 0.6
 act('flicker', 1.3, [[0, {}],
  [.18, with_(H, { lean: -.18, y: .02, z: -.03, tBack: .7, sy: 1.05, bob: .3 })],
  [.3, with_(H, { lean: -.24, y: .02, z: -.04, tBack: 1, sy: 1.07, glow: 1.15, bob: .2 })],
  [.4, with_(H, { lean: .62, z: .06, tFling: 1, sy: 1.14, sx: .92, glow: 1.25, bob: .2 })],
  [.52, with_(H, { lean: .5, z: .04, tFling: .85, sy: 1.08, sx: .96, bob: .3 })],
  [.75, { lean: .12, eH: .6, tFling: .2, bob: .7 }], [1, {}]],
 { hits: [.6], dash: (u) => 2.4 * win(u, .3, .44, .03) - .7 * win(u, .62, .92, .05) });
 // cling: its tendrils lash out, wrap the target and pull its light back in three pulls
 act('cling', 2.6, [[0, {}],
  [.1, with_(H, { lean: -.14, y: .03, tBack: .8, sy: 1.05, bob: .3 })],
  [.22, with_(H, { lean: .26, z: .04, tReach: 1, sy: 1.08, sx: .95, glow: 1.15, bob: .2 })],
  [.32, with_(H, { lean: .18, tReach: 1, tCoil: 1, bob: .3 })],
  [.5, with_(H, { lean: .1, tReach: 1, tCoil: 1, glow: 1.35, sc: 1.04, bob: .3 })],
  [.59, with_(H, { lean: .14, tReach: 1, tCoil: 1, glow: 1.1, bob: .3 })],
  [.68, with_(H, { lean: .1, tReach: 1, tCoil: 1, glow: 1.4, sc: 1.06, bob: .3 })],
  [.77, with_(H, { lean: .14, tReach: 1, tCoil: 1, glow: 1.15, bob: .3 })],
  [.86, with_(H, { lean: .08, tReach: .9, tCoil: 1, glow: 1.5, sc: 1.08, bob: .3 })],
  [.93, { eH: .5, tReach: .1, lean: -.05, glow: 1.2, sc: 1.03 }], [1, {}]],
 { hits: [.42, .6, .78], cues: [.5, .68, .86], dash: (u) => 1.6 * win(u, .12, .24, .03) - .55 * win(u, .88, .99, .03) });
 // gutter: shrinks almost to nothing to dodge, then flares back
 act('gutter', 1.5, [[0, {}],
  [.1, { sc: .9, sy: .9, shut: .6, tTuck: .5, glow: .9, bob: .5 }],
  [.36, { sc: .3, y: -.11, lean: -.1, glow: .5, flick: 1, shut: 1, tTuck: 1, spread: .45, wave: .3, bob: .2 }],
  [.6, { sc: .27, y: -.12, lean: -.12, glow: .42, flick: 1, shut: 1, tTuck: 1, spread: .4, wave: .3, bob: .2 }],
  [.72, { sc: 1.22, y: .02, glow: 2.1, sy: 1.12, spread: 1.6, swirl: 2.5, tRaise: .45, bob: .4 }],
  [.85, { sc: .97, glow: 1.2, bob: .8 }], [1, {}]],
 { cues: [.53] });
 // wail: mouth wide and tendrils raised; rings of sound reach the party at 0.52
 act('wail', 1.8, [[0, {}],
  [.16, { y: .02, lean: -.08, sy: 1.04, eW: .6, mO: .2, tRaise: .55, bob: .5 }],
  [.27, { y: .04, lean: -.15, sy: 1.12, sx: .95, eW: 1, tRaise: 1, glow: 1.3, shake: 1, bob: .2 }],
  [.7, { y: .04, lean: -.12, sy: 1.1, sx: .96, eW: 1, tRaise: 1, glow: 1.25, shake: 1, bob: .2 }],
  [.85, { eW: .35, tRaise: .3, bob: .7 }], [1, {}]],
 { hits: [.52] });
 // breath (the frost variant's): breathes in, then out a plume of frost that reaches the party at 0.55
 act('breath', 2.0, [[0, {}],
  [.2, { lean: -.2, y: .03, sy: 1.08, sx: 1.06, eW: .25, mO: .35, tBack: .7, glow: 1.15, bob: .4 }],
  [.3, { lean: .14, z: .04, sy: .97, mO: 1, tBack: 1, eW: .15, bob: .3 }],
  [.72, { lean: .1, z: .03, mO: 1, tBack: .9, eW: .1, bob: .3 }],
  [.86, { mO: .2, bob: .8 }], [1, {}]],
 { hits: [.55] });
 // hurt: torn and guttering, flakes of it breaking off
 act('hurt', .6, [[0, {}],
  [.1, { lean: -.34, roll: .14, sx: 1.12, sy: .86, tear: 1, glow: .6, flick: 1, eW: 1, tFlail: 1, shake: .6, bob: .2 }],
  [.38, { lean: -.16, roll: -.08, sx: .96, sy: 1.05, tear: .55, glow: 1.3, flick: .6, eW: 1, tFlail: .55, bob: .4 }],
  [1, {}]],
 { interrupt: true, bi: .05, bo: .2, dash: (u) => (u < .3 ? -1.4 * Math.sin(PI * u / .3) : 0) });
 // block: a flinch
 act('block', .45, [[0, {}], [.25, { lean: -.18, sx: 1.08, sy: .9, shut: 1, tTuck: .8, glow: .85, bob: .4 }], [1, {}]],
 { interrupt: true, bi: .05, bo: .2, dash: (u) => (u < .35 ? -.9 * Math.sin(PI * u / .35) : 0) });
 // appear: it gathers out of a few motes
 act('appear', 1.5, [[0, { sc: .04, fade: 0, glow: 2, spread: 3.2, swirl: 3, tTuck: 1, wave: .3, shut: 1 }],
  [.38, { sc: .12, fade: .5, glow: 2.2, spread: 1.6, swirl: 2.5, tTuck: 1, wave: .3, shut: 1 }],
  [.6, { sc: 1.12, fade: 1, glow: 1.8, sy: 1.1, spread: 1.05, tRaise: .3 }],
  [.8, { sc: .97, glow: 1.15 }], [1, {}]],
 { bi: .01, bo: .15 });
 // die: released, not killed. It unravels into soft swirling light, a pale moth rises out of it, and it fades away
 act('die', 3.0, [[0, {}],
  [.14, { lean: -.06, sy: 1.04, glow: 1.2, shut: .25, tLimp: .3, bob: .4 }],
  [.32, { y: .05, sy: 1.12, dis: .25, glow: 1.3, shut: .2, tLimp: .7, spread: 1.4, swirl: 2, bob: .3 }],
  [.6, { y: .12, sy: 1.25, dis: .62, glow: 1.4, fade: .85, shut: .3, tLimp: 1, spread: 2, swirl: 3, bob: .2 }],
  [.85, { y: .2, sy: 1.35, dis: .95, glow: 1.6, fade: .3, tLimp: 1, spread: 2.6, swirl: 3.5, bob: 0 }],
  [1, { y: .24, sy: 1.4, dis: 1, glow: 1.4, fade: 0, tLimp: 1, spread: 3, swirl: 3.5, bob: 0 }]],
 { hold: true, bi: .15 });

 // ---------- the face's three expressions ----------
 const EXP = {
  calm: { ex: .04, ey: .58, ew: .0225, eh: .031, tilt: .4, cut: 0, slope: .3, my: .527, fang: 0 },
  hungry: { ex: .041, ey: .577, ew: .0235, eh: .022, tilt: .2, cut: .22, slope: -.26, my: .525, fang: 1 },
  wail: { ex: .041, ey: .59, ew: .0185, eh: .037, tilt: .62, cut: 0, slope: .45, my: .51, fang: .4 },
  open: { my: .519 },
 };
 const XK = ['ex', 'ey', 'ew', 'eh', 'tilt', 'cut', 'slope', 'my', 'fang'], XP = {};

 // ---------- tendril poses (for the +X tendril; the -X one is mirrored) ----------
 const TP = {
  rest: [[.08, .47, 0], [.19, .49, .035], [.31, .29, .05], [.265, .375, .065]],
  raise: [[.08, .48, -.005], [.19, .52, -.01], [.33, .5, .01], [.33, .63, .04]],
  tuck: [[.08, .46, .02], [.13, .42, .1], [.07, .345, .135], [-.025, .375, .125]],
  flail: [[.08, .48, -.01], [.16, .54, -.07], [.25, .58, -.17], [.3, .49, -.23]],
  back: [[.08, .47, -.005], [.15, .45, -.09], [.21, .43, -.17], [.17, .51, -.21]],
  limp: [[.08, .45, .01], [.13, .4, .03], [.17, .26, .05], [.135, .19, .06]],
 };
 const _d = V3(), _n = V3(), _a = V3(), _b = V3(), _c = V3();
 let flingSide = 0;
 function tendrilPose(side, F, tm, tLoc) {
  const sg = side ? 1 : -1, P = side ? TB : TA, fl = side === flingSide;
  for (let k = 0; k < 4; k++) {
   const r = TP.rest[k];
   let x = r[0], y = r[1], z = r[2];
   if (k >= 2) { y += .018 * Math.sin(tm * 1.7 + side * 2 + k) * F.wave; x += .012 * Math.sin(tm * 1.3 + side + k * .7) * F.wave; }
   const add = (pose, w) => { if (w > 1e-4) { x += (pose[k][0] - r[0]) * w; y += (pose[k][1] - r[1]) * w; z += (pose[k][2] - r[2]) * w; } };
   add(TP.raise, F.tRaise); add(TP.tuck, F.tTuck); add(TP.flail, F.tFlail); add(TP.back, F.tBack + (fl ? 0 : F.tFling * .7)); add(TP.limp, F.tLimp);
   if (F.tRaise > 0 && k >= 2) y += .02 * Math.sin(tm * 13 + side * 2) * F.tRaise * F.shake;
   P[k].set(x * sg, y, z);
  }
  _d.set(tLoc.x, 0, tLoc.z); const dist = Math.max(.3, _d.length()); _d.multiplyScalar(1 / dist);
  if (fl && F.tFling > 1e-4) {
   const w = F.tFling;
   _a.copy(P[0]).addScaledVector(_d, .12); _a.y += .03;
   _b.set(0, .5, 0).addScaledVector(_d, .3); _b.x += sg * .03;
   _c.set(0, .53, 0).addScaledVector(_d, .47);
   P[1].lerp(_a, w); P[2].lerp(_b, w); P[3].lerp(_c, w);
  }
  if (F.tReach > 1e-4) {
   const w = F.tReach;
   _n.set(_d.z, 0, -_d.x).multiplyScalar(sg);
   _a.copy(P[0]).addScaledVector(_d, .22 * dist).addScaledVector(_n, .3 + .12 * dist); _a.y += .35 + .08 * dist;
   _b.copy(tLoc).addScaledVector(_d, -.28 * dist).addScaledVector(_n, -.18 - .08 * dist); _b.y += .3 + .1 * dist;
   P[1].lerp(_a, Math.pow(w, 1.4)); P[2].lerp(_b, Math.pow(w, 1.1)); P[3].lerp(tLoc, Math.pow(w, .7));
  }
 }
 // the same curve as the tendril shader, for anchors and for light that travels along it
 function tcen(side, s, out) {
  const P = side ? TB : TA, u = 1 - s, b0 = u * u * u, b1 = 3 * u * u * s, b2 = 3 * u * s * s, b3 = s * s * s;
  let x = b0 * P[0].x + b1 * P[1].x + b2 * P[2].x + b3 * P[3].x, y = b0 * P[0].y + b1 * P[1].y + b2 * P[2].y + b3 * P[3].y, z = b0 * P[0].z + b1 * P[1].z + b2 * P[2].z + b3 * P[3].z;
  const W = TU.uTW.value, tm = U.uTime.value, ph = side * 2.3 + U.uSeed.value, w = W.x * s * (.35 + .65 * s);
  x += w * Math.sin(s * 10 - tm * W.y + ph); y += w * .8 * Math.cos(s * 7.5 - tm * W.y * .8 + ph * 1.3); z += w * .6 * Math.sin(s * 6.5 - tm * W.y * 1.1 + ph * .7);
  const coil = side ? W.w : W.z;
  if (coil > .001) {
   const C = TU.uCoil.value, k = sm(.62, .8, s) * coil, th = (s - .62) * 20 * coil + side * PI + tm * .6;
   x += (C.x + Math.cos(th) * C.w - x) * k; y += (C.y + (.8 - s) * .45 - .05 + side * .12 - y) * k; z += (C.z + Math.sin(th) * C.w - z) * k;
  }
  return out.set(x, y, z);
 }

 // ---------- state, animation, effects ----------
 const BP = mk(), AP = mk(), AP2 = mk(), FIN = mk(), SNAP = mk();
 const TS = { tReach: 0, tCoil: 0, tFling: 0 }, TSK = Object.keys(TS);
 let dbgExpr = null;
 let actv = null, gOn = false, gW = 0, dashV = 0, liftV = .3, fadeE = 1, prevU = 0, rbT = 0, clock = 0, orbT = 0;
 let frostV = state.frost, blinkIn = 3.2 + rnd() * 3, blinkT = -1, noBlink = false;
 const PH = [rnd() * TAU, rnd() * TAU, rnd() * TAU, rnd() * TAU, rnd() * TAU];
 const mv = { init: false, px: 0, pz: 0, vx: 0, vz: 0, dx: 0, dz: 0, lean: 0, ph: 0 };
 const FXS = { launched: false, landed: false, from: V3(), sparkP: V3(), mothP: V3(), mothFrom: null, sparkOn: false, rings: [], burst: false, flare: false, smoke: 0, acc: 0, sp: 0, st: 0 };
 const _p = V3(), _q = V3(), _tw = V3(), _tl = V3(), _hc = V3();

 function targetWorld(out) { const T = state.target || {}; return out.set(+T.x || 0, T.y === undefined ? .9 : +T.y, +T.z || 0); }
 function L2W(x, y, z, out) { return inner.localToWorld(out.set(x, y, z)); }

 function onStart(name) {
  FXS.launched = FXS.landed = FXS.sparkOn = FXS.burst = FXS.flare = false; FXS.mothFrom = null; FXS.rings.length = 0; FXS.acc = FXS.smoke = FXS.sp = FXS.st = 0;
  for (let i = 0; i < NSLOT; i++) hide(i);
  root.updateMatrixWorld(true);
  inner.worldToLocal(targetWorld(_tl));
  flingSide = _tl.x < 0 ? 0 : 1;
  if (name === 'appear') {
   // a few motes drift in from around it and gather where it will be
   for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, r = .55 + rnd() * .55, h = .15 + rnd() * .85;
    L2W(Math.cos(a) * r, h, Math.sin(a) * r, _p);
    emit({ k: i % 3 ? 1 : 0, p: [_p.x, _p.y, _p.z], life: .5 + rnd() * .2, s0: i % 3 ? .06 : .09, s1: .03, c: tint(COL.green, COL.ice), li: 1.3, pa: .3, mode: 2, aux: [_p.x, _p.y, _p.z, rnd() * TAU], fi: .2, fo: .3 });
   }
  }
 }

 function basePose(t, walk) {
  cp(BP, REST);
  BP.lean = -.05 + .19 * walk; BP.tBack = .35 * walk;
  if (gW > .001) { BP.tTuck = .7 * gW; BP.sc = 1 - .06 * gW; BP.lean -= .06 * gW; BP.eH = .4 * gW; }
 }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  clock += dt; const tm = clock % 600;
  U.uTime.value = tm;
  walk = cl(walk || 0, 0, 1);
  gW += ((gOn ? 1 : 0) - gW) * (1 - Math.exp(-(dt || .016) * 8));
  frostV += (cl(+state.frost || 0, 0, 1) - frostV) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 1);
  const lvl = cl(((+state.level || 1) - 1) / 19, 0, 1);
  U.uFrost.value = frostV; U.uLevel.value = lvl;

  // its own motion: the bench or the game moves the root; the wisp leans into it and its tail streams behind
  root.updateMatrixWorld();
  const rx = root.position.x, rz = root.position.z;
  if (!mv.init || Math.hypot(rx - mv.px, rz - mv.pz) > 1.5) { mv.px = rx; mv.pz = rz; mv.vx = mv.vz = 0; mv.init = true; }
  if (dt > 0) { const k = 1 - Math.exp(-dt * 8); mv.vx += ((rx - mv.px) / dt - mv.vx) * k; mv.vz += ((rz - mv.pz) / dt - mv.vz) * k; }
  mv.px = rx; mv.pz = rz;
  const ry = root.rotation.y, cy = Math.cos(ry), sy = Math.sin(ry);
  const vfwd = mv.vx * sy + mv.vz * cy, vside = mv.vx * cy - mv.vz * sy;
  if (dt > 0) { const k = 1 - Math.exp(-dt * 5); mv.dx += (cl(-vside * .05, -.12, .12) - mv.dx) * k; mv.dz += (cl(-vfwd * .06, -.14, .14) - mv.dz) * k; mv.lean += (cl(vfwd * .09, -.25, .3) - mv.lean) * k; }

  // poses
  basePose(tm, walk);
  let u = 0, def = null, name = '';
  if (actv) { actv.t += dt; def = actv.def; name = actv.name; u = Math.min(1, actv.t / def.dur); if (u >= 1 && !def.hold) { actv = null; def = null; name = ''; u = 0; } }
  if (def) {
   evalKeys(def, u, AP);
   cp(AP2, SNAP); mixP(AP2, AP, sm(0, def.bi, actv.t));
   const W = def.hold ? 1 : 1 - sm(def.dur - def.bo, def.dur, actv.t);
   cp(FIN, BP); mixP(FIN, AP2, W);
   dashV = def.dash ? def.dash(u) * W : 0;
  } else {
   if (rbT > 0) { rbT -= dt; cp(FIN, SNAP); mixP(FIN, BP, 1 - Math.max(0, rbT) / .2); } else cp(FIN, BP);
   dashV = 0;
  }
  const F = FIN;
  if (dbgExpr) { F.eH = dbgExpr[0]; F.eW = dbgExpr[1]; F.mO = dbgExpr[2] || 0; }

  // the body: bob, sway, lean, squash and the level's size
  const bobK = F.bob, shk = F.shake;
  const bob = (.022 * Math.sin(tm * 1.6 + PH[0]) + .007 * Math.sin(tm * 3.7 + PH[1])) * bobK;
  const lvS = 1 + .12 * lvl, S = F.sc * lvS;
  body.position.set(F.x + shk * .006 * Math.sin(tm * 47), PIV + F.y + bob, F.z);
  root.worldToLocal(targetWorld(_hc));
  const phT = actv ? Math.atan2(_hc.x, _hc.z) : 0;
  if (dt > 0) mv.ph += (cl(phT, -1.5, 1.5) - mv.ph) * (1 - Math.exp(-dt * 10));
  const lean = F.lean, cph = Math.cos(mv.ph), sph = Math.sin(mv.ph);
  body.rotation.set(lean * cph + mv.lean + .03 * Math.sin(tm * .9 + PH[2]) * bobK, F.yaw, F.roll - lean * sph + .045 * Math.sin(tm * 1.1 + PH[3]) * bobK + shk * .04 * Math.sin(tm * 39), 'YXZ');
  body.scale.set(S * F.sx, S * F.sy, S * F.sx);
  body.updateMatrixWorld(true);
  liftV = Math.max(0, .3 * S + F.y + bob);

  // glow and flicker, tearing, unravelling, fade
  const flick = 1 + .05 * Math.sin(tm * 11 + PH[4]) + .04 * Math.sin(tm * 17.3) + F.flick * (.35 * Math.sin(tm * 23) + .25 * Math.sin(tm * 37 + 1));
  U.uGlow.value = F.glow * flick * (1 + .25 * lvl);
  U.uTear.value = cl(F.tear, 0, 1.5); U.uDis.value = cl(F.dis, 0, 1);
  const fd = cl(fadeE * F.fade, 0, 1);
  U.uFade.value = fd;
  root.visible = fd > .002;
  bodyMat.depthWrite = fd > .97 && F.dis < .2; // a fading or unravelling flame must not hide the light behind it
  FACE.uSway.value.set(mv.dx * .8 - F.lean * .02, mv.dz * .8, 0);
  tailMat.uniforms.uDrag.value.set(mv.dx * 1.3 + F.roll * .05, Math.abs(mv.dz) * .3, mv.dz * 1.3 - F.lean * .06);

  // the face: expressions blended, blinks
  if (dt > 0 && !noBlink) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2.2 + rnd() * 3.5; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const k = blinkT / .16; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) blinkT = -1; }
  if (F.eW > .5) bk = 0;
  const shut = Math.max(bk, cl(F.shut, 0, 1));
  const wH = cl(F.eH, 0, 1), wW = cl(F.eW, 0, 1), wC = Math.max(0, 1 - wH - wW), sw = wC + wH + wW;
  for (const k of XK) XP[k] = (EXP.calm[k] * wC + EXP.hungry[k] * wH + EXP.wail[k] * wW) / sw;
  const mo = cl(F.mO, 0, 1); XP.my = lerp(XP.my, EXP.open.my, mo); XP.fang *= 1 - mo;
  FACE.uEyeP.value.set(XP.ex, XP.ey, XP.ew, Math.max(.0022, XP.eh * (1 - .9 * shut)));
  FACE.uEyeQ.value.set(XP.tilt * (1 - .5 * shut), XP.cut + .3 * shut, XP.slope, 0);
  FACE.uMouP.value.set(XP.my, wC / sw * (1 - mo), wH / sw * (1 - mo), wW / sw * (1 - mo));
  FACE.uMouQ.value.set(XP.fang, mo, 0, 0);

  // the tendrils: reach, coil and fling ease on their own, so an interrupt whips them back instead of snapping
  for (const k of TSK) { const v = F[k], c = TS[k]; if (dt > 0) TS[k] = c + (v - c) * (1 - Math.exp(-dt * (v > c ? 40 : 16))); F[k] = TS[k]; }
  inner.worldToLocal(targetWorld(_tl));
  tendrilPose(0, F, tm, _tl); tendrilPose(1, F, tm, _tl);
  TU.uTW.value.set(.018 * F.wave * (1 + .6 * F.tFlail) + .035 * F.tReach * (1 - .6 * F.tCoil) + .02 * F.tFling, 5 + 4 * F.tFlail + 3 * F.tReach, F.tCoil, F.tCoil);
  TU.uCoil.value.set(_tl.x, _tl.y - .05, _tl.z, .2);
  TU.uTRad.value = 1 - .3 * F.tReach;
  let pa = 0, pb = 0, sa = 0, sb = 0;
  if (name === 'cling') for (const h of def.hits) { const k = (u - h) / .09; if (k >= 0 && k <= 1) { pa = pb = 1 - k; sa = sb = Math.sin(PI * k); } }
  TU.uPulse.value.set(pa, pb, sa, sb);

  // the hollow grows darker and wider with level; the specks and the halo
  HOL.uHC.value.set(0, .372, 0, .088 * (1 + .5 * lvl));
  orbT += dt * F.swirl;
  MO.uMo.value.set(F.spread, orbT, F.dis * .6, 1);
  MO.uHalo.value.set(0, .58, 0, .42);
  MO.uHaloI.value = .17 * U.uGlow.value;
  GG.uGI.value = .14 * U.uGlow.value * Math.min(1, S * S) * (1 - F.dis);

  stepFX(def, name, u, tm, dt);
  prevU = u;
 }

 // ---------- the actions' effects ----------
 function stepFX(def, name, u, tm, dt) {
  targetWorld(_tw);
  // flicker: the spark gathers at the flinging tendril's tip, flies on a small arc and lands at the hit
  if (name === 'flicker') {
   const L = .38, Hh = def.hits[0];
   tcen(flingSide, 1, _p); inner.localToWorld(_p);
   if (u >= .16 && u < L) { const g = sm(.16, .34, u); FXS.sparkP.copy(_p); FXS.sparkOn = true; put(0, _p.x, _p.y, _p.z, 8, .05 + .06 * g, 0, ...tint(COL.green, COL.ice), 1.3 * g, .15 * g, .37, tm); put(1, _p.x, _p.y, _p.z, 0, .16 + .12 * g, 0, ...tint(COL.green, COL.ice), .55 * g, 0, 0, 0); }
   if (u >= L && !FXS.launched) { FXS.launched = true; FXS.from.copy(_p); }
   if (FXS.launched && u < Hh) {
    const k = (u - L) / (Hh - L), D = FXS.from.distanceTo(_tw);
    _q.copy(FXS.from).lerp(_tw, k); _q.y += Math.sin(PI * k) * Math.min(.6, .08 * D + .1);
    FXS.sparkP.copy(_q);
    put(0, _q.x, _q.y, _q.z, 8, .11, 0, ...tint(COL.green, COL.ice), 1.4, .15, .37, tm); put(1, _q.x, _q.y, _q.z, 0, .3, 0, ...tint(COL.green, COL.ice), .6, 0, 0, 0);
    FXS.acc += dt * 70;
    while (FXS.acc > 1) { FXS.acc -= 1; emit({ k: rnd() < .5 ? 1 : 0, p: [_q.x + (rnd() - .5) * .05, _q.y + (rnd() - .5) * .05, _q.z + (rnd() - .5) * .05], v: [(rnd() - .5) * .4, .2 + rnd() * .4, (rnd() - .5) * .4], life: .3 + rnd() * .25, s0: .035, s1: .01, c: tint(COL.green, COL.ice), li: 1, pa: .15, dr: 2 }); }
   }
   if (u >= Hh && !FXS.landed) {
    FXS.landed = true; FXS.sparkOn = false; hide(0); hide(1);
    emit({ k: 0, p: [_tw.x, _tw.y, _tw.z], life: .3, s0: .5, s1: .9, c: tint(COL.pale, COL.frostW), li: 1.2, pa: 0, fi: .02, fo: .2 });
    for (let i = 0; i < 22; i++) { const a = rnd() * TAU, b = (rnd() - .3) * 2, sp = .8 + rnd() * 1.8; emit({ k: i % 3 ? 0 : 1, p: [_tw.x, _tw.y, _tw.z], v: [Math.cos(a) * sp, b * sp * .6, Math.sin(a) * sp], life: .35 + rnd() * .35, s0: i % 3 ? .04 : .045, s1: .01, c: tint(COL.green, COL.ice), li: 1.2, pa: .1, dr: 3, gr: -2 }); }
   }
  } else if (FXS.sparkOn) { FXS.sparkOn = false; hide(0); hide(1); }

  // cling: light leaves the target at each hit and runs back along both tendrils
  if (name === 'cling') {
   for (let h = 0; h < def.hits.length; h++) if (prevU < def.hits[h] && u >= def.hits[h]) {
    for (let i = 0; i < 10; i++) emit({ k: i % 2, p: [_tw.x, _tw.y, _tw.z], life: .32 + rnd() * .12, s0: .045, s1: .02, c: tint(COL.pale, COL.frostW), li: 1.3, pa: .15, mode: 1, aux: [i % 2, .8 - rnd() * .1, (rnd() - .5) * .05, (rnd() - .5) * .05], fi: .05, fo: .7 });
    for (let i = 0; i < 8; i++) { const a = rnd() * TAU; emit({ k: 0, p: [_tw.x, _tw.y, _tw.z], v: [Math.cos(a) * .6, .3 + rnd() * .5, Math.sin(a) * .6], life: .4, s0: .05, s1: .01, c: tint(COL.green, COL.ice), li: .9, dr: 2 }); }
   }
  }

  // gutter: thin smoke as it almost goes out, a burst of specks as it flares back
  if (name === 'gutter') {
   if (u > .25 && u < .62) { FXS.smoke += dt * 9; while (FXS.smoke > 1) { FXS.smoke -= 1; L2W((rnd() - .5) * .03, .48, (rnd() - .5) * .03, _p); emit({ k: 4, p: [_p.x, _p.y, _p.z], v: [(rnd() - .5) * .1, .35 + rnd() * .2, (rnd() - .5) * .1], life: .8 + rnd() * .4, s0: .03, s1: .1, c: tint(COL.smoke, [.32, .36, .48]), li: 0, pa: .3, dr: .8, fi: .2, fo: .6 }); } }
   if (u >= .64 && !FXS.flare) {
    FXS.flare = true; L2W(0, .5, 0, _p);
    emit({ k: 0, p: [_p.x, _p.y, _p.z], life: .3, s0: .3, s1: .5, c: tint(COL.pale, COL.frostW), li: .6, fi: .05, fo: .3 });
    for (let i = 0; i < 14; i++) { const a = rnd() * TAU, sp = 1 + rnd() * 1.2; emit({ k: 1, p: [_p.x, _p.y, _p.z], v: [Math.cos(a) * sp, (rnd() - .2) * 1.2, Math.sin(a) * sp], life: .5 + rnd() * .3, s0: .04, s1: .015, c: tint(COL.green, COL.ice), li: 1.1, pa: .2, dr: 2.5 }); }
   }
  }

  // wail: three pale rings of sound spread from its mouth; the first reaches the party at the hit
  if (name === 'wail') {
   const T0 = [.26, .34, .42];
   L2W(0, EXP.wail.my, .12, _p);
   for (let i = 0; i < 3; i++) {
    if (u >= T0[i] && !FXS.rings[i]) FXS.rings[i] = { c: _p.clone(), D: Math.max(1, _p.distanceTo(_tw)) };
    const R = FXS.rings[i];
    if (R) {
     const tt = (u - T0[i]) * def.dur, v = R.D / ((def.hits[0] - T0[0]) * def.dur), r = .1 + v * tt;
     const al = sm(0, .05, tt) * (1 - sm(R.D * .9, R.D * 1.6, r)) * (1 - .25 * i);
     if (al > .003) put(2 + i, R.c.x, R.c.y, R.c.z, 6, r / .88, 0, ...tint(COL.ring, COL.frostW), .55 * al, .1 * al, 0, Math.min(.12, .04 + .015 / Math.max(r, .1))); else hide(2 + i);
    }
   }
  } else if (FXS.rings.length) { FXS.rings.length = 0; hide(2); hide(3); hide(4); }

  // breath: a plume of frost from its mouth, with ice shards and a snowflake, that reaches the party at the hit
  if (name === 'breath') {
   const S0 = .28, S1 = .74, Hh = def.hits[0];
   L2W(0, EXP.open.my, .13, _p);
   const D = Math.max(1, _p.distanceTo(_tw)), flight = (Hh - S0) * def.dur, sp = D / flight;
   _d.copy(_tw).sub(_p).normalize();
   if (u >= S0 && u < S1) {
    FXS.acc += dt * 95;
    while (FXS.acc > 1) {
     FXS.acc -= 1;
     const j = .12 + .22 * rnd(), vx = _d.x * sp + (rnd() - .5) * sp * j, vy = _d.y * sp + (rnd() - .3) * sp * j * .6, vz = _d.z * sp + (rnd() - .5) * sp * j;
     const r = rnd();
     if (r < .62) emit({ k: 4, p: [_p.x, _p.y, _p.z], v: [vx, vy, vz], life: flight * (1.02 + .3 * rnd()), s0: .08, s1: .5 + .35 * rnd(), c: COL.mist, li: .1, pa: .17, fi: .08, fo: .55, vr: (rnd() - .5) * 2 });
     else if (r < .9) emit({ k: 2, p: [_p.x, _p.y, _p.z], v: [vx * 1.05, vy, vz * 1.05], life: flight * (1 + .2 * rnd()), s0: .035 + .025 * rnd(), c: COL.shard, li: .5, pa: .45, vr: (rnd() - .5) * 8, fi: .05, fo: .4 });
     else emit({ k: 0, p: [_p.x, _p.y, _p.z], v: [vx, vy, vz], life: flight * .9, s0: .06, s1: .02, c: COL.ice, li: 1, fi: .05 });
    }
   }
   // the snowflake drifts along the plume's middle
   if (u >= .34 && u < .9) {
    const k = sm(.34, .7, u), al = sm(.34, .42, u) * (1 - sm(.78, .9, u));
    _q.copy(_p).lerp(_tw, .2 + .65 * k); _q.y += .25 * Math.sin(PI * k) + .05;
    put(7, _q.x, _q.y, _q.z, 3, .1, tm * .8, ...COL.frostW, .9 * al, .45 * al, 0, 0);
   } else hide(7);
  } else hide(7);

  // hurt: flakes of it break off
  if (name === 'hurt' && u >= .03 && !FXS.burst) {
   FXS.burst = true;
   for (let i = 0; i < 22; i++) {
    const a = rnd() * TAU, y = .3 + rnd() * .4, r = .08 + rnd() * .05;
    L2W(Math.sin(a) * r, y, Math.cos(a) * r, _p);
    L2W(Math.sin(a) * (r + .3), y + .1 + rnd() * .2, Math.cos(a) * (r + .3) - .25, _q); _q.sub(_p);
    const sp = 1 + rnd() * 1.6, dark = i % 3 !== 0;
    emit({ k: dark ? 5 : 1, p: [_p.x, _p.y, _p.z], v: [_q.x * sp, _q.y * sp, _q.z * sp], life: .45 + rnd() * .4, s0: dark ? .025 + .02 * rnd() : .04, s1: .01, c: dark ? tint(COL.dark, [.18, .2, .3]) : tint(COL.green, COL.ice), li: dark ? 0 : 1.1, pa: dark ? .9 : .15, dr: 2.2, gr: dark ? -1.5 : 0, vr: (rnd() - .5) * 12, fi: .02, fo: .5 });
   }
  }

  // die: swirling light rises off it, and a pale moth rises out of the hollow
  if (name === 'die') {
   if (u > .1 && u < .88) {
    FXS.acc += dt * 34 * win(u, .15, .8, .05);
    while (FXS.acc > 1) {
     FXS.acc -= 1;
     const a = rnd() * TAU, r = .06 + rnd() * .1, y = .2 + rnd() * .55;
     L2W(Math.sin(a) * r, y, Math.cos(a) * r, _p); root.getWorldPosition(_q);
     emit({ k: rnd() < .55 ? 0 : 1, p: [_p.x, _p.y, _p.z], life: .9 + rnd() * .6, s0: .035 + .02 * rnd(), s1: .01, c: tint(rnd() < .5 ? COL.green : COL.pale, COL.ice), li: 1.1, pa: .12, mode: 3, aux: [_q.x, _q.z, Math.atan2(_p.z - _q.z, _p.x - _q.x), Math.hypot(_p.x - _q.x, _p.z - _q.z)], fi: .1, fo: .6 });
    }
   }
   if (u > .3) {
    const k = sm(.33, 1, u), e = 1 - (1 - k) * (1 - k), op = sm(.33, .43, u) * (1 - sm(.9, 1, u));
    if (!FXS.mothFrom) { L2W(0, .4, .05, _p); FXS.mothFrom = _p.clone(); }
    const M0 = FXS.mothFrom;
    _q.set(M0.x + .35 * e + .08 * Math.sin(k * 9), M0.y + 1.35 * e + .12 * k, M0.z + .1 * Math.sin(k * 6) * k);
    FXS.mothP.copy(_q);
    if (u < .86) { FXS.st += dt * 44; while (FXS.st > 1) { FXS.st -= 1; const a = rnd() * TAU; L2W(Math.sin(a) * .07, .2 + rnd() * .25, Math.cos(a) * .07, _p); emit({ k: rnd() < .5 ? 0 : 1, p: [_p.x, _p.y, _p.z], life: .7 + rnd() * .4, s0: .04, s1: .016, c: tint(rnd() < .6 ? COL.pale : COL.green, COL.ice), li: 1.15, pa: .1, mode: 4, aux: [_p.x, _p.y, _p.z, rnd() * TAU], fi: .1, fo: .4 }); } }
    FXS.sp += dt * 26 * op;
    while (FXS.sp > 1) { FXS.sp -= 1; emit({ k: 0, p: [_q.x + (rnd() - .5) * .05, _q.y - .02, _q.z + (rnd() - .5) * .05], v: [(rnd() - .5) * .1, -.15 - rnd() * .2, (rnd() - .5) * .1], life: .6 + rnd() * .4, s0: .025, s1: .006, c: COL.moth, li: 1, fi: .05, fo: .7 }); }
    const flap = .25 + .75 * Math.abs(Math.sin(tm * 11));
    put(5, _q.x, _q.y, _q.z, 7, .085, .25 * Math.sin(tm * 2.1), ...COL.moth, .8 * op, .55 * op, 0, flap);
    put(6, _q.x, _q.y, _q.z, 0, .26, 0, ...tint(COL.pale, COL.frostW), .45 * op, 0, 0, 0);
   }
  } else { FXS.mothFrom = null; if (fPar[5 * 16 + 1] !== 0) { hide(5); hide(6); } }

  // free particles
  if (pAlive > 0 && dt > 0) {
   pAlive = 0;
   for (let i = NSLOT; i < NP; i++) {
    if (pl[i] <= 0) continue;
    pl[i] -= dt;
    if (pl[i] <= 0) { hide(i); continue; }
    pAlive++;
    const age = 1 - pl[i] / pm[i], i3 = i * 3, i4 = i * 4;
    if (pMode[i] === 1) {
     // light running back along a tendril to the hollow
     const s = pAux[i4 + 1] * (1 - sm(0, 1, age));
     tcen(pAux[i4] | 0, s, _p); inner.localToWorld(_p);
     pX[i3] = _p.x + pAux[i4 + 2] * (1 - age); pX[i3 + 1] = _p.y; pX[i3 + 2] = _p.z + pAux[i4 + 3] * (1 - age);
    } else if (pMode[i] === 2) {
     // gathering into its middle
     L2W(0, .45, 0, _p); const k = sm(0, 1, age), sw = (1 - k) * .25;
     pX[i3] = lerp(pAux[i4], _p.x, k) + Math.cos(pAux[i4 + 3] + age * 6) * sw;
     pX[i3 + 1] = lerp(pAux[i4 + 1], _p.y, k);
     pX[i3 + 2] = lerp(pAux[i4 + 2], _p.z, k) + Math.sin(pAux[i4 + 3] + age * 6) * sw;
    } else if (pMode[i] === 4) {
     // a stream of light spiralling up from the body to the moth
     const k = sm(0, 1, age), M = FXS.mothP, sx = pAux[i4], sy = pAux[i4 + 1], sz = pAux[i4 + 2], cx = sx + (M.x - sx) * .2 - .12, cy = sy + .55, cz = sz + (M.z - sz) * .2;
     const b0 = (1 - k) * (1 - k), b1 = 2 * k * (1 - k), b2 = k * k, sw = .07 * (1 - k), an = pAux[i4 + 3] + age * 9;
     pX[i3] = b0 * sx + b1 * cx + b2 * M.x + Math.cos(an) * sw; pX[i3 + 1] = b0 * sy + b1 * cy + b2 * M.y; pX[i3 + 2] = b0 * sz + b1 * cz + b2 * M.z + Math.sin(an) * sw;
    } else if (pMode[i] === 3) {
     // swirling up around it
     pAux[i4 + 2] += dt * (2.2 + 1.5 * pSd[i]); pAux[i4 + 3] += dt * .12;
     pX[i3] = pAux[i4] + Math.cos(pAux[i4 + 2]) * pAux[i4 + 3]; pX[i3 + 2] = pAux[i4 + 1] + Math.sin(pAux[i4 + 2]) * pAux[i4 + 3];
     pX[i3 + 1] += dt * (.45 + .4 * pSd[i]);
    } else {
     const dr = Math.exp(-pDr[i] * dt);
     pV[i3] *= dr; pV[i3 + 1] = pV[i3 + 1] * dr - pGr[i] * dt; pV[i3 + 2] *= dr;
     pX[i3] += pV[i3] * dt; pX[i3 + 1] += pV[i3 + 1] * dt; pX[i3 + 2] += pV[i3 + 2] * dt;
    }
    pR[i] += pVR[i] * dt;
    const env = sm(0, pFi[i], age) * (1 - sm(1 - pFo[i], 1, age));
    put(i, pX[i3], pX[i3 + 1], pX[i3 + 2], pk[i], lerp(pS0[i], pS1[i], age), pR[i], pRGB[i3], pRGB[i3 + 1], pRGB[i3 + 2], pLi[i] * env, pPa[i] * env, pSd[i], tm);
   }
  }
  if (fxDirty) {
   const a = fxGeo.attributes;
   a.position.needsUpdate = a.aCol.needsUpdate = a.aPar.needsUpdate = a.aX.needsUpdate = true; fxDirty = false;
   let on = pAlive > 0; for (let i = 0; i < NSLOT && !on; i++) if (fPar[i * 16 + 1] !== 0) on = true;
   fxMesh.visible = on;
  }
 }

 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && !force && (actv.name === 'die' || (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)))) return false;
  const gone = FIN.fade * fadeE < .5;
  cp(SNAP, gone && name !== 'appear' ? BP : FIN);
  actv = { name, def, t: 0 }; prevU = 0; rbT = 0;
  onStart(name);
  return true;
 }
 const ANC = { chest: [0, .44, .06], head: [0, .61, .06], mouth: [0, .525, .12], hollow: [0, .375, .1], top: [0, .8, 0] };
 function anchor(name, out) {
  out = out || V3();
  inner.updateWorldMatrix(true, false);
  if (name === 'spark') return FXS.sparkOn ? out.copy(FXS.sparkP) : inner.localToWorld(tcen(flingSide, 1, out));
  if (name === 'tendrilR' || name === 'tendrilL') return inner.localToWorld(tcen(name === 'tendrilR' ? 0 : 1, 1, out));
  if (name === 'hit') {
   const a = actv ? actv.name : '';
   if (a === 'flicker' && FXS.sparkOn) return out.copy(FXS.sparkP);
   if (a === 'flicker' || a === 'cling' || a === 'wail' || a === 'breath') return targetWorld(out);
   return inner.localToWorld(tcen(flingSide, 1, out));
  }
  const L = ANC[name] || ANC.chest;
  return inner.localToWorld(out.set(L[0], L[1], L[2]));
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0;
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
 return {
  root, fx, animate, play,
  guard(on) { gOn = !!on; },
  reset() { const gone = FIN.fade * fadeE < .5; cp(SNAP, gone ? BP : FIN); actv = null; gOn = false; gW = 0; rbT = gone ? 0 : .2; clearFx(); },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); }, anchor, ACTIONS,
  stats: { triangles: Math.round(tri), drawCalls: draws + 1, textures: 0, bones: 0 },
  _dbg: { set noBlink(v) { noBlink = !!v; blinkT = -1; }, set expr(v) { dbgExpr = v; }, U, FACE, FIN },
 };
}
