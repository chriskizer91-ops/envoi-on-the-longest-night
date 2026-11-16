// flipbook.js: the Flipbook look for the whole battle, so the Moon Faire witches, their spells, Envoi's foes and effects and the
// painting all read as one picture (Chris, November 15: "make them look uniform ... the flipbook filter effect, have a toggle").
// After Moon Faire's (src/stage.js on moon-faire, from the witches' own stages): the 3D is drawn small into a picture of its own,
// a grid of rows down the screen; every solid pixel takes the nearest of the flipbook's colours (the Jester's 56, her sprites'
// own), solid shapes get an inked outline, and the small picture is enlarged with hard pixels. The painting behind is drawn on
// the same grid. Added light (glows, sparks) stays light: it is made to leave the picture's see-through channel alone.
// In Envoi's places the colours are the place's own: the first time a painting is drawn, 32 colours are taken from it
// (median cut) and joined by the 32 of the witches' colours least like them, and the 3D and the painting both take the
// nearest of those 64 (the painting through a lookup table). Mist and other see-through things stay see-through.
//   const FB = makeFlipbook(renderer); FB.on = true; FB.render(scene, camera) in place of renderer.render; FB.paint(ctx, img, sx, sy, sw, sh, w, h)
function makeFlipbook(renderer, o) {
  'use strict';
  o = o || {};
  const PAL = (o.palette || window.JESTER_PALETTE || [[0, 0, 0], [255, 255, 255]]).slice(0, 64), NP = Math.max(1, PAL.length);
  const pal = []; for (let i = 0; i < 64; i++) { const p = PAL[i % NP]; pal.push(new THREE.Vector3(p[0] / 255, p[1] / 255, p[2] / 255)); }
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
  const mat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    uniforms: { tD: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uPal: { value: pal }, uSnap: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'precision highp float; uniform sampler2D tD; uniform vec2 uRes; uniform vec3 uPal[64]; uniform float uSnap; varying vec2 vUv;\n' +
      'void main(){ vec2 px = 1.0 / uRes; vec2 uv = (floor(vUv * uRes) + 0.5) * px; vec4 c = texture2D(tD, uv);\n' +
      ' float n = max(max(texture2D(tD, uv + vec2(px.x, 0.0)).a, texture2D(tD, uv - vec2(px.x, 0.0)).a), max(texture2D(tD, uv + vec2(0.0, px.y)).a, texture2D(tD, uv - vec2(0.0, px.y)).a));\n' +
      ' if (c.a < 0.08) { if (n > 0.9) gl_FragColor = vec4(0.075, 0.05, 0.065, 1.0); else gl_FragColor = vec4(0.0); return; }\n' +
      ' vec3 col = c.rgb / max(c.a, 0.001); float l = dot(col, vec3(0.30, 0.59, 0.11)); col = clamp(l + (col - l) * (1.0 + 0.2 * uSnap), 0.0, 1.0);\n' +
      ' float best = 1e9; vec3 pick = col; for (int i = 0; i < 64; i++) { vec3 d = col - uPal[i]; float e = dot(d * d, vec3(0.30, 0.59, 0.11)); if (e < best) { best = e; pick = uPal[i]; } }\n' +
      ' pick = mix(col, pick, uSnap); float a = c.a > 0.9 ? 1.0 : c.a; gl_FragColor = vec4(pick * a, a); }' });
  const scene2 = new THREE.Scene(), cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false; scene2.add(quad);
  const small = document.createElement('canvas'), sg = small.getContext('2d', { willReadFrequently: true });
  // ---- the place's colours: median cut on a small copy of the painting, joined by the witches' colours least like them ----
  const seen = new WeakMap(); let LUT = null;
  function medianCut(px, k) {
    let boxes = [px];
    while (boxes.length < k) {
      let bi = -1, br = -1, ch = 0;
      boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; } const r = (hi - lo) * Math.sqrt(b.length); if (r > br) { br = r; bi = i; ch = c; } } });
      if (bi < 0) break;
      const b = boxes[bi].sort((x, y) => x[ch] - y[ch]), h = b.length >> 1; boxes.splice(bi, 1, b.slice(0, h), b.slice(h));
    }
    return boxes.map((b) => { const m = [0, 0, 0]; for (const p of b) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; } return m.map((v) => Math.round(v / b.length)); });
  }
  function usePalette(P) {
    for (let i = 0; i < 64; i++) { const p = P[i % P.length]; pal[i].set(p[0] / 255, p[1] / 255, p[2] / 255); }
    const d2 = (a, b) => 0.30 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2;
    LUT = new Uint8Array(32768 * 3);
    for (let i = 0; i < 32768; i++) { const c = [((i >> 10) & 31) * 8.23, ((i >> 5) & 31) * 8.23, (i & 31) * 8.23]; let best = 1e9, pk = P[0]; for (const p of P) { const e = d2(c, p); if (e < best) { best = e; pk = p; } } LUT[i * 3] = pk[0]; LUT[i * 3 + 1] = pk[1]; LUT[i * 3 + 2] = pk[2]; }
  }
  function placeColours(img) {
    if (seen.has(img) || o.palette) return; seen.set(img, true);
    const w = 160, h = Math.max(16, Math.round(160 * (img.naturalHeight || img.height || 90) / (img.naturalWidth || img.width || 160)));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    let d; try { d = g.getImageData(0, 0, w, h).data; } catch (e) { return; }
    const px = []; for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    const place = medianCut(px, 32), d2 = (a, b) => 0.30 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2;
    const theirs = PAL.map((p) => [p, Math.min(...place.map((q) => d2(p, q)))]).sort((a, b) => b[1] - a[1]).slice(0, 64 - place.length).map((x) => x[0]);
    usePalette(place.concat(theirs));
  }
  const tamed = new WeakSet(), _v = new THREE.Vector2();
  // added light leaves the see-through channel alone, so a glow is not taken for something solid and inked
  function tame(scene) {
    scene.traverse((ob) => { const ms = ob.material ? (Array.isArray(ob.material) ? ob.material : [ob.material]) : []; for (const m of ms) { if (tamed.has(m)) continue; tamed.add(m);
      if (m.blending === THREE.AdditiveBlending) { m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = m.premultipliedAlpha ? THREE.OneFactor : THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; m.needsUpdate = true; } } });
  }
  const FB = {
    on: false, rows: o.rows || 220,
    grid() { renderer.getSize(_v); const h = Math.max(32, Math.round(FB.rows)), w = Math.max(32, Math.round(h * _v.x / Math.max(1, _v.y))); return [w, h]; },
    render(scene, camera) {
      if (!FB.on) { renderer.render(scene, camera); return; }
      tame(scene);
      const [w, h] = FB.grid(); if (rt.width !== w || rt.height !== h) rt.setSize(w, h); mat.uniforms.uRes.value.set(w, h);
      const pr = renderer.getPixelRatio(); renderer.setPixelRatio(1);
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.setPixelRatio(pr); renderer.clear(); renderer.render(scene2, cam2);
    },
    // the painting on the same grid: drawn small, then enlarged with hard pixels
    paint(ctx, img, sx, sy, sw, sh, W, H) {
      const [w, h] = FB.grid(); if (small.width !== w || small.height !== h) { small.width = w; small.height = h; }
      placeColours(img);
      sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high'; sg.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      if (LUT) { try { const id = sg.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | d[i + 2] >> 3) * 3; d[i] = LUT[k]; d[i + 1] = LUT[k + 1]; d[i + 2] = LUT[k + 2]; } sg.putImageData(id, 0, 0); } catch (e) { /* a painting from elsewhere: left as it is */ } }
      ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, w, h, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
    },
  };
  return FB;
}
