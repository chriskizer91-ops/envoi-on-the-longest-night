// map3d.js: the 3D map of Aethermoor. Chris's night atlas (4608 x 3072, north up) laid over the land's height (read
// off the day atlas: tools/make-map-art.mjs), under a night sky with the moon high in the north-west. The four zones
// are the game's four level bands (World.BANDS); a zone the party hasn't reached lies under a drifting mist, and so does
// everything outside the four (the inland sea's island, the east and the south-east) all game. A gold line rings the
// zone Io is in; her pin, a beam of moonlight, stands where she is. One finger drags the map, two pinch to zoom and
// twist to turn (a mouse: drag, wheel, right-drag).
// Scale: one unit is one atlas pixel (10 m); heights are lifted EXAG times so the land reads from above.
// WorldMap.create(host, { art: { tiles: [4 urls], height: url }, open: [zones], io: { place, spot } }) -> map, with
//   map.ready (a promise), map.setIo(place, spot, fly), map.setOpen(zones), map.findIo(), map.flyTo(x, y, dist, s),
//   map.heightAt(ax, ay), map.numbers(), map.view (the camera's state), map.render()
// Needs three.js r128 (THREE), World (src/game/world.js) and MapPlaces (places.js).
(function () {
  'use strict';
  const AW = 4608, AH = 3072, EXAG = 1.15, HW = 576, HH = 384;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  function loadImage(url) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('could not load ' + url.slice(0, 40))); i.src = url; }); }

  // the land's height: red * 256 + green in tenths of an atlas pixel, offset by 100 px (make-map-art.mjs)
  async function loadHeight(url) {
    const img = await loadImage(url), c = document.createElement('canvas'); c.width = HW; c.height = HH;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, HW, HH).data, h = new Float32Array(HW * HH);
    for (let i = 0; i < HW * HH; i++) h[i] = (d[i * 4] * 256 + d[i * 4 + 1]) / 10 - 100;
    return h;
  }

  // each zone's share of every spot on the map, softened at the edges (red, green, blue, alpha: zones 1 to 4), so the
  // mist fades in over a few hundred metres and the borders can be drawn where two zones meet
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

  const NOISE = `
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n2(p); p = p * 2.03 + 7.7; a *= 0.5; } return v; }`;
  const TERRAIN_V = `
    attribute vec3 hnormal;
    uniform vec2 uOff;
    varying vec2 vUv, vAtlas; varying vec3 vN; varying float vDepth;
    void main() {
      vUv = uv; vN = hnormal;
      vAtlas = vec2((position.x + ${AW / 2}.0) / ${AW}.0, (position.z + ${AH / 2}.0) / ${AH}.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`;
  const TERRAIN_F = `
    uniform sampler2D map, zones; uniform vec4 uOpen, uHere; uniform vec3 uMoon, uFog, uSea, uMist; uniform float uTime, uFogNear, uFogFar, uGlow;
    varying vec2 vUv, vAtlas; varying vec3 vN; varying float vDepth;
    ${NOISE}
    void main() {
      vec3 c = texture2D(map, vUv).rgb;
      // the moon's light on the land's slopes, gentle: the painting has its own light and shade
      float l = dot(normalize(vN), uMoon);
      c *= 0.80 + 0.42 * max(l, 0.0) - 0.12 * max(-l, 0.0);
      // the map's edge fades into the open sea round it
      vec2 e = min(vAtlas, 1.0 - vAtlas); float edge = smoothstep(0.0, 0.035, min(e.x, e.y * 1.5));
      c = mix(uSea, c, edge);
      // the zones: mist where none open; a faint line where two meet; gold round the one Io is in
      vec4 z = texture2D(zones, vAtlas);
      float open = clamp(dot(z, uOpen), 0.0, 1.0), mist = 1.0 - open;
      vec2 drift = vec2(uTime * 0.004, uTime * 0.0015);
      float n = fbm(vAtlas * vec2(14.0, 9.3) + drift), n2v = fbm(vAtlas * vec2(31.0, 21.0) - drift * 1.7);
      vec3 mc = uMist * (0.7 + 0.55 * n + 0.2 * n2v);
      c = mix(c, mc, mist * clamp(0.5 + 0.4 * n, 0.0, 0.88));
      float sum = z.r + z.g + z.b + z.a;
      float meet = max(max(max(z.r * z.g, z.g * z.b), max(z.b * z.a, z.r * z.a)), max(z.r * z.b, z.g * z.a));
      float line = smoothstep(0.215, 0.245, meet) + smoothstep(0.22, 0.248, sum * (1.0 - sum)) * step(0.02, sum);
      c += vec3(0.62, 0.66, 0.85) * clamp(line, 0.0, 1.0) * 0.14 * edge;
      float m = dot(z, uHere), ring = smoothstep(0.215, 0.245, m * (1.0 - m));
      c = mix(c, vec3(1.0, 0.84, 0.5), ring * (0.38 + 0.18 * uGlow) * edge);
      // the night's haze with distance
      float f = smoothstep(uFogNear, uFogFar, vDepth);
      gl_FragColor = vec4(mix(c, uFog, f), 1.0);
    }`;

  function create(host, opts) {
    const P = window.MapPlaces, art = opts.art;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    let pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x0b0d22);
    host.appendChild(renderer.domElement);
    renderer.domElement.__v = () => ({ x: C.x, y: C.y, dist: C.dist, yaw: C.yaw }); // for the touch test
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 5, 80000);
    const labels = el('div', 'map-labels', host);
    const FOG = new THREE.Color(0x151a36), SEA = new THREE.Color(0x0e1c3a), MIST = new THREE.Color(0x6a7096);
    const MOON = new THREE.Vector3(-0.55, 0.62, -0.56).normalize();
    let H = null; // the height field
    function heightAt(ax, ay) { // in atlas pixels, lifted (scene units)
      if (!H) return 0;
      const fx = clamp(ax / AW * HW - 0.5, 0, HW - 1.001), fy = clamp(ay / AH * HH - 0.5, 0, HH - 1.001), x = fx | 0, y = fy | 0, tx = fx - x, ty = fy - y, i = y * HW + x;
      const v = (H[i] * (1 - tx) + H[i + 1] * tx) * (1 - ty) + (H[i + HW] * (1 - tx) + H[i + HW + 1] * tx) * ty;
      return Math.max(v, -2) * EXAG;
    }
    const W3 = (ax, ay, lift) => new THREE.Vector3(ax - AW / 2, heightAt(ax, ay) + (lift || 0), ay - AH / 2);

    // ---- the sky: a deep blue dome, stars, and the moon high in the north-west ----
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uMoon: { value: MOON } },
      vertexShader: 'varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uMoon;
        void main() { vec3 d = normalize(vD); float h = d.y, s = max(dot(d, uMoon), 0.0);
          vec3 c = mix(vec3(0.082, 0.102, 0.212), vec3(0.03, 0.035, 0.1), smoothstep(0.0, 0.7, h));
          c += vec3(0.25, 0.27, 0.42) * pow(s, 24.0) * 0.5 + vec3(0.6, 0.62, 0.8) * pow(s, 400.0);
          c = mix(c, vec3(0.082, 0.102, 0.212), smoothstep(0.02, -0.3, h));
          gl_FragColor = vec4(c, 1.0); }`,
    }));
    sky.scale.setScalar(60000); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
    {
      const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const u = Math.random(), v = Math.random() * 0.92 + 0.08, th = u * Math.PI * 2, r = Math.sqrt(1 - v * v);
        pos.set([Math.cos(th) * r * 50000, v * 50000, Math.sin(th) * r * 50000], i * 3);
        const b = 0.45 + Math.random() * 0.55; col.set([b * 0.9, b * 0.92, b], i * 3);
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
    // the open sea past the map's edges
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), new THREE.ShaderMaterial({
      uniforms: { uSea: { value: SEA }, uFog: { value: FOG }, uFogNear: { value: 0 }, uFogFar: { value: 1 } },
      vertexShader: 'varying float vDepth; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uSea, uFog; uniform float uFogNear, uFogFar; varying float vDepth; void main() { gl_FragColor = vec4(mix(uSea, uFog, smoothstep(uFogNear, uFogFar, vDepth)), 1.0); }',
    }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -4 * EXAG; scene.add(sea);

    // ---- the land: four quarters of the atlas, each a sheet of 192 x 128 squares lifted by the height ----
    const uniforms = {
      zones: { value: null }, uOpen: { value: new THREE.Vector4() }, uHere: { value: new THREE.Vector4() },
      uMoon: { value: MOON }, uFog: { value: FOG }, uSea: { value: SEA }, uMist: { value: MIST },
      uTime: { value: 0 }, uFogNear: { value: 0 }, uFogFar: { value: 1 }, uGlow: { value: 0 },
    };
    const chunks = [];
    function buildLand(textures) {
      const nx = 192, ny = 128;
      for (let q = 0; q < 4; q++) {
        const qx = (q % 2) * 2304, qy = Math.floor(q / 2) * 1536;
        const g = new THREE.PlaneGeometry(2304, 1536, nx, ny); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position, nrm = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) {
          const ax = p.getX(i) + 1152 + qx, ay = p.getZ(i) + 768 + qy;
          p.setXYZ(i, ax - AW / 2, heightAt(ax, ay), ay - AH / 2);
          // the slope from the height field itself, so the quarters' edges share their normals (no seam)
          const s = 12, dx = heightAt(ax + s, ay) - heightAt(ax - s, ay), dz = heightAt(ax, ay + s) - heightAt(ax, ay - s);
          const v = new THREE.Vector3(-dx, 2 * s, -dz).normalize(); nrm.set([v.x, v.y, v.z], i * 3);
        }
        g.setAttribute('hnormal', new THREE.BufferAttribute(nrm, 3)); g.computeBoundingSphere();
        const m = new THREE.ShaderMaterial({ uniforms: Object.assign({}, uniforms, { map: { value: textures[q] } }), vertexShader: TERRAIN_V, fragmentShader: TERRAIN_F });
        const mesh = new THREE.Mesh(g, m); scene.add(mesh); chunks.push(mesh);
      }
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
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd6d0ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
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

    // ---- labels: names over the map, placed each frame where their spot shows on the screen ----
    const tags = [];
    function tag(text, kind, ax, ay, lift, extra) {
      const d = el('div', 'map-tag ' + kind, labels);
      if (kind === 'io') { el('b', null, d, 'Io'); el('span', null, d, text); } else d.textContent = text;
      const t = Object.assign({ d, kind: kind.split(' ')[0], ax, ay, lift: lift || 0, show: true, pos: W3(ax, ay, lift) }, extra || {}); tags.push(t); return t;
    }
    let ioTag = null;
    function makeTags() {
      for (const [id, l] of Object.entries(P.LANDINGS)) tag(l.name, 'landing', l.sky[0], l.sky[1], 6, { zone: l.zone, id });
      const landed = new Set(Object.values(P.LANDINGS).map((l) => l.place));
      for (const [id, p] of Object.entries(P.PLACES)) tag(p.name, 'place' + (landed.has(id) ? ' lands' : ''), p.at[0], p.at[1], 4, { zone: p.zone, id });
      for (const [z, Z] of Object.entries(P.ZONES)) {
        // a zone's name over the middle of its places
        const ps = Z.places.map((id) => P.PLACES[id].at), cx = ps.reduce((a, p) => a + p[0], 0) / ps.length, cy = ps.reduce((a, p) => a + p[1], 0) / ps.length;
        tag(Z.name, 'zone', cx, cy - 70, 60, { zone: +z });
      }
      ioTag = tag('', 'io', 0, 0, 0);
    }

    // ---- the camera: it looks at a spot on the land from `dist` away, turned by `yaw` (0: north is up the screen),
    // tilted more the closer it comes ----
    const C = { x: AW / 2, y: AH / 2, dist: 1e6, yaw: 0, gy: 0 }; // it opens on the whole map (clamped to DMAX)
    const DMIN = 260; let DMAX = 6200;
    const elev = (d) => THREE.MathUtils.lerp(0.62, 1.22, clamp((d - DMIN) / (4200 - DMIN), 0, 1)); // radians above the ground
    function placeCamera() {
      C.x = clamp(C.x, 0, AW); C.y = clamp(C.y, 0, AH); C.dist = clamp(C.dist, DMIN, DMAX);
      const gy = heightAt(C.x, C.y); C.gy += (gy - C.gy) * 0.15;
      const e = elev(C.dist), hd = Math.cos(e) * C.dist;
      const tx = C.x - AW / 2, tz = C.y - AH / 2;
      camera.position.set(tx + Math.sin(C.yaw) * hd, C.gy + Math.sin(e) * C.dist, tz + Math.cos(C.yaw) * hd);
      // never inside a hill
      const under = heightAt(camera.position.x + AW / 2, camera.position.z + AH / 2) + 60;
      if (camera.position.y < under) camera.position.y = under;
      camera.lookAt(tx, C.gy, tz);
      camera.near = Math.max(5, C.dist * 0.03); camera.far = 90000; camera.updateProjectionMatrix();
      const fn = C.dist * 1.15, ff = C.dist * 3.6 + 2500;
      for (const u of [uniforms, sea.material.uniforms]) { u.uFogNear.value = fn; u.uFogFar.value = ff; }
      for (const m of chunks) { m.material.uniforms.uFogNear.value = fn; m.material.uniforms.uFogFar.value = ff; }
    }

    // a flight of the camera to a spot: out and over if it is far, then down
    let fly = null;
    function flyTo(ax, ay, dist, secs, yaw) {
      const from = { x: C.x, y: C.y, dist: C.dist, yaw: C.yaw }, to = { x: ax, y: ay, dist: dist || C.dist, yaw: yaw === undefined ? C.yaw : yaw };
      let dy = to.yaw - from.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); to.yaw = from.yaw + dy;
      const far = Math.hypot(to.x - from.x, to.y - from.y), top = Math.max(from.dist, to.dist, Math.min(DMAX, far * 1.1));
      vel = { x: 0, y: 0 }; // a fling still gliding stops: the flight takes over
      return new Promise((done) => { fly = { from, to, top, t: 0, secs: secs || clamp(0.9 + far / 1800 + Math.abs(Math.log(to.dist / from.dist)) * 0.55, 1, 3.2), done }; });
    }
    function stepFly(dt) {
      if (!fly) return;
      fly.t = Math.min(1, fly.t + dt / fly.secs); const k = ease(fly.t), F = fly.from, T = fly.to;
      C.x = F.x + (T.x - F.x) * k; C.y = F.y + (T.y - F.y) * k; C.yaw = F.yaw + (T.yaw - F.yaw) * k;
      // the distance runs through `top` (a curve over the middle of the flight)
      const a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k; C.dist = a * F.dist + b * fly.top + c * T.dist;
      if (fly.t >= 1) { const d = fly.done; fly = null; d(); }
    }

    // ---- touch and mouse ----
    const cv = renderer.domElement, pts = new Map();
    let last = null, vel = { x: 0, y: 0 }, lastMove = 0;
    const span = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const ang = () => { const [a, b] = [...pts.values()]; return Math.atan2(b.y - a.y, b.x - a.x); };
    const mid = () => { const v = [...pts.values()]; return { x: v.reduce((s, p) => s + p.x, 0) / v.length, y: v.reduce((s, p) => s + p.y, 0) / v.length }; };
    function pan(dx, dy) {
      const wpp = 2 * C.dist * Math.tan(camera.fov * Math.PI / 360) / cv.clientHeight, s = Math.sin(elev(C.dist));
      const rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw), fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw);
      C.x += -rx * dx * wpp + fx * dy * wpp / s; C.y += -rz * dx * wpp + fz * dy * wpp / s;
    }
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* a pointer the browser no longer tracks */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button });
      fly = null; vel = { x: 0, y: 0 }; last = { mid: mid(), span: pts.size > 1 ? span() : 0, ang: pts.size > 1 ? ang() : 0 };
      if (api.onTouch) api.onTouch();
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      const m = mid();
      if (pts.size === 1 && p.b === 2) { C.yaw += (m.x - last.mid.x) * 0.006; } // a mouse's right button turns
      else if (pts.size === 1) { const dx = m.x - last.mid.x, dy = m.y - last.mid.y; pan(dx, dy); const now = performance.now(), dt = Math.max(8, now - lastMove); vel = { x: clamp(dx / dt * 16, -40, 40), y: clamp(dy / dt * 16, -40, 40) }; lastMove = now; }
      else { const s = span(), a = ang(); if (last.span) C.dist *= last.span / s; let da = a - last.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); C.yaw += da; pan(m.x - last.mid.x, m.y - last.mid.y); last.span = s; last.ang = a; }
      last.mid = m;
    });
    const up = (e) => { pts.delete(e.pointerId); last = { mid: mid(), span: pts.size > 1 ? span() : 0, ang: pts.size > 1 ? ang() : 0 }; if (performance.now() - lastMove > 80) vel = { x: 0, y: 0 }; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); fly = null; C.dist *= Math.exp(e.deltaY * 0.0012); }, { passive: false });

    // ---- the frame ----
    let W = 1, Hh = 1, frames = 0, fpsT = 0, fps = 0, slow = 0, lastT = performance.now(), running = true;
    function resize() { W = host.clientWidth || 1; Hh = host.clientHeight || 1; renderer.setSize(W, Hh, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = Hh + 'px'; camera.aspect = W / Hh; camera.updateProjectionMatrix();
      // far enough out to see the whole map across the screen, however the phone is held
      const th = Math.tan(camera.fov * Math.PI / 360), tw = th * camera.aspect; DMAX = Math.max(6200, AW * 0.53 / tw, AH * 0.62 / th); }
    window.addEventListener('resize', resize);
    const v3 = new THREE.Vector3();
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
        // the box each name takes on the screen (as map.css places it over its spot)
        const up = t.kind === 'io' ? 26 : t.kind === 'zone' ? -t.h / 2 : 10, r = [t.sx - t.w / 2 - 3, t.sy - t.h - up - 3, t.w + 6, t.h + 6];
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
      frames++; fpsT += dt; if (fpsT >= 1) { fps = frames / fpsT; frames = 0; fpsT = 0;
        // a phone that draws the map slowly gets it a little less sharp (never below one pixel per pixel)
        if (fps < 40 && pr > 1) { if (++slow >= 2) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); resize(); slow = 0; } } else slow = 0; }
    }
    function step(dt, real) {
      uniforms.uTime.value += dt;
      stepFly(real || dt); // a flight keeps to its time even if a frame comes late
      if (!pts.size && !fly && (Math.abs(vel.x) + Math.abs(vel.y) > 0.05)) { pan(vel.x, vel.y); vel.x *= 0.9; vel.y *= 0.9; }
      placeCamera();
      if (ioAt) {
        const s = C.dist / 1000, t = uniforms.uTime.value;
        io.position.copy(W3(ioAt[0], ioAt[1]));
        beam.scale.set(9 * s, 150 * s, 9 * s);
        const k = (t * 0.6) % 1; ring.scale.setScalar((14 + 30 * k) * s); ring.material.opacity = 0.75 * (1 - k);
        ring2.scale.setScalar(20 * s); ring2.position.y = 1;
        crescent.position.y = 150 * s + 8 * s * Math.sin(t * 1.6); crescent.scale.setScalar(46 * s);
        ioTag.pos.set(io.position.x, io.position.y + 150 * s, io.position.z);
      }
      for (const m of chunks) m.material.uniforms.uGlow.value = 0.5 + 0.5 * Math.sin(uniforms.uTime.value * 1.8);
      updateTags();
    }
    function render() { renderer.render(scene, camera); }

    // ---- what the page asks of it ----
    const api = {
      open: (opts.open || [1, 2, 3, 4]).slice(), onTouch: null,
      heightAt, flyTo, render, step,
      get view() { return { x: C.x, y: C.y, dist: C.dist, yaw: C.yaw }; },
      set view(v) { Object.assign(C, v); fly = null; placeCamera(); },
      setOpen(zs) {
        api.open = zs.slice();
        const v = [1, 2, 3, 4].map((z) => (zs.includes(z) ? 1 : 0));
        for (const m of chunks) m.material.uniforms.uOpen.value.set(v[0], v[1], v[2], v[3]);
        uniforms.uOpen.value.set(v[0], v[1], v[2], v[3]);
      },
      setIo(place, spot, flyThere) {
        const p = P.PLACES[place]; if (!p) return Promise.resolve();
        ioPlace = place; ioAt = P.atlasOf(place, spot); io.visible = true;
        ioTag.d.querySelector('span').textContent = p.name;
        const z = p.zone, h = [1, 2, 3, 4].map((k) => (k === z ? 1 : 0));
        for (const m of chunks) m.material.uniforms.uHere.value.set(h[0], h[1], h[2], h[3]);
        return flyThere ? flyTo(ioAt[0], ioAt[1], 1150, undefined, 0) : Promise.resolve();
      },
      findIo() { return ioAt ? flyTo(ioAt[0], ioAt[1], 1150, undefined, 0) : Promise.resolve(); },
      get io() { return ioAt && { place: ioPlace, at: ioAt.slice() }; },
      numbers() { return { fps: Math.round(fps), triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, sharp: pr, textures: renderer.info.memory.textures }; },
      stop() { running = false; },
      P: { scene, camera, renderer, chunks, C },
    };
    api.ready = (async () => {
      const [h, ...imgs] = await Promise.all([loadHeight(art.height)].concat(art.tiles.map(loadImage)));
      H = h;
      const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const texs = imgs.map((img) => { const t = new THREE.Texture(img); t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t; });
      uniforms.zones.value = zoneTexture();
      buildLand(texs);
      makeTags();
      api.setOpen(api.open);
      resize();
      if (opts.io) api.setIo(opts.io.place, opts.io.spot, false);
      C.gy = heightAt(C.x, C.y); placeCamera();
      requestAnimationFrame((t) => { lastT = t; frame(t); });
      return api;
    })();
    return api;
  }
  window.WorldMap = { create, AW, AH, EXAG };
})();
