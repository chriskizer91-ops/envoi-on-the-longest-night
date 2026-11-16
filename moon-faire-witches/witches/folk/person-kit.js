// person-kit.js: makes a different person from a finished witch, used as the template. three.js r128, global THREE.
// Needs: jester_kit.js (her model with the one template step), lod.js (the light levels), jester_tex.js (her paintings)
// and window.MF_FACE_PLAIN (kit/face_plain.webp as a data URI: her face with the jester make-up painted out).
//
// A person is a small object (see kit/PERSON-KIT.md and people/lampseller.js):
//   { name, height, build, skin, keep, colors, parts, face(F), make(K) }
// What is reused from the witch: her skeleton, every body move, her body, hands, head and boots at the Lightest weight.
// What is new for each person: colours, skin, a repainted face, hair, headwear and simple clothes made of lofted shells.
(function () {
  'use strict';
  const BASE = [0xd9, 0x9f, 0x91];                                        // the witch's own skin colour (JESTER_TEX.skin)
  // her own costume parts, left out unless a person keeps one
  const HERS = { sock: 1, capknot: 1, neckband: 1, puff: 1, cap: 1, velvet: 1, fur: 1, ruffle: 1, bells: 1, bellslit: 1, gold: 1, gem: 1, hair: 1, lace: 1, leather: 1, stitch: 1, eyelet: 1, aglet: 1, pearl: 1, cord: 1, nail: 1 };
  const BODY = { torso: 'torso', sleeve: 'wine', forearm: 'cloth', legs: 'leggings', boots: 'boot', soles: 'sole', puff: 'puff' };      // a person's word for each body part, and her key for it
  const rgb = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tone = (skin) => (skin ? rgb(skin).map((v, i) => Math.min(1.12, v / BASE[i])) : [1, 1, 1]);
  const load = (url) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('a picture did not load')); im.src = url; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- the face: 1024 x 1024, the same layout as her face painting ----------
  const LAND = { W: 1024, eyeL: [356, 309], eyeR: [668, 309], browY: 236, nose: [518, 500], mouth: [518, 652], chin: [518, 800], cheekL: [300, 480], cheekR: [735, 480], forehead: [518, 150], jawL: [262, 690], jawR: [776, 690] };
  function faceTools(g, seed) {
    let s = (seed >>> 0) || 7; const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    // a soft airbrushed oval: colour, how strong (0 to 1), and a blend mode ('source-over', 'multiply', 'screen', 'color', 'soft-light')
    const air = (x, y, rx, ry, color, alpha, mode) => {
      const c = rgb(color), gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(0.55, `rgba(${c},0.6)`); gr.addColorStop(1, `rgba(${c},0)`);
      g.save(); g.globalCompositeOperation = mode || 'source-over'; g.globalAlpha = alpha == null ? 0.5 : alpha; g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
    };
    const stroke = (pts, color, alpha, width, mode) => { g.save(); g.globalCompositeOperation = mode || 'multiply'; g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = color; g.shadowBlur = width * 0.9; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); g.restore(); };
    const both = (fn) => { fn(1); fn(-1); }, mx = (x, k) => 518 + k * (x - 518);              // k = 1 her right side as painted (image left), -1 the mirror
    const F = Object.assign({ g, rnd, air, stroke }, LAND);
    F.lips = (color, alpha) => { air(518, 652, 118, 50, color, alpha == null ? 0.7 : alpha, 'color'); };
    F.lipShade = (alpha) => { air(518, 652, 112, 44, '#5a3038', alpha == null ? 0.25 : alpha, 'multiply'); };
    F.brows = (color, alpha, width) => both((k) => stroke([[mx(238, k), 242], [mx(330, k), 206], [mx(452, k), 246]], color, alpha == null ? 0.6 : alpha, width || 15, 'source-over'));
    F.blush = (color, alpha) => both((k) => air(mx(300, k), 485, 120, 90, color, alpha == null ? 0.25 : alpha, 'source-over'));
    F.eyeshadow = (color, alpha) => both((k) => air(mx(356, k), 282, 86, 30, color, alpha == null ? 0.35 : alpha, 'multiply'));
    F.underEye = (alpha) => both((k) => air(mx(356, k), 352, 78, 26, '#7a5a66', alpha == null ? 0.3 : alpha, 'multiply'));
    F.eyes = (color, alpha) => both((k) => air(mx(356, k), 316, 27, 27, color, alpha == null ? 0.75 : alpha, 'color'));
    F.freckles = (n, color, alpha) => { for (let i = 0; i < (n || 80); i++) { const x = 518 + (rnd() - 0.5) * 520, y = 420 + (rnd() - 0.5) * 190 - Math.abs(x - 518) * 0.08; air(x, y, 3 + rnd() * 3, 3 + rnd() * 3, color || '#8a5a3c', (alpha == null ? 0.45 : alpha) * (0.5 + rnd() * 0.5), 'multiply'); } };
    F.mole = (x, y, r) => air(x, y, r || 6, r || 6, '#4a2c24', 0.8, 'multiply');
    // the lines of an older face: forehead, between the brows, crow's feet, beside the nose and mouth. strength 0 to 1
    F.lines = (strength) => { const a = 0.5 * (strength == null ? 0.6 : strength), c = '#7a4a44';
      for (const y of [128, 162, 194]) stroke([[330, y + 6], [518, y - 8], [706, y + 6]], c, a * 0.8, 4);
      stroke([[498, 232], [502, 262], [498, 282]], c, a, 4); stroke([[538, 232], [534, 262], [538, 282]], c, a, 4);
      both((k) => { for (const d of [-16, 0, 16]) stroke([[mx(246, k), 318 + d * 0.4], [mx(214, k), 318 + d * 1.4]], c, a, 3.5);
        stroke([[mx(452, k), 520], [mx(408, k), 580], [mx(398, k), 650]], c, a * 1.1, 6); stroke([[mx(396, k), 676], [mx(388, k), 716], [mx(402, k), 752]], c, a * 0.8, 5); stroke([[mx(300, k), 372], [mx(356, k), 392], [mx(416, k), 372]], c, a * 0.7, 5); }); };
    // hair on the face, painted flat: 'stubble' is short dots, 'beard' is longer strokes over the jaw, chin and upper lip
    F.beard = (color, alpha, kind) => { const n = kind === 'stubble' ? 3200 : 9000, len = kind === 'stubble' ? 3 : 16; g.save(); g.globalAlpha = alpha == null ? 0.6 : alpha; g.strokeStyle = color; g.lineWidth = kind === 'stubble' ? 2.4 : 5; g.lineCap = 'round';
      for (let i = 0; i < n; i++) { const x = 518 + (rnd() - 0.5) * 600, y = 560 + rnd() * 330, dx = (x - 518) / 300, dy = (y - 720) / 190, lip = Math.abs(x - 518) < 150 && y > 568 && y < 608;
        if (!lip && (dx * dx + dy * dy > 1 || (Math.abs(x - 518) < 128 && y > 612 && y < 698) || y < 640 - Math.abs(dx) * 60 + (1 - Math.abs(dx)) * 40)) continue;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3 + dx * 2, y + len * (0.6 + rnd() * 0.6)); g.stroke(); }
      g.restore(); };
    F.pale = (alpha) => { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = alpha == null ? 0.12 : alpha; g.fillStyle = '#fff4ec'; g.fillRect(0, 0, 1024, 1024); g.restore(); };
    return F;
  }
  // skin: the whole painting is multiplied toward the person's skin colour, leaving the eyes as they are
  function skinned(img, w, h, t, eyes) {
    const c = canvas(w, h), g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const m = canvas(w, h), mg = m.getContext('2d'); mg.fillStyle = hex(t.map((v) => v * 255 / 1.12 * 1.12 > 255 ? 255 : v * 255)); mg.fillRect(0, 0, w, h);
    if (eyes) { mg.globalCompositeOperation = 'destination-out'; for (const e of [LAND.eyeL, LAND.eyeR]) { const gr = mg.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.7, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mg.save(); mg.translate(e[0] * w / 1024, (e[1] + 6) * h / 1024); mg.scale(50 * w / 1024, 24 * h / 1024); mg.fillStyle = gr; mg.beginPath(); mg.arc(0, 0, 1, 0, 7); mg.fill(); mg.restore(); } }
    g.globalCompositeOperation = 'multiply'; g.drawImage(m, 0, 0); return c;
  }
  // her profile painting still wears her rouge: most of it is covered with plain skin, leaving a hint of the modelling
  function plainSide(img, skin) { const c = canvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalAlpha = 0.78; g.fillStyle = skin; g.fillRect(0, 0, c.width, c.height); return c; }
  // get a person's pictures ready: the repainted face, and her hands and profile in the person's skin
  async function prepare(person, skin) {
    if (skin) return prepareSkin(person, skin);
    const T = window.JESTER_TEX, t = tone(person.skin), [plain, side, hands] = await Promise.all([load(window.MF_FACE_PLAIN), load(T.faceSide), load(T.hands)]);
    const fc = canvas(1024, 1024), g = fc.getContext('2d'); g.drawImage(plain, 0, 0, 1024, 1024);
    let faceError = '';
    if (person.face) { try { person.face(faceTools(g, person.seed || 11)); } catch (e) { faceError = String(e && e.message || e); } }
    const face = skinned(fc, 1024, 1024, t, true);
    const sk = (h) => hex(rgb(h).map((v, i) => v * t[i]));
    return { faceError, faceCanvas: face, textures: Object.assign({}, T, { face: face.toDataURL('image/webp', 0.92), faceSide: skinned(plainSide(side, T.skinJaw || T.skin), side.width, side.height, t, false).toDataURL('image/png'),
      hands: skinned(hands, 512, 512, t, false).toDataURL('image/webp', 0.9), skin: sk(T.skin), skinJaw: sk(T.skinJaw), faceParts: {} }) };
  }
  // ---------- a painted skin: one body sheet (front | back) and one face picture, laid onto the person ----------
  // skin: { body, face (data URIs), fit: { front, back: [sx, sy, ox, oy] }, faceFit: [scale, dx, dy], skin: '#hex', SKIN: the fitter's file or null }
  const CEN = [0.5, 0.5];                                                // the middle of a half picture: x = 0, y = 0.9 m
  function layFit(auto, nudge) {                                        // a guide point g (0..1) is read from the picture at g * s + o
    const S = (nudge && nudge.scale) || [1, 1], M = (nudge && nudge.move) || [0, 0], m = [M[0] / 1.5, M[1] / 2.0], out = [0, 0, 0, 0];
    for (let i = 0; i < 2; i++) { const k = S[i] || 1; out[i] = auto[i] / k; out[2 + i] = (CEN[i] - (CEN[i] + m[i]) / k) * auto[i] + auto[2 + i]; }
    return new THREE.Vector4(out[0], out[1], out[2], out[3]);
  }
  // the face's own blink and mouth shapes, painted from the person's face picture: lids in the skin colour found above each eye,
  // an open mouth, and a smile's turned-up corners. Same places and sizes as the template's own patches
  function faceParts(fc) {
    const g0 = fc.getContext('2d'), mean = (x, y) => { const d = g0.getImageData(x - 5, y - 5, 11, 11).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return [r / n, gg / n, b / n].map(Math.round); };
    const part = (x, y, w, h, paint) => { const c = canvas(w, h), g = c.getContext('2d'); g.drawImage(fc, x, y, w, h, 0, 0, w, h); g.translate(-x, -y); paint(g); return { src: c.toDataURL('image/webp', 0.92), x: x / 1024, y: y / 1024, w: w / 1024, h: h / 1024 }; };
    const oval = (g, x, y, rx, ry, c, a, edge) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(edge, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.save(); g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); };
    const line = (g, a, b, c, col, w) => { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]); g.stroke(); g.restore(); };
    const eyes = [LAND.eyeL, LAND.eyeR], lids = eyes.map((e) => mean(e[0], e[1] - 44)), dark = lids.map((c) => c.map((v) => Math.round(v * 0.32)));
    const lid = (k) => (g) => eyes.forEach((e, i) => { const y = e[1] + 2 - (1 - k) * 12; oval(g, e[0], y, 62, 10 + 16 * k, lids[i], 1, 0.72); line(g, [e[0] - 48, y + 4 + 6 * k], [e[0], y + 8 + 12 * k], [e[0] + 48, y + 4 + 6 * k], `rgba(${dark[i]},0.8)`, 4.5); });
    const M = LAND.mouth, lip = mean(M[0], M[1] + 16).map((v) => Math.round(v * 0.22));
    return { shut: part(187, 263, 649, 200, lid(1)), half: part(187, 263, 649, 200, lid(0.5)),
      oh: part(349, 573, 325, 195, (g) => { oval(g, M[0], M[1] + 4, 36, 23, lip, 0.95, 0.6); }),
      smile: part(349, 573, 325, 195, (g) => { for (const k of [-1, 1]) line(g, [M[0] + k * 58, M[1] - 2], [M[0] + k * 80, M[1] - 6], [M[0] + k * 92, M[1] - 20], `rgba(${lip},0.55)`, 5); }) };
  }
  // a part of the model moved a little (a hat pulled down): its paint moves with it
  function moved(m, v, kind, size, mid) {
    const first = m.onBeforeCompile; m.customProgramCacheKey = () => 'moved-' + kind;
    m.onBeforeCompile = (sh, r) => { if (first) first(sh, r); sh.uniforms.uMove = { value: new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0) };
      sh.uniforms.uSize = { value: new THREE.Vector3(size[0] || 1, size[1] || 1, size[2] || 1) }; sh.uniforms.uMid = { value: new THREE.Vector3(mid[0], mid[1], mid[2]) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uMove; uniform vec3 uSize; uniform vec3 uMid;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = ( transformed - uMid ) * uSize + uMid + uMove;'); };
    return m;
  }
  const middle = (pos) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], pos[i + k]); hi[k] = Math.max(hi[k], pos[i + k]); } return [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2); };
  async function prepareSkin(person, skin) {
    const T = window.JESTER_TEX, S = skin.SKIN || {}, hexSkin = S.skin || skin.skin || person.skin || '#d99f91', t = tone(hexSkin);
    const [pic, side, hands, body] = await Promise.all([load(skin.face), load(T.faceSide), load(T.hands), load(skin.body)]);
    const fc = canvas(1024, 1024), g = fc.getContext('2d'), a = skin.faceFit || [1, 0, 0], n = S.face || {}, k = a[0] * (n.scale || 1), mv = n.move || [0, 0];
    g.fillStyle = hexSkin; g.fillRect(0, 0, 1024, 1024); g.translate(512 + a[1] + mv[0], 512 + a[2] + mv[1]); g.scale(k, k); g.drawImage(pic, -512, -512, 1024, 1024);
    const tex = new THREE.Texture(body); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4; tex.needsUpdate = true;
    const jaw = hex(rgb(hexSkin).map((v) => v * 0.94));
    return { faceError: '', faceCanvas: fc, bodyTex: tex, skin, S, front: layFit(skin.fit.front, S.front), back: layFit(skin.fit.back, S.back),
      textures: Object.assign({}, T, { face: fc.toDataURL('image/webp', 0.92), faceSide: skinned(plainSide(side, T.skinJaw || T.skin), side.width, side.height, t, false).toDataURL('image/png'),
        hands: skinned(hands, 512, 512, t, false).toDataURL('image/webp', 0.9), skin: hexSkin, skinJaw: jaw, faceParts: faceParts(fc) }) };
  }
  // the body sheet read by where each point stands in the standing pose: the front half on what faces forward, the back half on what faces back
  function painted(K, P, rough) {
    const m = K.sheen(K.std({ map: P.bodyTex, roughness: rough == null ? 0.86 : rough, side: THREE.DoubleSide, envMapIntensity: 0.25 }), '#cbbcc4', 2.6, 0.1), first = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (first) first(sh, r); sh.uniforms.uFront = { value: P.front }; sh.uniforms.uBack = { value: P.back }; sh.uniforms.uSeam = { value: (P.S.seam == null ? 0.2 : P.S.seam) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBindP; varying float vBindNz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBindP = position; vBindNz = normal.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uFront; uniform vec4 uBack; uniform float uSeam; varying vec3 vBindP; varying float vBindNz;')
        .replace('#include <map_fragment>', 'vec2 gP = vec2( ( vBindP.x + 0.75 ) / 1.5, ( vBindP.y + 0.1 ) / 2.0 );\n vec2 fP = clamp( gP * uFront.xy + uFront.zw, 0.002, 0.998 );\n vec2 bP = clamp( vec2( 1.0 - gP.x, gP.y ) * uBack.xy + uBack.zw, 0.002, 0.998 );\n vec3 cF = mapTexelToLinear( texture2D( map, vec2( fP.x * 0.5, fP.y ) ) ).rgb;\n vec3 cB = mapTexelToLinear( texture2D( map, vec2( 0.5 + bP.x * 0.5, bP.y ) ) ).rgb;\n diffuseColor.rgb *= mix( cB, cF, smoothstep( -uSeam, uSeam, vBindNz ) );');
    };
    return m;
  }
  const WORD = {}; for (const w in BODY) WORD[BODY[w]] = w;              // her key for a body part -> a person's word for it
  // small cloth patterns, painted in code
  function patternTex(spec) {
    const c = canvas(64, 64), g = c.getContext('2d'), p = spec.pattern; g.fillStyle = spec.color; g.fillRect(0, 0, 64, 64); g.fillStyle = p.color || '#ffffff';
    if (p.kind === 'check') { g.globalAlpha = 0.55; g.fillRect(0, 0, 32, 64); g.fillRect(0, 0, 64, 32); }
    else if (p.kind === 'dots') { for (const [x, y] of [[16, 16], [48, 48]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } }
    else if (p.kind === 'hoops') g.fillRect(0, 0, 64, 26); else g.fillRect(0, 0, 26, 64);      // 'stripes' run down the cloth; 'hoops' run round it
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(p.kind === 'hoops' ? 1 : (p.n || 8), p.kind === 'hoops' ? (p.n || 6) : (p.kind === 'stripes' ? 1 : (p.n || 8) / 2)); return t;
  }
  function material(spec, K) {
    if (typeof spec === 'string') spec = { color: spec };
    const o = { roughness: spec.rough == null ? 0.9 : spec.rough, metalness: spec.metal || 0, side: spec.oneSided ? THREE.FrontSide : THREE.DoubleSide };
    if (spec.pattern) o.map = patternTex(spec); else o.color = K.lin(spec.color || '#888888');
    if (spec.metal) o.envMapIntensity = 1.4;
    const c = rgb(spec.color || '#888888').map((v) => v + (255 - v) * 0.45);
    return K.sheen(K.std(o), spec.sheen || hex(c), 2.6, spec.metal ? 0 : (spec.sheenK == null ? 0.28 : spec.sheenK));
  }
  // build the person. prepared: what prepare() returned
  function make(person, prepared, extra) {
    const WL = window.WITCH_LOD, L = WL.LEVELS.find((x) => x.id === 'lightest'), errors = [];
    const skip = Object.assign({}, HERS); for (const k of person.keep || []) delete skip[BODY[k] || k];
    // a lighter weight of the same person: parts left off (hidden ones), and a share of each part's triangles kept. The painted skin is read by
    // where a point stands, so it lies on a thinned part as it did on the whole one, with nothing to bake again.
    const WT = person.weight || null, partName = (key) => key === 'face' ? 'head' : key === 'hand' ? 'hands' : key.slice(0, 2) === 'p_' ? key.slice(2) : (WORD[key] || key);
    if (WT) for (const n of WT.drop || []) if (n !== 'head' && n !== 'hands') skip[BODY[n] || 'p_' + n] = 1;
    const lod = WL.hooks(Object.assign({}, L.lod, { merge: null, shadowOnly: null, clothShadow: 0, skip, simplify: Object.assign({}, L.lod.simplify, { torso: 0.9, wine: 0.8, cloth: 0.8, leggings: 0.7 }) }));
    const thin = lod.onGeometry, own = lod.material, colors = person.colors || {}, parts = person.parts || {}, skinHex = person.skin || '#d99f91';
    lod.onGeometry = (key, g, B, K) => { if (key.slice(0, 2) !== 'p_') thin(key, g, B, K);            // a person's own parts are already light
      if (WT) { const k = WT.keep && WT.keep[partName(key)], r = (k == null ? (WT.rest == null ? 1 : WT.rest) : k) * (WT.scale || 1); if (r < 0.995) WL.simplify(g, Math.max(0.02, r), 0.3, true); } };
    lod.material = (key, B, K) => {
      if (prepared.bodyTex && key !== 'face' && key !== 'hand' && key !== 'skin') { const nm = key.slice(0, 2) === 'p_' ? key.slice(2) : (WORD[key] || key), S = prepared.S, fl = S.flat && S.flat[nm], ro = S.rough && S.rough[nm];
        const mt = fl ? material({ color: fl, rough: ro == null ? 0.8 : ro, sheen: fl, sheenK: 0.05 }, K) : painted(K, prepared, ro), mv = S.move && S.move[nm], sz = S.size && S.size[nm];
        return mv || sz ? moved(mt, mv || [0, 0, 0], fl ? 'flat' : 'painted', sz || [1, 1, 1], middle(B.pos)) : mt; }
      if (key.slice(0, 2) === 'p_') return material(parts[key.slice(2)] || '#888888', K);
      for (const w in BODY) if (BODY[w] === key) { let c = colors[w] || (w === 'puff' && colors.sleeve) || (w === 'forearm' && colors.cuff); if (!c) break; if (c === 'skin') c = skinHex;
        return material(Object.assign({ oneSided: true }, key === 'boot' ? { rough: 0.45 } : null, typeof c === 'string' ? { color: c } : c), K); }
      return own(key, B, K);
    };
    lod.person = { cloth: person.cloth, build(K0) {
      const V = (p) => (p.isVector3 ? p : K0.V3(p[0], p[1], p[2])), B = K0.BI, sm = K0.sm;
      const w = {
        head: K0.wHead, torso: K0.wTorso, hips: () => [B.hips, 1], chest: () => [B.spine3, 1],
        hair: (x, y) => { const v = sm(1.40, 1.47, y); return [B.head, v, B.neck, (1 - v) * 0.5, B.spine3, (1 - v) * 0.5]; },       // long hair follows the head above the nape and the shoulders below
        skirt: (x, y) => { const t = sm(0.98, 0.50, y) * 0.5, s = sm(-0.06, 0.06, x); return [B.hips, 1 - t, B.thighR, t * (1 - s), B.thighL, t * s]; },
        bone: (name) => { if (B[name] == null) throw new Error('no bone called ' + name); return () => [B[name], 1]; },
      };
      const mid = (rows) => { let a = 1e9, b = -1e9; for (const r of rows) { a = Math.min(a, r[0]); b = Math.max(b, r[0]); } return (a + b) / 2; };
      const K = Object.assign({}, K0, { w,
        // a closed shell through rings: rows of [y, half-width, half-depth front, half-depth back, centre x, centre z]
        shell(key, rows, wf, o) { o = o || {}; const n = o.n || 24, rings = rows.map((r) => K0.ringXZ(r[4] || 0, r[0], r[5] || 0, r[1], r[2], r[3] == null ? r[2] : r[3], n, o.square));
          return K0.addPart('p_' + key, K0.loft(rings, { capA: !!o.capFirst, capB: !!o.capLast, uS: 1, vS: 1 }), wf || w.torso, { out: K0.V3(rows[0][4] || 0, mid(rows), rows[0][5] || 0) }); },
        // part of a shell: only from angle a0 to a1 in degrees (0 = her front, 90 = her left, 180 = her back, -90 = her right)
        panel(key, rows, a0, a1, wf, o) { o = o || {}; const n = o.n || 14, rings = rows.map((r) => { const ring = []; for (let j = 0; j <= n; j++) { const a = (a0 + (a1 - a0) * j / n) * Math.PI / 180, c = Math.cos(a); ring.push([(r[4] || 0) + r[1] * Math.sin(a), r[0], (r[5] || 0) + (c >= 0 ? r[2] : (r[3] == null ? r[2] : r[3])) * c]); } return ring; });
          return K0.addPart('p_' + key, K0.loft(rings, { open: true }), wf || w.torso, { out: K0.V3(rows[0][4] || 0, mid(rows), rows[0][5] || 0) }); },
        // a tube along points [x, y, z] with a radius at each
        tube(key, pts, radii, wf, n) { const P = pts.map(V), rings = K0.tubeRings(P, radii, n || 10); return K0.addPart('p_' + key, K0.loft(rings, { capA: true, capB: true }), wf || w.torso, { out: K0.centroidOf(rings) }); },
        // a ball or an egg: centre [x, y, z] and radii [rx, ry, rz]
        ball(key, c, r, wf) { const C = V(c); return K0.addPart('p_' + key, K0.spherePart(C, r[0], r[1], r[2], 12, 8), wf || w.head, { out: C }); },
      });
      // ready-made hair fitted to the head: 'short', 'bob', 'long', 'bun' or 'topknot'. underHat leaves the crown off
      K.hair = (key, style, o) => { o = o || {};
        if (!o.underHat) K.shell(key, [[1.656, 0.012, 0.014, 0.014, 0, -0.004], [1.646, 0.046, 0.056, 0.058, 0, -0.004], [1.626, 0.069, 0.086, 0.084], [1.604, 0.078, 0.099, 0.093]], w.head, { n: 22 });
        const side = [[1.604, 0.078, 0.099, 0.093], [1.56, 0.081, 0.094, 0.097], [1.50, 0.079, 0.088, 0.095], [1.455, 0.068, 0.072, 0.088]];
        if (style === 'bob' || style === 'long') { side[3] = [1.455, 0.080, 0.082, 0.094]; side.push([1.40, 0.084, 0.080, 0.094]); }
        K.panel(key, side, 62, 298, style === 'bob' || style === 'long' ? w.hair : w.head, { n: 20 });
        if (style === 'long') K.panel(key, [[1.41, 0.086, 0.07, 0.096], [1.34, 0.100, 0.07, 0.106], [1.24, 0.106, 0.07, 0.114], [1.12, 0.094, 0.07, 0.110]], 78, 282, w.hair, { n: 16 });
        if (style === 'bun') K.ball(key, [0, 1.505, -0.105], [0.046, 0.044, 0.040], w.head);
        if (style === 'topknot') K.ball(key, [0, 1.672, -0.015], [0.036, 0.034, 0.036], w.head);
      };
      // a ready-made beard under the mouth: 'short', 'full' or 'long'
      K.beard = (key, style) => { const rows = [[1.447, 0.060, 0.099], [1.415, 0.061, 0.108], [1.385, 0.050, 0.104]];
        if (style === 'short') rows[2] = [1.392, 0.040, 0.096]; else if (style === 'long') rows.push([1.33, 0.046, 0.108], [1.26, 0.022, 0.104]); else rows.push([1.355, 0.034, 0.094]);
        K.panel(key, rows, -68, 68, w.head, { n: 12 }); };
      try { if (person.make) person.make(K); } catch (e) { errors.push(String(e && e.message || e)); }
    } };
    const o = Object.assign({}, L.opts, { treadmill: false, textures: prepared.textures }, extra || {}); o.lod = lod;
    const J = window.makeJester(o);
    const h = person.height || 1, b = person.build || [1, 1]; J.root.scale.set(h * (b[0] || 1), h, h * (b[1] || 1));
    if (person.head) { const q = person.head, hs = J.debug.SK.head.scale; hs.set(hs.x * (q[0] || 1), hs.y * (q[1] || 1), hs.z * (q[2] || 1)); }
    J.partTris = {}; for (const k in J.debug.meshes) { const ix = J.debug.meshes[k].geometry.index; J.partTris[partName(k)] = (J.partTris[partName(k)] || 0) + (ix ? ix.count / 3 : 0); }
    J.partNames = Object.keys(J.debug.meshes).filter((k) => k !== 'face' && k !== 'hand' && k !== 'skin').map((k) => k.slice(0, 2) === 'p_' ? k.slice(2) : (WORD[k] || k));
    J.person = person; J.personErrors = errors.concat(prepared.faceError ? ['face: ' + prepared.faceError] : []);
    return J;
  }
  window.MF_PERSON = { prepare, make, LAND, BODY, HERS };
})();
