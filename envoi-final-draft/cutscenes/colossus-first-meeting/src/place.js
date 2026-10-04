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
