// core.js: the parts every 3D place of Envoi is made with (the world3d job, November 16, 2026).
//   W3D.map(place)      the painting's pixels to metres and back: x across, y down the painting (south), as maps.js keeps them
//   W3D.Builder         static geometry merged by material, so a whole place draws in a handful of calls
//   W3D.mat(...)        the night look: one small shader for every surface (moonlight, a sky glow, the lamps' warm light
//                       painted into a light map in the painting's own pixels, soft shade under trees and by walls, fog)
//   W3D.textures(ids)   Chris's made texture where there is one (texture-packs/made/<id>.png), the stand-in where not
// Everything is three.js r128. Nothing here knows about any one place.
(function (G) {
  'use strict';
  const W3D = G.W3D = G.W3D || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  W3D.clamp = clamp; W3D.ss = ss; W3D.lerp = (a, b, t) => a + (b - a) * t;

  // ---- the painting's pixels and metres ----
  // A walking painting is 1536 x 1024, seen from above at a slant. Across, one pixel is 4 cm (Io stands 42 px tall in the
  // 2D walk, and is 1.7 m); down the painting the ground is squashed, so one pixel there is 5 cm (the Moonwell's round
  // ring is painted 1.25 times wider than tall). The painting's middle is the world's middle; north is -z.
  W3D.map = function (p) {
    const SX = p.sx || 0.04, SZ = p.sz || 0.05, CX = (p.w || 1536) / 2, CY = (p.h || 1024) / 2;
    return {
      SX, SZ, CX, CY, W: p.w || 1536, H: p.h || 1024,
      x: (px) => (px - CX) * SX, z: (py) => (py - CY) * SZ,
      px: (x) => x / SX + CX, py: (z) => z / SZ + CY,
      w: (px, py) => [(px - CX) * SX, (py - CY) * SZ],
    };
  };

  // ---- polygons in painting pixels ----
  W3D.inPoly = function (poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  // the distance from a point to a polygon's edge (pixels)
  W3D.edgeDist = function (poly, x, y) {
    let d = 1e9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j][0], ay = poly[j][1], bx = poly[i][0], by = poly[i][1], dx = bx - ax, dy = by - ay;
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return d;
  };
  W3D.rectPoly = (r) => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];

  // a seeded random, so a place is laid out the same every time
  W3D.rand = function (seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };

  // ---- the geometry builder ----
  // Each material key gathers positions, normals, uvs (in metres: the shader repeats its texture every so many metres)
  // and colours (a tint per piece). build() gives one mesh per key.
  W3D.Builder = function () {
    const B = {};
    const get = (k) => B[k] || (B[k] = { p: [], n: [], u: [], c: [] });
    const v3 = new THREE.Vector3(), n3 = new THREE.Vector3(), nm = new THREE.Matrix3();
    const api = {
      // a flat quad from four corners (counter-clockwise seen from the front), uv as [u0, v0, u1, v1] in metres
      quad(k, a, b, c, d, uv, col) {
        const g = get(k), e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
        const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
        const [u0, v0, u1, v1] = uv || [0, 0, Math.hypot(...e1), Math.hypot(...e2)];
        const P = [a, b, c, a, c, d], U = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];
        col = col || [1, 1, 1];
        for (let i = 0; i < 6; i++) { g.p.push(P[i][0], P[i][1], P[i][2]); g.n.push(nx, ny, nz); g.u.push(U[i][0], U[i][1]); g.c.push(col[0], col[1], col[2]); }
      },
      tri(k, a, b, c, uv, col) {
        const g = get(k), e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
        const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L; col = col || [1, 1, 1];
        const P = [a, b, c];
        for (let i = 0; i < 3; i++) { g.p.push(P[i][0], P[i][1], P[i][2]); g.n.push(nx, ny, nz); g.u.push(uv[i][0], uv[i][1]); g.c.push(col[0], col[1], col[2]); }
      },
      // a box standing on (x, y, z), w across x, d along z, h up, turned by ry; uv in metres on every face
      box(k, x, y, z, w, h, d, ry, col, opt) {
        opt = opt || {};
        const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
        const P = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
        const hw = w / 2, hd = d / 2;
        const A = P(-hw, 0, hd), Bq = P(hw, 0, hd), C = P(hw, h, hd), D = P(-hw, h, hd);
        const E = P(hw, 0, -hd), F = P(-hw, 0, -hd), Gq = P(-hw, h, -hd), H = P(hw, h, -hd);
        const u = opt.u0 || 0, vb = opt.v0 != null ? opt.v0 : y;
        if (!opt.noFront) api.quad(k, A, Bq, C, D, [u, vb, u + w, vb + h], col);
        if (!opt.noBack) api.quad(k, E, F, Gq, H, [u, vb, u + w, vb + h], col);
        if (!opt.noSides) { api.quad(k, Bq, E, H, C, [u, vb, u + d, vb + h], col); api.quad(k, F, A, D, Gq, [u, vb, u + d, vb + h], col); }
        if (!opt.noTop) api.quad(k, D, C, H, Gq, [x - hw, z - hd, x + hw, z + hd], col);
        if (opt.bottom) api.quad(k, F, E, Bq, A, [0, 0, w, d], col);
      },
      // any three.js geometry, placed by a matrix; uvScale turns its uvs into metres
      geom(k, geo, m4, col, uvScale) {
        const g = get(k), gi = geo.index ? geo.toNonIndexed() : geo;
        const pa = gi.attributes.position, na = gi.attributes.normal, ua = gi.attributes.uv;
        nm.getNormalMatrix(m4); col = col || [1, 1, 1];
        const us = uvScale == null ? 1 : uvScale, usx = Array.isArray(us) ? us[0] : us, usy = Array.isArray(us) ? us[1] : us;
        for (let i = 0; i < pa.count; i++) {
          v3.fromBufferAttribute(pa, i).applyMatrix4(m4); g.p.push(v3.x, v3.y, v3.z);
          if (na) { n3.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); g.n.push(n3.x, n3.y, n3.z); } else g.n.push(0, 1, 0);
          if (ua) g.u.push(ua.getX(i) * usx, ua.getY(i) * usy); else g.u.push(0, 0);
          if (typeof col === 'function') { const cc = col(v3, i); g.c.push(cc[0], cc[1], cc[2]); } else g.c.push(col[0], col[1], col[2]);
        }
        if (gi !== geo) gi.dispose();
      },
      // a cylinder (or cone, r1 at the top) standing on (x, y, z)
      cyl(k, x, y, z, r0, r1, h, seg, col, uvs, open) {
        const geo = new THREE.CylinderGeometry(r1, r0, h, seg || 8, 1, !!open);
        const m = new THREE.Matrix4().makeTranslation(x, y + h / 2, z);
        api.geom(k, geo, m, col, uvs || [Math.PI * 2 * Math.max(r0, r1), h]); geo.dispose();
      },
      keys: () => Object.keys(B),
      count: (k) => (B[k] ? B[k].p.length / 9 : 0),
      // one mesh per material key that has anything in it
      build(mats) {
        const out = {};
        for (const k in B) {
          const g = B[k]; if (!g.p.length) continue;
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3));
          geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
          geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.u, 2));
          geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3));
          geo.computeBoundingSphere();
          const mesh = new THREE.Mesh(geo, mats[k]); mesh.name = k; mesh.matrixAutoUpdate = false;
          if (!mats[k]) console.warn('world3d: no material for', k);
          out[k] = mesh;
        }
        return out;
      },
    };
    return api;
  };

  // ---- textures ----
  // ids -> { id: THREE.Texture }. Each is Chris's made one when the page carries it, otherwise the stand-in. The page
  // names both paths as "./..." strings, so the offline build puts whichever pictures exist inside the file.
  W3D.loadTextures = function (list, renderer) {
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const out = {}, used = {};
    const jobs = list.map((t) => new Promise((res) => {
      const tex = new THREE.Texture(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = aniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; out[t.id] = tex;
      const tries = (t.made ? [['made', t.made]] : []).concat(t.stand ? [['stand-in', t.stand]] : []);
      const next = () => {
        const q = tries.shift();
        if (!q) { used[t.id] = 'none'; tex.image = W3D.flatImage(t.flat || [128, 128, 128]); tex.needsUpdate = true; return res(); }
        // a made texture counts only when the page carries it (the build put it inside); otherwise the stand-in
        if (q[0] === 'made' && !/^data:/.test(q[1])) { next(); return; }
        const im = new Image();
        im.onload = () => { tex.image = im; tex.needsUpdate = true; used[t.id] = q[0]; res(); };
        im.onerror = next; im.src = q[1];
      };
      next();
    }));
    return Promise.all(jobs).then(() => ({ tex: out, used }));
  };
  W3D.flatImage = function (rgb) { const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d'); g.fillStyle = 'rgb(' + rgb.join(',') + ')'; g.fillRect(0, 0, 4, 4); return c; };
  W3D.canvasTex = function (cv, repeat) {
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return t;
  };

  // ---- the night look ----
  // Shared by every surface (one uniforms object, so the moon, fog and lamps change everywhere at once).
  W3D.night = function (M, opt) {
    opt = opt || {};
    return {
      uGlow: { value: null }, uShade: { value: null },
      uMapK: { value: new THREE.Vector4(1 / (M.SX * M.W), 1 / (M.SZ * M.H), M.CX / M.W, M.CY / M.H) },
      // the textures are already painted at night, so the light that falls on them is nearly white: a sky from above, a
      // dark ground below, and the moon (high in the north-west) for the shape of things
      uSky: { value: new THREE.Color().setRGB(0.62, 0.6, 0.7) }, uGround: { value: new THREE.Color().setRGB(0.1, 0.09, 0.13) },
      uMoonDir: { value: new THREE.Vector3(-0.35, 0.8, -0.48).normalize() }, uMoon: { value: new THREE.Color().setRGB(0.42, 0.43, 0.56) },
      uFog: { value: new THREE.Color().setRGB(0.075, 0.08, 0.16) }, uFogNear: { value: opt.fogNear || 30 }, uFogFar: { value: opt.fogFar || 115 },
      uGlowK: { value: opt.glowK || 1.7 }, uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() }, uIo: { value: new THREE.Vector3(0, -99, 0) }, uCut: { value: 0 },
    };
  };
  const CHUNK_V = `
    varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol;
    uniform vec2 uRep;
    void main() {
      vec4 p = vec4(position, 1.0); vec3 n = normal;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
      #endif
      vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
      vUv = uv * uRep;
      vCol = vec3(1.0);
      #ifdef USE_COLOR
        vCol = color;
      #endif
      #ifdef USE_INSTANCING_COLOR
        vCol *= instanceColor;
      #endif
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const CHUNK_F_HEAD = `
    varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol;
    uniform sampler2D uGlow, uShade; uniform vec4 uMapK;
    uniform vec3 uSky, uGround, uMoonDir, uMoon, uFog; uniform float uFogNear, uFogFar, uGlowK, uTime;
    uniform vec3 uCam, uIo; uniform float uCut;
    uniform vec3 uTint, uEmis; uniform float uLit, uGlowUse, uSpec, uShadeK;
    vec2 paintUv(vec3 w) { return vec2(w.x * uMapK.x + uMapK.z, w.z * uMapK.y + uMapK.w); }
    vec3 toLin(vec3 c) { return c * c; }
    // the lamps' warm light, painted in the place's light map; less of it high up
    vec3 lampLight(vec3 w, vec3 n) {
      vec3 g = toLin(texture2D(uGlow, paintUv(w)).rgb) * uGlowK;
      float up = clamp(1.3 - max(w.y, 0.0) * 0.1, 0.3, 1.0);
      return g * up * (0.55 + 0.45 * clamp(n.y, 0.0, 1.0));
    }
    float shade(vec3 w) { return mix(1.0, texture2D(uShade, paintUv(w)).r, uShadeK); }
    vec3 nightLight(vec3 w, vec3 n, float sh) {
      vec3 hemi = mix(uGround, uSky, n.y * 0.5 + 0.5);
      float m = max(dot(n, uMoonDir), 0.0);
      return (hemi + uMoon * m) * sh;
    }
    // anything between the camera and Io thins away in a fine dither, so she is never hidden
    void cutAway(vec3 w) {
      if (uCut < 0.5) return;
      vec3 ab = uIo - uCam; float L = length(ab); vec3 d = ab / L;
      float t = dot(w - uCam, d);
      if (t > L - 0.7 || t < 0.4) return;
      float r = length(w - uCam - d * t);
      float R = mix(0.9, 2.4, clamp(t / L, 0.0, 1.0));
      if (r < R) {
        vec2 q = mod(floor(gl_FragCoord.xy), 4.0);
        float dith = (mod(q.x + q.y * 2.0, 4.0) * 4.0 + mod(q.x * 2.0 + q.y * 3.0, 4.0) + 0.5) / 16.0;
        float k = smoothstep(R, R * 0.55, r);
        if (dith < k * 0.92) discard;
      }
    }
    vec3 fogged(vec3 c, vec3 w) { float d = distance(w, cameraPosition); return mix(c, uFog, smoothstep(uFogNear, uFogFar, d) * 0.92); }
    vec4 outC(vec3 c) { return vec4(sqrt(max(c, 0.0)), 1.0); }
  `;
  // a surface: textured (map), tinted, lit by the night (uLit 1) or glowing by itself (uLit 0)
  W3D.mat = function (U, o) {
    o = o || {};
    const defs = {};
    if (o.map) defs.USE_MAP = '';
    if (o.alphaTest) defs.ALPHA_TEST = '';
    if (o.cut) defs.CUT = '';
    if (o.water) defs.WATER = '';
    if (o.nofog) defs.NOFOG = '';
    const uni = Object.assign({}, U, {
      map: { value: o.map || null }, uRep: { value: new THREE.Vector2(1 / (o.rep || 1), 1 / (o.repV || o.rep || 1)) },
      uTint: { value: new THREE.Color(o.tint == null ? 0xffffff : o.tint) }, uEmis: { value: new THREE.Color(o.emis || 0x000000) },
      uLit: { value: o.lit == null ? 1 : o.lit }, uGlowUse: { value: o.glow == null ? 1 : o.glow }, uSpec: { value: o.spec || 0 }, uShadeK: { value: o.shade == null ? 1 : o.shade },
      uAlpha: { value: o.alphaTest || 0.5 },
    });
    const frag = CHUNK_F_HEAD + `
      uniform sampler2D map; uniform float uAlpha;
      void main() {
        #ifdef CUT
          cutAway(vW);
        #endif
        vec3 alb = toLin(uTint) * vCol;
        #ifdef USE_MAP
          vec4 tx = texture2D(map, vUv);
          #ifdef ALPHA_TEST
            if (tx.a < uAlpha) discard;
          #endif
          alb *= toLin(tx.rgb);
        #endif
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float sh = shade(vW);
        vec3 c = alb * (nightLight(vW, n, sh) + lampLight(vW, n) * uGlowUse) * uLit + alb * (1.0 - uLit) + toLin(uEmis);
        // a glint of moon on wet or polished things
        if (uSpec > 0.0) { vec3 v = normalize(cameraPosition - vW); vec3 h = normalize(v + uMoonDir); c += uMoon * pow(max(dot(n, h), 0.0), 40.0) * uSpec * sh; }
        #ifdef NOFOG
          gl_FragColor = outC(c);
        #else
          gl_FragColor = outC(fogged(c, vW));
        #endif
      }`;
    const m = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: CHUNK_V, fragmentShader: frag, defines: defs, vertexColors: true, side: o.side || THREE.FrontSide, transparent: !!o.transparent });
    m.extensions = { derivatives: false };
    return m;
  };

  // the ground: four textures laid by a splat map in the painting's pixels (red: cobbles, green: earth, blue: paving,
  // none: grass), each repeated in metres, with a second, larger sampling of each to break up the repeat
  W3D.groundMat = function (U, t) {
    const uni = Object.assign({}, U, {
      tCob: { value: t.cob }, tGrass: { value: t.grass }, tDirt: { value: t.dirt }, tPave: { value: t.pave }, uSplat: { value: t.splat },
      uRep4: { value: new THREE.Vector4(1 / t.rep[0], 1 / t.rep[1], 1 / t.rep[2], 1 / t.rep[3]) },
      uRep: { value: new THREE.Vector2(1, 1) }, uTint: { value: new THREE.Color(0xffffff) }, uEmis: { value: new THREE.Color(0) }, uLit: { value: 1 }, uGlowUse: { value: 1 }, uSpec: { value: 0 }, uShadeK: { value: 1 },
    });
    const frag = CHUNK_F_HEAD + `
      uniform sampler2D tCob, tGrass, tDirt, tPave, uSplat; uniform vec4 uRep4;
      vec3 two(sampler2D t, vec2 w, float rep) {
        vec3 a = texture2D(t, w * rep).rgb, b = texture2D(t, w * rep * 0.29 + vec2(0.37, 0.71)).rgb;
        float la = dot(b, vec3(0.333));
        return toLin(a) * mix(0.78, 1.22, smoothstep(0.15, 0.6, la));
      }
      void main() {
        vec2 w = vW.xz;
        vec3 s = texture2D(uSplat, paintUv(vW)).rgb;
        vec3 g = two(tGrass, w, uRep4.y) * vec3(0.5, 0.58, 0.55);
        vec3 c = mix(g, two(tDirt, w, uRep4.z), s.g);
        c = mix(c, two(tCob, w, uRep4.x), s.r);
        c = mix(c, two(tPave, w, uRep4.w), s.b);
        vec3 n = normalize(vN);
        float sh = shade(vW);
        vec3 col = c * (nightLight(vW, n, sh) + lampLight(vW, n));
        gl_FragColor = outC(fogged(col, vW));
      }`;
    return new THREE.ShaderMaterial({ uniforms: uni, vertexShader: CHUNK_V, fragmentShader: frag, vertexColors: true });
  };

  // still water: its dark texture drifting, the moon's glint, the lamps' light lying on it in long wobbling streaks,
  // and white water where it falls (where the surface is steep)
  W3D.waterMat = function (U, t) {
    const uni = Object.assign({}, U, {
      tWater: { value: t.water }, uRep: { value: new THREE.Vector2(1 / (t.rep || 5), 1 / (t.rep || 5)) }, uFlow: { value: new THREE.Vector2(t.flow ? t.flow[0] : 0.01, t.flow ? t.flow[1] : 0.004) },
      uTint: { value: new THREE.Color(t.tint || 0xffffff) }, uEmis: { value: new THREE.Color(0) }, uLit: { value: 1 }, uGlowUse: { value: 1 }, uSpec: { value: 0 }, uShadeK: { value: 1 },
    });
    const frag = CHUNK_F_HEAD + `
      uniform sampler2D tWater; uniform vec2 uFlow;
      void main() {
        vec3 n = normalize(vN);
        float fall = smoothstep(0.92, 0.55, n.y);
        vec2 fl = uFlow * uTime * (1.0 + fall * 30.0);
        vec3 a = toLin(texture2D(tWater, vUv + fl).rgb), b = toLin(texture2D(tWater, vUv * 0.61 - fl * 0.7 + 0.3).rgb);
        vec3 c = (a + b) * 0.5 * toLin(uTint);
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(v.y, 0.0), 3.0);
        vec3 sky = uSky * 0.55 * (0.35 + fres);
        // the lamps on the water: their light map read a little toward the camera, wobbling
        vec2 wob = vec2(sin(vW.z * 3.1 + uTime * 1.7), cos(vW.x * 2.3 + uTime * 1.3)) * 0.35;
        vec3 lw = vW + vec3(wob.x, 0.0, wob.y) - vec3(v.x, 0.0, v.z) * 1.5;
        vec3 g = toLin(texture2D(uGlow, paintUv(lw)).rgb) * uGlowK * 0.9;
        vec3 h = normalize(v + uMoonDir);
        float glint = pow(max(dot(vec3(wob.x * 0.25, 1.0, wob.y * 0.25), h), 0.0), 60.0);
        vec3 col = c * 1.4 + sky * 0.6 + g * (0.35 + fres) + uMoon * glint * 1.3;
        col = mix(col, vec3(0.55, 0.6, 0.75) * (0.6 + 0.4 * a.b * 3.0), fall * 0.85);
        gl_FragColor = outC(fogged(col, vW));
      }`;
    return new THREE.ShaderMaterial({ uniforms: uni, vertexShader: CHUNK_V, fragmentShader: frag, vertexColors: true });
  };

  // the sky: deep violet to the blue near the hills, the full moon with its halo and a few thin clouds; no stars (the
  // story is one long night, and the stars only come back at its end)
  W3D.skyMat = function (U) {
    return new THREE.ShaderMaterial({
      uniforms: { uMoonDir: U.uMoonDir, uTime: U.uTime, uFog: U.uFog },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uMoonDir, uFog; uniform float uTime;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 d = normalize(vD); float y = max(d.y, 0.0);
          vec3 top = vec3(0.075, 0.06, 0.17), mid = vec3(0.16, 0.13, 0.32), low = vec3(0.24, 0.24, 0.44);
          vec3 c = mix(low, mid, smoothstep(0.0, 0.22, y)); c = mix(c, top, smoothstep(0.2, 0.85, y));
          c = mix(uFog * 1.3, c, smoothstep(-0.05, 0.06, d.y));
          float m = dot(d, uMoonDir);
          float disc = smoothstep(0.99935, 0.99955, m);
          vec2 mp = d.xz * 60.0; float mare = n2(mp) * 0.5 + n2(mp * 2.3) * 0.3;
          vec3 moon = mix(vec3(1.0, 0.97, 0.9), vec3(0.78, 0.8, 0.86), smoothstep(0.45, 0.75, mare));
          c += vec3(0.32, 0.33, 0.52) * pow(max(m, 0.0), 120.0) + vec3(0.12, 0.12, 0.22) * pow(max(m, 0.0), 12.0);
          // thin clouds, drifting slowly
          vec2 cp = d.xz / (d.y + 0.12) * 1.6 + vec2(uTime * 0.004, 0.0);
          float cl = smoothstep(0.55, 0.85, n2(cp * vec2(1.0, 3.0)) * 0.65 + n2(cp * 3.1) * 0.35) * smoothstep(0.03, 0.25, y);
          c = mix(c, c * 0.55 + vec3(0.18, 0.17, 0.3) * (0.5 + pow(max(m, 0.0), 30.0) * 1.5), cl * 0.6);
          c = mix(c, moon, disc * (1.0 - cl * 0.5));
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.BackSide, depthWrite: false,
    });
  };
})(window);
