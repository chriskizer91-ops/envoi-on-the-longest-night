// garden.js: where Io lives, built for her study: her cottage garden in Wickhollow, at night, after the walking map
// painted for it (reference/art/walk/walk-wickhollow-cottage.png): a stone cottage with a mossy roof and a round lit
// window, a flagstone path between raised beds of lavender, white flowers and blue spires, a picket fence with a gate
// between two stone pillars and their lanterns, a cauldron, dark trees with hanging moss, a big moon and no stars (the
// sky has none until the ending). three.js r128 (global THREE). Defines makeGarden(renderer, opts) only.
// Returns { scene, moonDir, heightAt(x, z), look(name), update(t, dt), lamp, lights }.
// opts: { quality: 'medium' | 'high' | 'max', linear (default true) }
function makeGarden(renderer, opts) {
 'use strict';
 opts = opts || {};
 const QL = opts.quality || 'high', HQ = QL !== 'medium', MAX = QL === 'max';
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 7331;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const LIN = opts.linear !== false;
 const L1 = (v) => (LIN ? Math.pow(v, 2.2) : v);
 const C = (hex) => { const c = new THREE.Color(hex); if (LIN) c.convertSRGBToLinear(); return c; };
 const CR = (r, g, b) => new THREE.Color(L1(r), L1(g), L1(b));
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const TX = HQ ? 1 : .5;
 const tex = (c, rx, ry, data) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx); t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding; return t; };
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = s[i * 4] / 255;
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data, at = (x, y) => h[((y + H) % H) * W + (x + W) % W];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = at(x + 1, y) - at(x - 1, y), dy = at(x, y + 1) - at(x, y - 1), nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 const tiled = (W, H, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) f(ox, oy); };
 const scene = new THREE.Scene();
 const FOG = CR(.075, .07, .11);
 scene.fog = new THREE.FogExp2(FOG.getHex(), .028);
 scene.background = FOG.clone();
 const moonDir = V3(-.5, .42, -.76).normalize();

 // ---------- the sky: deep blue-violet, a haze toward the horizon, thin cloud, the moon. No stars. ----------
 const SKY_U = { uMoon: { value: moonDir }, uTime: { value: 0 }, uK: { value: 1 } };
 const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: SKY_U,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
  fragmentShader: 'uniform vec3 uMoon; uniform float uTime, uK; varying vec3 vD;\n' +
   'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
   'float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }\n' +
   'float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.07 + 3.1; a *= .5; } return s; }\n' +
   'void main(){ vec3 d = normalize(vD); float y = d.y, md = dot(d, uMoon);\n' +
   ' vec3 c = mix(' + v3(CR(.13, .1, .2)) + ', ' + v3(CR(.035, .04, .09)) + ', smoothstep(-.02, .55, y));\n' +
   ' c += ' + v3(CR(.24, .2, .34)) + ' * pow(max(md, 0.), 8.) * .5 + ' + v3(CR(.5, .52, .66)) + ' * pow(max(md, 0.), 120.) * .9;\n' +
   ' vec2 q = d.xz / max(y + .25, .08) * 1.6 + vec2(uTime * .006, 0.); float cl = smoothstep(.48, .78, fbm(q)) * smoothstep(.0, .25, y) * (1. - smoothstep(.6, .9, y));\n' +
   ' c = mix(c, ' + v3(CR(.16, .15, .24)) + ' + ' + v3(CR(.45, .45, .58)) + ' * pow(max(md, 0.), 14.), cl * .55);\n' +
   ' float disc = smoothstep(.99965, .99975, md); vec2 mp = vec2(dot(d, normalize(cross(uMoon, vec3(0., 1., 0.)))), d.y - uMoon.y) * 900.;\n' +
   ' float maria = .82 + .18 * fbm(mp * .09 + 5.) - .12 * smoothstep(.55, .75, fbm(mp * .05 + 1.));\n' +
   ' c = mix(c, ' + v3(CR(.96, .95, .9)) + ' * 7. * maria, disc * (1. - cl * .6));\n' +
   ' c *= uK; gl_FragColor = vec4(c, 1.); }' }));
 function v3(c) { return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }
 sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

 // ---------- the ground: soft rises away from the garden, flat inside it ----------
 const heightAt = (x, z) => { const r = Math.hypot(x, z); return sm(9, 30, r) * (1.2 * Math.sin(x * .09 + 1) + .9 * Math.cos(z * .07 + .4) + .6) + .03 * Math.sin(x * 1.3) * Math.sin(z * 1.1) * sm(2, 6, r); };
 const GRASS = (() => {
  const W = 1024 * TX, c = cvs(W, W), g = c.getContext('2d'), hc = cvs(W, W), h = hc.getContext('2d');
  g.fillStyle = '#1d2a22'; g.fillRect(0, 0, W, W); h.fillStyle = '#808080'; h.fillRect(0, 0, W, W);
  for (let i = 0; i < 26000 * TX; i++) { const x = rnd() * W, y = rnd() * W, l = 3 + rnd() * 9, a = rnd() * TAU; const col = rnd() < .5 ? 'rgba(12,22,16,.5)' : rnd() < .7 ? 'rgba(46,66,48,.45)' : 'rgba(70,84,60,.35)'; g.strokeStyle = col; g.lineWidth = .8 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); h.strokeStyle = rnd() < .5 ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'; h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke(); }
  for (let i = 0; i < 90; i++) { const x = rnd() * W, y = rnd() * W, r = 20 + rnd() * 80; tiled(W, W, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, rnd() < .5 ? 'rgba(40,30,22,.35)' : 'rgba(40,62,40,.3)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); }); }
  return { map: tex(c, 18, 18), normal: tex(normalFrom(hc, 2.5), 18, 18, true) };
 })();
 const groundG = new THREE.PlaneGeometry(240, 240, HQ ? 160 : 80, HQ ? 160 : 80); groundG.rotateX(-PI / 2);
 { const p = groundG.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i))); groundG.computeVertexNormals(); }
 const ground = new THREE.Mesh(groundG, new THREE.MeshStandardMaterial({ map: GRASS.map, normalMap: GRASS.normal, normalScale: new THREE.Vector2(.6, .6), roughness: .95, envMapIntensity: .3 }));
 ground.receiveShadow = true; scene.add(ground);

 // ---------- stone: flagstones, pillars, the well of the cottage walls ----------
 function stoneTex(base, seedS, moss) {
  const W = 512 * TX, c = cvs(W, W), g = c.getContext('2d'), hc = cvs(W, W), h = hc.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, W, W); h.fillStyle = '#909090'; h.fillRect(0, 0, W, W);
  for (let i = 0; i < 9000 * TX; i++) { const x = rnd() * W, y = rnd() * W, s = 1 + rnd() * 4; g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.12)' : 'rgba(255,240,230,.07)'; g.fillRect(x, y, s, s); h.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.18)'; h.fillRect(x, y, s, s); }
  for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * W, r = 10 + rnd() * 50; tiled(W, W, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, rnd() < .6 ? 'rgba(20,16,20,.25)' : 'rgba(160,150,160,.12)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); }); }
  if (moss) for (let i = 0; i < 60; i++) { const x = rnd() * W, y = rnd() * W, r = 6 + rnd() * 26; tiled(W, W, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, 'rgba(58,80,44,.55)'); q.addColorStop(1, 'rgba(58,80,44,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); }); }
  for (let i = 0; i < 30; i++) { let x = rnd() * W, y = rnd() * W; g.strokeStyle = 'rgba(10,8,10,.5)'; h.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = h.lineWidth = 1 + rnd(); g.beginPath(); h.beginPath(); g.moveTo(x, y); h.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rr(-12, 12); y += rr(-12, 12); g.lineTo(x, y); h.lineTo(x, y); } g.stroke(); h.stroke(); }
  return { map: tex(c), normal: tex(normalFrom(hc, 3), 1, 1, true) };
 }
 const STONE = stoneTex('#57525e', 1, true), WALL = stoneTex('#6b6370', 2, true);
 const stoneM = new THREE.MeshStandardMaterial({ map: STONE.map, normalMap: STONE.normal, roughness: .88, vertexColors: true, envMapIntensity: .4 });
 // an irregular slab: a rounded polygon, bevelled, a little domed
 function slab(rx, rz, th) {
  const s = new THREE.Shape(), n = 6 + Math.floor(rnd() * 3), a0 = rnd() * TAU, R = [];
  for (let i = 0; i < n; i++) R.push(.68 + .32 * rnd());
  for (let i = 0; i <= n; i++) { const a = a0 + i / n * TAU + (i % n ? (rnd() - .5) * .5 : 0), r = R[i % n]; const x = Math.cos(a) * rx * r, z = Math.sin(a) * rz * r; i ? s.lineTo(x, z) : s.moveTo(x, z); }
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: th * .35, bevelSize: Math.min(rx, rz) * .05, bevelSegments: 2, curveSegments: 1 });
  g.rotateX(PI / 2); g.computeVertexNormals();
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), k = rr(.42, .7);
  for (let i = 0; i < p.count; i++) { uv.setXY(i, p.getX(i) * .9 + rnd() * .001, p.getZ(i) * .9); col[i * 3] = k; col[i * 3 + 1] = k * rr(.97, 1.02); col[i * 3 + 2] = k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
 }
 function mergeG(list) {
  let nv = 0; for (const g of list) nv += g.attributes.position.count;
  const out = new THREE.BufferGeometry(), keys = ['position', 'normal', 'uv', 'color'].filter((k) => list[0].attributes[k]);
  for (const k of keys) { const sz = list[0].attributes[k].itemSize, A = new Float32Array(nv * sz); let o = 0; for (const g of list) { const a = g.attributes[k] ? g.attributes[k].array : new Float32Array(g.attributes.position.count * sz).fill(1); A.set(a, o); o += g.attributes.position.count * sz; } out.setAttribute(k, new THREE.BufferAttribute(A, sz)); }
  const idx = []; let vo = 0; for (const g of list) { const c = g.attributes.position.count; if (g.index) for (const i of g.index.array) idx.push(i + vo); else for (let i = 0; i < c; i++) idx.push(i + vo); vo += c; }
  out.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  out.computeBoundingSphere(); return out;
 }
 const placed = (g, x, y, z, ry, s) => { const m = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)), s ? V3(s, s, s) : V3(1, 1, 1)); g.applyMatrix4(m); return g; };
 // the path from the gate to the door: flagstones two abreast, a little uneven, grass between them
 {
  const list = [];
  for (let z = 6.2; z > -6.8; z -= rr(.48, .62)) {
   const two = rnd() < .65, w = 1.15;
   if (two) for (const sx of [-1, 1]) list.push(placed(slab(rr(.24, .3), rr(.2, .26), .05), sx * w * .25 + rr(-.04, .04), heightAt(0, z) - .015, z + rr(-.05, .05), rr(0, TAU)));
   else list.push(placed(slab(rr(.42, .5), rr(.22, .27), .05), rr(-.05, .05), heightAt(0, z) - .015, z, rr(-.2, .2)));
  }
  const path = new THREE.Mesh(mergeG(list), stoneM); path.receiveShadow = true; path.castShadow = false; scene.add(path);
 }

 // ---------- wood: the beds' boards, the fence, the gate ----------
 const WOOD = (() => {
  const W = 256 * TX, H = 1024 * TX, c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = '#3e2f27'; g.fillRect(0, 0, W, H); h.fillStyle = '#808080'; h.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) { const x = rnd() * W, w = .5 + rnd() * 3; g.fillStyle = rnd() < .5 ? 'rgba(20,12,10,.35)' : 'rgba(110,90,70,.18)'; g.fillRect(x, 0, w, H); h.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.25)'; h.fillRect(x, 0, w, H); }
  for (let i = 0; i < 14; i++) { const x = rnd() * W, y = rnd() * H; g.fillStyle = 'rgba(15,10,8,.6)'; g.beginPath(); g.ellipse(x, y, 3 + rnd() * 4, 8 + rnd() * 10, 0, 0, TAU); g.fill(); h.fillStyle = 'rgba(0,0,0,.7)'; h.beginPath(); h.ellipse(x, y, 3, 9, 0, 0, TAU); h.fill(); }
  for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * H, r = 8 + rnd() * 30; const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(60,84,46,.4)'); q.addColorStop(1, 'rgba(60,84,46,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  return { map: tex(c), normal: tex(normalFrom(hc, 2), 1, 1, true) };
 })();
 const woodM = new THREE.MeshStandardMaterial({ map: WOOD.map, normalMap: WOOD.normal, roughness: .85, envMapIntensity: .3 });
 const box = (w, h, d, x, y, z, ry, rx) => { const g = new THREE.BoxGeometry(w, h, d, 1, Math.max(1, Math.round(h * 3)), 1); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 1.5, uv.getY(i) * Math.max(h, d) * .8); g.applyMatrix4(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, 0)), V3(1, 1, 1))); return g; };
 // the raised beds: four of them, either side of the path
 const BEDS = [{ x: -2.55, z: 1.2, w: 2.4, d: 3.0, kind: 'lavender' }, { x: -2.55, z: -3.6, w: 2.4, d: 3.4, kind: 'white' }, { x: 2.55, z: 1.2, w: 2.4, d: 3.0, kind: 'spire' }, { x: 2.55, z: -3.6, w: 2.4, d: 3.4, kind: 'herbs' }];
 const SOIL = (() => {
  const W = 512 * TX, c = cvs(W, W), g = c.getContext('2d');
  g.fillStyle = '#231a16'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 20000 * TX; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.3)' : 'rgba(90,70,56,.25)'; const s = 1 + rnd() * 3; g.fillRect(rnd() * W, rnd() * W, s, s); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(40,58,34,.5)'; g.beginPath(); g.ellipse(rnd() * W, rnd() * W, 2 + rnd() * 6, 1 + rnd() * 3, rnd() * PI, 0, TAU); g.fill(); }
  return tex(c, 2, 2);
 })();
 const soilM = new THREE.MeshStandardMaterial({ map: SOIL, roughness: 1 });
 {
  const boards = [], soil = [];
  for (const b of BEDS) {
   const y0 = heightAt(b.x, b.z);
   boards.push(box(b.w + .1, .22, .07, b.x, y0 + .11, b.z + b.d / 2), box(b.w + .1, .22, .07, b.x, y0 + .11, b.z - b.d / 2), box(.07, .22, b.d, b.x + b.w / 2, y0 + .11, b.z), box(.07, .22, b.d, b.x - b.w / 2, y0 + .11, b.z));
   const sg = new THREE.PlaneGeometry(b.w, b.d, 12, 12); sg.rotateX(-PI / 2); const p = sg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, .17 + .03 * Math.sin(p.getX(i) * 6) * Math.cos(p.getZ(i) * 5)); sg.computeVertexNormals(); sg.translate(b.x, y0, b.z); soil.push(sg);
  }
  const bm = new THREE.Mesh(mergeG(boards), woodM); bm.castShadow = bm.receiveShadow = true; scene.add(bm);
  const sm2 = new THREE.Mesh(mergeG(soil), soilM); sm2.receiveShadow = true; scene.add(sm2);
 }

 // ---------- plants, instanced, swaying in a breath of wind ----------
 const WIND = { uTime: { value: 0 }, uWind: { value: .6 } };
 function sway(m, k) {
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
   sh.vertexShader = 'uniform float uTime, uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n { vec3 ip = instanceMatrix[3].xyz; float h = max(position.y, 0.); float w = (sin(uTime * 1.3 + ip.x * .7 + ip.z * .5) * .6 + sin(uTime * 2.9 + ip.x * 1.9) * .25) * uWind * ' + k.toFixed(3) + ' * h * h; transformed.x += w; transformed.z += w * .4; }\n#endif');
  };
  m.customProgramCacheKey = () => 'sway' + k;
  return m;
 }
 const plantM = sway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75, side: THREE.DoubleSide, envMapIntensity: .3 }), .35);
 // one plant's geometry from parts: stems (thin tubes) and blooms (small shapes), coloured per vertex
 function addPart(list, g, col, m) { g.applyMatrix4(m); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); list.push(g.index ? g : g); }
 const M4 = (x, y, z, rx, ry, rz, s) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), typeof s === 'object' ? s : V3(s || 1, s || 1, s || 1));
 function stem(list, x0, z0, h, lean, ang, col, r) {
  const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(V3(x0 + Math.cos(ang) * lean * t * t, h * t, z0 + Math.sin(ang) * lean * t * t)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, r || .004, 3, false); addPart(list, g, col, new THREE.Matrix4()); return pts[4];
 }
 const LAV = C('#7d5fc0'), LAV2 = C('#5c43a0'), STEMC = C('#4d6650'), LEAF = C('#2f4a36'), WHITE = C('#e9e6dc'), YEL = C('#e2c45a'), BLUE = C('#4b63c9'), BLUE2 = C('#7b8fe8'), HERB = C('#4f7a4a');
 function lavender() {
  const list = [];
  for (let s = 0; s < 22; s++) {
   const a = rnd() * TAU, r = rnd() * .12, h = rr(.38, .6), tip = stem(list, Math.cos(a) * r * .4, Math.sin(a) * r * .4, h, r + .05, a, STEMC, .0035);
   for (let k = 0; k < 9; k++) { const t = k / 9, g = new THREE.SphereGeometry(.012 * (1 - t * .4), 5, 4); addPart(list, g, k % 2 ? LAV : LAV2, M4(tip.x, tip.y - .1 + t * .1, tip.z, 0, 0, 0, V3(1, 1.6, 1))); }
  }
  for (let s = 0; s < 18; s++) { const a = rnd() * TAU, g = new THREE.ConeGeometry(.008, .12, 3); addPart(list, g, LEAF, M4(Math.cos(a) * .05, .06, Math.sin(a) * .05, Math.cos(a) * .9, 0, -Math.sin(a) * .9)); }
  return mergeG(list);
 }
 function whiteFlowers() {
  const list = [];
  for (let s = 0; s < 14; s++) {
   const a = rnd() * TAU, r = rnd() * .14, tip = stem(list, Math.cos(a) * r * .3, Math.sin(a) * r * .3, rr(.18, .34), r * .6, a, STEMC, .003);
   const f = new THREE.CircleGeometry(.028, 8); const p = f.attributes.position; for (let i = 1; i < p.count; i++) { const q = (i - 1) / 8 * TAU * 4; p.setZ(i, .004 * Math.sin(q)); }
   addPart(list, f, WHITE, M4(tip.x, tip.y, tip.z, -PI / 2 + rr(-.4, .4), rr(0, TAU), 0));
   addPart(list, new THREE.SphereGeometry(.008, 5, 4), YEL, M4(tip.x, tip.y + .004, tip.z, 0, 0, 0, V3(1, .5, 1)));
  }
  for (let s = 0; s < 16; s++) { const a = rnd() * TAU, g = new THREE.ConeGeometry(.012, .1, 3); addPart(list, g, LEAF, M4(Math.cos(a) * .06, .04, Math.sin(a) * .06, Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1)); }
  return mergeG(list);
 }
 function spire() {
  const list = [], h = rr(.8, 1.15), tip = stem(list, 0, 0, h, .06, rnd() * TAU, STEMC, .006);
  for (let k = 0; k < 26; k++) { const t = k / 26, a = k * 2.4, r = .045 * (1 - t * .7); addPart(list, new THREE.ConeGeometry(.02 * (1 - t * .5), .03, 5), k % 3 ? BLUE : BLUE2, M4(tip.x * (.5 + t * .5) + Math.cos(a) * r, h * (.5 + t * .5), tip.z * (.5 + t * .5) + Math.sin(a) * r, Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2)); }
  for (let s = 0; s < 10; s++) { const a = rnd() * TAU, g = new THREE.ConeGeometry(.02, .18, 3); addPart(list, g, LEAF, M4(Math.cos(a) * .07, .08, Math.sin(a) * .07, Math.cos(a) * 1, 0, -Math.sin(a) * 1)); }
  return mergeG(list);
 }
 function herbs() {
  const list = [];
  for (let s = 0; s < 30; s++) { const a = rnd() * TAU, r = rnd() * .15; addPart(list, new THREE.ConeGeometry(.018, rr(.12, .3), 3), r > .1 ? HERB : LEAF, M4(Math.cos(a) * r, .08, Math.sin(a) * r, Math.cos(a) * .6, rnd() * TAU, -Math.sin(a) * .6)); }
  return mergeG(list);
 }
 const KIND = { lavender: [lavender(), 34], white: [whiteFlowers(), 30], spire: [spire(), 16], herbs: [herbs(), 30] };
 const dummy = new THREE.Object3D();
 for (const b of BEDS) {
  const [g, n0] = KIND[b.kind], n = HQ ? n0 : Math.round(n0 * .6), im = new THREE.InstancedMesh(g, plantM, n);
  for (let i = 0; i < n; i++) { const x = b.x + rr(-b.w / 2 + .2, b.w / 2 - .2), z = b.z + rr(-b.d / 2 + .2, b.d / 2 - .2); dummy.position.set(x, heightAt(b.x, b.z) + .17, z); dummy.rotation.set(0, rnd() * TAU, 0); dummy.scale.setScalar(rr(.8, 1.25)); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
  im.castShadow = true; im.receiveShadow = true; scene.add(im);
 }
 // grass tufts everywhere outside the beds and the path, densest near the garden
 {
  const list = [];
  for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + rnd(), g = new THREE.PlaneGeometry(.014, rr(.12, .26), 1, 3); g.translate(0, g.parameters.height / 2, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getY(i) / g.parameters.height; p.setX(i, p.getX(i) * (1 - t * .9)); p.setZ(i, p.getZ(i) + t * t * .05); } addPart(list, g, C(rnd() < .5 ? '#2c4434' : '#3d5440'), M4(Math.cos(a) * .03, 0, Math.sin(a) * .03, 0, a, 0)); }
  const tuft = mergeG(list), N = MAX ? 26000 : HQ ? 14000 : 5000, im = new THREE.InstancedMesh(tuft, sway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide, envMapIntensity: .2 }), .9), N);
  let n = 0;
  for (let i = 0; i < N * 4 && n < N; i++) {
   const r = Math.pow(rnd(), 1.4) * 22 + .4, a = rnd() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
   if (Math.abs(x) < .75 && z > -7 && z < 6.6) continue;
   if (BEDS.some((b) => Math.abs(x - b.x) < b.w / 2 + .08 && Math.abs(z - b.z) < b.d / 2 + .08)) continue;
   if (z < -6.6 && z > -11 && Math.abs(x) < 4) continue;
   dummy.position.set(x, heightAt(x, z), z); dummy.rotation.set(0, rnd() * TAU, 0); dummy.scale.setScalar(rr(.7, 1.4)); dummy.updateMatrix(); im.setMatrixAt(n++, dummy.matrix);
  }
  im.count = n; im.receiveShadow = true; scene.add(im);
 }

 // ---------- the fence, the gate pillars and their lanterns ----------
 {
  const parts = [];
  const run = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / .14), ry = Math.atan2(x1 - x0, z1 - z0); for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), h = .78 + .06 * Math.sin(i * 1.7); parts.push(box(.075, h, .022, x, heightAt(x, z) + h / 2, z, ry + PI / 2, rr(-.04, .04))); } for (const y of [.25, .62]) parts.push(box(.04, .06, L, (x0 + x1) / 2, heightAt((x0 + x1) / 2, (z0 + z1) / 2) + y, (z0 + z1) / 2, ry)); };
  run(-1.0, 4.9, -5.2, 4.9); run(-5.2, 4.9, -5.2, -6.2); run(1.0, 4.9, 5.2, 4.9); run(5.2, 4.9, 5.2, -6.2);
  const fm = new THREE.Mesh(mergeG(parts), woodM); fm.castShadow = true; fm.receiveShadow = true; scene.add(fm);
  const pil = []; for (const sx of [-1, 1]) { pil.push(box(.4, 1.3, .4, sx * .82, .65, 4.9)); pil.push(box(.48, .1, .48, sx * .82, 1.35, 4.9)); }
  const pm = new THREE.Mesh(mergeG(pil), new THREE.MeshStandardMaterial({ map: WALL.map, normalMap: WALL.normal, roughness: .9, vertexColors: false })); pm.castShadow = pm.receiveShadow = true; scene.add(pm);
 }
 // a lantern: an iron frame round warm glass, a flame inside
 const lanternParts = (x, y, z, s) => {
  const g = [], k = s || 1;
  g.push(box(.16 * k, .02 * k, .16 * k, x, y + .2 * k, z), box(.18 * k, .02 * k, .18 * k, x, y, z));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.push(box(.014 * k, .2 * k, .014 * k, x + dx * .075 * k, y + .1 * k, z + dz * .075 * k));
  const cap = new THREE.ConeGeometry(.12 * k, .1 * k, 4); cap.rotateY(PI / 4); cap.translate(x, y + .26 * k, z); g.push(cap);
  return g;
 };
 const ironM = new THREE.MeshStandardMaterial({ color: C('#1b1a1f'), roughness: .5, metalness: .7 });
 const glowM = new THREE.MeshBasicMaterial({ color: CR(1, .62, .3).multiplyScalar(LIN ? 3.2 : 1) });
 const LANTERNS = [[-.82, 1.42, 4.9, 1], [.82, 1.42, 4.9, 1], [1.25, 1.62, .75, 1.1], [-.9, 2.0, -6.25, 1]];
 {
  const iron = [], glass = [];
  for (const [x, y, z, s] of LANTERNS) { iron.push(...lanternParts(x, y, z, s)); const gl = new THREE.BoxGeometry(.13 * s, .17 * s, .13 * s); gl.translate(x, y + .1 * s, z); glass.push(gl); }
  // the post of the lantern by the path, with its arm
  iron.push(box(.06, 1.75, .06, 1.25, .875, 1.15), box(.04, .04, .45, 1.25, 1.78, .95));
  scene.add(new THREE.Mesh(mergeG(iron), ironM), new THREE.Mesh(mergeG(glass), glowM));
 }

 // ---------- the cottage: stone walls, a timber frame, a steep mossy roof, a round window and the door ajar ----------
 const COT = { x: 0, z: -9.2, w: 6.2, d: 4.4, h: 2.7 };
 {
  const wallM = new THREE.MeshStandardMaterial({ map: WALL.map, normalMap: WALL.normal, roughness: .9, envMapIntensity: .3 });
  const ws = [];
  const wall = (w, h, x, y, z, ry) => { const g = new THREE.PlaneGeometry(w, h, Math.ceil(w * 2), Math.ceil(h * 2)); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * .7, uv.getY(i) * h * .7); g.applyMatrix4(M4(x, y, z, 0, ry, 0)); ws.push(g); };
  const { x, z, w, d, h } = COT;
  wall(w, h, x, h / 2, z + d / 2, 0); wall(w, h, x, h / 2, z - d / 2, PI); wall(d, h, x + w / 2, h / 2, z, PI / 2); wall(d, h, x - w / 2, h / 2, z, -PI / 2);
  // the gable ends
  for (const sz of [1, -1]) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, 2.3); s.lineTo(-w / 2, 0); const g = new THREE.ShapeGeometry(s); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .7, uv.getY(i) * .7); g.applyMatrix4(M4(x, h, z + sz * d / 2, 0, sz > 0 ? 0 : PI, 0)); ws.push(g); }
  const wm = new THREE.Mesh(mergeG(ws), wallM); wm.receiveShadow = true; scene.add(wm);
  // the roof: thatch under moss, thick, overhanging, its ridge sagging a little with age
  const TH = (() => { const W = 512 * TX, c = cvs(W, W), g = c.getContext('2d'), hc = cvs(W, W), hh = hc.getContext('2d'); g.fillStyle = '#3a3a24'; g.fillRect(0, 0, W, W); hh.fillStyle = '#808080'; hh.fillRect(0, 0, W, W); for (let i = 0; i < 9000 * TX; i++) { const xx = rnd() * W, yy = rnd() * W, l = 8 + rnd() * 30; g.strokeStyle = rnd() < .5 ? 'rgba(20,22,12,.5)' : rnd() < .6 ? 'rgba(76,92,48,.4)' : 'rgba(120,110,70,.3)'; g.lineWidth = 1 + rnd() * 1.5; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + rr(-2, 2), yy + l); g.stroke(); hh.strokeStyle = rnd() < .5 ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.3)'; hh.beginPath(); hh.moveTo(xx, yy); hh.lineTo(xx, yy + l); hh.stroke(); } for (let i = 0; i < 80; i++) { const xx = rnd() * W, yy = rnd() * W, r = 10 + rnd() * 40; tiled(W, W, (ox, oy) => { const q = g.createRadialGradient(xx + ox, yy + oy, 0, xx + ox, yy + oy, r); q.addColorStop(0, 'rgba(70,100,50,.5)'); q.addColorStop(1, 'rgba(70,100,50,0)'); g.fillStyle = q; g.fillRect(xx + ox - r, yy + oy - r, 2 * r, 2 * r); }); } return { map: tex(c), normal: tex(normalFrom(hc, 2.5), 1, 1, true) }; })();
  const roofM = new THREE.MeshStandardMaterial({ map: TH.map, normalMap: TH.normal, roughness: .95, side: THREE.DoubleSide, envMapIntensity: .2 });
  const rs = [];
  for (const sx of [-1, 1]) {
   const g = new THREE.BoxGeometry(Math.hypot(w / 2 + .5, 2.5), .32, d + 1.0, 16, 2, 16), p = g.attributes.position, uv = g.attributes.uv;
   for (let i = 0; i < p.count; i++) { const zz = p.getZ(i); p.setY(i, p.getY(i) - .12 * Math.cos(zz / (d + 1) * PI) + .03 * Math.sin(p.getX(i) * 7 + zz * 3)); }
   for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
   g.computeVertexNormals();
   const ang = Math.atan2(2.5, w / 2 + .5);
   g.applyMatrix4(M4(x + sx * (w / 2 + .5) / 2, h + 1.17, z, 0, 0, sx * -ang)); rs.push(g);
  }
  const rm = new THREE.Mesh(mergeG(rs), roofM); rm.castShadow = true; rm.receiveShadow = true; scene.add(rm);
  // the timber frame and the door
  const tb = [];
  for (const sx of [-1, 1]) tb.push(box(.16, h, .14, x + sx * (w / 2 - .08), h / 2, z + d / 2 + .02));
  tb.push(box(w, .16, .14, x, h - .08, z + d / 2 + .02), box(w, .14, .12, x, 1.25, z + d / 2 + .02));
  for (const sx of [-1, 1]) tb.push(box(.12, 1.6, .1, x + sx * 1.6, 1.9, z + d / 2 + .03, 0));
  tb.push(box(.9, .08, .14, x - 1.7, .95, z + d / 2 + .05), box(.9, .08, .14, x + 1.7, .95, z + d / 2 + .05));
  const door = box(.92, 1.75, .06, 0, .875, 0); door.applyMatrix4(M4(x + .46, 0, z + d / 2 + .02, 0, -.55, 0).multiply(M4(-.46, 0, 0))); tb.push(door);
  const tm = new THREE.Mesh(mergeG(tb), woodM); tm.castShadow = true; scene.add(tm);
  // the warm inside, seen through the doorway and the windows
  const warm = new THREE.MeshBasicMaterial({ color: CR(1, .55, .25).multiplyScalar(LIN ? 1.6 : .9) });
  const ins = [];
  { const g = new THREE.PlaneGeometry(.95, 1.78); g.translate(x, .89, z + d / 2 - .01); ins.push(g); }
  for (const sx of [-1, 1]) { const g = new THREE.PlaneGeometry(.62, .7); g.translate(x + sx * 1.7, 1.45, z + d / 2 + .005); ins.push(g); }
  { const g = new THREE.CircleGeometry(.42, 32); g.translate(x, h + .95, z + d / 2 + .005); ins.push(g); }
  scene.add(new THREE.Mesh(mergeG(ins), warm));
  // the window bars: a cross over each, a ring round the round one
  const bars = [];
  for (const sx of [-1, 1]) bars.push(box(.62, .04, .03, x + sx * 1.7, 1.45, z + d / 2 + .02), box(.04, .7, .03, x + sx * 1.7, 1.45, z + d / 2 + .02));
  bars.push(box(.84, .04, .03, x, h + .95, z + d / 2 + .02), box(.04, .84, .03, x, h + .95, z + d / 2 + .02));
  const ring = new THREE.TorusGeometry(.44, .05, 8, 40); ring.translate(x, h + .95, z + d / 2 + .03); bars.push(ring);
  scene.add(new THREE.Mesh(mergeG(bars), woodM));
  // the chimney
  const ch = box(.7, 2.0, .7, x + 1.9, h + 1.4, z - .6); scene.add(Object.assign(new THREE.Mesh(ch, wallM), { castShadow: true }));
 }
 // smoke from the chimney: soft puffs rising and spreading
 const SMOKE = [];
 {
  const c = cvs(128, 128), g = c.getContext('2d'), q = g.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(200,196,210,.5)'); q.addColorStop(1, 'rgba(200,196,210,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128);
  const t = tex(c);
  for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, color: CR(.5, .48, .56), opacity: 0 })); s.userData.ph = i / 14; scene.add(s); SMOKE.push(s); }
 }
 // the cauldron, on its tripod by the beds, a low fire under it
 {
  const g = [];
  const pot = new THREE.LatheGeometry([[0, -.2], [.18, -.18], [.26, -.06], [.27, .06], [.22, .16], [.24, .19]].map((p) => new THREE.Vector2(p[0], p[1])), 24); pot.translate(3.6, .55, 3.6); g.push(pot);
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU, leg = box(.04, 1.25, .04, 3.6 + Math.cos(a) * .32, .6, 3.6 + Math.sin(a) * .32); leg.applyMatrix4(new THREE.Matrix4()); g.push(leg); }
  scene.add(new THREE.Mesh(mergeG(g), ironM));
 }
 // ---------- trees: dark, round-crowned, a big old one with hanging moss; a ring of forest beyond ----------
 const leafM = new THREE.MeshStandardMaterial({ color: C('#1c2a26'), roughness: .95, flatShading: false, envMapIntensity: .2 });
 const barkM = new THREE.MeshStandardMaterial({ color: C('#2a221f'), roughness: .95, map: WOOD.map, normalMap: WOOD.normal });
 {
  const crowns = [], trunks = [];
  const tree = (x, z, s) => {
   const y = heightAt(x, z), tr = new THREE.CylinderGeometry(.18 * s, .32 * s, 3.4 * s, 8, 4); tr.translate(x, y + 1.7 * s, z); trunks.push(tr);
   for (let k = 0; k < 6; k++) { const g = new THREE.IcosahedronGeometry(rr(1.1, 1.8) * s, HQ ? 2 : 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + .18 * Math.sin(p.getX(i) * 3 + k) * Math.cos(p.getY(i) * 2.6 + p.getZ(i) * 2); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * .8, p.getZ(i) * f); } g.computeVertexNormals(); g.translate(x + rr(-1.3, 1.3) * s, y + rr(3.2, 4.8) * s, z + rr(-1.3, 1.3) * s); crowns.push(g); }
  };
  const spots = [[-8, -6, 1.2], [-10, 2, 1], [-9.5, 9, 1.1], [8.5, -5, 1.3], [10, 3.5, .9], [11, 10, 1.2], [-14, -12, 1.4], [14, -13, 1.3], [-4, -16, 1.2], [5, -17, 1.5], [-17, 6, 1.2], [17, 5, 1.1], [-12, 16, 1], [13, 17, 1.2], [0, 22, 1.3], [-6, 20, 1.1], [7, 21, 1]];
  for (const [x, z, s] of spots) tree(x, z, s);
  const tm = new THREE.Mesh(mergeG(trunks), barkM), cm = new THREE.Mesh(mergeG(crowns), leafM); tm.castShadow = cm.castShadow = true; tm.receiveShadow = cm.receiveShadow = true; scene.add(tm, cm);
  // moss hanging from the big tree behind on the right
  const moss = []; for (let i = 0; i < 70; i++) { const x = 8.5 + rr(-2, 2), z = -5 + rr(-2, 2), y = heightAt(8.5, -5) + rr(3.5, 5.2), l = rr(.6, 1.6); const g = new THREE.PlaneGeometry(.12, l, 1, 4); g.translate(0, -l / 2, 0); g.rotateY(rnd() * PI); g.translate(x, y, z); moss.push(g); }
  scene.add(new THREE.Mesh(mergeG(moss), new THREE.MeshStandardMaterial({ color: C('#56604c'), roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: .75 })));
  // the forest far off: a band of tree shapes round the horizon
  const c = cvs(2048, 256), g = c.getContext('2d'); g.fillStyle = '#000'; for (let x = 0; x < 2048; x += 6) { const h = 90 + 70 * Math.abs(Math.sin(x * .013)) + 40 * rnd(); g.beginPath(); g.moveTo(x - 14, 256); g.lineTo(x, 256 - h); g.lineTo(x + 14, 256); g.fill(); }
  const ft = tex(c, 6, 1); ft.encoding = THREE.LinearEncoding;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 22, 64, 1, true), new THREE.MeshBasicMaterial({ color: CR(.03, .035, .05), alphaMap: ft, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }));
  band.position.y = 9; band.renderOrder = -5; scene.add(band);
 }

 // ---------- the light ----------
 const hemi = new THREE.HemisphereLight(CR(.34, .34, .48), CR(.12, .1, .1), .55);
 const moon = new THREE.DirectionalLight(CR(.86, .88, 1), 1.25);
 moon.position.copy(moonDir).multiplyScalar(20); moon.target.position.set(0, .9, 0);
 moon.castShadow = true; moon.shadow.mapSize.set(HQ ? 2048 : 1024, HQ ? 2048 : 1024);
 Object.assign(moon.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 5, far: 40 }); moon.shadow.bias = -.0006; moon.shadow.normalBias = .02;
 // her lantern by the path: the warm key light on her, casting her shadow back toward the cottage
 const lamp = new THREE.SpotLight(CR(1, .74, .48), 2.0, 14, .75, .8, 2);
 lamp.position.set(1.25, 1.72, .85); lamp.target.position.set(0, .85, 0); lamp.castShadow = true; lamp.shadow.mapSize.set(HQ ? 1024 : 512, HQ ? 1024 : 512); lamp.shadow.bias = -.0008; lamp.shadow.normalBias = .02; lamp.shadow.camera.near = .3;
 const gateL = new THREE.PointLight(CR(1, .66, .38), 1.4, 9, 2); gateL.position.set(0, 1.55, 4.9);
 const doorL = new THREE.PointLight(CR(1, .6, .32), 2.4, 12, 2); doorL.position.set(0, 1.2, COT.z + COT.d / 2 + .6);
 const fill = new THREE.DirectionalLight(CR(.55, .5, .72), .25); fill.position.set(-2, 3, 6);
 scene.add(hemi, moon, moon.target, lamp, lamp.target, gateL, doorL, fill);
 const lights = { hemi, moon, lamp, gateL, doorL, fill };
 const BASE = { hemi: hemi.intensity, moon: moon.intensity, lamp: lamp.intensity, gateL: gateL.intensity, doorL: doorL.intensity, fill: fill.intensity };

 // ---------- what metal and glass reflect: the night painted plainly (MeshBasicMaterial only) ----------
 function envOf(studio) {
  const es = new THREE.Scene(), sg = new THREE.SphereGeometry(50, 48, 24), sp = sg.attributes.position, col = new Float32Array(sp.count * 3);
  const top = studio ? CR(.6, .6, .62) : CR(.035, .04, .09), hor = studio ? CR(.5, .5, .52) : CR(.13, .1, .2), bot = studio ? CR(.34, .34, .36) : CR(.03, .03, .03);
  for (let i = 0; i < sp.count; i++) { const h = sp.getY(i) / 50, c = h > 0 ? hor.clone().lerp(top, Math.min(1, h / .55)) : hor.clone().lerp(bot, Math.min(1, -h / .2)); col.set([c.r, c.g, c.b], i * 3); }
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const disc = (r, c, k, p) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(k) })); m.position.copy(p); m.lookAt(0, 0, 0); es.add(m); };
  if (studio) { disc(9, CR(1, 1, 1), 2.2, V3(10, 30, 26)); disc(12, CR(1, 1, 1), .8, V3(-28, 12, 18)); }
  else {
   disc(1.6, CR(.96, .95, .9), 18, moonDir.clone().multiplyScalar(40)); disc(6, CR(.24, .2, .34), .5, moonDir.clone().multiplyScalar(41));
   disc(1.4, CR(1, .6, .3), 5, V3(0, 2, -40)); disc(.9, CR(1, .6, .3), 4, V3(-14, 2, -38)); disc(.9, CR(1, .6, .3), 4, V3(14, 2, -38)); disc(.8, CR(1, .7, .4), 6, V3(18, 10, 22));
  }
  const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(es, 0, .1, 100).texture; pm.dispose(); return t;
 }
 const ENV = { night: envOf(false), studio: envOf(true) };
 scene.environment = ENV.night;
 // the studio: a plain grey room in which to see her as she is
 const studioG = new THREE.Group(); studioG.visible = false; scene.add(studioG);
 {
  const g = new THREE.CylinderGeometry(9, 9, 12, 64, 1, true), back = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: CR(.42, .42, .44), roughness: 1, side: THREE.BackSide })); back.position.y = 5.9;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: CR(.46, .46, .48), roughness: .95 })); floor.rotation.x = -PI / 2; floor.position.y = .002; floor.receiveShadow = true;
  studioG.add(back, floor);
 }
 const garden = scene.children.filter((o) => o !== studioG && !o.isLight && o !== moon.target && o !== lamp.target);
 // looks: 'night' (her lantern, the gate, the door and the moon), 'moon' (the lanterns out), 'studio'
 let LOOK = 'night';
 function look(name) {
  LOOK = name; const st = name === 'studio';
  for (const o of garden) o.visible = !st; studioG.visible = st;
  scene.environment = st ? ENV.studio : ENV.night;
  scene.fog.density = st ? 0 : .028; scene.background.copy(st ? CR(.42, .42, .44) : FOG);
  const lan = name === 'night' ? 1 : 0;
  hemi.intensity = st ? 1.1 : BASE.hemi; hemi.color.copy(st ? CR(.9, .9, .92) : CR(.34, .34, .48)); hemi.groundColor.copy(st ? CR(.45, .44, .44) : CR(.12, .1, .1));
  moon.intensity = st ? 1.6 : BASE.moon * (lan ? 1 : 1.25); moon.color.copy(st ? CR(1, 1, 1) : CR(.86, .88, 1));
  if (st) moon.position.set(3, 7, 9); else moon.position.copy(moonDir).multiplyScalar(20);
  lamp.intensity = st ? 1.2 : BASE.lamp * lan; lamp.color.copy(st ? CR(1, 1, 1) : CR(1, .74, .48));
  gateL.intensity = BASE.gateL * lan * (st ? 0 : 1); doorL.intensity = st ? 0 : BASE.doorL * (lan ? 1 : .8);
  fill.intensity = st ? .5 : BASE.fill; glowM.color.copy(CR(1, .62, .3).multiplyScalar(lan ? (LIN ? 3.2 : 1) : .05));
 }
 function update(t, dt) {
  WIND.uTime.value = t; SKY_U.uTime.value = t;
  for (const s of SMOKE) { const a = (t * .07 + s.userData.ph) % 1; s.position.set(COT.x + 1.9 + a * 1.4 + Math.sin(t * .3 + s.userData.ph * 9) * .2 * a, COT.h + 2.5 + a * 4, COT.z - .6 - a * .8); s.scale.setScalar(.5 + a * 2.6); s.material.opacity = Math.sin(PI * a) * .35 * (LOOK === 'studio' ? 0 : 1); s.material.rotation = s.userData.ph * 6 + a; }
  // the lanterns flicker a little
  if (LOOK === 'night') { const f = 1 + .05 * Math.sin(t * 11) + .04 * Math.sin(t * 17.3 + 1) + .03 * Math.sin(t * 5.1); lamp.intensity = BASE.lamp * f; gateL.intensity = BASE.gateL * (2 - f); }
 }
 return { scene, moonDir, heightAt, look, update, lamp, lights, wind: WIND.uWind, get look_() { return LOOK; } };
}
