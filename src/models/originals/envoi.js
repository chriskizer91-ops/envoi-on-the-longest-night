// Imported unchanged from reference/demos/envoi-letter-wyrm-model-preview.html. three.js r128 (global THREE).
function makeEnvoiOriginal(opts) {
  'use strict';
  opts = opts || {};
  const T = THREE;
  const DETAIL = Math.min(1, Math.max(0.5, opts.detail == null ? 1 : +opts.detail));
  let seed = 51713;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + rnd() * (b - a);
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const win = (x, a, b, c, d) => sm(a, b, x) * (1 - sm(c, d, x));
  const TAU = Math.PI * 2;
  const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
  const UP = V3(0, 1, 0);
  let texBytes = 0, texCount = 0;

  // ---------- canvas painting ----------
  function tex(w, h, draw, k) {
    k = k || 1; const c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
    const g = c.getContext('2d'); g.scale(k, k); draw(g, w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    texBytes += w * k * h * k * 4 * 1.33; texCount++;
    return t;
  }
  const HI = DETAIL >= 0.85 ? 2 : 1;
  const INK = (a) => 'rgba(52,32,20,' + a + ')';
  function glyph(g, x, y, s, a) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK(a);
    const n = 3 + ((rnd() * 4) | 0);
    for (let i = 0; i < n; i++) {
      g.lineWidth = s * rr(0.07, 0.14);
      const x0 = x + rr(-0.38, 0.3) * s, y0 = y + rr(-0.42, 0.3) * s, k = rnd();
      g.beginPath(); g.moveTo(x0, y0);
      if (k < 0.38) g.lineTo(x0 + rr(0.35, 0.75) * s, y0 + rr(-0.1, 0.06) * s);
      else if (k < 0.78) g.quadraticCurveTo(x0 + rr(-0.15, 0.15) * s, y0 + 0.35 * s, x0 + rr(-0.3, 0.25) * s, y0 + rr(0.45, 0.75) * s);
      else g.lineTo(x0 + rr(0.08, 0.15) * s, y0 + rr(0.1, 0.18) * s);
      g.stroke();
    }
  }
  function column(g, x, y0, y1, s, a) { let y = y0; while (y < y1) { glyph(g, x, y, s, a * rr(0.55, 1)); y += s * rr(1.05, 1.35); } }
  function writeBlock(g, x0, y0, w, h, s, a) { for (let x = x0 + s * 0.6; x < x0 + w - s * 0.3; x += s * rr(1.25, 1.5)) column(g, x, y0 + s * rr(0.5, 1.5), y0 + h - s * rr(0.4, 2.2), s, a); }
  function stamp(g, x, y, s, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(176,30,32,' + a + ')'; g.fillRect(-s / 2, -s / 2, s, s);
    g.strokeStyle = 'rgba(246,226,196,' + a * 0.85 + ')'; g.lineWidth = s * 0.07; g.strokeRect(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72);
    g.lineWidth = s * 0.09; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); const yy = -s * 0.2 + i * s * 0.2; g.moveTo(-s * 0.22, yy); g.lineTo(s * rr(0.05, 0.22), yy + rr(-0.05, 0.05) * s); g.stroke(); }
    g.restore();
  }
  function paper(g, x0, y0, w, h, base) {
    g.fillStyle = base || '#ecdfc3'; g.fillRect(x0, y0, w, h);
    const n = (w * h) / 700;
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * w, y = y0 + rnd() * h, r = rr(4, 26), d = rnd() < 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, d ? 'rgba(140,100,55,0.07)' : 'rgba(255,250,236,0.09)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.strokeStyle = 'rgba(120,88,50,0.07)'; g.lineWidth = 1;
    for (let i = 0; i < n * 0.7; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h, a = rr(0, TAU), l = rr(3, 11); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  }
  function scorch(g, x0, y0, w, h, fromRight, glow) {
    // ragged burnt band along one edge, used on wing tips and streamer ends
    const steps = 24;
    for (let pass = 0; pass < 3; pass++) {
      const depth = [0.16, 0.09, 0.04][pass] * w, col = glow ? ['rgba(255,120,30,0.9)', 'rgba(60,20,5,1)', 'rgba(0,0,0,1)'][pass] : ['rgba(150,90,40,0.55)', 'rgba(70,38,18,0.9)', 'rgba(25,14,8,1)'][pass];
      g.fillStyle = col; g.beginPath();
      const ex = fromRight ? x0 + w : x0;
      g.moveTo(ex, y0);
      for (let i = 0; i <= steps; i++) { const y = y0 + (h * i) / steps, d = depth * rr(0.4, 1.3); g.lineTo(fromRight ? ex - d : ex + d, y); }
      g.lineTo(ex, y0 + h); g.closePath(); g.fill();
    }
  }

  // ---------- facet atlas: 2x2 cells, each holds one canonical triangle ----------
  const ATL = 512, CS = 256, PAD = 10;
  const cellTri = (i) => { const cx = (i % 2) * CS, cy = ((i / 2) | 0) * CS; return [[cx + PAD, cy + CS - PAD], [cx + CS - PAD, cy + CS - PAD], [cx + CS / 2, cy + PAD]]; };
  const CELLUV = [0, 1, 2, 3].map((i) => cellTri(i).map(([x, y]) => [x / ATL, 1 - y / ATL]));
  function facetAtlas(glow) {
    return tex(ATL, ATL, (g) => {
      for (let i = 0; i < 4; i++) {
        const cx = (i % 2) * CS, cy = ((i / 2) | 0) * CS, t = cellTri(i);
        const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
        if (glow) {
          g.fillStyle = '#8a4f1c'; g.fillRect(cx, cy, CS, CS);
          const gr = g.createRadialGradient(mx, my + 20, 4, mx, my, CS * 0.62);
          gr.addColorStop(0, '#fff1c8'); gr.addColorStop(0.45, '#ffc76e'); gr.addColorStop(1, '#a5571a');
          g.fillStyle = gr; g.fillRect(cx, cy, CS, CS);
        } else {
          paper(g, cx, cy, CS, CS);
          const gr = g.createLinearGradient(0, cy + CS, 0, cy);
          gr.addColorStop(0, 'rgba(120,80,40,0.16)'); gr.addColorStop(0.3, 'rgba(120,80,40,0)'); g.fillStyle = gr; g.fillRect(cx, cy, CS, CS);
        }
        seed = 900 + i * 77;
        writeBlock(g, cx + 22, cy + 28, CS - 44, CS - 42, 15, glow ? 0.55 : 0.8);
        if (i === 1 || i === 3) stamp(g, cx + CS * (i === 1 ? 0.62 : 0.38), cy + CS * 0.68, 26, rr(-0.3, 0.3), glow ? 0.5 : 0.85);
        g.strokeStyle = glow ? 'rgba(70,30,8,0.9)' : 'rgba(110,70,32,0.42)'; g.lineWidth = glow ? 7 : 4; g.lineJoin = 'miter';
        g.beginPath(); g.moveTo(t[0][0], t[0][1]); g.lineTo(t[1][0], t[1][1]); g.lineTo(t[2][0], t[2][1]); g.closePath(); g.stroke();
        if (!glow) { g.strokeStyle = 'rgba(255,248,230,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(t[0][0] + 6, t[0][1] - 4); g.lineTo(t[2][0], t[2][1] + 8); g.lineTo(t[1][0] - 6, t[1][1] - 4); g.stroke(); }
      }
    }, glow ? 1 : HI);
  }
  seed = 4242;
  const segMap = facetAtlas(false), segGlow = facetAtlas(true);

  function wingTex(glow) {
    return tex(512, 256, (g, w, h) => {
      if (glow) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#5a3214'); gr.addColorStop(0.22, '#e6b878'); gr.addColorStop(0.7, '#fff0c8'); gr.addColorStop(1, '#f2c47e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      else paper(g, 0, 0, w, h, '#eee2c8');
      seed = 3131;
      g.save(); g.translate(0, h); g.rotate(-Math.PI / 2);
      for (let y = 8; y < h - 5; y += 15) column(g, y, 60, w - 64, 10.5, glow ? 0.4 : 0.55);
      g.restore();
      seed = 3200; for (let i = 0; i < 4; i++) stamp(g, rr(150, 400), rr(20, h - 20), 20, rr(-0.4, 0.4), glow ? 0.45 : 0.85);
      g.strokeStyle = glow ? 'rgba(80,36,10,0.55)' : 'rgba(110,72,36,0.25)'; g.lineWidth = 2;
      for (let y = 0; y <= h; y += h / 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      scorch(g, 0, 0, w, h, true, glow);
    }, glow ? 1 : HI);
  }
  const wingMap = wingTex(false), wingGlow = wingTex(true);

  const streamTex = tex(512, 256, (g, w, h) => {
    for (let r = 0; r < 4; r++) {
      const y0 = r * 64; paper(g, 0, y0, w, 64, '#efe4cc');
      seed = 600 + r * 31;
      g.save(); g.translate(0, y0 + 64); g.rotate(-Math.PI / 2);
      column(g, 20, 30, w - 110, 14, 0.75); column(g, 42, 40, w - 140, 13, 0.6);
      g.restore();
      if (r % 2 === 0) stamp(g, rr(140, 300), y0 + 32, 22, rr(-0.3, 0.3), 0.85);
      scorch(g, 0, y0, w, 64, true, false);
      g.fillStyle = 'rgba(70,38,16,0.5)'; for (let i = 0; i < 6; i++) { const x = rr(w * 0.55, w * 0.85); g.beginPath(); g.arc(x, y0 + (rnd() < 0.5 ? 2 : 62), rr(3, 8), 0, TAU); g.fill(); }
    }
  }, HI);
  const tagTex = tex(64, 128, (g, w, h) => {
    g.fillStyle = '#d9c39a'; g.fillRect(0, 0, w, h); paper(g, 3, 3, w - 6, h - 6, '#e8d6b0');
    g.fillStyle = '#3a2416'; g.beginPath(); g.arc(w / 2, 12, 4, 0, TAU); g.fill();
    seed = 77; column(g, w / 2, 32, h - 34, 11, 0.85); stamp(g, w / 2, h - 18, 18, 0, 0.9);
  });
  const sealTex = tex(256, 256, (g, w) => {
    const c = w / 2, gr = g.createRadialGradient(c - 30, c - 30, 10, c, c, c);
    gr.addColorStop(0, '#e2454a'); gr.addColorStop(0.6, '#b5161e'); gr.addColorStop(1, '#6e0a10');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(70,4,8,0.9)'; g.lineWidth = 12; g.beginPath(); g.arc(c, c, c * 0.78, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,150,140,0.55)'; g.lineWidth = 4; g.beginPath(); g.arc(c - 2, c - 2, c * 0.78, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    // an original mark: an open crescent cradling a rising flame
    g.lineCap = 'round'; g.strokeStyle = 'rgba(80,6,10,0.95)'; g.lineWidth = 16;
    g.beginPath(); g.arc(c, c + 6, 54, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    g.beginPath(); g.moveTo(c, c + 46); g.quadraticCurveTo(c - 34, c - 6, c, c - 66); g.quadraticCurveTo(c + 30, c - 8, c, c + 46); g.stroke();
    g.strokeStyle = 'rgba(255,140,130,0.5)'; g.lineWidth = 4;
    g.beginPath(); g.arc(c - 3, c + 3, 54, Math.PI * 0.2, Math.PI * 0.6); g.stroke();
  });
  const heartTex = tex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h / 2, w * 0.7);
    gr.addColorStop(0, '#fff6dc'); gr.addColorStop(0.5, '#ffd47c'); gr.addColorStop(1, '#d88a34');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    seed = 515; writeBlock(g, 30, 30, w - 60, h - 60, 20, 0.35);
    g.strokeStyle = 'rgba(110,60,20,0.7)'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
  });
  function sprite(stops) {
    return tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach((s) => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  }
  const glowSpr = sprite([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  const letterTex = tex(128, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f3e6c8'; g.beginPath(); g.moveTo(8, 10); g.lineTo(w - 10, 6); g.lineTo(w - 6, h - 12); g.lineTo(10, h - 6); g.closePath(); g.fill();
    seed = 808; g.save(); g.translate(0, h); g.rotate(-Math.PI / 2); column(g, 30, 20, w - 20, 11, 0.8); column(g, 52, 24, w - 30, 11, 0.7); g.restore();
    g.fillStyle = 'rgba(176,30,32,0.9)'; g.beginPath(); g.arc(w * 0.72, h * 0.6, 10, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,140,40,0)'); gr.addColorStop(0.7, 'rgba(255,150,50,0.15)'); gr.addColorStop(1, 'rgba(255,110,20,0.95)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  });

  // ---------- materials ----------
  const EMBER = new T.Color(0xffa640), CREASE = new T.Color(0xfff2d0);
  function burnable(mat) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute vec2 aBurn;\nvarying vec2 vBurn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBurn = aBurn;');
      sh.fragmentShader = 'varying vec2 vBurn;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.08, 0.055), vBurn.y);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vBurn.x * (1.0 - vBurn.y * 0.9);\n totalEmissiveRadiance += vec3(1.0, 0.38, 0.06) * vBurn.y * (1.0 - vBurn.y) * 2.4;');
    };
    return mat;
  }
  const matSeg = burnable(new T.MeshStandardMaterial({ map: segMap, emissiveMap: segGlow, emissive: EMBER.clone(), emissiveIntensity: 1.0, roughness: 0.86, metalness: 0, flatShading: true }));
  const matHead = new T.MeshStandardMaterial({ map: segMap, emissiveMap: segGlow, emissive: EMBER.clone(), emissiveIntensity: 0.42, roughness: 0.84, metalness: 0, flatShading: true, side: T.DoubleSide });
  const matWing = new T.MeshStandardMaterial({ map: wingMap, emissiveMap: wingGlow, emissive: EMBER.clone(), emissiveIntensity: 0.4, roughness: 0.9, metalness: 0, flatShading: true, side: T.DoubleSide });
  const matRed = new T.MeshStandardMaterial({ color: 0xb8161f, emissive: 0x3a0306, roughness: 0.55, metalness: 0, flatShading: true });
  const matSeal = new T.MeshStandardMaterial({ map: sealTex, color: 0xffffff, emissive: 0x2a0204, roughness: 0.32, metalness: 0.05 });
  const matLantern = new T.MeshStandardMaterial({ map: heartTex, emissiveMap: heartTex, emissive: 0xffc070, emissiveIntensity: 1.5, roughness: 0.8, side: T.DoubleSide });
  const matFrame = new T.MeshStandardMaterial({ color: 0x6a4420, roughness: 0.42, metalness: 0.55, flatShading: true });
  const matRib = new T.MeshStandardMaterial({ color: 0xc08a52, emissive: 0x4a2408, roughness: 0.45, metalness: 0.1, side: T.DoubleSide });
  const matStream = new T.MeshStandardMaterial({ map: streamTex, emissive: EMBER.clone(), emissiveMap: streamTex, emissiveIntensity: 0.18, roughness: 0.9, side: T.DoubleSide });
  const matTag = new T.MeshStandardMaterial({ map: tagTex, roughness: 0.85, side: T.DoubleSide });
  const matEye = new T.MeshBasicMaterial({ color: 0xffd683 });
  const matMouth = new T.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  const matLetter = new T.MeshBasicMaterial({ map: letterTex, transparent: true, side: T.DoubleSide, depthWrite: false, alphaTest: 0.05 });
  const matShard = new T.MeshStandardMaterial({ color: 0xc01c24, roughness: 0.35, side: T.DoubleSide, flatShading: true });
  function pointsMat() {
    return new T.ShaderMaterial({
      uniforms: { map: { value: glowSpr }, scale: { value: 800 } },
      vertexShader: 'attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale;\nvoid main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC;\nvoid main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vC.a; gl_FragColor = vec4(vC.rgb * t.rgb * a, a * 0.6); }',
      blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneMinusSrcAlphaFactor, transparent: true, depthWrite: false,
    });
  }

  // ---------- faceted paper geometry ----------
  const LV = DETAIL >= 0.85 ? 2 : 1; // crumple subdivision depth
  let LVcur = LV;
  function Soup() { this.p = []; this.u = []; }
  Soup.prototype.tri = function (a, b, c, ua, ub, uc) {
    this.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
  };
  Soup.prototype.geo = function () {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
    g.computeVertexNormals(); return g;
  };
  function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; }
  const _e1 = V3(), _e2 = V3(), _n = V3(), _c = V3();
  // one paper facet: oriented away from `ctr`, subdivided with a tiny crumple that leaves the creases straight
  function facet(S, a, b, c, ctr, amp, cell) {
    _n.copy(_e1.subVectors(b, a)).cross(_e2.subVectors(c, a));
    const area = _n.length() * 0.5; if (area < 1e-7) return;
    _n.normalize();
    _c.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    if (ctr && _n.dot(V3().subVectors(_c, ctr)) < 0) { const t = b; b = c; c = t; _n.negate(); }
    const n = _n.clone(), A = (amp == null ? 0.05 : amp) * Math.sqrt(area);
    const uv = CELLUV[cell == null ? (rnd() * 4) | 0 : cell];
    const P = (w) => {
      const p = V3().addScaledVector(a, w[0]).addScaledVector(b, w[1]).addScaledVector(c, w[2]);
      const e = Math.min(w[0], w[1], w[2]) * 3;
      if (e > 0 && A > 0) p.addScaledVector(n, A * e * hash3(p.x * 9.1, p.y * 9.1, p.z * 9.1));
      return p;
    };
    const U = (w) => [uv[0][0] * w[0] + uv[1][0] * w[1] + uv[2][0] * w[2], uv[0][1] * w[0] + uv[1][1] * w[1] + uv[2][1] * w[2]];
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    const rec = (wa, wb, wc, d) => {
      if (d === 0) { S.tri(P(wa), P(wb), P(wc), U(wa), U(wb), U(wc)); return; }
      const ab = mid(wa, wb), bc = mid(wb, wc), ca = mid(wc, wa);
      rec(wa, ab, ca, d - 1); rec(ab, wb, bc, d - 1); rec(ca, bc, wc, d - 1); rec(ab, bc, ca, d - 1);
    };
    rec([1, 0, 0], [0, 1, 0], [0, 0, 1], amp === 0 ? 0 : LVcur);
  }
  // rings of points along a path; radius 0 makes a point (tip). Every face is a paper facet.
  function tube(S, path, rad, sides, o) {
    o = o || {};
    const rings = [];
    for (let k = 0; k < path.length; k++) {
      const d = (k < path.length - 1 ? V3().subVectors(path[k + 1], path[k]) : V3().subVectors(path[k], path[k - 1])).normalize();
      const sd = V3().crossVectors(d, Math.abs(d.y) > 0.92 ? V3(0, 0, 1) : UP).normalize();
      const u2 = V3().crossVectors(sd, d).normalize();
      if (rad[k] <= 0) { rings.push(null); continue; }
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * TAU + (o.phase || 0);
        ring.push(path[k].clone().addScaledVector(sd, Math.cos(a) * rad[k] * (o.flat || 1)).addScaledVector(u2, Math.sin(a) * rad[k]));
      }
      rings.push(ring);
    }
    for (let k = 0; k < path.length - 1; k++) {
      const A = rings[k], B = rings[k + 1], ctr = V3().addVectors(path[k], path[k + 1]).multiplyScalar(0.5);
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        if (A && B) { facet(S, A[i], B[i], B[j], ctr, o.amp); facet(S, A[i], B[j], A[j], ctr, o.amp); }
        else if (A && !B) facet(S, A[i], path[k + 1], A[j], ctr.clone().lerp(path[k], 0.5), o.amp);
        else if (!A && B) facet(S, path[k], B[i], B[j], ctr.clone().lerp(path[k + 1], 0.5), o.amp);
      }
    }
    if (rings[0] && o.cap !== false) { const ctr = path[1].clone(); for (let i = 0; i < sides; i++) facet(S, path[0], rings[0][i], rings[0][(i + 1) % sides], ctr, 0); }
  }
  // closed loft along +z through polygon sections
  function loft(S, secs, amp) {
    const P = secs.map((s) => s.pts.map(([x, y]) => V3(x, y, s.z)));
    const cen = (r) => r.reduce((m, p) => m.add(p), V3()).multiplyScalar(1 / r.length);
    for (let k = 0; k < P.length - 1; k++) {
      const n = P[k].length, ctr = cen(P[k]).add(cen(P[k + 1])).multiplyScalar(0.5);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; facet(S, P[k][i], P[k + 1][i], P[k + 1][j], ctr, amp); facet(S, P[k][i], P[k + 1][j], P[k][j], ctr, amp); }
    }
    const capAt = (r, inner) => { const c = cen(r); for (let i = 0; i < r.length; i++) facet(S, c, r[i], r[(i + 1) % r.length], inner, 0); };
    capAt(P[0], cen(P[1])); capAt(P[P.length - 1], cen(P[P.length - 2]));
  }
  function merge(list) {
    const pos = [], uv = [];
    for (const g0 of list) {
      const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, u = g.attributes.uv ? g.attributes.uv.array : null;
      for (let i = 0; i < p.length; i++) pos.push(p[i]);
      for (let i = 0; i < p.length / 3; i++) { uv.push(u ? u[i * 2] : 0, u ? u[i * 2 + 1] : 0); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
  }

  // lantern segment: 8-sided folded diamond, axis +Y, radius 0.33, half-height 0.25
  const SEG_R = 0.33, SEG_H = 0.25;
  function segmentGeo() {
    const S = new Soup(), n = 12, O = V3();
    const top = V3(0, SEG_H, 0), bot = V3(0, -SEG_H, 0), A = [], B = [], M = [], C = [], D = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, a2 = ((i + 0.5) / n) * TAU;
      A.push(V3(Math.cos(a) * SEG_R * 0.62, SEG_H * 0.46, Math.sin(a) * SEG_R * 0.62));
      B.push(V3(Math.cos(a) * SEG_R * 0.62, -SEG_H * 0.46, Math.sin(a) * SEG_R * 0.62));
      C.push(V3(Math.cos(a2) * SEG_R * 0.3, SEG_H * 0.8, Math.sin(a2) * SEG_R * 0.3));
      D.push(V3(Math.cos(a2) * SEG_R * 0.3, -SEG_H * 0.8, Math.sin(a2) * SEG_R * 0.3));
    }
    for (let i = 0; i < 2 * n; i++) { const a = (i / (2 * n)) * TAU, r = i % 2 ? SEG_R * 0.82 : SEG_R; M.push(V3(Math.cos(a) * r, i % 2 ? SEG_H * 0.06 : -SEG_H * 0.06, Math.sin(a) * r)); }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, m0 = M[2 * i], m1 = M[2 * i + 1], m2 = M[(2 * i + 2) % (2 * n)];
      // twisted cap folds near each tip (like a folded lantern top)
      facet(S, top, C[i], C[j], O); facet(S, C[i], A[j], C[j], O); facet(S, C[i], A[i], A[j], O);
      facet(S, bot, D[j], D[i], O); facet(S, D[i], D[j], B[j], O); facet(S, D[i], B[j], B[i], O);
      facet(S, A[i], m0, m1, O); facet(S, A[i], m1, A[j], O); facet(S, A[j], m1, m2, O);
      facet(S, B[i], m1, m0, O); facet(S, B[i], B[j], m1, O); facet(S, B[j], m2, m1, O);
      // a small folded corner flap at every ridge point
      const out = V3(m0.x, 0, m0.z).normalize(), tg = V3(-out.z, 0, out.x).multiplyScalar(0.01);
      const tip = m0.clone().addScaledVector(out, 0.07), up = m0.clone().add(V3(0, 0.06, 0)).addScaledVector(out, -0.03), dn = m0.clone().add(V3(0, -0.06, 0)).addScaledVector(out, -0.03);
      facet(S, up, tip, dn, m0.clone().add(tg), 0.03); facet(S, up, dn, tip, m0.clone().sub(tg), 0.03);
    }
    return S.geo();
  }

  // head, built along +z from the neck joint; mouth line at y = 0
  const pentUp = (h, a, ya, b, dy) => [[0, h + dy], [a, ya + dy], [b, dy], [-b, dy], [-a, ya + dy]];
  const pentDn = (b, a, ya, d) => [[b, 0], [a, -ya], [0, -d], [-a, -ya], [-b, 0]];
  function headGeo() {
    const S = new Soup();
    loft(S, [
      { z: -0.06, pts: pentUp(0.24, 0.16, 0.14, 0.18, 0) },
      { z: 0.18, pts: pentUp(0.38, 0.23, 0.22, 0.25, 0) },
      { z: 0.46, pts: pentUp(0.28, 0.18, 0.16, 0.2, 0) },
      { z: 0.76, pts: pentUp(0.16, 0.11, 0.09, 0.12, 0) },
      { z: 1.02, pts: pentUp(0.05, 0.04, 0.03, 0.05, 0.01) },
    ], 0.05);
    for (const s of [-1, 1]) {
      // long swept horns, a second smaller pair, brow spikes, cheek fins
      tube(S, [V3(0.1 * s, 0.24, 0.06), V3(0.23 * s, 0.72, -0.3), V3(0.36 * s, 1.16, -1.02)], [0.072, 0.046, 0], 4, { phase: Math.PI / 4, amp: 0.03 });
      tube(S, [V3(0.17 * s, 0.18, 0.0), V3(0.3 * s, 0.36, -0.28), V3(0.42 * s, 0.44, -0.58)], [0.045, 0.028, 0], 4, { phase: Math.PI / 4, amp: 0.03 });
      tube(S, [V3(0.13 * s, 0.25, 0.38), V3(0.18 * s, 0.34, 0.2), V3(0.22 * s, 0.4, -0.02)], [0.03, 0.02, 0], 3, { amp: 0.02 });
      tube(S, [V3(0.2 * s, 0.03, 0.2), V3(0.34 * s, 0.02, -0.06), V3(0.48 * s, -0.04, -0.34)], [0.05, 0.03, 0], 4, { flat: 0.35, amp: 0.02 });
      for (let k = 0; k < 4; k++) { const z = 0.32 + k * 0.17, x = (0.17 - k * 0.025) * s; tube(S, [V3(x, 0.005, z), V3(x * 0.97, -0.06, z + 0.02)], [0.018, 0], 3, { amp: 0 }); }
    }
    tube(S, [V3(0, 0.29, 0.2), V3(0, 0.36, 0.04), V3(0, 0.4, -0.16)], [0.03, 0.02, 0], 3, { amp: 0 });
    for (const s of [-1, 1]) {
      // brow ridge over each eye, nostril folds, layered cheek plates, more teeth
      tube(S, [V3(0.1 * s, 0.33, 0.62), V3(0.21 * s, 0.31, 0.44), V3(0.28 * s, 0.34, 0.22), V3(0.31 * s, 0.4, 0.04)], [0.03, 0.045, 0.035, 0], 4, { flat: 0.45, amp: 0.03, phase: Math.PI / 4 });
      tube(S, [V3(0.045 * s, 0.155, 0.9), V3(0.065 * s, 0.19, 0.78), V3(0.07 * s, 0.2, 0.66)], [0.025, 0.02, 0], 3, { amp: 0.02 });
      for (let k = 0; k < 3; k++) tube(S, [V3(0.19 * s, 0.05 + k * 0.05, 0.62 - k * 0.2), V3(0.27 * s, 0.06 + k * 0.05, 0.42 - k * 0.2), V3(0.33 * s, 0.05 + k * 0.05, 0.2 - k * 0.22)], [0.05, 0.04, 0], 4, { flat: 0.3, amp: 0.03, phase: Math.PI / 4 });
      for (let k = 0; k < 2; k++) { const z = 0.4 + k * 0.17 + 0.085, x = (0.16 - k * 0.03) * s; tube(S, [V3(x, 0.005, z), V3(x * 0.97, -0.07, z + 0.02)], [0.016, 0], 3, { amp: 0 }); }
    }
    // a folded frill fanning out behind the skull
    for (let k = 0; k < 7; k++) {
      const a = -1.15 + (k / 6) * 2.3, L = 0.62 - Math.abs(a) * 0.12;
      tube(S, [V3(Math.sin(a) * 0.1, 0.12 + Math.cos(a) * 0.06, -0.04), V3(Math.sin(a) * 0.36, 0.2 + Math.cos(a) * 0.26, -0.26), V3(Math.sin(a) * (0.36 + L * 0.6), 0.2 + Math.cos(a) * (0.26 + L * 0.5), -0.5 - L * 0.4)], [0.06, 0.04, 0], 4, { flat: 0.3, amp: 0.03, phase: Math.PI / 4 });
    }
    // whisker barbels trailing from the snout
    for (const s of [-1, 1]) tube(S, [V3(0.07 * s, 0.02, 0.92), V3(0.22 * s, -0.04, 0.78), V3(0.42 * s, -0.2, 0.48), V3(0.55 * s, -0.42, 0.2)], [0.022, 0.016, 0.01, 0], 3, { amp: 0 });
    return S.geo();
  }
  function jawGeo() {
    const S = new Soup();
    loft(S, [
      { z: 0.0, pts: pentDn(0.17, 0.14, 0.09, 0.16) },
      { z: 0.4, pts: pentDn(0.17, 0.13, 0.08, 0.12) },
      { z: 0.75, pts: pentDn(0.1, 0.07, 0.05, 0.06) },
      { z: 0.97, pts: pentDn(0.04, 0.03, 0.02, 0.025) },
    ], 0.05);
    for (const s of [-1, 1]) {
      tube(S, [V3(0.1 * s, -0.08, 0.12), V3(0.16 * s, -0.15, -0.06), V3(0.2 * s, -0.24, -0.26)], [0.03, 0.018, 0], 3, { amp: 0 });
      for (let k = 0; k < 5; k++) { const z = 0.3 + k * 0.12, x = (0.15 - k * 0.022) * s; tube(S, [V3(x, -0.005, z), V3(x * 0.95, 0.06, z + 0.02)], [0.016, 0], 3, { amp: 0 }); }
      tube(S, [V3(0.12 * s, -0.1, 0.5), V3(0.17 * s, -0.12, 0.3), V3(0.21 * s, -0.11, 0.08)], [0.02, 0.03, 0], 4, { flat: 0.4, amp: 0.03 });
    }
    return S.geo();
  }
  function tasselGeo() {
    const a = new T.OctahedronGeometry(0.04, 1); a.scale(1, 0.7, 1.3);
    const b = new T.CylinderGeometry(0.008, 0.008, 0.12, 6, 1); b.translate(0, -0.08, 0);
    const c = new T.OctahedronGeometry(0.028, 1); c.translate(0, -0.15, 0);
    const c2 = new T.TorusGeometry(0.026, 0.006, 4, 12); c2.rotateX(Math.PI / 2); c2.translate(0, -0.175, 0);
    const d = new T.CylinderGeometry(0.022, 0.05, 0.2, 14, 3, true); d.translate(0, -0.27, 0);
    const p = d.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.36) { const k = 1 + 0.25 * Math.sin(i * 2.3); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y - 0.02 * Math.abs(Math.sin(i * 1.7))); } }
    return merge([a, b, c, c2, d]);
  }
  function lanternGeos() {
    const body = new T.CylinderGeometry(0.2, 0.2, 0.42, 8, 2, true);
    const caps = new Soup();
    tube(caps, [V3(0, 0.21, 0), V3(0, 0.29, 0), V3(0, 0.36, 0), V3(0, 0.42, 0)], [0.24, 0.17, 0.08, 0.03], 8, { amp: 0.03 });
    tube(caps, [V3(0, -0.21, 0), V3(0, -0.28, 0), V3(0, -0.34, 0), V3(0, -0.38, 0)], [0.24, 0.14, 0.06, 0.02], 8, { amp: 0.03 });
    const parts = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, b = new T.BoxGeometry(0.026, 0.46, 0.026); b.rotateY(-a); b.translate(Math.cos(a) * 0.205, 0, Math.sin(a) * 0.205); parts.push(b);
      const f = new T.ConeGeometry(0.02, 0.07, 4); f.translate(Math.cos(a) * 0.235, 0.25, Math.sin(a) * 0.235); parts.push(f); }
    for (const y of [-0.215, 0.215, 0]) { const r = new T.TorusGeometry(0.207, y ? 0.018 : 0.008, 4, 8); r.rotateX(Math.PI / 2); r.translate(0, y, 0); parts.push(r); }
    const hook = new T.TorusGeometry(0.04, 0.01, 5, 12); hook.translate(0, 0.47, 0); parts.push(hook);
    const knob = new T.OctahedronGeometry(0.035, 1); knob.translate(0, -0.4, 0); parts.push(knob);
    const cord = new T.CylinderGeometry(0.012, 0.012, 1, 4, 1); cord.translate(0, 0.5, 0);
    return { body, caps: caps.geo(), frame: merge(parts), cord };
  }

  // ---------- assembly ----------
  const root = new T.Group(); root.name = 'envoi';
  const fx = new T.Group(); fx.name = 'envoi-fx';
  const body = new T.Group(); root.add(body);
  const bones = [];
  const bone = (name, parent) => { const b = new T.Bone(); b.name = name; (parent || body).add(b); bones.push(b); return b; };

  // body: 16 lantern segments in one instanced draw
  const NSEG = 16;
  const SIZE = [0.74, 0.84, 0.92, 0.97, 1.0, 1.0, 0.98, 0.95, 0.92, 0.88, 0.83, 0.77, 0.7, 0.62, 0.54, 0.46];
  const segG = segmentGeo();
  const aBurn = new T.InstancedBufferAttribute(new Float32Array(NSEG * 2), 2);
  for (let i = 0; i < NSEG; i++) aBurn.setXY(i, 1, 0);
  segG.setAttribute('aBurn', aBurn);
  const segMesh = new T.InstancedMesh(segG, matSeg, NSEG);
  segMesh.frustumCulled = false; body.add(segMesh);
  const segBones = []; for (let i = 0; i < NSEG; i++) segBones.push(bone('seg' + i));

  // head + jaw
  const HEAD_S = 1.62;
  const headB = bone('head');
  LVcur = DETAIL >= 0.85 ? 3 : 1;
  const headMesh = new T.Mesh(headGeo(), matHead); headMesh.scale.setScalar(HEAD_S); headB.add(headMesh);
  const jawB = bone('jaw', headB); jawB.position.set(0, -0.005 * HEAD_S, 0.02 * HEAD_S);
  const jawMesh = new T.Mesh(jawGeo(), matHead); LVcur = LV; jawMesh.scale.setScalar(HEAD_S); jawB.add(jawMesh);
  const mouthGlow = new T.Mesh(new T.PlaneGeometry(0.22, 0.75), matMouth); mouthGlow.rotation.x = -Math.PI / 2; mouthGlow.position.set(0, -0.02, 0.45 * HEAD_S); jawB.add(mouthGlow);
  const eyeG = merge([-1, 1].map((s) => { const g = new T.OctahedronGeometry(0.05, 1); g.scale(0.5, 0.42, 1.55); g.rotateY(s * 0.38); g.rotateZ(s * -0.3); g.translate(0.195 * s * HEAD_S, 0.17 * HEAD_S, 0.47 * HEAD_S); return g; }));
  const eyes = new T.Mesh(eyeG, matEye); headB.add(eyes);
  const seal = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.03, 18), matSeal);
  seal.position.set(0, 0.335 * HEAD_S, 0.32 * HEAD_S); seal.rotation.x = 0.55; headB.add(seal);

  // wings: pleated paper fans on lacquered ribs, rebuilt from a spread value each frame (small buffers)
  const PL = 16, NL = PL * 2, KB = DETAIL >= 0.85 ? 6 : 3; // pleats, fold lines, radial bands
  const WTRI = NL * 2 * KB, NRIB = PL + 1;
  function makeWing(s) {
    const b = bone(s > 0 ? 'wingL' : 'wingR');
    const roll = new T.Group(); b.add(roll);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(WTRI * 9), 3));
    g.setAttribute('normal', new T.BufferAttribute(new Float32Array(WTRI * 9).fill(0.5), 3));
    const uv = new Float32Array(WTRI * 6); let o = 0;
    const put = (...q) => { for (const v of q) uv[o++] = v; };
    for (let j = 0; j < NL; j++) {
      const va = j / NL, vb = (j + 1) / NL, vm = (j + 0.5) / NL, r = (k) => k / KB;
      put(0.01, vm, r(1), va, r(1), vb);
      for (let k = 1; k < KB - 1; k++) { put(r(k), va, r(k + 1), va, r(k + 1), vb); put(r(k), va, r(k + 1), vb, r(k), vb); }
      put(r(KB - 1), va, 1, va, 0.95, vm); put(r(KB - 1), va, 0.95, vm, r(KB - 1), vb); put(r(KB - 1), vb, 0.95, vm, 1, vb);
    }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const m = new T.Mesh(g, matWing); m.frustumCulled = false; roll.add(m);
    const rg = new T.BufferGeometry();
    rg.setAttribute('position', new T.BufferAttribute(new Float32Array(NRIB * 4 * 9), 3));
    rg.setAttribute('normal', new T.BufferAttribute(new Float32Array(NRIB * 4 * 9), 3));
    const ribs = new T.Mesh(rg, matRib); ribs.frustumCulled = false; roll.add(ribs);
    const jag = []; for (let j = 0; j <= NL; j++) jag.push(rr(0.95, 1.05));
    return { s, b, roll, g, m, rg, ribs, jag, tips: [] };
  }
  const wings = [makeWing(1), makeWing(-1)];
  const WING_L = 2.95, TH0 = -0.28, SPAN_MAX = 2.05, ALPHA = (SPAN_MAX / NL) * 1.06;
  const _wp = V3(), _wq = V3();
  function updateWing(w, spread) {
    const span = lerp(0.3, SPAN_MAX, spread), d = span / NL;
    const foldK = 0.5 * Math.sqrt(Math.max(0, ALPHA * ALPHA - d * d));
    const pos = w.g.attributes.position.array, E = [], TH = [];
    for (let j = 0; j <= NL; j++) {
      const th = TH0 + span * (j / NL), f = j / NL;
      let len = WING_L * (0.62 + 0.38 * Math.sin(Math.PI * (0.18 + f * 0.78))) * w.jag[j];
      if (j % 2) len *= 0.86;
      E.push([j % 2 ? -foldK * len * w.s : 0, Math.sin(th) * len, -Math.cos(th) * len]); TH.push(th);
    }
    w.tips = E;
    let o = 0;
    const P = (j, r) => { const e = E[j]; return [e[0] * r, e[1] * r, e[2] * r]; };
    const tri = (a, b, c) => { pos[o++] = a[0]; pos[o++] = a[1]; pos[o++] = a[2]; pos[o++] = b[0]; pos[o++] = b[1]; pos[o++] = b[2]; pos[o++] = c[0]; pos[o++] = c[1]; pos[o++] = c[2]; };
    const Z = [0, 0, 0];
    for (let j = 0; j < NL; j++) {
      const a = E[j], b = E[j + 1], n = [(a[0] + b[0]) * 0.47, (a[1] + b[1]) * 0.47, (a[2] + b[2]) * 0.47], r = (k) => k / KB;
      tri(Z, P(j, r(1)), P(j + 1, r(1)));
      for (let k = 1; k < KB - 1; k++) { tri(P(j, r(k)), P(j, r(k + 1)), P(j + 1, r(k + 1))); tri(P(j, r(k)), P(j + 1, r(k + 1)), P(j + 1, r(k))); }
      const a1 = P(j, r(KB - 1)), b1 = P(j + 1, r(KB - 1));
      tri(a1, a, n); tri(a1, n, b1); tri(b1, n, b);
    }
    w.g.attributes.position.needsUpdate = true;
    // ribs along every ridge: a cross-shaped stick so it reads from any angle; the outer guard sticks run full length
    const rp = w.rg.attributes.position.array, rn = w.rg.attributes.normal.array; o = 0; let q = 0;
    for (let j = 0; j <= NL; j += 2) {
      const e = E[j], th = TH[j], guard = j === 0 || j === NL, r1 = guard ? 0.97 : 0.58, wd = guard ? 0.022 : 0.009;
      const t = [0, Math.cos(th) * wd, Math.sin(th) * wd], nx = wd * 0.9;
      const p0 = [e[0] * 0.02, e[1] * 0.02, e[2] * 0.02], p1 = [e[0] * r1, e[1] * r1, e[2] * r1];
      const quads = [[t, [1, 0, 0]], [[nx, 0, 0], [0, -Math.sin(th), Math.cos(th)]]];
      for (const [dv, nn] of quads) {
        const A_ = [p0[0] + dv[0], p0[1] + dv[1], p0[2] + dv[2]], B_ = [p0[0] - dv[0], p0[1] - dv[1], p0[2] - dv[2]], C_ = [p1[0] + dv[0] * 0.6, p1[1] + dv[1] * 0.6, p1[2] + dv[2] * 0.6], D_ = [p1[0] - dv[0] * 0.6, p1[1] - dv[1] * 0.6, p1[2] - dv[2] * 0.6];
        for (const v of [A_, B_, C_, B_, D_, C_]) { rp[o++] = v[0]; rp[o++] = v[1]; rp[o++] = v[2]; rn[q++] = nn[0]; rn[q++] = nn[1]; rn[q++] = nn[2]; }
      }
    }
    w.rg.attributes.position.needsUpdate = true; w.rg.attributes.normal.needsUpdate = true;
  }

  // red cord bindings wrapped around every joint, one instanced draw
  const NTIE = (NSEG - 1) * 2;
  const tieG = new T.TorusGeometry(0.075, 0.014, 5, 16);
  const ties = new T.InstancedMesh(tieG, matRed, NTIE); ties.frustumCulled = false; body.add(ties);

  // ---------- spine poses: 9 control points (y, z) plus head direction ----------
  const NC = 9;
  const P_IDLE = [[4.7, 1.0], [4.05, 0.55], [3.35, 0.2], [2.75, -0.45], [2.35, -1.3], [1.75, -1.85], [1.05, -1.55], [0.75, -0.65], [0.8, 0.35]];
  const P_REAR = [[5.45, 0.5], [4.72, 0.22], [3.9, 0.0], [3.05, -0.45], [2.4, -1.2], [1.7, -1.7], [1.05, -1.4], [0.75, -0.55], [0.8, 0.4]];
  const mkPose = () => ({ pts: Array.from({ length: NC }, () => V3()), head: V3(0, 0, 1), spread: 0.7, flap: 0.1, jaw: 0.05, tuck: 0, roll: 0, ward: 0 });
  function setPts(pose, arr, t, sway) {
    for (let i = 0; i < NC; i++) {
      const f = i / (NC - 1);
      pose.pts[i].set(Math.sin(t * 1.15 - i * 0.75) * sway * (0.25 + f), arr[i][0] + Math.sin(t * 1.5 - i * 0.6) * 0.06 * sway / 0.22 + Math.sin(t * 0.9) * 0.07, arr[i][1]);
    }
  }
  function poseIdle(p, t, walk) {
    setPts(p, P_IDLE, t * (1 + walk * 0.8), 0.22 + walk * 0.1);
    p.head.set(Math.sin(t * 0.7) * 0.12, 0.04 - walk * 0.12, 1); p.spread = 0.72; p.flap = 0.1 + walk * 0.12; p.jaw = 0.05 + Math.max(0, Math.sin(t * 0.5)) * 0.06; p.tuck = walk * 0.4; p.ward = 0;
    if (walk > 0) for (let i = 0; i < NC; i++) p.pts[i].z += walk * 0.35 * (1 - i / NC);
  }
  function poseRear(p, t) { setPts(p, P_REAR, t, 0.12); p.head.set(0, 0.55, 0.83); p.spread = 1; p.flap = 0.3; p.jaw = 0.25; p.tuck = 0.2; p.ward = 0; }
  function poseCoil(p, t) {
    const R = 1.85, cy = 2.55;
    for (let i = 0; i < NC; i++) {
      const a = Math.PI / 2 - i * 0.7 + Math.sin(t * 0.8 - i * 0.5) * 0.04;
      p.pts[i].set(Math.cos(a) * R * (1 - i * 0.012), cy + Math.sin(a) * R + Math.sin(t * 0.9) * 0.05, 0.85 - i * 0.05 + Math.sin(i * 1.3) * 0.18);
    }
    // the head rides up and out in front of the wing wall instead of sitting inside it
    p.pts[0].z += 1.05; p.pts[0].y += 0.35; p.pts[1].z += 0.5; p.pts[1].y += 0.12;
    p.head.set(0, -0.12, 1); p.spread = 1; p.flap = 0.04; p.jaw = 0.1; p.tuck = 0.5; p.ward = 1;
  }
  function poseRecoil(p, t) { setPts(p, P_IDLE, t, 0.1); for (let i = 0; i < NC; i++) { const k = 1 - i / NC; p.pts[i].z -= 0.55 * k; p.pts[i].y += 0.22 * k; p.pts[i].x += 0.25 * k; } p.head.set(0.35, 0.45, 0.8); p.spread = 0.4; p.flap = 0.35; p.jaw = 0.6; p.tuck = 0.6; p.ward = 0; }
  let REACH = 4.5;
  function poseHelix(p, t) { // wrapped around the foe standing REACH meters ahead
    const R = 1.55;
    for (let i = 0; i < NC; i++) {
      const a = 2.2 - i * 0.8 + t * 0.32;
      p.pts[i].set(Math.cos(a) * R * (1 + i * 0.015), 3.35 - i * 0.3 + Math.sin(t * 1.2 - i) * 0.05, REACH + Math.sin(a) * R * (1 + i * 0.015));
    }
    p.head.set(-p.pts[0].x, -1.3, REACH - p.pts[0].z).normalize();
    p.spread = 1; p.flap = 0.2; p.jaw = 0.3; p.tuck = 0; p.ward = 0;
  }
  function blendPose(o, a, b, w) {
    if (w <= 0) { if (o !== a) copyPose(o, a); return o; }
    for (let i = 0; i < NC; i++) o.pts[i].lerpVectors(a.pts[i], b.pts[i], w);
    o.head.lerpVectors(a.head, b.head, w);
    for (const k of ['spread', 'flap', 'jaw', 'tuck', 'ward']) o[k] = lerp(a[k], b[k], w);
    return o;
  }
  function copyPose(o, a) { for (let i = 0; i < NC; i++) o.pts[i].copy(a.pts[i]); o.head.copy(a.head); for (const k of ['spread', 'flap', 'jaw', 'tuck', 'ward']) o[k] = a[k]; return o; }

  // centripetal-ish Catmull-Rom sampled into a polyline, then segments placed by arc length
  const NS = 72, samp = Array.from({ length: NS }, () => V3()), sLen = new Float32Array(NS);
  const _a = V3(), _b = V3();
  function crPoint(out, p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    out.set(0, 0, 0)
      .addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t)
      .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
      .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
      .addScaledVector(p3, 0.5 * t3 - 0.5 * t2);
    return out;
  }
  function sampleSpine(pts) {
    for (let k = 0; k < NS; k++) {
      const f = (k / (NS - 1)) * (NC - 1), i = Math.min(NC - 2, Math.floor(f)), t = f - i;
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(NC - 1, i + 2)];
      crPoint(samp[k], p0, p1, p2, p3, t);
      sLen[k] = k ? sLen[k - 1] + samp[k].distanceTo(samp[k - 1]) : 0;
    }
  }
  function atArc(d, outP, outT) {
    let k = 1; while (k < NS - 1 && sLen[k] < d) k++;
    const L0 = sLen[k - 1], L1 = sLen[k], f = L1 > L0 ? cl((d - L0) / (L1 - L0), 0, 1.5) : 0;
    outP.lerpVectors(samp[k - 1], samp[k], f);
    if (d > sLen[NS - 1]) outP.addScaledVector(_a.subVectors(samp[NS - 1], samp[NS - 2]).normalize(), d - sLen[NS - 1]);
    if (outT) outT.subVectors(samp[k], samp[k - 1]).normalize();
  }
  const SEG_D = []; { let d = 0.36; for (let i = 0; i < NSEG; i++) { SEG_D.push(d); d += SEG_H * 0.9 * (SIZE[i] + (SIZE[i + 1] || SIZE[i])) + 0.015; } }
  const segPos = Array.from({ length: NSEG }, () => V3()), segTan = Array.from({ length: NSEG }, () => V3());
  const tailTip = V3(), tailDir = V3();
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _s = V3(), _x = V3(), _y = V3(), _z = V3(), _q2 = new T.Quaternion();
  function basisQuat(out, fwd, up) { // z = fwd
    _z.copy(fwd).normalize(); _x.crossVectors(up, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
    _m.makeBasis(_x, _y, _z); return out.setFromRotationMatrix(_m);
  }
  function axisQuat(out, axis, i) { // y = axis, with a stable lateral x
    _y.copy(axis).normalize(); _s.set(Math.abs(_y.x) < 0.85 ? 1 : 0, 0, Math.abs(_y.x) < 0.85 ? 0 : 1);
    _x.copy(_s).addScaledVector(_y, -_y.dot(_s)).normalize(); _z.crossVectors(_x, _y);
    _m.makeBasis(_x, _y, _z); out.setFromRotationMatrix(_m);
    return out.multiply(_q2.setFromAxisAngle(UP, (i % 2) * (Math.PI / 8)));
  }
  // body frame at a segment, for wings and legs: faces the heading, stays upright
  const _hd = V3(), _fh = V3();
  function bodyFrame(out, k, pose) {
    _hd.set(pose.head.x, 0, pose.head.z); if (_hd.lengthSq() < 1e-4) _hd.set(0, 0, 1); _hd.normalize();
    _fh.subVectors(segPos[Math.max(0, k - 1)], segPos[Math.min(NSEG - 1, k + 1)]).setY(0);
    const w = 1 - pose.ward;
    if (_fh.lengthSq() > 1e-4) _fh.normalize().multiplyScalar(0.45 * w); else _fh.set(0, 0, 0);
    _hd.multiplyScalar(0.55 + 0.45 * pose.ward).add(_fh);
    return basisQuat(out, _hd, UP);
  }

  // ---------- world-space secondary motion (fx group) ----------
  const _w = V3(), _w2 = V3(), _w3 = V3(), _qa = new T.Quaternion(), DOWN = V3(0, -1, 0);
  const H = 1 / 120;
  // pendulums: tassels hang from the joints, cheeks, wing roots, lantern and tail
  const NTAS = NSEG - 1 + 2 + 2 + 1 + 2;
  const tasMesh = new T.InstancedMesh(tasselGeo(), matRed, NTAS); tasMesh.frustumCulled = false; fx.add(tasMesh);
  const tas = [];
  for (let i = 0; i < NTAS; i++) { const L = rr(0.24, 0.32); tas.push({ a: V3(), p: V3(0, -L, 0), q: V3(0, -L, 0), L, sc: rr(0.85, 1.15), vis: 1, init: false }); }
  function pendStep(o, g, wind, damp) {
    const vx = (o.p.x - o.q.x) * (1 - damp * H), vy = (o.p.y - o.q.y) * (1 - damp * H), vz = (o.p.z - o.q.z) * (1 - damp * H);
    o.q.copy(o.p);
    o.p.x += vx + wind.x * H * H; o.p.y += vy + (wind.y - g) * H * H; o.p.z += vz + wind.z * H * H;
    _w.subVectors(o.p, o.a); const d = _w.length() || 1; o.p.copy(o.a).addScaledVector(_w, o.L / d);
  }

  // heart lantern on its cord
  const LG = lanternGeos();
  const heart = new T.Group(); fx.add(heart);
  heart.add(new T.Mesh(LG.body, matLantern), new T.Mesh(LG.caps, matHead), new T.Mesh(LG.frame, matFrame));
  const cord = new T.Mesh(LG.cord, matRed); fx.add(cord);
  const heartP = { a: V3(), p: V3(), q: V3(), L: 0.5, init: false };
  const heartLight = new T.PointLight(0xffb45a, 0, 7, 2); fx.add(heartLight);

  // tail streamers: 7 paper strips, verlet chains rendered as one ribbon mesh
  const NST = 9, NN = 12;
  const strips = [];
  for (let s = 0; s < NST; s++) {
    const L = rr(0.12, 0.165), nodes = [];
    for (let n = 0; n < NN; n++) nodes.push({ p: V3(0, -n * L, 0), q: V3(0, -n * L, 0) });
    strips.push({ L, nodes, w: rr(0.12, 0.16), tw: rr(-1, 1), row: s % 4, off: V3(Math.cos((s / NST) * TAU) * 0.07, 0, Math.sin((s / NST) * TAU) * 0.07), init: false, vis: 1 });
  }
  const stG = new T.BufferGeometry();
  const stPos = new Float32Array(NST * NN * 2 * 3), stUV = new Float32Array(NST * NN * 2 * 2), stIdx = [];
  for (let s = 0; s < NST; s++) for (let n = 0; n < NN; n++) {
    const v = (s * NN + n) * 2, row = strips[s].row;
    stUV.set([n / (NN - 1), 1 - (row * 64 + 4) / 256, n / (NN - 1), 1 - (row * 64 + 60) / 256], v * 2);
    if (n < NN - 1) stIdx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  }
  stG.setAttribute('position', new T.BufferAttribute(stPos, 3)); stG.setAttribute('uv', new T.BufferAttribute(stUV, 2)); stG.setIndex(stIdx);
  stG.setAttribute('normal', new T.BufferAttribute(new Float32Array(stPos.length), 3));
  const stMesh = new T.Mesh(stG, matStream); stMesh.frustumCulled = false; fx.add(stMesh);
  // paper tags tied to some strips
  const tagG = new T.PlaneGeometry(0.09, 0.19); tagG.translate(0, -0.13, 0);
  const tagCord = new T.BoxGeometry(0.006, 0.05, 0.006); tagCord.translate(0, -0.015, 0);
  const NTAG = 6, tagMesh = new T.InstancedMesh(merge([tagG, tagCord]), matTag, NTAG); tagMesh.frustumCulled = false; fx.add(tagMesh);
  const tags = []; for (let i = 0; i < NTAG; i++) tags.push({ strip: [0, 2, 3, 5, 6, 8][i], node: 4 + (i % 3), a: V3(), p: V3(), q: V3(), L: 0.12, yaw: rr(0, TAU), init: false });

  // particles: glow halos, embers, letters, seal shards
  function pointPool(n) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('size', new T.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('col', new T.BufferAttribute(new Float32Array(n * 4), 4));
    const m = pointsMat(), pts = new T.Points(g, m); pts.frustumCulled = false;
    pts.onBeforeRender = (r, sc, cam) => { r.getDrawingBufferSize(_dbs); m.uniforms.scale.value = cam.isPerspectiveCamera ? _dbs.y / (2 * Math.tan((cam.fov * Math.PI) / 360)) : _dbs.y / 2; };
    fx.add(pts); return { g, pts, n, pos: g.attributes.position, size: g.attributes.size, col: g.attributes.col };
  }
  const _dbs = new T.Vector2();
  const GLOW = pointPool(26); // 0-15 segments, 16 heart, 17-18 eyes, 19 mouth, 20 seal flash, 21 burst, 22-23 wing roots
  function setGlow(i, p, size, r, g, b, a) { GLOW.pos.setXYZ(i, p.x, p.y, p.z); GLOW.size.setX(i, size); GLOW.col.setXYZW(i, r, g, b, a); }
  const EMB = pointPool(200), emb = []; for (let i = 0; i < EMB.n; i++) emb.push({ p: V3(), v: V3(), life: 0, max: 1, s: 0.05, hot: 1 });
  let embNext = 0;
  function ember(p, v, life, s, hot) { const e = emb[embNext]; embNext = (embNext + 1) % emb.length; e.p.copy(p); e.v.copy(v); e.life = e.max = life; e.s = s; e.hot = hot == null ? 1 : hot; }
  const NLET = 56, letMesh = new T.InstancedMesh(new T.PlaneGeometry(0.2, 0.15), matLetter, NLET); letMesh.frustumCulled = false; fx.add(letMesh);
  letMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NLET * 3).fill(1), 3);
  const lets = []; for (let i = 0; i < NLET; i++) lets.push({ p: V3(), v: V3(), ax: V3(1, 0, 0), ang: 0, spin: 0, life: 0, max: 1, s: 1, ash: 0, drag: 1 });
  let letNext = 0;
  function letter(p, v, life, ash, s, drag) { const l = lets[letNext]; letNext = (letNext + 1) % NLET; l.p.copy(p); l.v.copy(v); l.life = l.max = life; l.ash = ash; l.s = s || 1; l.drag = drag == null ? 1.2 : drag; l.ax.set(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); l.ang = rr(0, TAU); l.spin = rr(-7, 7); }
  const shardG = new T.BufferGeometry(); shardG.setAttribute('position', new T.Float32BufferAttribute([0, 0.04, 0, -0.035, -0.03, 0.005, 0.04, -0.025, -0.005], 3)); shardG.computeVertexNormals();
  const NSH = 12, shMesh = new T.InstancedMesh(shardG, matShard, NSH); shMesh.frustumCulled = false; fx.add(shMesh);
  const shards = []; for (let i = 0; i < NSH; i++) shards.push({ p: V3(), v: V3(), ax: V3(0, 1, 0), ang: 0, life: 0 });
  const _zero = new T.Matrix4().makeScale(0, 0, 0);

  function stepParticles(dt) {
    for (let i = 0; i < emb.length; i++) {
      const e = emb[i];
      if (e.life > 0) {
        e.life -= dt; e.v.y += 0.35 * dt; e.v.multiplyScalar(1 - 0.9 * dt); e.p.addScaledVector(e.v, dt);
        const f = cl(e.life / e.max, 0, 1);
        EMB.pos.setXYZ(i, e.p.x, e.p.y, e.p.z); EMB.size.setX(i, e.s * (0.4 + 0.6 * f));
        EMB.col.setXYZW(i, 1, lerp(0.25, 0.75, f * e.hot), lerp(0.04, 0.32, f * e.hot), Math.min(1, f * 1.6));
      } else EMB.col.setXYZW(i, 0, 0, 0, 0);
    }
    EMB.pos.needsUpdate = EMB.size.needsUpdate = EMB.col.needsUpdate = true;
    for (let i = 0; i < NLET; i++) {
      const l = lets[i];
      if (l.life > 0) {
        l.life -= dt; l.v.multiplyScalar(1 - l.drag * dt); l.v.y += (l.ash ? 0.5 : 0.9) * dt; l.p.addScaledVector(l.v, dt); l.ang += l.spin * dt;
        const f = cl(l.life / l.max, 0, 1), sc = l.s * Math.min(1, f * 3) * Math.min(1, (1 - f) * 8 + 0.2);
        _qa.setFromAxisAngle(l.ax, l.ang); _s.setScalar(sc); _m.compose(l.p, _qa, _s); letMesh.setMatrixAt(i, _m);
        const c = l.ash ? [0.42, 0.38, 0.34] : [1, lerp(0.55, 0.95, f), lerp(0.3, 0.85, f)];
        letMesh.instanceColor.setXYZ(i, c[0], c[1], c[2]);
      } else letMesh.setMatrixAt(i, _zero);
    }
    letMesh.instanceMatrix.needsUpdate = true; letMesh.instanceColor.needsUpdate = true;
    for (let i = 0; i < NSH; i++) {
      const s = shards[i];
      if (s.life > 0) { s.life -= dt; s.v.y -= 6 * dt; s.p.addScaledVector(s.v, dt); s.ang += 9 * dt; _qa.setFromAxisAngle(s.ax, s.ang); _s.setScalar(Math.min(1, s.life * 2) * 1.4); _m.compose(s.p, _qa, _s); shMesh.setMatrixAt(i, _m); }
      else shMesh.setMatrixAt(i, _zero);
    }
    shMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- actions ----------
  const A = (dur, hits, hold, interrupt) => Object.freeze({ dur, hits: Object.freeze(hits), hold: !!hold, interrupt: !!interrupt });
  const ACTIONS = {
    summon: A(5.2, [0.62], true),
    envoi: A(7.0, [0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.85], true),
    leave: A(2.6, [], true),
    block: A(0.6, [], false, true),
    hurt: A(0.6, [], false, true),
  };
  ACTIONS.appear = ACTIONS.summon; ACTIONS.die = ACTIONS.leave;
  Object.freeze(ACTIONS);
  const ALIAS = { appear: 'summon', die: 'leave' };

  const CHAR = new T.Color(0.13, 0.08, 0.055), WING_EM = new T.Color(0xffc878);
  const PA = mkPose(), PB = mkPose(), TGT = mkPose(), CUR = mkPose();
  let act = null, prevU = 0, guardT = 0, guardW = 0, fade = 1, sealOn = 1, flash = 0, sealFlash = 0, flapPh = 0, first = true;
  const unf = new Float32Array(NSEG).fill(1), burn = new Float32Array(NSEG);
  let headF = 1, wingF = 1, headBurn = 0, wingBurn = 0, streamVis = 1, crease = 0, glowNow = 1;
  let warded = false, ignite = 1, heartDrop = 0, heartGone = false, pillar = 0, fireBurn = false, finalFlash = 0;
  const api = { dash: 0, lift: 0.5, state: { glow: 1, crease: 0, seal: 1, reach: 4.5 } };

  function resetLooks() {
    sealOn = 1; seal.visible = true; api.state.seal = 1;
    for (let i = 0; i < NSEG; i++) { burn[i] = 0; unf[i] = 1; }
    headF = wingF = 1; headBurn = wingBurn = 0; streamVis = 1; ignite = 1; heartDrop = 0; heartGone = false; pillar = 0; fireBurn = false;
  }
  function breakSeal() {
    if (!sealOn) return; sealOn = 0; api.state.seal = 0; seal.visible = false; sealFlash = 1;
    seal.getWorldPosition(_w3);
    for (const s of shards) { s.p.copy(_w3); s.v.set(rr(-2, 2), rr(1.5, 3.5), rr(-0.5, 2.5)); s.ax.set(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); s.life = rr(0.8, 1.3); }
    for (let i = 0; i < 22; i++) ember(_w3, _w.set(rr(-2, 2), rr(0, 2.5), rr(-1, 2)), rr(0.5, 1.1), rr(0.05, 0.1));
  }

  function animate(phase, walk, t, dt) {
    dt = Math.min(dt || 0, 0.1); walk = cl(walk || 0, 0, 1);
    // action clock
    let u = -1, name = '';
    if (act) {
      act.t += dt; u = act.t / act.def.dur;
      if (u >= 1) { if (act.def.hold) u = 1; else { act = null; u = -1; } }
      if (act) name = act.name;
    }
    api.action = name; api.progress = act ? Math.min(1, u) : -1; api.busy = !!act && !act.def.hold && u < 1;
    const crossed = (x) => prevU < x && u >= x;

    // base pose: idle, blended toward the coil while guarding
    guardW += ((guardT || warded ? 1 : 0) - guardW) * (1 - Math.exp(-4 * dt));
    poseIdle(PA, t, walk); poseCoil(PB, t); blendPose(TGT, PA, PB, guardW);
    let dash = 0, rise = 0, glowAdd = 0, cr = 0, jawAdd = 0, k = 7, ripple = -1;
    REACH = cl(+api.state.reach || 4.5, 2.5, 8);
    const key = ALIAS[name] || name;
    const layer = (fn, w) => { if (w > 0.001) { fn(PB, t); blendPose(TGT, TGT, PB, w); } };
    if (key === 'summon') {
      // letters fold into the wyrm, Sol's blade lights the heart, the seal breaks, it coils into a wall
      rise = -2.6 * (1 - sm(0, 0.38, u));
      for (let i = 0; i < NSEG; i++) unf[i] = sm(0.03 + i * 0.016, 0.17 + i * 0.016, u);
      headF = sm(0.0, 0.14, u); wingF = sm(0.26, 0.48, u);
      ignite = lerp(0.12, 1, sm(0.4, 0.5, u));
      if (crossed(0.45)) finalFlash = Math.max(finalFlash, 0.5);
      layer(poseRear, win(u, 0.5, 0.6, 0.7, 0.82));
      jawAdd = win(u, 0.58, 0.63, 0.7, 0.8) * 0.85;
      glowAdd = Math.exp(-Math.pow((u - 0.64) / 0.08, 2)); ripple = (u - 0.6) * 2.6;
      if (crossed(0.62)) breakSeal();
      if (u >= 0.74) warded = true;
      if (u < 0.42 && dt > 0) for (let n = 0; n < 3; n++) if (rnd() < 16 * dt) {
        const i = (rnd() * NSEG) | 0; _w.copy(segPos[i]).add(_w2.set(rr(-1.4, 1.4), rr(-0.8, 0.9), rr(-1.4, 1.4))); root.localToWorld(_w);
        root.localToWorld(_w3.copy(segPos[i])); _w2.subVectors(_w3, _w).multiplyScalar(1.7); _w2.y += 0.5; letter(_w, _w2, rr(0.5, 0.9), 0, 1.1, 0.6);
      }
    } else if (key === 'envoi') {
      // uncoil, wrap the foe, burn tail to head as a ring of fire, deliver the heart, rise away as letters
      warded = false; fireBurn = true;
      layer(poseRear, win(u, 0.0, 0.07, 0.11, 0.2)); layer(poseHelix, sm(0.12, 0.3, u)); k = u > 0.1 && u < 0.34 ? 4.5 : 7;
      cr = sm(0.02, 0.14, u) * 0.55; glowAdd = 0.3 * cr;
      for (let i = 0; i < NSEG; i++) { const j = NSEG - 1 - i; burn[i] = sm(0.4 + j * 0.018, 0.52 + j * 0.018, u); }
      streamVis = 1 - sm(0.36, 0.44, u);
      heartDrop = sm(0.72, 0.84, u); jawAdd = win(u, 0.74, 0.8, 0.88, 0.95);
      if (crossed(0.85)) {
        heartGone = true; finalFlash = 1.4; flash = 1;
        _w3.set(0, 1.3, REACH); root.localToWorld(_w3);
        for (let i = 0; i < 60; i++) ember(_w3, _w.set(rr(-5, 5), rr(-1, 6), rr(-5, 5)), rr(0.6, 1.6), rr(0.06, 0.16));
        for (let i = 0; i < 24; i++) letter(_w3, _w.set(rr(-5, 5), rr(1, 6), rr(-5, 5)), rr(1, 1.8), 0, 1.4, 1.2);
      }
      headBurn = sm(0.86, 0.98, u); wingBurn = sm(0.84, 0.97, u);
      pillar = win(u, 0.85, 0.87, 0.95, 1.0);
    } else if (key === 'leave') {
      warded = false; fireBurn = false;
      layer(poseRear, sm(0, 0.35, u) * 0.45);
      streamVis = 1 - sm(0.0, 0.15, u);
      for (let i = 0; i < NSEG; i++) { const j = NSEG - 1 - i; burn[i] = sm(0.04 + j * 0.03, 0.18 + j * 0.03, u); }
      wingBurn = sm(0.5, 0.8, u); headBurn = sm(0.65, 0.95, u); glowAdd = 0.3 * (1 - u);
    } else if (key === 'block') {
      // the paper wall takes the hit: it shudders and its light flickers, then settles
      layer(poseRecoil, win(u, 0, 0.12, 0.35, 1) * 0.35); k = 12;
      ripple = 1 - u * 2.2; glowAdd = -0.35 * win(u, 0, 0.05, 0.2, 0.5) + 0.6 * win(u, 0.25, 0.4, 0.5, 0.9);
      if (crossed(0.02)) { root.localToWorld(_w3.set(0, 2.6, 0.9)); for (let i = 0; i < 20; i++) ember(_w3, _w.set(rr(-2.5, 2.5), rr(-0.5, 2), rr(0, 2.5)), rr(0.4, 0.9), rr(0.05, 0.09)); }
    } else if (key === 'hurt') {
      layer(poseRecoil, win(u, 0, 0.12, 0.35, 1)); k = 12; dash = u < 0.3 ? -1.6 : 0;
    }
    if (rise) for (let i = 0; i < NC; i++) TGT.pts[i].y += rise;
    TGT.jaw = Math.min(1, TGT.jaw + jawAdd);
    // fade from the game: unfolds head to tail
    if (fade < 1) for (let i = 0; i < NSEG; i++) unf[i] = Math.min(unf[i], sm((i / NSEG) * 0.6, (i / NSEG) * 0.6 + 0.4, fade));
    const hF = Math.min(headF, sm(0, 0.3, fade)), wF = Math.min(wingF, sm(0.5, 1, fade));

    // smooth toward the target, so actions never pop
    const a = first ? 1 : 1 - Math.exp(-k * dt); first = false;
    if (a > 0) {
      for (let i = 0; i < NC; i++) CUR.pts[i].lerp(TGT.pts[i], a);
      CUR.head.lerp(TGT.head, a); for (const key of ['spread', 'flap', 'jaw', 'tuck', 'ward']) CUR[key] = lerp(CUR[key], TGT[key], a);
    }
    flash = Math.max(0, flash - dt * 1.6); finalFlash = Math.max(0, finalFlash - dt * 1.3); sealFlash = Math.max(0, sealFlash - dt * 2.2);
    crease += (Math.max(cr, cl(api.state.crease, 0, 1)) - crease) * (1 - Math.exp(-8 * dt));
    glowNow = cl(api.state.glow == null ? 1 : api.state.glow, 0, 1.5) * (1 + glowAdd + flash * 0.8);
    if (api.state.seal === 0 && sealOn) { sealOn = 0; seal.visible = false; }
    else if (api.state.seal === 1 && !sealOn) { sealOn = 1; seal.visible = true; }

    // body
    sampleSpine(CUR.pts);
    let minY = 99;
    for (let i = 0; i < NSEG; i++) {
      atArc(SEG_D[i], segPos[i], segTan[i]);
      const f = unf[i], gone = 1 - sm(0.55, 1, burn[i]), sc = SIZE[i] * gone;
      axisQuat(_q, segTan[i], i); if (f < 1) _q.multiply(_q2.setFromAxisAngle(UP, (1 - f) * Math.PI * 1.5));
      _s.set(sc * lerp(0.55, 1, f), sc * lerp(0.03, 1, f * f), sc * lerp(0.55, 1, f)); if (f < 0.01) _s.setScalar(0);
      _m.compose(segPos[i], _q, _s); segMesh.setMatrixAt(i, _m);
      segBones[i].position.copy(segPos[i]); segBones[i].quaternion.copy(_q);
      const rip = ripple > -1 ? 1.4 * Math.exp(-Math.pow((ripple - i / NSEG) / 0.12, 2)) : 0;
      aBurn.setXY(i, glowNow * (1 + rip + crease * 0.6), Math.min(1, burn[i] * 1.6));
      if (f > 0.2 && gone > 0.2) minY = Math.min(minY, segPos[i].y - SEG_R * SIZE[i]);
    }
    segMesh.instanceMatrix.needsUpdate = true; aBurn.needsUpdate = true;
    for (let i = 0; i < NSEG - 1; i++) {
      const v = Math.min(unf[i], unf[i + 1]) * (1 - sm(0.4, 0.8, Math.max(burn[i], burn[i + 1])));
      _w.subVectors(segPos[i + 1], segPos[i]); const len = _w.length() || 1; _w.multiplyScalar(1 / len);
      _q.setFromUnitVectors(_zAx, _w); const sc = (SIZE[i] + SIZE[i + 1]) * 0.5 * v;
      for (let r = 0; r < 2; r++) {
        _w2.copy(segPos[i]).lerp(segPos[i + 1], 0.5).addScaledVector(_w, (r ? 0.035 : -0.035) * sc);
        _s.setScalar(v < 0.02 ? 0 : sc); _m.compose(_w2, _q, _s); ties.setMatrixAt(i * 2 + r, _m);
      }
    }
    ties.instanceMatrix.needsUpdate = true;
    atArc(SEG_D[NSEG - 1] + SEG_H * SIZE[NSEG - 1] * 1.05, tailTip, tailDir);
    matSeg.emissive.copy(EMBER).lerp(CREASE, crease * 0.7); matSeg.emissiveIntensity = 1 + crease * 0.5;
    matWing.emissive.copy(WING_EM).lerp(CREASE, crease * 0.7); matWing.emissiveIntensity = 0.5 * Math.min(1.3, glowNow) * (1 + crease * 0.35) * (1 - wingBurn * 0.9);
    matWing.color.setRGB(1, 1, 1).lerp(CHAR, wingBurn);
    matHead.emissiveIntensity = 0.42 * glowNow * (1 + crease * 0.8) * (1 - headBurn * 0.9);
    matHead.color.setRGB(1, 1, 1).lerp(CHAR, headBurn);
    matLantern.emissiveIntensity = 1.5 * glowNow * ignite;

    // head
    headB.position.copy(samp[0]);
    _w.copy(CUR.head).normalize().addScaledVector(segTan[0], -0.3).normalize();
    basisQuat(headB.quaternion, _w, UP);
    headB.scale.setScalar(Math.max(0.0001, hF * (1 - sm(0.6, 1, headBurn))));
    jawB.rotation.x = CUR.jaw * 0.62;
    matMouth.opacity = cl(CUR.jaw * 1.2, 0, 1) * Math.min(1, glowNow);

    // wings
    flapPh += dt * (2.2 + CUR.flap * 2.5);
    bodyFrame(_q, 2, CUR);
    for (const w of wings) {
      w.b.position.copy(segPos[2]).add(_w.set(w.s * 0.22 * SIZE[2], 0.16, 0.04).applyQuaternion(_q));
      w.b.quaternion.copy(_q);
      { const fl = CUR.flap * Math.sin(flapPh), wd = CUR.ward;
        _wB.set(w.s * (0.62 + 0.4 * wd), -0.08 + 0.06 * wd, -0.78 + 0.5 * wd).normalize();
        _wU.set(w.s * (0.42 - 0.1 * wd), 0.9, 0.12).normalize().applyAxisAngle(_wB, -w.s * (fl - 0.1));
        _wU.addScaledVector(_wB, -_wU.dot(_wB)).normalize(); _wZ.copy(_wB).negate(); _wX.crossVectors(_wU, _wZ);
        _m.makeBasis(_wX, _wU, _wZ); w.roll.quaternion.setFromRotationMatrix(_m); }
      const ws = wF * (1 - sm(0.5, 1, wingBurn));
      w.b.scale.setScalar(Math.max(0.0001, ws));
      updateWing(w, CUR.spread * lerp(0.3, 1, wF));
    }
    api.dash = dash;
    api.lift = minY < 90 ? Math.max(0, minY) : 0;
    root.updateMatrixWorld(true);
    stepFx(t, dt);
    prevU = u;
  }
  const _zAx = V3(0, 0, 1);
  const _eu = new T.Euler(), _wB = V3(), _wU = V3(), _wX = V3(), _wZ = V3();

  // ---------- fx step (world space) ----------
  const _wind = V3(), _hd2 = V3(), _side = V3(), _wd = V3(), _dir = V3(), _anc = V3();
  const CHEEK = [V3(0.21 * HEAD_S, -0.03 * HEAD_S, 0.3 * HEAD_S), V3(-0.21 * HEAD_S, -0.03 * HEAD_S, 0.3 * HEAD_S)];
  function stepFx(t, dt) {
    const steps = dt > 0 ? Math.min(8, Math.ceil(dt / H)) : 0;
    const bodyVis = (i) => unf[i] * (1 - sm(0.45, 0.9, burn[i]));
    // tassel anchors
    let n = 0;
    for (let i = 0; i < NSEG - 1; i++, n++) { root.localToWorld(tas[n].a.lerpVectors(segPos[i], segPos[i + 1], 0.5)); tas[n].vis = Math.min(bodyVis(i), bodyVis(i + 1)); }
    for (let s = 0; s < 2; s++, n++) { headB.localToWorld(tas[n].a.copy(CHEEK[s])); tas[n].vis = headB.scale.x; }
    for (let s = 0; s < 2; s++, n++) { wings[s].b.getWorldPosition(tas[n].a); tas[n].vis = wings[s].b.scale.x; }
    const lanternTasN = n++; const tailTasN = n; n += 2;
    // heart lantern pendulum
    bodyFrame(_q, 3, CUR);
    heartP.a.copy(segPos[3]).add(_w.set(0, -0.3 * SIZE[3], 0.06).applyQuaternion(_q));
    if (heartDrop > 0) heartP.a.lerp(_w2.set(0, 1.85, REACH), sm(0, 1, heartDrop));
    root.localToWorld(heartP.a);
    if (!heartP.init) { heartP.p.copy(heartP.a).y -= heartP.L; heartP.q.copy(heartP.p); heartP.init = true; }
    const hv = fireBurn ? (heartGone ? 0 : unf[3]) : bodyVis(3);
    // streamers anchor
    root.localToWorld(_anc.copy(tailTip)); _hd2.copy(tailDir).transformDirection(root.matrixWorld);
    for (let s = 0; s < 2; s++) { tas[tailTasN + s].a.copy(_anc).add(_w.set(s ? 0.06 : -0.06, 0, 0)); tas[tailTasN + s].vis = bodyVis(NSEG - 1) * streamVis; }
    for (const st of strips) if (!st.init) { for (let k = 0; k < NN; k++) { st.nodes[k].p.copy(_anc).add(st.off).addScaledVector(_hd2, k * st.L); st.nodes[k].q.copy(st.nodes[k].p); } st.init = true; }
    for (const o of tas) if (!o.init) { o.p.copy(o.a).y -= o.L; o.q.copy(o.p); o.init = true; }
    for (let k = 0; k < steps; k++) {
      const tt = t - (steps - 1 - k) * H;
      _wind.set(Math.sin(tt * 1.3) * 0.8, 0, Math.cos(tt * 0.9) * 0.6);
      for (const o of tas) pendStep(o, 8, _wind, 4);
      pendStep(heartP, 9, _wind, 3.5);
      for (let s = 0; s < NST; s++) {
        const st = strips[s], nd = st.nodes;
        nd[0].p.copy(_anc).add(st.off); nd[0].q.copy(nd[0].p);
        const fx_ = _hd2.x * 1.8 + Math.sin(tt * 1.4 + s * 1.7) * 1.2, fy = _hd2.y * 1.8 - 2.4, fz = _hd2.z * 1.8 + Math.cos(tt * 1.1 + s) * 1.0;
        for (let j = 1; j < NN; j++) {
          const p = nd[j].p, q = nd[j].q, d = 1 - 2.6 * H;
          const vx = (p.x - q.x) * d, vy = (p.y - q.y) * d, vz = (p.z - q.z) * d; q.copy(p);
          p.x += vx + fx_ * H * H; p.y += vy + fy * H * H; p.z += vz + fz * H * H;
        }
        for (let it = 0; it < 2; it++) for (let j = 1; j < NN; j++) {
          _w.subVectors(nd[j].p, nd[j - 1].p); const L = _w.length() || 1, e = (L - st.L) / L;
          if (j === 1) nd[j].p.addScaledVector(_w, -e); else { nd[j].p.addScaledVector(_w, -e * 0.5); nd[j - 1].p.addScaledVector(_w, e * 0.5); }
        }
      }
    }
    // tassel matrices
    heart.getWorldPosition(_w3);
    tas[lanternTasN].a.copy(heartP.p).add(_w.copy(heartP.a).sub(heartP.p).normalize().multiplyScalar(-0.38)); tas[lanternTasN].vis = hv;
    for (let i = 0; i < NTAS; i++) {
      const o = tas[i]; _dir.subVectors(o.p, o.a).normalize();
      _qa.setFromUnitVectors(DOWN, _dir); _s.setScalar(o.sc * o.vis); if (o.vis < 0.02) _s.setScalar(0);
      _m.compose(o.a, _qa, _s); tasMesh.setMatrixAt(i, _m);
    }
    tasMesh.instanceMatrix.needsUpdate = true;
    // heart lantern and cord
    _dir.subVectors(heartP.a, heartP.p).normalize();
    heart.position.copy(heartP.p); heart.quaternion.setFromUnitVectors(UP, _dir).multiply(_q2.setFromAxisAngle(UP, t * 0.35));
    heart.scale.setScalar(Math.max(0.0001, hv * 1.05)); heart.visible = hv > 0.02;
    _w.copy(heartP.p).addScaledVector(_dir, 0.4 * hv);
    cord.position.copy(_w); cord.quaternion.setFromUnitVectors(UP, _dir); cord.scale.set(hv, Math.max(0.001, heartP.a.distanceTo(_w)), hv); cord.visible = hv > 0.02;
    heartLight.position.copy(heartP.p); heartLight.intensity = 1.5 * glowNow * ignite * hv * (1 + flash * 2) + finalFlash * 3;
    // streamer ribbons
    const P = stPos;
    for (let s = 0; s < NST; s++) {
      const st = strips[s], nd = st.nodes;
      for (let j = 0; j < NN; j++) {
        if (j < NN - 1) _dir.subVectors(nd[j + 1].p, nd[j].p); else _dir.subVectors(nd[j].p, nd[j - 1].p);
        _dir.normalize(); _side.crossVectors(_dir, UP); if (_side.lengthSq() < 1e-4) _side.set(1, 0, 0); _side.normalize();
        const ph = st.tw * (j / NN) * 1.4 + s * 0.9; _wd.crossVectors(_dir, _side);
        _side.multiplyScalar(Math.cos(ph)).addScaledVector(_wd, Math.sin(ph));
        const hw = st.w * (1 - 0.45 * (j / NN)) * 0.5 * streamVis * bodyVis(NSEG - 1), v = (s * NN + j) * 6, p = nd[j].p;
        P[v] = p.x + _side.x * hw; P[v + 1] = p.y + _side.y * hw; P[v + 2] = p.z + _side.z * hw;
        P[v + 3] = p.x - _side.x * hw; P[v + 4] = p.y - _side.y * hw; P[v + 5] = p.z - _side.z * hw;
      }
    }
    stG.attributes.position.needsUpdate = true; stG.computeVertexNormals();
    // tags
    for (let i = 0; i < NTAG; i++) {
      const g = tags[i]; g.a.copy(strips[g.strip].nodes[g.node].p);
      if (!g.init) { g.p.copy(g.a).y -= g.L; g.q.copy(g.p); g.init = true; }
      for (let k = 0; k < steps; k++) pendStep(g, 7, _wind, 4);
      _dir.subVectors(g.p, g.a).normalize(); _qa.setFromUnitVectors(DOWN, _dir).multiply(_q2.setFromAxisAngle(UP, g.yaw + t * 0.3));
      _s.setScalar(streamVis * bodyVis(NSEG - 1)); _m.compose(g.a, _qa, _s); tagMesh.setMatrixAt(i, _m);
    }
    tagMesh.instanceMatrix.needsUpdate = true;

    // glow halos
    for (let i = 0; i < NSEG; i++) { root.localToWorld(_w.copy(segPos[i])); const v = bodyVis(i); setGlow(i, _w, 1.05 * SIZE[i] * v, 1, 0.72, 0.38, 0.26 * glowNow * (1 + crease)); }
    setGlow(16, heartP.p, (1.5 + heartDrop) * hv, 1, 0.78, 0.42, 0.55 * glowNow * ignite);
    const hs = headB.scale.x;
    for (let s = 0; s < 2; s++) { headB.localToWorld(_w.set((s ? -0.21 : 0.21) * HEAD_S, 0.17 * HEAD_S, 0.47 * HEAD_S)); setGlow(17 + s, _w, 0.22 * hs, 1, 0.85, 0.5, 0.95); }
    headB.localToWorld(_w.set(0, -0.03 * HEAD_S, 0.62 * HEAD_S)); setGlow(19, _w, 1.1 * CUR.jaw * hs, 1, 0.7, 0.3, 0.7 * CUR.jaw * glowNow);
    seal.getWorldPosition(_w); setGlow(20, _w, 2.6 * sealFlash, 1, 0.45, 0.3, sealFlash);
    if (heartGone) root.localToWorld(_w.set(0, 1.3, REACH)); else root.localToWorld(_w.copy(segPos[3]));
    const fb = Math.max(flash, finalFlash * 0.85); setGlow(21, _w, 9 * fb, 1, 0.9, 0.7, Math.min(1, fb) * 0.9);
    for (let s = 0; s < 2; s++) { wings[s].b.getWorldPosition(_w); setGlow(22 + s, _w, 0.9 * wings[s].b.scale.x, 1, 0.7, 0.35, 0.3 * glowNow); }
    setGlow(24, _w.set(0, -999, 0), 0, 0, 0, 0, 0); setGlow(25, _w, 0, 0, 0, 0, 0);
    GLOW.pos.needsUpdate = GLOW.size.needsUpdate = GLOW.col.needsUpdate = true;

    if (dt > 0) {
      // embers from scorched tips
      for (let s = 0; s < NST; s++) if (streamVis > 0.3 && rnd() < 1.6 * dt) ember(strips[s].nodes[NN - 1].p, _w.set(rr(-0.2, 0.2), rr(0.1, 0.4), rr(-0.2, 0.2)), rr(0.7, 1.6), rr(0.035, 0.06));
      for (const w of wings) if (w.b.scale.x > 0.3 && rnd() < 3 * dt) { const e = w.tips[(rnd() * w.tips.length) | 0]; w.m.localToWorld(_w.set(e[0], e[1], e[2])); ember(_w, _w2.set(rr(-0.2, 0.2), rr(0.1, 0.4), rr(-0.2, 0.2)), rr(0.6, 1.4), rr(0.035, 0.06)); }
      // burning away
      for (let i = 0; i < NSEG; i++) if (burn[i] > 0.12 && burn[i] < 0.92) {
        root.localToWorld(_w3.copy(segPos[i]));
        const fr = fireBurn ? 2.2 : 1;
        for (let e = 0; e < 3; e++) if (rnd() < 6 * fr * dt) ember(_w3.clone().add(_w2.set(rr(-0.3, 0.3), rr(-0.3, 0.3), rr(-0.3, 0.3))), _w.set(rr(-0.4, 0.4), rr(0.4, 1.4), rr(-0.4, 0.4)), rr(0.6, 1.6), fireBurn && e === 0 ? rr(0.22, 0.4) : rr(0.04, 0.08));
        if (rnd() < (fireBurn ? 4.5 : 2.2) * dt) letter(_w3, _w.set(rr(-0.6, 0.6), rr(0.6, 1.6), rr(-0.6, 0.6)), rr(1.2, 2), fireBurn ? 0 : 1, rr(0.8, 1.2), 0.6);
      }
      if (pillar > 0.01) {
        root.localToWorld(_w3.set(0, 1.2, REACH));
        for (let e = 0; e < 3; e++) if (rnd() < 14 * pillar * dt) letter(_w3.clone().add(_w2.set(rr(-0.6, 0.6), 0, rr(-0.6, 0.6))), _w.set(rr(-0.5, 0.5), rr(4, 7), rr(-0.5, 0.5)), rr(1.2, 1.8), 0, rr(0.9, 1.3), 0.2);
        for (let e = 0; e < 4; e++) if (rnd() < 20 * pillar * dt) ember(_w3.clone().add(_w2.set(rr(-0.5, 0.5), rr(0, 2), rr(-0.5, 0.5))), _w.set(rr(-0.4, 0.4), rr(3, 6), rr(-0.4, 0.4)), rr(0.8, 1.6), rr(0.06, 0.18));
      }
      if (headBurn > 0.1 && headBurn < 0.9 && rnd() < 12 * dt) { headB.getWorldPosition(_w3); ember(_w3, _w.set(rr(-0.4, 0.4), rr(0.4, 1.2), rr(-0.4, 0.4)), rr(0.8, 1.6), rr(0.04, 0.08)); }
      if (wingBurn > 0.1 && wingBurn < 0.9) for (const w of wings) if (rnd() < 10 * dt) { const e = w.tips[(rnd() * w.tips.length) | 0]; w.m.localToWorld(_w3.set(e[0] * 0.7, e[1] * 0.7, e[2] * 0.7)); ember(_w3, _w.set(rr(-0.3, 0.3), rr(0.4, 1), rr(-0.3, 0.3)), rr(0.8, 1.6), rr(0.04, 0.08)); }
    }
    stepParticles(dt);
  }

  // ---------- interface ----------
  function play(name, force) {
    const def = ACTIONS[name]; if (!def) return false;
    if (api.busy && !force && !def.interrupt) return false;
    const key = ALIAS[name] || name;
    if (key === 'summon') { resetLooks(); warded = false; for (let i = 0; i < NSEG; i++) unf[i] = 0; headF = 0; wingF = 0; ignite = 0.12; }
    act = { name, def, t: 0 }; prevU = 0; api.busy = !def.hold; api.action = name; api.progress = 0;
    return true;
  }
  function guard(on) { guardT = on ? 1 : 0; }
  function reset() { act = null; warded = false; prevU = 0; guardT = 0; api.busy = false; api.action = ''; api.progress = -1; api.dash = 0; resetLooks(); }
  function setFade(f) { fade = cl(f, 0, 1); }
  const ANCH = {
    chest: (o) => root.localToWorld(o.copy(segPos[2])),
    head: (o) => headB.localToWorld(o.set(0, 0.12 * HEAD_S, 0.4 * HEAD_S)),
    hit: (o) => (fireBurn ? root.localToWorld(o.set(0, 1.3, REACH)) : headB.localToWorld(o.set(0, 0, 1.0 * HEAD_S))),
    target: (o) => root.localToWorld(o.set(0, 1.3, REACH)),
    mouth: (o) => headB.localToWorld(o.set(0, -0.02, 0.85 * HEAD_S)),
    heart: (o) => o.copy(heartP.p),
    seal: (o) => seal.getWorldPosition(o),
    tail: (o) => root.localToWorld(o.copy(tailTip)),
    wingL: (o) => { const e = wings[0].tips[NL >> 1]; return wings[0].m.localToWorld(o.set(e[0], e[1], e[2])); },
    wingR: (o) => { const e = wings[1].tips[NL >> 1]; return wings[1].m.localToWorld(o.set(e[0], e[1], e[2])); },
  };
  function anchor(name, out) { out = out || V3(); const f = ANCH[name] || ANCH.chest; return f(out); }

  api.root = root; api.fx = fx; api.animate = animate; api.play = play; api.guard = guard; api.reset = reset;
  api.setFade = setFade; api.anchor = anchor; api.ACTIONS = ACTIONS; api.busy = false; api.action = ''; api.progress = -1;
  api.info = { bones: bones.length, actions: ['summon', 'envoi', 'leave', 'block', 'hurt'], textures: texCount, textureMB: +(texBytes / 1048576).toFixed(2), height: 6.2 };
  animate(0, 0, 0, 0);
  return api;
}
