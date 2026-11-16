// map3d.js: Aethermoor as a 3D model of the land (Chris, November 16: not the painting laid over a shape, but the world
// drawn in 3D, to turn and look round). Nothing of the painting is on it: the land is built from two small data pictures
// read off the atlas (tools/make-terrain.mjs): how high each spot stands, and what kind of ground it is. From those:
//   the land      a sheet of 576 x 384 squares lifted to the heights, coloured by its kind of ground (forest, grass,
//                 fields, fen, sand, desert, mesa, rock, snow), steep faces turning to bare rock, lit by the moon in facets
//   the sea       a flat sheet at sea level, pale in the shallows, dark in the deep, surf along the shores
//   rivers, lakes drawn on the land where they run
//   trees         tens of thousands of small 3D trees (pines, leafy trees, the fen's willows) where the forests are
//   the castle    Hearthstone Keep on its island, and a few lit roofs or a tower where each town and landmark is
// The four zones are the game's four level bands (World.BANDS). A zone not reached yet lies under a low mist that the
// peaks and towers stand out of; so does everything outside the four. A gold line rings the zone Io is in; her pin, a
// beam of moonlight, stands where she is.
// One finger turns and tilts the land; two fingers pinch to zoom, slide to move, twist to turn (a mouse: drag to turn,
// right-drag to move, wheel to zoom).
// Scale: one unit is one atlas pixel (10 m); heights are lifted EXAG times so the land reads from above.
// WorldMap.create(host, { art: { height: url, kinds: url }, open: [zones], io: { place, spot } }) -> map, with
//   map.ready (a promise), map.setIo(place, spot, fly), map.setOpen(zones), map.findIo(), map.flyTo(x, y, dist, s, yaw, tilt),
//   map.heightAt(ax, ay), map.kindAt(ax, ay), map.mist(0 to 1), map.numbers(), map.view (the camera's state), map.render()
// Needs three.js r128 (THREE), World (src/game/world.js) and MapPlaces (places.js).
(function () {
  'use strict';
  const AW = 4608, AH = 3072, EXAG = 1.25, DW = 1152, DH = 768, DS = 4; // the data pictures: one pixel = 4 atlas pixels
  const KIND = { sea: 0, river: 1, lake: 2, pine: 3, leafy: 4, grass: 5, farm: 6, fen: 7, sand: 8, desert: 9, mesa: 10, rock: 11, snow: 12 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  function loadPixels(url) {
    return new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); ok(g.getImageData(0, 0, DW, DH).data); };
      i.onerror = () => no(new Error('could not load the land')); i.src = url;
    });
  }
  // a random number from a seed, the same every time (so the trees stand in the same places on every phone)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---- the ground's colours by kind (by day; the shaders light them by the moon) ----
  const COLOR = {
    [KIND.river]: [0.11, 0.33, 0.56], [KIND.lake]: [0.10, 0.31, 0.54],
    [KIND.pine]: [0.09, 0.27, 0.17], [KIND.leafy]: [0.19, 0.42, 0.16], [KIND.grass]: [0.40, 0.56, 0.24], [KIND.fen]: [0.27, 0.36, 0.19],
    [KIND.sand]: [0.84, 0.78, 0.58], [KIND.desert]: [0.78, 0.62, 0.40], [KIND.mesa]: [0.66, 0.35, 0.22], [KIND.rock]: [0.47, 0.47, 0.50], [KIND.snow]: [0.93, 0.95, 1.0],
  };
  const FIELDS = [[0.66, 0.58, 0.22], [0.44, 0.60, 0.24], [0.74, 0.50, 0.20], [0.33, 0.50, 0.20], [0.58, 0.64, 0.28]];

  // ---- shader pieces shared by the land, the sea, the trees and the buildings ----
  const NOISE = `
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n2(p); p = p * 2.03 + 7.7; a *= 0.5; } return v; }`;
  // moonlight on a colour; then the mist over closed zones (low: what stands tall rises out of it), the zone lines, the
  // gold ring round Io's zone, and the night's haze with distance
  const FINISH = `
    uniform sampler2D zones; uniform vec4 uOpen, uHere; uniform vec3 uMoon, uFog, uMist; uniform float uTime, uFogNear, uFogFar, uGlow, uPierce, uMistAmt;
    ${NOISE}
    vec3 moonlit(vec3 albedo, vec3 n) {
      float l = dot(n, uMoon);
      return albedo * (vec3(0.30, 0.35, 0.52) + vec3(0.92, 0.94, 1.0) * max(l, 0.0) * 0.95 + vec3(0.05, 0.06, 0.10) * max(n.y, 0.0));
    }
    vec3 finish(vec3 c, vec3 wp, float depth, float lines) {
      vec2 at = vec2((wp.x + ${AW / 2}.0) / ${AW}.0, (wp.z + ${AH / 2}.0) / ${AH}.0);
      vec4 z = texture2D(zones, at);
      float inMap = step(0.0, at.x) * step(at.x, 1.0) * step(0.0, at.y) * step(at.y, 1.0);
      vec2 drift = vec2(uTime * 0.004, uTime * 0.0015);
      float n = fbm(at * vec2(14.0, 9.3) + drift), nb = fbm(at * vec2(31.0, 21.0) - drift * 1.7);
      // the mist's edge is ragged and soft (the zones' own edges are straight lines): read a little to each side
      vec2 wob = (vec2(nb, fbm(at * vec2(27.0, 19.0) + 3.1 + drift)) - 0.5) * 0.05, o = vec2(0.011, 0.0);
      vec4 zs = (texture2D(zones, at + wob + o) + texture2D(zones, at + wob - o) + texture2D(zones, at + wob + o.yx * 1.5) + texture2D(zones, at + wob - o.yx * 1.5)) * 0.25;
      // (no mist past the map's edges, fading in over the last of the map; tall ground stands half out of it)
      vec2 e2 = min(at, 1.0 - at); float inner = smoothstep(0.0, 0.05, min(e2.x, e2.y * 1.5)) * inMap;
      float open = clamp(dot(zs, uOpen), 0.0, 1.0), mist = (1.0 - open) * inner * (1.0 - uPierce * smoothstep(26.0, 130.0, wp.y)) * (1.0 - 0.5 * step(0.9, uPierce)) * uMistAmt;
      c = mix(c, uMist * (0.7 + 0.55 * n + 0.2 * nb), mist * clamp(0.55 + 0.4 * n, 0.0, 0.9));
      if (lines > 0.5) {
        float sum = z.r + z.g + z.b + z.a;
        float meet = max(max(max(z.r * z.g, z.g * z.b), max(z.b * z.a, z.r * z.a)), max(z.r * z.b, z.g * z.a));
        float line = smoothstep(0.215, 0.245, meet) + smoothstep(0.22, 0.248, sum * (1.0 - sum)) * step(0.02, sum);
        c += vec3(0.62, 0.66, 0.85) * clamp(line, 0.0, 1.0) * 0.16 * inMap;
        float m = dot(z, uHere), ring = smoothstep(0.215, 0.245, m * (1.0 - m));
        c = mix(c, vec3(1.0, 0.84, 0.5), ring * (0.42 + 0.2 * uGlow) * inMap);
      }
      return mix(c, uFog, smoothstep(uFogNear, uFogFar, depth));
    }`;
  const LAND_V = `
    attribute vec3 snormal;
    varying vec3 vW, vN; varying float vDepth;
    void main() { vW = position; vN = snormal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const LAND_F = `
    uniform sampler2D ground;
    varying vec3 vW, vN; varying float vDepth;
    ${FINISH}
    void main() {
      vec2 at = vec2((vW.x + ${AW / 2}.0) / ${AW}.0, (vW.z + ${AH / 2}.0) / ${AH}.0);
      vec4 g = texture2D(ground, at);
      // each little face of the land catches the moon its own way (close up); far off, the land's smooth slope
      vec3 face = normalize(cross(dFdx(vW), dFdy(vW))); if (face.y < 0.0) face = -face;
      vec3 n = normalize(mix(face, normalize(vN), smoothstep(1400.0, 4200.0, vDepth)));
      // steep ground is bare rock, whatever grows round it; water only lies where the ground is near level (g.a is 1 on
      // a river or a lake: on a steep face that is the paint of the bank's edge, so it is rock too)
      float steep = smoothstep(0.26, 0.5, 1.0 - face.y), wet = g.a * (1.0 - steep);
      vec3 c = mix(g.rgb, vec3(0.44, 0.44, 0.47), g.a * steep) * (0.9 + 0.2 * n2(vW.xz * 0.35));
      c = mix(c, mix(vec3(0.40, 0.40, 0.44), c * 0.62, 0.45), steep);
      c = moonlit(c, n);
      c += wet * vec3(0.06, 0.09, 0.15) * (0.5 + 0.5 * n2(vW.xz * 0.6 + uTime * vec2(0.5, 0.3))); // the water's shimmer
      gl_FragColor = vec4(finish(c, vW, vDepth, 1.0), 1.0);
    }`;
  const SEA_V = 'varying vec3 vW; varying float vDepth; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }';
  const SEA_F = `
    uniform sampler2D depths; uniform vec3 uEye;
    varying vec3 vW; varying float vDepth;
    ${FINISH}
    void main() {
      vec2 at = vec2((vW.x + ${AW / 2}.0) / ${AW}.0, (vW.z + ${AH / 2}.0) / ${AH}.0);
      float inMap = step(0.0, at.x) * step(at.x, 1.0) * step(0.0, at.y) * step(at.y, 1.0);
      vec2 e3 = min(at, 1.0 - at); float inner3 = smoothstep(0.0, 0.03, min(e3.x, e3.y * 1.5)) * inMap;
      float d = mix(1.0, texture2D(depths, clamp(at, 0.0, 1.0)).r, inner3); // 0 at the shore, 1 in the deep (and past the map's edge)
      vec3 c = mix(vec3(0.10, 0.36, 0.46), vec3(0.035, 0.085, 0.22), smoothstep(0.0, 0.75, d));
      // small waves, the moon's glitter on them, and surf where the water is shallowest
      vec2 p = vW.xz * 0.05; float w = n2(p * 3.0 + uTime * vec2(0.35, 0.2)) + 0.5 * n2(p * 7.0 - uTime * vec2(0.3, 0.45));
      vec3 n = normalize(vec3((w - 0.75) * 0.22, 1.0, (n2(p * 3.0 + 9.0 + uTime * 0.3) - 0.5) * 0.22));
      vec3 v = normalize(uEye - vW), hlf = normalize(v + uMoon);
      float nearBy = 1.0 - smoothstep(1200.0, 5000.0, vDepth); // far off the waves are too small to see: no glitter, no flicker
      c = c * (0.9 + (0.3 * w - 0.15) * nearBy) + vec3(0.75, 0.8, 1.0) * pow(max(dot(n, hlf), 0.0), 60.0) * 0.4 * nearBy;
      float surf = (1.0 - smoothstep(0.02, 0.11 + 0.05 * sin(uTime * 0.9 + w * 6.0), d)) * inMap;
      c = mix(c, vec3(0.80, 0.86, 0.95), surf * (0.45 + 0.4 * n2(vW.xz * 0.4 + uTime * 0.4)));
      gl_FragColor = vec4(finish(c, vW, vDepth, 1.0), 1.0);
    }`;
  // trees (one shape drawn thousands of times, each with its own colour) and buildings (one mesh, a colour per corner)
  const THING_V = `
    #ifdef USE_INSTANCING_COLOR
      varying vec3 vC;
    #else
      attribute vec3 acolor; varying vec3 vC;
    #endif
    varying vec3 vW; varying float vDepth;
    void main() {
      #ifdef USE_INSTANCING
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
      #else
        vec4 w = modelMatrix * vec4(position, 1.0);
      #endif
      #ifdef USE_INSTANCING_COLOR
        vC = instanceColor;
      #else
        vC = acolor;
      #endif
      vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
    }`;
  const THING_F = `
    varying vec3 vC, vW; varying float vDepth;
    ${FINISH}
    void main() {
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      gl_FragColor = vec4(finish(moonlit(vC, n), vW, vDepth, 0.0), 1.0);
    }`;
  // the towns' lit windows: small warm points, dimmed under the mist
  const GLOW_V = `
    uniform sampler2D zones; uniform vec4 uOpen; uniform float uTime, uSize;
    attribute float seed; varying float vA;
    void main() {
      vec2 at = vec2((position.x + ${AW / 2}.0) / ${AW}.0, (position.z + ${AH / 2}.0) / ${AH}.0);
      float open = clamp(dot(texture2D(zones, at), uOpen), 0.0, 1.0);
      vA = (0.25 + 0.75 * open) * (0.8 + 0.2 * sin(uTime * (1.0 + seed * 2.0) + seed * 40.0));
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = clamp(uSize / -mv.z, 1.6, 9.0); gl_Position = projectionMatrix * mv;
    }`;
  const GLOW_F = 'varying float vA; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = (1.0 - smoothstep(0.2, 1.0, d)) * vA; gl_FragColor = vec4(vec3(1.0, 0.78, 0.42) * a, a); }';

  // each zone's share of every spot on the map (red, green, blue, alpha: zones 1 to 4), softened at the edges
  function zoneTexture() {
    const W = 576, H = 384, N = W * H, ch = [1, 2, 3, 4].map(() => new Float32Array(N));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const b = World.bandAt((x + 0.5) * AW / W, (y + 0.5) * AH / H); if (b) ch[b - 1][y * W + x] = 1; }
    const tmp = new Float32Array(N), r = 1;
    for (const a of ch) for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += a[y * W + clamp(x, 0, W - 1)]; for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)]; } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, H - 1) * W + x]; for (let y = 0; y < H; y++) { a[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
    }
    const data = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) data[i * 4 + k] = Math.round(ch[k][i] * 255);
    const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
    return t;
  }

  // ---- small builders for the buildings: plain shapes with a colour, joined into one mesh ----
  function Parts() {
    const pos = [], col = [];
    const put = (geo, m, c) => {
      const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m);
      const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); col.push(c[0], c[1], c[2]); }
      g.dispose();
    };
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    const at = (x, y, z, ry, sx, sy, sz) => M.compose(new THREE.Vector3(x, y, z), Q.setFromAxisAngle(UP, ry || 0), new THREE.Vector3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz));
    return {
      // a box standing on y, w wide (x), h tall, d deep (z), turned ry
      box(x, y, z, w, h, d, ry, c) { put(new THREE.BoxGeometry(w, h, d), at(x, y + h / 2, z, ry), c); },
      // a round or many-sided tower or roof: r0 at the top, r1 at the foot
      drum(x, y, z, r0, r1, h, sides, c, ry) { put(new THREE.CylinderGeometry(r0, r1, h, sides, 1, r0 > 0), at(x, y + h / 2, z, ry || 0), c); },
      // a house: walls (sunk a little into the ground, for slopes) and a hipped roof
      house(x, y, z, w, h, d, ry, wall, roof) {
        this.box(x, y - 6, z, w, h + 6, d, ry, wall);
        put(new THREE.CylinderGeometry(0, 0.72, 1, 4, 1, true), at(x, y + h + h * 0.33, z, ry + Math.PI / 4, w, h * 0.66, d), roof);
      },
      mesh(material) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('acolor', new THREE.Float32BufferAttribute(col, 3));
        g.computeBoundingSphere(); return new THREE.Mesh(g, material);
      },
      get triangles() { return pos.length / 9; },
    };
  }

  function create(host, opts) {
    const P = window.MapPlaces, art = opts.art;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    let pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x0b0d22);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 5, 80000);
    const labels = el('div', 'map-labels', host);
    const FOG = new THREE.Color(0x141936), MIST = new THREE.Color(0x6f76a0);
    const MOON = new THREE.Vector3(-0.55, 0.62, -0.56).normalize();
    let Hf = null, Kd = null; // the heights (atlas pixels, not yet lifted) and the kinds, DW x DH
    function rawHeight(ax, ay) {
      const fx = clamp(ax / DS - 0.5, 0, DW - 1.001), fy = clamp(ay / DS - 0.5, 0, DH - 1.001), x = fx | 0, y = fy | 0, tx = fx - x, ty = fy - y, i = y * DW + x;
      return (Hf[i] * (1 - tx) + Hf[i + 1] * tx) * (1 - ty) + (Hf[i + DW] * (1 - tx) + Hf[i + DW + 1] * tx) * ty;
    }
    const heightAt = (ax, ay) => (Hf ? rawHeight(ax, ay) * EXAG : 0); // in scene units; below 0 is under the sea
    const groundAt = (ax, ay) => Math.max(0, heightAt(ax, ay)); // what a thing would stand on (the sea's top, at sea)
    const kindAt = (ax, ay) => (Kd ? Kd[clamp(Math.floor(ay / DS), 0, DH - 1) * DW + clamp(Math.floor(ax / DS), 0, DW - 1)] : 0);
    const W3 = (ax, ay, lift) => new THREE.Vector3(ax - AW / 2, groundAt(ax, ay) + (lift || 0), ay - AH / 2);

    const uniforms = {
      zones: { value: null }, uOpen: { value: new THREE.Vector4() }, uHere: { value: new THREE.Vector4() },
      uMoon: { value: MOON }, uFog: { value: FOG }, uMist: { value: MIST },
      uTime: { value: 0 }, uFogNear: { value: 0 }, uFogFar: { value: 1 }, uGlow: { value: 0 },
      uMistAmt: { value: 1 }, // 1: mist over the closed zones; 0: none (map.mist(0), to see the whole land)
      uPierce: { value: 0.55 }, // how far tall things stand out of the mist (buildings: 1, and half the mist)
    };
    // every material shares the same uniform objects, so one change reaches them all
    const material = (vs, fs, extra, o) => new THREE.ShaderMaterial(Object.assign({ uniforms: Object.assign({}, uniforms, extra || {}), vertexShader: vs, fragmentShader: fs, extensions: { derivatives: true } }, o || {}));

    // ---- the sky: a deep blue dome, stars, and the moon high in the north-west ----
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uMoon: { value: MOON } },
      vertexShader: 'varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uMoon;
        void main() { vec3 d = normalize(vD); float h = d.y, s = max(dot(d, uMoon), 0.0);
          vec3 c = mix(vec3(0.078, 0.098, 0.212), vec3(0.03, 0.035, 0.1), smoothstep(0.0, 0.7, h));
          c += vec3(0.25, 0.27, 0.42) * pow(s, 24.0) * 0.5 + vec3(0.6, 0.62, 0.8) * pow(s, 400.0);
          c = mix(c, vec3(0.078, 0.098, 0.212), smoothstep(0.02, -0.3, h));
          gl_FragColor = vec4(c, 1.0); }`,
    }));
    sky.scale.setScalar(60000); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
    {
      const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), R = rng(7);
      for (let i = 0; i < n; i++) {
        const u = R(), v = R() * 0.92 + 0.08, th = u * Math.PI * 2, r = Math.sqrt(1 - v * v);
        pos.set([Math.cos(th) * r * 50000, v * 50000, Math.sin(th) * r * 50000], i * 3);
        const b = 0.45 + R() * 0.55; col.set([b * 0.9, b * 0.92, b], i * 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: 0.85 }));
      stars.frustumCulled = false; stars.renderOrder = -9; scene.add(stars);
      const mc = document.createElement('canvas'); mc.width = mc.height = 128; const g2 = mc.getContext('2d');
      const grd = g2.createRadialGradient(64, 64, 10, 64, 64, 64); grd.addColorStop(0, 'rgba(230,232,255,.55)'); grd.addColorStop(0.4, 'rgba(160,170,230,.12)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g2.fillStyle = grd; g2.fillRect(0, 0, 128, 128); g2.fillStyle = '#f2f0ff'; g2.beginPath(); g2.arc(64, 64, 15, 0, 7); g2.fill();
      g2.fillStyle = 'rgba(190,190,215,.5)'; for (const [x, y, r] of [[58, 60, 4], [70, 68, 3], [66, 55, 2]]) { g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.fill(); }
      const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(mc), fog: false, depthWrite: false, transparent: true }));
      moon.position.copy(MOON).multiplyScalar(48000); moon.scale.setScalar(9000); moon.renderOrder = -8; scene.add(moon);
    }

    // ---- the land ----
    const landMeshes = [], stats = { trees: 0, houses: 0 };
    function buildLand() {
      // the ground's colour, a pixel for each data pixel: its kind's colour, the fields in a patchwork; alpha: a river or lake
      const tex = new Uint8Array(DW * DH * 4), dep = new Uint8Array(DW * DH * 4);
      for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
        // (where the data says sea but the land's sheet pokes up a little, a shore: sand)
        const i = y * DW + x, k = Kd[i]; let c = COLOR[k] || COLOR[KIND.sand];
        if (k === KIND.farm) { // fields of about 200 m by 160 m, each its own crop, with a darker hedge between
          const fx = (x + hash2(y >> 3, 5) * 3) / 5, fy = (y + hash2(x >> 3, 9) * 3) / 4, cx = Math.floor(fx), cy = Math.floor(fy);
          c = FIELDS[Math.floor(hash2(cx, cy) * FIELDS.length)];
          if (fx - cx < 0.16 || fy - cy < 0.2) c = [0.2, 0.36, 0.17];
        }
        if ((k === KIND.river || k === KIND.lake) && x > 3 && y > 3 && x < DW - 4 && y < DH - 4 && (Kd[i - 3] === KIND.fen || Kd[i + 3] === KIND.fen || Kd[i - 3 * DW] === KIND.fen || Kd[i + 3 * DW] === KIND.fen)) c = [0.09, 0.22, 0.27]; // the fen's dark pools
        const v = 0.92 + 0.16 * hash2(x, y);
        tex[i * 4] = clamp(c[0] * v, 0, 1) * 255; tex[i * 4 + 1] = clamp(c[1] * v, 0, 1) * 255; tex[i * 4 + 2] = clamp(c[2] * v, 0, 1) * 255;
        tex[i * 4 + 3] = k === KIND.river || k === KIND.lake ? 255 : 0;
        dep[i * 4] = clamp(-Hf[i] / 30, 0, 1) * 255; dep[i * 4 + 3] = 255;
      }
      const two = renderer.capabilities.isWebGL2;
      const ground = new THREE.DataTexture(tex, DW, DH, THREE.RGBAFormat); ground.magFilter = THREE.LinearFilter; ground.minFilter = two ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; ground.generateMipmaps = two; ground.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); ground.needsUpdate = true;
      const depths = new THREE.DataTexture(dep, DW, DH, THREE.RGBAFormat); depths.magFilter = depths.minFilter = THREE.LinearFilter; depths.needsUpdate = true;
      // the sheet: 576 x 384 squares in sixteen pieces (so what's off the screen isn't drawn)
      const nx = 144, ny = 96, mat = material(LAND_V, LAND_F, { ground: { value: ground } });
      for (let q = 0; q < 16; q++) {
        const qx = (q % 4) * 1152, qy = Math.floor(q / 4) * 768;
        const g = new THREE.PlaneGeometry(1152, 768, nx, ny); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position, nrm = new Float32Array(p.count * 3), v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          const ax = p.getX(i) + 576 + qx, ay = p.getZ(i) + 384 + qy;
          p.setXYZ(i, ax - AW / 2, heightAt(ax, ay), ay - AH / 2);
          const s = 8, dx = heightAt(ax + s, ay) - heightAt(ax - s, ay), dz = heightAt(ax, ay + s) - heightAt(ax, ay - s);
          v.set(-dx, 2 * s, -dz).normalize(); nrm.set([v.x, v.y, v.z], i * 3);
        }
        g.deleteAttribute('normal'); g.deleteAttribute('uv');
        g.setAttribute('snormal', new THREE.BufferAttribute(nrm, 3)); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, mat); scene.add(mesh); landMeshes.push(mesh);
      }
      // the sea: one flat sheet at sea level, far past the map's edges
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), material(SEA_V, SEA_F, { depths: { value: depths }, uEye: { value: camera.position } }));
      sea.rotation.x = -Math.PI / 2; scene.add(sea);
    }

    // ---- the trees: stood where the forests are, in patches of the map so the far ones needn't be drawn ----
    const treePatches = [];
    function buildTrees() {
      const R = rng(1911), SP = 8.5, CX = 6, CY = 4, cw = AW / CX, chh = AH / CY;
      const lists = { pine: [], leafy: [] }; for (const k in lists) for (let i = 0; i < CX * CY; i++) lists[k].push([]);
      // how likely a tree stands on each kind of ground, and how likely that tree is a pine
      const ODDS = { [KIND.pine]: [0.95, 0.9], [KIND.leafy]: [0.9, 0.12], [KIND.fen]: [0.34, 0.2], [KIND.grass]: [0.05, 0.4], [KIND.farm]: [0.02, 0.2], [KIND.rock]: [0.1, 0.9], [KIND.sand]: [0.02, 0.3], [KIND.desert]: [0.012, 0.2], [KIND.mesa]: [0.02, 0.5], [KIND.snow]: [0.02, 1] };
      for (let gy = 0; gy < AH / SP; gy++) for (let gx = 0; gx < AW / SP; gx++) {
        const ax = (gx + R()) * SP, ay = (gy + R()) * SP, r1 = R(), r2 = R(), r3 = R(), r4 = R();
        if (ax < 12 || ay < 12 || ax > AW - 12 || ay > AH - 12) continue;
        const k = kindAt(ax, ay), o = ODDS[k]; if (!o || r1 > o[0]) continue;
        const h = rawHeight(ax, ay); if (h < 0.9) continue;
        // not on a cliff face, and thinning out up the mountains
        const slope = Math.hypot(rawHeight(ax + 6, ay) - rawHeight(ax - 6, ay), rawHeight(ax, ay + 6) - rawHeight(ax, ay - 6)) / 12;
        if (slope > 0.85 || (k === KIND.rock && h > 150) || (k === KIND.snow && h > 120)) continue;
        const pine = r2 < o[1], size = 0.75 + r3 * 0.6, fen = k === KIND.fen, dry = k === KIND.desert || k === KIND.mesa;
        const c = pine ? [0.07 + r4 * 0.05, 0.22 + r4 * 0.1, 0.15 + r4 * 0.05] : fen ? [0.30 + r4 * 0.1, 0.42 + r4 * 0.08, 0.2] : dry ? [0.36, 0.42 + r4 * 0.06, 0.2] : [0.16 + r4 * 0.1, 0.4 + r4 * 0.14, 0.13 + r4 * 0.05];
        lists[pine ? 'pine' : 'leafy'][clamp(Math.floor(ay / chh), 0, CY - 1) * CX + clamp(Math.floor(ax / cw), 0, CX - 1)].push([ax, ay, size * (dry ? 0.6 : 1), r4 * 6.28, c]);
      }
      // a pine: two cones, one on the other; a leafy tree: a round crown, a ring of faces under a low cap (both stand on
      // y = 0). Built by hand, a triangle per face, so nothing is drawn that can't be seen
      const ringAt = (r, y, n, i) => [Math.cos(i / n * 6.2832) * r, y, Math.sin(i / n * 6.2832) * r];
      const cone = (r, h, y, n) => { const p = []; for (let i = 0; i < n; i++) p.push(0, y + h, 0, ...ringAt(r, y, n, i + 1), ...ringAt(r, y, n, i)); return p; };
      const band = (r0, y0, r1, y1, n) => { const p = []; for (let i = 0; i < n; i++) { const a = ringAt(r0, y0, n, i), b = ringAt(r0, y0, n, i + 1), c = ringAt(r1, y1, n, i), d = ringAt(r1, y1, n, i + 1); p.push(...a, ...c, ...b, ...b, ...c, ...d); } return p; };
      const shape = (...ps) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([].concat(...ps), 3)); return g; };
      const pineGeo = shape(cone(3.3, 6.5, 0.6, 5), cone(2.2, 5.5, 4.6, 5)); // 10 triangles
      const leafGeo = shape(band(2.5, 1.0, 3.4, 3.4, 6), cone(3.4, 2.6, 3.4, 6)); // 18 triangles
      const mat = material(THING_V, THING_F, null, { side: THREE.DoubleSide }), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), S = new THREE.Vector3(), T = new THREE.Vector3(), C = new THREE.Color();
      for (const [kind, geo] of [['pine', pineGeo], ['leafy', leafGeo]]) for (let ci = 0; ci < CX * CY; ci++) {
        const list = lists[kind][ci]; if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(geo, mat, list.length); let top = 0;
        list.forEach(([ax, ay, size, ry, c], i) => {
          const y = heightAt(ax, ay); top = Math.max(top, y);
          M.compose(T.set(ax - AW / 2, y - 0.3, ay - AH / 2), Q.setFromAxisAngle(UP, ry), S.set(size, size * (kind === 'pine' ? 1.15 : 1), size));
          mesh.setMatrixAt(i, M); mesh.setColorAt(i, C.setRGB(c[0], c[1], c[2]));
        });
        mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.frustumCulled = false; // (an instanced mesh's own bounds are its one shape's: the patch is tested below instead)
        const cx = (ci % CX + 0.5) * cw - AW / 2, cz = (Math.floor(ci / CX) + 0.5) * chh - AH / 2;
        mesh.userData.sphere = new THREE.Sphere(new THREE.Vector3(cx, top / 2, cz), Math.hypot(cw, chh) / 2 + top / 2 + 20);
        scene.add(mesh); treePatches.push(mesh); stats.trees += list.length;
      }
    }

    // ---- the castle, and a little of each town and landmark (at this height a town is a few roofs and their lights) ----
    function buildPlaces() {
      const parts = Parts(), R = rng(404), glow = [];
      const STONE = [0.62, 0.60, 0.58], DARKSTONE = [0.46, 0.45, 0.47], SLATE = [0.24, 0.29, 0.45], TILE = [0.58, 0.26, 0.20], WOOD = [0.42, 0.30, 0.20], PLASTER = [0.72, 0.66, 0.56], THATCH = [0.50, 0.42, 0.26];
      const gy = (x, y) => groundAt(x, y);
      const tower = (x, y, r, h, wall, roof, sides) => { const g = gy(x, y); parts.drum(x - AW / 2, g - 8, y - AH / 2, r, r * 1.08, h + 8, sides || 7, wall); parts.drum(x - AW / 2, g + h, y - AH / 2, 0, r * 1.25, r * 2.1, sides || 7, roof); glow.push([x, g + h * 0.72, y]); };
      const house = (x, y, s, wall, roof) => { if (rawHeight(x, y) < 0.6) return false; const g = gy(x, y), w = (4.6 + R() * 2.4) * s, d = (3.4 + R() * 1.4) * s, h = (2.6 + R() * 1.2) * s; parts.house(x - AW / 2, g, y - AH / 2, w, h, d, R() * 3.14, wall, roof); if (R() < 0.7) glow.push([x, g + h * 0.7, y]); stats.houses++; return true; };
      const cluster = (x, y, n, spread, s, wall, roof) => { let made = 0; for (let t = 0; t < n * 6 && made < n; t++) { const a = R() * 6.28, r = Math.sqrt(R()) * spread; if (house(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, s, wall, roof)) made++; } };
      // Hearthstone Keep (atlas 2340, 1240): a ring wall with towers, the keep and its spires, houses within, lights
      {
        const cx = 2340, cy = 1240, RW = 44, n = 10;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * 6.283, a1 = (i + 1) / n * 6.283, x0 = cx + Math.cos(a0) * RW, y0 = cy + Math.sin(a0) * RW * 0.8, x1 = cx + Math.cos(a1) * RW, y1 = cy + Math.sin(a1) * RW * 0.8;
          const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0), g = Math.max(gy(mx, my), gy(x0, y0), gy(x1, y1));
          parts.box(mx - AW / 2, g - 14, my - AH / 2, len + 1, 22, 3.2, -Math.atan2(y1 - y0, x1 - x0), STONE);
          tower(x0, y0, 4.2, 15 + (i % 2) * 4, STONE, SLATE);
        }
        const g = gy(cx, cy);
        parts.box(cx - AW / 2, g - 12, cy - AH / 2, 24, 34, 20, 0.2, STONE);
        parts.drum(cx - AW / 2, g + 22, cy - AH / 2, 0, 16, 9, 4, SLATE, 0.2 + Math.PI / 4);
        for (const [dx, dy, h] of [[-13, -10, 34], [13, -10, 40], [-13, 10, 30], [13, 10, 36]]) tower(cx + dx, cy + dy, 3.6, h - (gy(cx + dx, cy + dy) - g), STONE, SLATE);
        tower(cx + 2, cy - 1, 5.2, 52, DARKSTONE, SLATE, 8);
        for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 16 + R() * 22; house(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 0.95, PLASTER, R() < 0.6 ? TILE : SLATE); }
        for (let i = 0; i < 14; i++) { const a = R() * 6.28; glow.push([cx + Math.cos(a) * 40, g + 6 + R() * 26, cy + Math.sin(a) * 30]); }
      }
      // the towns and landmarks, where the atlas has them (texture-packs/world/aethermoor/inventory.md):
      // ['town', x, y, houses, spread, walls, roofs, its tower's height or 0] or ['tower', x, y, radius, height, walls, roof]
      const T = [
        ['town', 1348, 1838, 12, 30, PLASTER, TILE, 13], ['town', 1752, 2512, 10, 30, WOOD, THATCH, 14], ['town', 1325, 1098, 14, 30, STONE, TILE, 13],
        ['town', 2097, 599, 8, 24, STONE, SLATE, 17], ['town', 3500, 735, 12, 30, DARKSTONE, SLATE, 15], ['town', 990, 728, 6, 22, PLASTER, THATCH, 0],
        ['town', 3790, 538, 8, 24, STONE, SLATE, 13], ['town', 2898, 2588, 6, 24, WOOD, THATCH, 0], ['town', 3560, 2108, 6, 22, PLASTER, THATCH, 0],
        ['tower', 1138, 2318, 3.2, 16, [0.5, 0.33, 0.27], TILE], ['tower', 2914, 212, 3.4, 20, STONE, SLATE], ['tower', 1525, 905, 3, 12, STONE, SLATE],
        ['tower', 4040, 1818, 2.2, 24, [0.74, 0.6, 0.42], TILE], ['tower', 4062, 1828, 2.2, 21, [0.74, 0.6, 0.42], TILE], ['tower', 3525, 1588, 4.4, 8, [0.74, 0.6, 0.42], [0.62, 0.5, 0.36]],
      ];
      for (const t of T) {
        if (t[0] === 'town') { cluster(t[1], t[2], t[3], t[4], 1, t[5], t[6]); if (t[7]) tower(t[1] + 4, t[2] - 3, 2.8, t[7], t[5], t[6]); }
        else tower(t[1], t[2], t[3], t[4], t[5], t[6]);
      }
      // (the castle and the towers show through the mist more than the land does: they are what to steer by)
      const mesh = parts.mesh(material(THING_V, THING_F, { uPierce: { value: 1 } }, { side: THREE.DoubleSide })); scene.add(mesh); stats.buildingTriangles = parts.triangles;
      const g = new THREE.BufferGeometry(), pos = new Float32Array(glow.length * 3), seed = new Float32Array(glow.length);
      glow.forEach(([x, y, z], i) => { pos.set([x - AW / 2, y, z - AH / 2], i * 3); seed[i] = R(); });
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
      const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { zones: uniforms.zones, uOpen: uniforms.uOpen, uTime: uniforms.uTime, uSize: { value: 2600 } }, vertexShader: GLOW_V, fragmentShader: GLOW_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pts.frustumCulled = false; scene.add(pts); stats.lights = glow.length;
    }

    // ---- Io's pin: a beam of moonlight, a ring on the ground, a crescent at the top ----
    const io = new THREE.Group(); io.visible = false; scene.add(io);
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: uniforms.uTime },
      vertexShader: 'varying float vY; void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uTime; varying float vY; void main() { float a = (1.0 - vY) * (0.55 + 0.1 * sin(uTime * 2.0 - vY * 9.0)); gl_FragColor = vec4(vec3(0.78, 0.76, 1.0) * a, a); }',
    });
    const beamGeo = new THREE.CylinderGeometry(0.25, 1, 1, 20, 8, true); beamGeo.translate(0, 0.5, 0);
    const beam = new THREE.Mesh(beamGeo, beamMat); io.add(beam);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd6d0ff, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), ringMat); ring.rotation.x = -Math.PI / 2; io.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 32), ringMat.clone()); ring2.rotation.x = -Math.PI / 2; ring2.material.opacity = 0.95; io.add(ring2);
    const crescent = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 6, 64, 64, 64); grd.addColorStop(0, 'rgba(220,214,255,.75)'); grd.addColorStop(0.45, 'rgba(160,150,255,.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#fbf8ff'; g.beginPath(); g.arc(64, 64, 26, 0, 7); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(76, 56, 22, 0, 7); g.fill();
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, depthWrite: false, transparent: true, fog: false }));
      s.renderOrder = 5; return s;
    })();
    io.add(crescent);
    let ioAt = null, ioPlace = null;

    // ---- names over the map, placed each frame where their spot shows on the screen ----
    const tags = [];
    function tag(text, kind, ax, ay, lift, extra) {
      const d = el('div', 'map-tag ' + kind, labels);
      if (kind === 'io') { el('b', null, d, 'Io'); el('span', null, d, text); } else d.textContent = text;
      const t = Object.assign({ d, kind: kind.split(' ')[0], ax, ay, lift: lift || 0, show: true, pos: W3(ax, ay, lift) }, extra || {}); tags.push(t); return t;
    }
    let ioTag = null;
    function makeTags() {
      for (const [id, l] of Object.entries(P.LANDINGS)) tag(l.name, 'landing', l.sky[0], l.sky[1], 14, { zone: l.zone, id });
      const landed = new Set(Object.values(P.LANDINGS).map((l) => l.place));
      for (const [id, p] of Object.entries(P.PLACES)) tag(p.name, 'place' + (landed.has(id) ? ' lands' : ''), p.at[0], p.at[1], 12, { zone: p.zone, id });
      for (const [z, Z] of Object.entries(P.ZONES)) {
        const ps = Z.places.map((id) => P.PLACES[id].at), cx = ps.reduce((a, p) => a + p[0], 0) / ps.length, cy = ps.reduce((a, p) => a + p[1], 0) / ps.length;
        tag(Z.name, 'zone', cx, cy - 70, 90, { zone: +z });
      }
      ioTag = tag('', 'io', 0, 0, 0);
    }

    // ---- the camera: it looks at a spot on the land from `dist` away, turned by `yaw` (0: north is up the screen) and
    // lifted by `tilt` (radians above the ground: low looks across the land, high looks down on it) ----
    const C = { x: AW / 2, y: AH / 2, dist: 1e6, yaw: 0, tilt: 0.95, gy: 0 }; // it opens on the whole map (clamped to DMAX)
    const DMIN = 150, TMIN = 0.16, TMAX = 1.5; let DMAX = 6200;
    function placeCamera() {
      C.x = clamp(C.x, 0, AW); C.y = clamp(C.y, 0, AH); C.dist = clamp(C.dist, DMIN, DMAX); C.tilt = clamp(C.tilt, TMIN, TMAX);
      const gy = groundAt(C.x, C.y); C.gy += (gy - C.gy) * 0.15;
      const hd = Math.cos(C.tilt) * C.dist, tx = C.x - AW / 2, tz = C.y - AH / 2;
      camera.position.set(tx + Math.sin(C.yaw) * hd, C.gy + Math.sin(C.tilt) * C.dist, tz + Math.cos(C.yaw) * hd);
      // never inside a hill
      const under = groundAt(camera.position.x + AW / 2, camera.position.z + AH / 2) + 14 + C.dist * 0.02;
      if (camera.position.y < under) camera.position.y = under;
      camera.lookAt(tx, C.gy, tz);
      camera.near = Math.max(4, C.dist * 0.02); camera.far = 90000; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      uniforms.uFogNear.value = C.dist * 1.3 + 400; uniforms.uFogFar.value = C.dist * 4 + 5200;
    }
    // a flight of the camera to a spot: out and over if it is far, then down
    let fly = null, vel = { x: 0, y: 0 }, spin = { yaw: 0, tilt: 0 };
    function flyTo(ax, ay, dist, secs, yaw, tilt) {
      const from = { x: C.x, y: C.y, dist: C.dist, yaw: C.yaw, tilt: C.tilt }, to = { x: ax, y: ay, dist: dist || C.dist, yaw: yaw === undefined ? C.yaw : yaw, tilt: tilt === undefined ? C.tilt : tilt };
      let dy = to.yaw - from.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); to.yaw = from.yaw + dy;
      const far = Math.hypot(to.x - from.x, to.y - from.y), top = Math.max(from.dist, to.dist, Math.min(DMAX, far * 1.1));
      vel = { x: 0, y: 0 }; spin = { yaw: 0, tilt: 0 }; // a flick still gliding or turning stops: the flight takes over
      return new Promise((done) => { fly = { from, to, top, t: 0, secs: secs || clamp(0.9 + far / 1800 + Math.abs(Math.log(to.dist / from.dist)) * 0.55, 1, 3.2), done }; });
    }
    function stepFly(dt) {
      if (!fly) return;
      fly.t = Math.min(1, fly.t + dt / fly.secs); const k = ease(fly.t), F = fly.from, T = fly.to;
      C.x = F.x + (T.x - F.x) * k; C.y = F.y + (T.y - F.y) * k; C.yaw = F.yaw + (T.yaw - F.yaw) * k; C.tilt = F.tilt + (T.tilt - F.tilt) * k;
      const a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k; C.dist = a * F.dist + b * fly.top + c * T.dist;
      if (fly.t >= 1) { const d = fly.done; fly = null; d(); }
    }

    // ---- fingers and mouse: one finger turns and tilts; two pinch to zoom, slide to move, twist to turn ----
    const cv = renderer.domElement, pts = new Map();
    cv.__v = () => ({ x: C.x, y: C.y, dist: C.dist, yaw: C.yaw, tilt: C.tilt }); // for the touch test
    let last = null, lastMove = 0;
    const span = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const ang = () => { const [a, b] = [...pts.values()]; return Math.atan2(b.y - a.y, b.x - a.x); };
    const mid = () => { const v = [...pts.values()]; return { x: v.reduce((s, p) => s + p.x, 0) / v.length, y: v.reduce((s, p) => s + p.y, 0) / v.length }; };
    function pan(dx, dy) { // the land follows the fingers
      const wpp = 2 * C.dist * Math.tan(camera.fov * Math.PI / 360) / cv.clientHeight, s = Math.max(0.35, Math.sin(C.tilt));
      const rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw), fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw);
      C.x += -rx * dx * wpp + fx * dy * wpp / s; C.y += -rz * dx * wpp + fz * dy * wpp / s;
    }
    const turn = (dx, dy) => { C.yaw -= dx * 0.0062; C.tilt = clamp(C.tilt + dy * 0.0036, TMIN, TMAX); };
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* a pointer the browser no longer tracks */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, shift: e.shiftKey });
      fly = null; vel = { x: 0, y: 0 }; spin = { yaw: 0, tilt: 0 }; last = { mid: mid(), span: pts.size > 1 ? span() : 0, ang: pts.size > 1 ? ang() : 0 };
      if (api.onTouch) api.onTouch();
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      const m = mid(), dx = m.x - last.mid.x, dy = m.y - last.mid.y, now = performance.now(), dt = Math.max(8, now - lastMove);
      if (pts.size === 1 && (p.b === 2 || p.shift)) { pan(dx, dy); vel = { x: clamp(dx / dt * 16, -40, 40), y: clamp(dy / dt * 16, -40, 40) }; } // a mouse's right button moves the land
      else if (pts.size === 1) { turn(dx, dy); spin = { yaw: clamp(dx / dt * 16, -14, 14), tilt: 0 }; } // (a flick keeps it turning a moment; the tilt stops with the finger)
      else { const s = span(), a = ang(); if (last.span) C.dist *= last.span / s; let da = a - last.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); C.yaw -= da; pan(dx, dy); last.span = s; last.ang = a; }
      last.mid = m; lastMove = now;
    });
    const up = (e) => { pts.delete(e.pointerId); last = { mid: mid(), span: pts.size > 1 ? span() : 0, ang: pts.size > 1 ? ang() : 0 }; if (performance.now() - lastMove > 80 || pts.size) { vel = { x: 0, y: 0 }; spin = { yaw: 0, tilt: 0 }; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); fly = null; C.dist *= Math.exp(e.deltaY * 0.0012); }, { passive: false });

    // ---- the frame ----
    let W = 1, Hh = 1, frames = 0, fpsT = 0, fps = 0, slow = 0, lastT = performance.now(), running = true;
    function resize() {
      W = host.clientWidth || 1; Hh = host.clientHeight || 1; renderer.setSize(W, Hh, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = Hh + 'px'; camera.aspect = W / Hh; camera.updateProjectionMatrix();
      // far enough out to see the whole map across the screen, however the phone is held
      const th = Math.tan(camera.fov * Math.PI / 360), tw = th * camera.aspect; DMAX = Math.max(6200, AW * 0.56 / tw, AH * 0.66 / th);
    }
    window.addEventListener('resize', resize);
    const v3 = new THREE.Vector3(), frustum = new THREE.Frustum(), pm = new THREE.Matrix4();
    // names that would overlap give way: Io's first, then the zones', then the places nearest the middle of the screen
    const RANK = { io: 0, zone: 1, place: 2, landing: 3 };
    function updateTags() {
      const near = C.dist < 1900, mid_ = C.dist < 3600, want = [];
      for (const t of tags) {
        let show = false;
        if (t.kind === 'io') show = !!ioAt && C.dist < 3000; // far out, her pin is enough (the zones' names show)
        else if (t.kind === 'zone') show = !mid_ || C.dist > 3000;
        // a landing in another open zone (in Io's own zone its place's name shows, with the landing's diamond)
        else if (t.kind === 'landing') show = api.open.includes(t.zone) && mid_ && !(ioPlace && P.PLACES[ioPlace].zone === t.zone);
        else if (t.kind === 'place') show = near && ioPlace && P.PLACES[ioPlace].zone === t.zone && t.id !== ioPlace;
        if (show) { v3.copy(t.pos).project(camera); if (v3.z > 1 || Math.abs(v3.x) > 1.15 || Math.abs(v3.y) > 1.15) show = false; }
        if (show) { t.sx = (v3.x + 1) / 2 * W; t.sy = (1 - v3.y) / 2 * Hh; want.push(t); }
        else if (t.show) { t.show = false; t.d.style.display = 'none'; }
      }
      want.sort((a, b) => RANK[a.kind] - RANK[b.kind] || (Math.hypot(a.sx - W / 2, a.sy - Hh / 2) - Math.hypot(b.sx - W / 2, b.sy - Hh / 2)));
      const taken = [];
      for (const t of want) {
        if (!t.show) { t.show = true; t.d.style.display = ''; }
        if (!t.w) { t.w = t.d.offsetWidth; t.h = t.d.offsetHeight; }
        const upBy = t.kind === 'io' ? 26 : t.kind === 'zone' ? -t.h / 2 : 10, r = [t.sx - t.w / 2 - 3, t.sy - t.h - upBy - 3, t.w + 6, t.h + 6];
        if (t.kind !== 'io' && taken.some((q) => r[0] < q[0] + q[2] && q[0] < r[0] + r[2] && r[1] < q[1] + q[3] && q[1] < r[1] + r[3])) { t.show = false; t.d.style.display = 'none'; continue; }
        taken.push(r);
        t.d.style.transform = 'translate(' + t.sx.toFixed(1) + 'px,' + t.sy.toFixed(1) + 'px)';
      }
    }
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const real = Math.min(0.5, (now - lastT) / 1000), dt = Math.min(0.05, real); lastT = now;
      step(dt, real); render();
      frames++; fpsT += real; if (fpsT >= 1) { fps = frames / fpsT; frames = 0; fpsT = 0;
        // a phone that draws the map slowly gets it a little less sharp (never below one pixel per pixel)
        if (fps < 40 && pr > 1) { if (++slow >= 2) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); resize(); slow = 0; } } else slow = 0; }
    }
    function step(dt, real) {
      uniforms.uTime.value += dt; uniforms.uGlow.value = 0.5 + 0.5 * Math.sin(uniforms.uTime.value * 1.8);
      stepFly(real || dt); // a flight keeps to its time even if a frame comes late
      if (!pts.size && !fly) { // a flick keeps turning, or sliding, for a moment
        if (Math.abs(spin.yaw) + Math.abs(spin.tilt) > 0.05) { turn(spin.yaw, spin.tilt); spin.yaw *= 0.9; spin.tilt *= 0.85; }
        if (Math.abs(vel.x) + Math.abs(vel.y) > 0.05) { pan(vel.x, vel.y); vel.x *= 0.9; vel.y *= 0.9; }
      }
      placeCamera();
      // trees: only the patches on the screen and near enough to be more than specks
      pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
      for (const m of treePatches) { const s = m.userData.sphere; m.visible = camera.position.distanceTo(s.center) < 3900 + s.radius && frustum.intersectsSphere(s); }
      if (ioAt) {
        const s = C.dist / 1000, t = uniforms.uTime.value;
        io.position.copy(W3(ioAt[0], ioAt[1], 1));
        beam.scale.set(9 * s, 150 * s, 9 * s);
        const k = (t * 0.6) % 1; ring.scale.setScalar((14 + 30 * k) * s); ring.material.opacity = 0.75 * (1 - k);
        ring2.scale.setScalar(20 * s);
        crescent.position.y = 150 * s + 8 * s * Math.sin(t * 1.6); crescent.scale.setScalar(46 * s);
        ioTag.pos.set(io.position.x, io.position.y + 150 * s, io.position.z);
      }
      updateTags();
    }
    function render() { renderer.render(scene, camera); }

    // ---- what the page asks of it ----
    const api = {
      open: (opts.open || [1, 2, 3, 4]).slice(), onTouch: null,
      heightAt, kindAt, flyTo, render, step, stats,
      get view() { return { x: C.x, y: C.y, dist: C.dist, yaw: C.yaw, tilt: C.tilt }; },
      set view(v) { Object.assign(C, v); fly = null; C.gy = groundAt(C.x, C.y); placeCamera(); },
      mist(v) { uniforms.uMistAmt.value = v; },
      setOpen(zs) { api.open = zs.slice(); const v = [1, 2, 3, 4].map((z) => (zs.includes(z) ? 1 : 0)); uniforms.uOpen.value.set(v[0], v[1], v[2], v[3]); },
      setIo(place, spot, flyThere) {
        const p = P.PLACES[place]; if (!p) return Promise.resolve();
        ioPlace = place; ioAt = P.atlasOf(place, spot); io.visible = true;
        ioTag.d.querySelector('span').textContent = p.name;
        const h = [1, 2, 3, 4].map((k) => (k === p.zone ? 1 : 0)); uniforms.uHere.value.set(h[0], h[1], h[2], h[3]);
        return flyThere ? api.findIo() : Promise.resolve();
      },
      // to Io: close enough to see her country, north up, looking across the land
      findIo() { return ioAt ? flyTo(ioAt[0], ioAt[1], 1000, undefined, 0, 0.72) : Promise.resolve(); },
      get io() { return ioAt && { place: ioPlace, at: ioAt.slice() }; },
      numbers() { return { fps: Math.round(fps), triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, sharp: pr, trees: stats.trees, houses: stats.houses }; },
      stop() { running = false; },
      P: { scene, camera, renderer, C },
    };
    api.ready = (async () => {
      const [hp, kp] = await Promise.all([loadPixels(art.height), loadPixels(art.kinds)]);
      Hf = new Float32Array(DW * DH); Kd = new Uint8Array(DW * DH);
      for (let i = 0; i < DW * DH; i++) {
        Kd[i] = kp[i * 4]; let h = (hp[i * 4] * 256 + hp[i * 4 + 1]) / 10 - 100;
        // the land slips under the sea at the map's very edges (the painting cuts some islands off there)
        const x = i % DW, y = (i / DW) | 0, e = Math.min(x, y, DW - 1 - x, DH - 1 - y);
        if (e < 14 && h > -3) h = -3 + (h + 3) * sstep(1, 14, e);
        Hf[i] = h;
      }
      uniforms.zones.value = zoneTexture();
      buildLand(); buildTrees(); buildPlaces(); makeTags();
      api.setOpen(api.open);
      resize();
      if (opts.io) api.setIo(opts.io.place, opts.io.spot, false);
      C.gy = groundAt(C.x, C.y); placeCamera();
      requestAnimationFrame((t) => { lastT = t; frame(t); });
      return api;
    })();
    return api;
  }
  window.WorldMap = { create, AW, AH, EXAG, KIND };
})();
