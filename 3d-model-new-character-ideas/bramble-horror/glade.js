// glade.js: a clearing in the wildlands for a model bench to stand a creature in. three.js r128 (global THREE).
// Defines makeGlade(opts) only: a sky with a moon and stars, two rings of trees fading into mist, drifting ground mist, a
// forest floor with grass, ferns and stones round the edge, fireflies, and metre rings to judge size by. Everything is
// painted in code. It adds no lights, so whatever stands in it is seen under the bench's own lights alone; its sky,
// trees and mist are unlit, and only the floor, grass and stones take the bench's light.
// opts: { radius (of the clear middle, where nothing grows; default 3.4 m), rings (how far the metre rings run; default 6 m) }
// Returns { root, update(t, dt), setDay(on), setRings(on), setScenery(on) }.
function makeGlade(opts) {
  'use strict';
  opts = opts || {};
  const CLEAR = opts.radius || 3.4, RM = opts.rings || 6, TAU = Math.PI * 2;
  let seed = 4242;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const root = new THREE.Group(); root.name = 'Glade';
  const scenery = new THREE.Group(); root.add(scenery);
  const T = { value: 0 };

  // ---------- the two looks: night (the battle screen's) and an overcast day ----------
  const LOOK = {
    night: { top: 0x0a0712, mid: 0x1b1430, hor: 0x3a2d50, moon: 0xdfe4ff, glow: .55, stars: 1, far: 0x2a2140, near: 0x140f1f, mist: 0x3b3152, mistA: .5, floor: 0x3a2f3c, grass: 0x4b5a3e, stone: 0x3e3a48, flies: 1 },
    day: { top: 0x8ea6bd, mid: 0xb7c5cf, hor: 0xd9ddd6, moon: 0xfff6e0, glow: .25, stars: 0, far: 0x8b968e, near: 0x56634f, mist: 0xd4d9d4, mistA: .42, floor: 0x7a6d55, grass: 0x6f8350, stone: 0x8c8780, flies: 0 },
  };

  // ---------- sky: a gradient dome, a moon low over the trees, and stars that twinkle ----------
  // The moon sits where the battle screen's moonlight comes from (behind and to the left), brought down near the trees.
  const moonDir = new THREE.Vector3(-5, 0, -12).normalize(); moonDir.y = .2; moonDir.normalize();
  const skyU = { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uMoon: { value: new THREE.Color() }, uMoonDir: { value: moonDir }, uGlow: { value: .5 }, uStars: { value: 1 }, uTime: T };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD;\nvoid main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform vec3 uTop, uMid, uHor, uMoon, uMoonDir; uniform float uGlow, uStars, uTime; varying vec3 vD;',
      'float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
      'void main(){',
      ' vec3 d = normalize(vD); float y = d.y;',
      ' vec3 c = mix(uHor, uMid, smoothstep(-.03, .2, y)); c = mix(c, uTop, smoothstep(.2, .8, y));',
      ' float m = dot(d, uMoonDir);',
      ' c += uMoon * (uGlow * (pow(max(m, 0.), 6.) * .22 + pow(max(m, 0.), 40.) * .5) + smoothstep(.99935, .9996, m) * 1.3);',
      ' vec3 p = d * 140., i = floor(p), f = fract(p);',
      ' vec3 q = vec3(h(i), h(i + 1.7), h(i + 3.1));',
      ' float s = step(.982, h(i + 9.3)) * smoothstep(.16, 0., length(f - q)) * (.55 + .45 * sin(uTime * (1.3 + q.x * 2.) + q.y * 30.));',
      ' c += vec3(.85, .88, 1.) * s * uStars * smoothstep(.04, .3, y) * (1. - smoothstep(.97, .999, m));',
      ' gl_FragColor = vec4(c, 1.);',
      '}'].join('\n'),
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; scenery.add(sky);

  // ---------- trees: two rings of silhouettes, hazy far ones and darker near ones, sinking into mist ----------
  // Painted as a white mask (oaks, thorny dead trees, conifers and bramble mounds), tinted by a small shader that fades
  // their feet into the mist and lights their tops a little where the moon is.
  function treeMask(W, H, n, near) {
    const c = cvs(W, H), g = c.getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
    const wrap = (fn) => { for (const ox of [-W, 0, W]) { g.save(); g.translate(ox, 0); fn(); g.restore(); } };
    const blob = (x, y, rx, ry, a) => wrap(() => { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, TAU); g.fill(); });
    const limb = (x, y, x2, y2, w) => wrap(() => { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + rr(-6, 6), (y + y2) / 2 + rr(-6, 6), x2, y2); g.stroke(); });
    // a clump of foliage: many small lumps, ragged at the edge, with gaps the mist shows through
    const clump = (x, y, r) => { for (let k = 0; k < 16; k++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; blob(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, r * rr(.22, .42), r * rr(.16, .3), rnd() * 3); } };
    // a branch that forks, ending in foliage (or bare and thorny, hung with bramble)
    const branch = (x, y, a, l, w, d, leafy) => {
      const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l; limb(x, y, x2, y2, w);
      if (d > 0) { const k = 2 + (rnd() < .35 ? 1 : 0); for (let i = 0; i < k; i++) branch(x2, y2, a + rr(-.75, .75), l * rr(.58, .78), w * .64, d - 1, leafy); }
      else if (leafy) clump(x2, y2, l * rr(.9, 1.4));
      else if (rnd() < .3) wrap(() => { g.lineWidth = 1.2; g.beginPath(); g.moveTo(x2, y2); g.quadraticCurveTo(x2 + rr(-14, 14), y2 + rr(10, 30), x2 + rr(-20, 20), y2 + rr(25, 55)); g.stroke(); });
    };
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, kind = rnd(), base = H, h = H * rr(.5, .97) * (near ? 1 : .9);
      if (kind < .5) { // an old broadleaf: a flared trunk that splits into forking limbs, foliage in ragged clumps
        const w0 = h * rr(.03, .045), top = base - h * rr(.38, .5), lean = rr(-.06, .06) * h;
        wrap(() => { g.beginPath(); g.moveTo(x - w0 * 2.2, base); g.quadraticCurveTo(x - w0, base - h * .08, x - w0 * .8 + lean * .5, base - h * .25); g.lineTo(x - w0 * .55 + lean, top); g.lineTo(x + w0 * .55 + lean, top); g.lineTo(x + w0 * .8 + lean * .5, base - h * .25); g.quadraticCurveTo(x + w0, base - h * .08, x + w0 * 2.3, base); g.fill(); });
        const nl = 3 + (rnd() < .5 ? 1 : 0); for (let k = 0; k < nl; k++) branch(x + lean, top, Math.PI / 2 + (k / (nl - 1) - .5) * rr(1.3, 1.9), h * rr(.16, .24), w0 * 1.1, 2, true);
        clump(x + lean, top - h * .32, h * .12);
      } else if (kind < .72) { // a dead tree, bare and thorny, hung with dead bramble
        branch(x, base, Math.PI / 2 + rr(-.1, .1), h * .36, h * rr(.022, .032), 4, false);
      } else { // a dark spruce: drooping layers, narrow and tall
        const L = 9 + ((rnd() * 4) | 0), tw = h * rr(.14, .2);
        wrap(() => { g.lineWidth = h * .02; g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - h); g.stroke(); });
        for (let k = 0; k < L; k++) { const f = (k + 1) / L, y = base - h + h * f * .9, wv = tw * f * rr(.8, 1.1); wrap(() => { g.beginPath(); g.moveTo(x, y - h * .09); g.quadraticCurveTo(x + wv * .5, y - h * .02, x + wv, y + h * .015); g.lineTo(x, y - h * .015); g.lineTo(x - wv, y + h * .015); g.quadraticCurveTo(x - wv * .5, y - h * .02, x, y - h * .09); g.fill(); }); }
      }
    }
    // bramble thickets and undergrowth along the foot, with arching canes
    for (let i = 0; i < n * 4; i++) blob(rnd() * W, H - rr(0, H * .05), rr(H * .03, H * .07), rr(H * .02, H * .05));
    for (let i = 0; i < n * 2; i++) { const x = rnd() * W, w = rr(20, 60), hh = rr(H * .05, H * .12); wrap(() => { g.lineWidth = rr(1.5, 3); g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + w * .3, H - hh * 1.6, x + w, H - hh * .2); g.stroke(); }); }
    g.fillRect(0, H - H * .04, W, H * .04);
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  const treeU = [];
  function treeRing(R, H, y0, n, rep, near) {
    const u = { uMap: { value: treeMask(2048, 512, n, near) }, uTree: { value: new THREE.Color() }, uMist: { value: new THREE.Color() }, uRim: { value: new THREE.Color() }, uMoonDir: { value: moonDir }, uRep: { value: rep }, uMistH: { value: near ? .32 : .5 } };
    treeU.push({ u, near });
    const geo = new THREE.CylinderGeometry(R, R, H, 96, 1, true); geo.translate(0, y0 + H / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: u, side: THREE.BackSide, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vP;\nvoid main(){ vUv = uv; vP = normalize(vec3(position.x, 0., position.z)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D uMap; uniform vec3 uTree, uMist, uRim, uMoonDir; uniform float uRep, uMistH; varying vec2 vUv; varying vec3 vP;',
        'void main(){',
        ' float a = texture2D(uMap, vec2(vUv.x * uRep, vUv.y)).r; if (a < .02) discard;',
        ' float moon = pow(max(dot(vP, normalize(vec3(uMoonDir.x, 0., uMoonDir.z))), 0.), 3.);',
        ' vec3 c = mix(uTree, uMist, 1. - smoothstep(0., uMistH, vUv.y)) + uRim * moon * smoothstep(.2, .9, vUv.y) * .35;',
        ' gl_FragColor = vec4(c, a);',
        '}'].join('\n'),
    }));
    m.renderOrder = -9 + (near ? 1 : 0); m.frustumCulled = false; scenery.add(m);
  }
  treeRing(48, 24, -2, 24, 3, false);
  treeRing(33, 16, -1, 13, 4, true);

  // ---------- the floor: dark loam and leaf litter, fading into the mist at the edge ----------
  const floorTex = (() => {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = '#5a4f52'; g.fillRect(0, 0, S, S);
    const wrapDot = (x, y, r, col) => { g.fillStyle = col; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); } };
    for (let i = 0; i < 70; i++) { const x = rnd() * S, y = rnd() * S, r = rr(40, 140), q = g.createRadialGradient(x, y, 0, x, y, r); const col = rnd() < .5 ? '40,34,38' : rnd() < .5 ? '86,96,64' : '104,92,84'; q.addColorStop(0, 'rgba(' + col + ',.35)'); q.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
    for (let i = 0; i < 16000; i++) { g.fillStyle = rnd() < .55 ? 'rgba(0,0,0,.22)' : 'rgba(255,240,230,.07)'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); }
    // leaf litter: little tinted ellipses with a midrib
    for (let i = 0; i < 900; i++) {
      const x = rnd() * S, y = rnd() * S, l = rr(5, 13), a = rnd() * TAU, col = ['rgba(120,84,52,.55)', 'rgba(90,62,44,.55)', 'rgba(74,86,50,.5)', 'rgba(130,100,64,.45)'][(rnd() * 4) | 0];
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(x + ox, y + oy); g.rotate(a); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, l, l * .45, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,20,14,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.restore(); }
    }
    // pebbles and twigs
    for (let i = 0; i < 160; i++) { const x = rnd() * S, y = rnd() * S, r = rr(2, 6); wrapDot(x + 1, y + 1.5, r, 'rgba(20,14,14,.5)'); wrapDot(x, y, r, 'rgba(150,140,140,.55)'); }
    g.lineCap = 'round';
    for (let i = 0; i < 120; i++) { const x = rnd() * S, y = rnd() * S, a = rnd() * TAU, l = rr(12, 40); g.strokeStyle = 'rgba(64,46,34,.65)'; g.lineWidth = rr(1.5, 3); for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.anisotropy = 8; return t;
  })();
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: .96, transparent: true, depthWrite: false });
  floorMat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec2 vGp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGp = position.xy;');
    sh.fragmentShader = 'varying vec2 vGp;\n' + sh.fragmentShader.replace('#include <alphatest_fragment>', ' diffuseColor.a *= 1. - smoothstep(17., 27., length(vGp));\n#include <alphatest_fragment>');
  };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 96), floorMat); floor.rotation.x = -Math.PI / 2; floor.renderOrder = -8; scenery.add(floor);

  // ---------- grass, ferns and stones round the edge of the clearing, swaying a little ----------
  const grassTex = (() => {
    const W = 256, H = 256, c = cvs(W, H), g = c.getContext('2d'); g.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = rr(40, 216), h = rr(110, 245), lean = rr(-60, 60), w = rr(3, 7), sh = rr(.55, 1);
      g.strokeStyle = 'rgb(' + Math.round(150 * sh) + ',' + Math.round(200 * sh) + ',' + Math.round(120 * sh) + ')'; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + lean * .3, H - h * .6, x + lean, H - h); g.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();
  const fernTex = (() => {
    const W = 256, H = 256, c = cvs(W, H), g = c.getContext('2d'); g.lineCap = 'round';
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * .42, L = rr(150, 220), x0 = 128, y0 = H;
      for (let i = 0; i <= 22; i++) {
        const t = i / 22, cx = x0 + Math.cos(a) * L * t + Math.sin(t * 2.4) * 12 * (f - 2) * .3, cy = y0 + Math.sin(a) * L * t + t * t * 30, len = 34 * Math.sin(Math.PI * Math.min(1, t * 1.15 + .05)) * (1 - t * .3);
        g.strokeStyle = 'rgb(' + (120 + i * 2) + ',' + (190 - i) + ',' + (110 - i) + ')'; g.lineWidth = 4.5 * (1 - t * .6);
        for (const sd of [-1, 1]) { const pa = a + sd * 1.25; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(pa) * len * .6, cy + Math.sin(pa) * len * .6 - 4, cx + Math.cos(pa + sd * .25) * len, cy + Math.sin(pa + sd * .25) * len + 6); g.stroke(); }
      }
      g.strokeStyle = 'rgb(110,150,80)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L + 30); g.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();
  function clumps(tex, n, rMin, rMax, sMin, sMax) {
    const pos = [], uv = [], idx = [], sway = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = rr(rMin, rMax), x = Math.sin(a) * r, z = Math.cos(a) * r, s = rr(sMin, sMax), rot = rnd() * Math.PI;
      for (let k = 0; k < 2; k++) {
        const q = rot + k * Math.PI / 2, dx = Math.cos(q) * s * .6, dz = Math.sin(q) * s * .6, b = pos.length / 3;
        pos.push(x - dx, 0, z - dz, x + dx, 0, z + dz, x - dx, s, z - dz, x + dx, s, z + dz);
        uv.push(0, 0, 1, 0, 0, 1, 1, 1); sway.push(0, 0, 1, 1); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aSw', new THREE.Float32BufferAttribute(sway, 1)); geo.setIndex(idx); geo.computeVertexNormals();
    // lit as if facing up, so both sides of a card take the light the same way
    const nor = geo.attributes.normal; for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .45, side: THREE.DoubleSide, roughness: .85 });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = T;
      sh.vertexShader = 'attribute float aSw; uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += aSw * .06 * sin(uT * 1.3 + position.z * .7 + position.x * .3);\n transformed.z += aSw * .04 * sin(uT * 1.1 + position.x * .6);');
    };
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scenery.add(m); return m;
  }
  const grass = clumps(grassTex, 150, CLEAR + .3, CLEAR + 11.6, .28, .62), ferns = clumps(fernTex, 34, CLEAR + 1.2, CLEAR + 9.6, .5, .95);
  const stoneGeo = (() => {
    const list = [];
    for (let i = 0; i < 9; i++) {
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, k = rr(.14, .42), a = rnd() * TAU, r = rr(CLEAR + .8, CLEAR + 7.6), ph = rnd() * 9;
      for (let j = 0; j < p.count; j++) { const x = p.getX(j), y = p.getY(j), z = p.getZ(j), n = 1 + .22 * Math.sin(x * 3.1 + ph) * Math.sin(z * 2.7 + ph) + .1 * Math.sin(y * 5 + ph); p.setXYZ(j, x * k * n * 1.3, Math.max(-.2, y) * k * n * .7, z * k * n); }
      g.rotateY(rnd() * TAU); g.translate(Math.sin(a) * r, 0, Math.cos(a) * r); list.push(g);
    }
    const out = new THREE.BufferGeometry(), n = list.reduce((s, g) => s + g.attributes.position.count, 0), arr = new Float32Array(n * 3); let o = 0;
    for (const g of list) { arr.set(g.attributes.position.array, o); o += g.attributes.position.array.length; }
    out.setAttribute('position', new THREE.BufferAttribute(arr, 3)); out.computeVertexNormals(); return out;
  })();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a5466, roughness: .92, flatShading: true });
  scenery.add(new THREE.Mesh(stoneGeo, stoneMat));

  // ---------- ground mist: soft layers that drift, clear in the middle so the creature stands in the open ----------
  const mistTex = (() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S, r = rr(18, 60), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const mistU = [];
  for (const [y, k, sp] of [[.12, 1, .006], [.42, .8, -.004], [.95, .55, .003]]) {
    const u = { uMap: { value: mistTex }, uC: { value: new THREE.Color() }, uA: { value: .5 * k }, uT: T, uSp: { value: sp }, uClear: { value: CLEAR + .6 } };
    mistU.push(u);
    const m = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vP;\nvoid main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform sampler2D uMap; uniform vec3 uC; uniform float uA, uT, uSp, uClear; varying vec2 vP;',
        'void main(){',
        ' float r = length(vP), n = texture2D(uMap, vP / 9. + vec2(uT * uSp, uT * uSp * .6)).r * texture2D(uMap, vP / 23. - vec2(uT * uSp * .5, 0.)).r * 3.;',
        ' float a = uA * n * smoothstep(uClear, uClear + 4., r) * (1. - smoothstep(22., 30., r));',
        ' gl_FragColor = vec4(uC, a);',
        '}'].join('\n'),
    }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 4; m.frustumCulled = false; scenery.add(m);
  }

  // ---------- fireflies: drifting, blinking motes over the grass (night only) ----------
  const NF = 70, fpos = new Float32Array(NF * 3), fph = new Float32Array(NF * 4);
  for (let i = 0; i < NF; i++) { const a = rnd() * TAU, r = rr(CLEAR, CLEAR + 9.6); fpos.set([Math.sin(a) * r, rr(.25, 2.6), Math.cos(a) * r], i * 3); fph.set([rnd() * TAU, rr(.5, 1.4), rr(.15, .5), rr(.6, 1.6)], i * 4); }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fgeo.setAttribute('aPh', new THREE.BufferAttribute(fph, 4));
  const fliesU = { uT: T, uScale: { value: 400 }, uOn: { value: 1 } };
  const flies = new THREE.Points(fgeo, new THREE.ShaderMaterial({
    uniforms: fliesU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute vec4 aPh; uniform float uT, uScale, uOn; varying float vA;',
      'void main(){',
      ' vec3 p = position + vec3(sin(uT * aPh.y * .5 + aPh.x) * 1.2, sin(uT * aPh.y * .7 + aPh.x * 2.) * .35, cos(uT * aPh.y * .4 + aPh.x * 1.3) * 1.2);',
      ' vA = uOn * pow(max(0., sin(uT * aPh.w + aPh.x * 3.)), 3.);',
      ' vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = vA > .01 ? aPh.z * .22 * uScale / -mv.z : 0.;',
      '}'].join('\n'),
    fragmentShader: 'varying float vA;\nvoid main(){ float d = length(gl_PointCoord - .5) * 2.; float k = smoothstep(1., 0., d); gl_FragColor = vec4(vec3(.85, 1., .45) * (k * k + .6 * smoothstep(.35, 0., d)) * vA, 1.); }',
  }));
  flies.frustumCulled = false; flies.renderOrder = 9; scenery.add(flies);
  flies.onBeforeRender = (r) => { const v = new THREE.Vector2(); r.getDrawingBufferSize(v); fliesU.uScale.value = v.y; };

  // ---------- metre rings, to judge the size by ----------
  function ringsTex(day) {
    const S = 1024, c = cvs(S, S), g = c.getContext('2d'), h = S / 2, ppm = h / (RM + 1);
    g.strokeStyle = day ? 'rgba(40,30,20,.3)' : 'rgba(214,222,255,.16)'; g.lineWidth = 2; g.fillStyle = day ? 'rgba(40,30,20,.5)' : 'rgba(214,222,255,.38)'; g.font = '22px sans-serif';
    for (let m = 1; m <= RM; m++) { g.beginPath(); g.arc(h, h, m * ppm, 0, TAU); g.stroke(); if (RM <= 8 || m % 2 === 0) g.fillText(m + ' m', h + m * ppm + 6, h - 6); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const ringTex = [ringsTex(false), ringsTex(true)];
  const rings = new THREE.Mesh(new THREE.CircleGeometry(RM + 1, 72), new THREE.MeshBasicMaterial({ map: ringTex[0], transparent: true, depthWrite: false }));
  rings.rotation.x = -Math.PI / 2; rings.position.y = .003; rings.renderOrder = -7; root.add(rings);
  // with the scenery off: the bench's old plain floor, a soft disc fading into the stage
  const bareTex = (day) => {
    const S = 512, c = cvs(S, S), g = c.getContext('2d'), h = S / 2, base = day ? [104, 96, 78] : [43, 35, 50], q = g.createRadialGradient(h, h, 0, h, h, h);
    q.addColorStop(0, 'rgba(' + base + ',1)'); q.addColorStop(.62, 'rgba(' + base + ',.85)'); q.addColorStop(1, 'rgba(' + base + ',0)'); g.fillStyle = q; g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  };
  const bareT = [bareTex(false), bareTex(true)];
  const bare = new THREE.Mesh(new THREE.CircleGeometry(RM + 1, 72), new THREE.MeshStandardMaterial({ map: bareT[0], transparent: true, roughness: .95, depthWrite: false }));
  bare.rotation.x = -Math.PI / 2; bare.renderOrder = -8; bare.visible = false; root.add(bare);

  // ---------- switching looks ----------
  let isDay = false;
  function setDay(on) {
    isDay = !!on; const L = on ? LOOK.day : LOOK.night;
    skyU.uTop.value.set(L.top); skyU.uMid.value.set(L.mid); skyU.uHor.value.set(L.hor); skyU.uMoon.value.set(L.moon); skyU.uGlow.value = L.glow; skyU.uStars.value = L.stars;
    for (const { u, near } of treeU) { u.uTree.value.set(near ? L.near : L.far); u.uMist.value.set(L.mist); u.uRim.value.set(L.moon); }
    for (const u of mistU) { u.uC.value.set(L.mist); u.uA.value = L.mistA * (u === mistU[0] ? 1 : u === mistU[1] ? .8 : .55); }
    floorMat.color.set(L.floor); grass.material.color.set(L.grass); ferns.material.color.set(L.grass); stoneMat.color.set(L.stone);
    fliesU.uOn.value = L.flies; rings.material.map = ringTex[on ? 1 : 0]; bare.material.map = bareT[on ? 1 : 0]; rings.material.needsUpdate = bare.material.needsUpdate = true;
  }
  setDay(false);
  return {
    root,
    update(t) { T.value = t; },
    setDay,
    setRings(on) { rings.visible = !!on; },
    setScenery(on) { scenery.visible = !!on; bare.visible = !on; },
    get day() { return isDay; },
  };
}
