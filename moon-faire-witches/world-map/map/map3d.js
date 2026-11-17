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
    uniform sampler2D zones, moods, hazes, shades; uniform vec4 uOpen, uHere; uniform vec3 uMoon, uFog, uMist, uEye; uniform float uTime, uFogNear, uFogFar, uGlow, uPierce, uMistAmt, uViolet;
    ${NOISE}
    // the region's own look in the game (from its walking places): what grows there is tinted this, by w
    vec3 mooded(vec3 c, vec3 wp, float w) {
      vec2 at = clamp(vec2((wp.x + ${AW / 2}.0) / ${AW}.0, (wp.z + ${AH / 2}.0) / ${AH}.0), 0.0, 1.0);
      return c * mix(vec3(1.0), texture2D(moods, at).rgb * 2.0, w);
    }
    // how much of the moon reaches this spot past the hills and peaks between (x: 0 in their shadow, 1 in the open),
    // and how open it lies to the sky (y: lower down in a valley or a gully)
    vec2 shadeAt(vec3 wp) {
      vec4 s = texture2D(shades, clamp(vec2((wp.x + ${AW / 2}.0) / ${AW}.0, (wp.z + ${AH / 2}.0) / ${AH}.0), 0.0, 1.0));
      return vec2(s.g, s.b);
    }
    // moonlight on one of the made textures (they are painted by night already, so this lifts them)
    vec3 moonlitTex(vec3 t, vec3 n, vec2 sv) {
      float l = dot(n, uMoon);
      return t * (vec3(1.02, 1.04, 1.1) * (0.62 + 0.38 * sv.y) + vec3(1.6, 1.6, 1.65) * max(l, 0.0) * sv.x - vec3(0.22) * max(-l, 0.0));
    }
    vec3 moonlit(vec3 albedo, vec3 n, vec2 sv) {
      float l = dot(n, uMoon);
      return albedo * (vec3(0.30, 0.35, 0.52) * (0.62 + 0.38 * sv.y) + vec3(0.92, 0.94, 1.0) * max(l, 0.0) * 0.95 * sv.x + vec3(0.05, 0.06, 0.10) * max(n.y, 0.0));
    }
    // water under the moon, flat: two sets of small ripples crossing tilt its face a little; seen at a low angle it takes
    // the sky's sheen; and the moon lays a path of light on it (calm: 1 the open sea, near 0 a river, which lies
    // still: move 0)
    vec3 water(vec3 base, vec3 wp, float vd, float calm, float move) {
      vec2 p = wp.xz * 0.11, m1 = uTime * vec2(0.42, 0.25) * move, m2 = uTime * vec2(-0.36, 0.5) * move, e = vec2(0.7, 0.0);
      float a = n2(p + m1), b = n2(p * 2.3 + m2);
      vec2 g = vec2(n2(p + e + m1) - a, n2(p + e.yx + m1) - a) + 0.6 * vec2(n2(p * 2.3 + e + m2) - b, n2(p * 2.3 + e.yx + m2) - b);
      vec3 n = normalize(vec3(-g.x * calm * 0.45, 1.0, -g.y * calm * 0.45)), v = normalize(uEye - wp), r = reflect(-v, n);
      float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0), mr = max(dot(r, uMoon), 0.0), nearBy = 1.0 - smoothstep(1500.0, 6500.0, vd);
      vec3 c = base * (0.86 + 0.28 * n2(p * 0.33 + m1 * 0.2));
      c = mix(c, vec3(0.15, 0.18, 0.34), fres * 0.6);
      // (the moon's light on it soft and broad: sharp glints made a busy scribble over the water near the coasts)
      return c + vec3(0.85, 0.88, 1.0) * (pow(mr, 90.0) * 0.16 + pow(mr, 18.0) * 0.16) * (0.25 + 0.75 * nearBy);
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
      // the region's own night haze lying in its low ground (each place's fog colour in the game)
      // zones 1 and 2 under a violet night (Chris, November 17: the game's places are violet by night, and stood as
      // purple squares on a field of green; the land should read green and purple at once). The shadows and the dark
      // of the woods take most of it; lit grass keeps most of its green
      float vl = dot(c, vec3(0.3, 0.59, 0.11)), vz = clamp(z.r + z.g, 0.0, 1.0) * uViolet * inMap * (1.0 - 0.55 * smoothstep(0.05, 0.3, c.r - c.b)); // (warm things, the fields' gold and the roofs' red, keep more of their own colour)
      c *= mix(vec3(1.0), vec3(1.1, 0.95, 1.24), vz);
      c = mix(c, vec3(vl) * vec3(1.2, 0.86, 1.66), vz * 0.52 * (1.0 - smoothstep(0.03, 0.26, vl)));
      vec4 hz = texture2D(hazes, clamp(at, 0.0, 1.0));
      c = mix(c, hz.rgb * 1.5, hz.a * 0.16 * inMap * (1.0 - smoothstep(4.0, 70.0, wp.y)) * (0.5 + 0.9 * n));
      c = mix(c, uMist * (0.7 + 0.55 * n + 0.2 * nb), mist * clamp(0.55 + 0.4 * n, 0.0, 0.9));
      if (lines > 0.5) {
        float sum = z.r + z.g + z.b + z.a;
        float meet = max(max(max(z.r * z.g, z.g * z.b), max(z.b * z.a, z.r * z.a)), max(z.r * z.b, z.g * z.a));
        float line = smoothstep(0.215, 0.245, meet) + smoothstep(0.22, 0.248, sum * (1.0 - sum)) * step(0.02, sum);
        c += vec3(0.62, 0.66, 0.85) * clamp(line, 0.0, 1.0) * 0.16 * inMap;
        // the edge of the zone Io is in: a thin line of pale violet light in dashes (Chris, November 17: the gold band
        // it was looked like a strip of sand lying on the land)
        float m = dot(z, uHere), ring = smoothstep(0.236, 0.249, m * (1.0 - m)), dash = step(0.24, fract(wp.x / 17.0)) * step(0.24, fract(wp.z / 17.0));
        c = mix(c, vec3(0.72, 0.62, 1.0), ring * dash * (0.62 + 0.25 * uGlow) * inMap);
      }
      return mix(c, uFog, smoothstep(uFogNear, uFogFar, depth));
    }`;
  const LAND_V = `
    attribute vec3 snormal;
    varying vec3 vW, vN; varying float vDepth;
    void main() { vW = position; vN = snormal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  // tex: true where the phone or laptop can hold the made ground textures as a stack of layers (WebGL 2); else flat colours
  const landF = (tex) => `
    ${tex ? 'precision highp sampler2DArray;' : ''}
    uniform sampler2D ground, kinds; ${tex ? 'uniform sampler2DArray layers; uniform float uLayer[65], uMoodW[13]; uniform vec3 uTint[27];' : ''}
    varying vec3 vW, vN; varying float vDepth;
    ${FINISH}
    void main() {
      vec2 at = vec2((vW.x + ${AW / 2}.0) / ${AW}.0, (vW.z + ${AH / 2}.0) / ${AH}.0);
      vec4 g = texture2D(ground, at); vec2 sv = shadeAt(vW);
      // each little face of the land catches the moon its own way (close up); far off, the land's smooth slope
      vec3 face = normalize(cross(dFdx(vW), dFdy(vW))); if (face.y < 0.0) face = -face;
      vec3 sn = normalize(vN), n = normalize(mix(face, sn, smoothstep(1400.0, 4200.0, vDepth)));
      // steep ground is bare rock, whatever grows round it; water only lies where the ground is near level
      float steep = smoothstep(0.26, 0.5, 1.0 - face.y);
      // a river or a lake: g.a runs from 0 on the land to 1 in the water, so its banks are smooth curves, a little ragged
      float wet = smoothstep(0.40, 0.58, g.a + (n2(vW.xz * 0.21) - 0.5) * 0.14) * (1.0 - steep);
      // the kind of ground here, read a little to one side and another so that kinds meet in a ragged line, not in squares
      vec2 wob = ((vec2(n2(vW.xz * 0.05), n2(vW.xz * 0.05 + 17.3)) - 0.5) * 2.6 + (vec2(n2(vW.xz * 0.33), n2(vW.xz * 0.33 + 5.1)) - 0.5)) / vec2(${DW}.0, ${DH}.0);
      ${tex ? `
      int k = int(texture2D(kinds, at + wob).r * 255.0 + 0.5);
      float mw = uMoodW[k];
      // which zone this is (0: none), its edge ragged too: grass, woods and fields wear their zone's own ground
      vec2 zw = (vec2(fbm(vW.xz * 0.012), fbm(vW.xz * 0.012 + 9.7)) - 0.5) * 0.045;
      vec4 zq = texture2D(zones, at + zw); int zi = 0; float zb = 0.35;
      if (zq.r > zb) { zi = 1; zb = zq.r; } if (zq.g > zb) { zi = 2; zb = zq.g; } if (zq.b > zb) { zi = 3; zb = zq.b; } if (zq.a > zb) { zi = 4; }
      // its texture, repeating every 960 m (the zones' close-up ground every 400 m), mixed with the same texture laid
      // larger and turned so the repeat doesn't show. (Mountain ground, rock or snow, starts from the rock.)
      bool mt = (k == 11 || k == 12);
      float L = mt ? 8.0 : uLayer[k * 5 + zi], dry = (k == 9 || k == 10) ? 1.0 : 0.0, fine = L > 15.5 ? 2.4 : 1.0;
      vec2 p = vW.xz * fine;
      vec3 t1 = texture(layers, vec3(p / 96.0, L)).rgb, t2 = texture(layers, vec3(mat2(0.8, -0.6, 0.6, 0.8) * p / 250.0 + 0.37, L)).rgb;
      vec3 c = mix(t1, t2, clamp(0.3 * smoothstep(0.3, 0.7, n2(vW.xz * 0.006 + 3.0)) + 0.55 * smoothstep(500.0, 2600.0, vDepth), 0.0, 0.85));
      // close to, the same texture again much finer, so the ground has grain under the trees
      c = mix(c, texture(layers, vec3(p / 21.0 + 0.11, L)).rgb, 0.5 * (1.0 - smoothstep(60.0, 300.0, vDepth)));
      c *= uTint[int(L + 0.5)];
      // open grass has more to it than one even green: drifts of meadow and of clover, darker and lighter patches, and
      // close to, tufts and the specks of flowers
      if (k == 5) {
        float m1 = fbm(vW.xz * 0.021 + 4.0), m2 = fbm(vW.xz * 0.034 + 11.0);
        if (zi <= 1) {
          c = mix(c, texture(layers, vec3(p / 70.0, 25.0)).rgb * uTint[25], smoothstep(0.42, 0.6, m1) * 0.85);
          c = mix(c, texture(layers, vec3(p / 60.0, 26.0)).rgb * uTint[26], smoothstep(0.52, 0.66, m2) * 0.8);
        }
        c *= 0.8 + 0.42 * fbm(vW.xz * 0.075 + 1.5);
        float near = 1.0 - smoothstep(120.0, 520.0, vDepth), tuft = n2(vW.xz * 0.9) * n2(vW.xz * 2.3 + 3.0);
        c *= 1.0 - 0.38 * near * smoothstep(0.22, 0.5, tuft);
        c += vec3(0.5, 0.48, 0.3) * near * smoothstep(0.86, 0.93, n2(vW.xz * 3.1 + 7.0)) * smoothstep(0.45, 0.6, m2);
      }
      // the mountains: bare rock, banded as it rises; snow lying where the ground is high and not too steep (higher on
      // some slopes than others, and wherever the painting has snow); between the two, rock with snow in its hollows
      float slope = 1.0 - mix(face.y, sn.y, 0.5);
      float line = 150.0 + (fbm(vW.xz * 0.011 + 2.0) - 0.5) * 110.0 - (k == 12 ? 75.0 : 0.0);
      float snow = mt ? smoothstep(line - 35.0, line + 45.0, vW.y) * (1.0 - smoothstep(0.26, 0.5, slope)) : 0.0;
      vec3 snowy = texture(layers, vec3(vW.xz / 120.0, 11.0)).rgb * uTint[11], white = texture(layers, vec3(vW.xz / 96.0, 10.0)).rgb * uTint[10];
      float band = 0.84 + 0.3 * n2(vec2(vW.y * 0.085 + n2(vW.xz * 0.02) * 3.0, dot(vW.xz, vec2(0.6, 0.8)) * 0.004));
      if (mt) c = mix(mix(c * band, snowy, smoothstep(0.1, 0.5, snow)), white, smoothstep(0.45, 0.85, snow));
      // a steep face: the cliff texture (the mesa's own in the east, the rock's own in the mountains), laid on it upright
      vec2 q = vec2(dot(vW.xz, vec2(0.7071)), vW.y * 1.3) / 80.0;
      vec3 cl = texture(layers, vec3(q, mt ? 8.0 : mix(9.0, 7.0, dry))).rgb * (mt ? uTint[8] * band * 0.9 : mix(vec3(1.25), vec3(1.6, 1.0, 0.74) * 0.8, dry));
      c = mix(mooded(c, vW, mw), mooded(cl, vW, 0.35), steep * (mt ? 0.75 : 1.0));
      c = moonlitTex(c, n, sv);
      // inland water: its bank damp and dark, then the water (in zone 4 it is frozen: the lake ice)
      // (Chris, November 17: flat and still. The river's texture has waves painted in it, which read as water running
      // downhill between the trees: so mostly one even colour, a little of the texture laid large, and nothing moving)
      vec3 wt = texture(layers, vec3(vW.xz / (zi == 4 ? 64.0 : 300.0), zi == 4 ? 24.0 : 15.0)).rgb;
      vec3 wc = zi == 4 ? moonlitTex(wt * uTint[24], vec3(0.0, 1.0, 0.0), sv) : water(mix(vec3(0.07, 0.19, 0.36), wt * vec3(1.1, 1.2, 1.35), 0.3), vW, vDepth, 0.08, 0.0) * (0.62 + 0.38 * sv.x);
      c = mix(c * (1.0 - 0.3 * smoothstep(0.18, 0.42, g.a)), wc, wet);` : `
      vec3 c = g.rgb * (0.9 + 0.2 * n2(vW.xz * 0.35));
      c = mix(c, mix(vec3(0.40, 0.40, 0.44), c * 0.62, 0.45), steep);
      c = moonlit(mooded(c, vW, 0.8 * (1.0 - steep)), n, sv);
      c = mix(c, water(vec3(0.07, 0.2, 0.34), vW, vDepth, 0.08, 0.0), wet);`}
      gl_FragColor = vec4(finish(c, vW, vDepth, 1.0), 1.0);
    }`;
  const SEA_V = 'varying vec3 vW; varying float vDepth; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }';
  // the sea: a flat sheet at sea level, wearing Chris's two sea textures (the shallow one by the shores, the deep one beyond)
  const seaF = (tex) => `
    ${tex ? 'precision highp sampler2DArray; uniform sampler2DArray layers;' : ''}
    varying vec3 vW; varying float vDepth;
    ${FINISH}
    void main() {
      vec2 at = vec2((vW.x + ${AW / 2}.0) / ${AW}.0, (vW.z + ${AH / 2}.0) / ${AH}.0);
      float inMap = step(0.0, at.x) * step(at.x, 1.0) * step(0.0, at.y) * step(at.y, 1.0);
      vec2 e3 = min(at, 1.0 - at); float inner3 = smoothstep(0.0, 0.03, min(e3.x, e3.y * 1.5)) * inMap;
      vec4 sd = texture2D(shades, clamp(at, 0.0, 1.0));
      float d = mix(1.0, sd.r, inner3); // 0 at the shore, 1 in the deep (and past the map's edge)
      ${tex ? `
      // (the textures drift; the deep one is laid twice, crossing, at two sizes, so its repeat doesn't show)
      vec2 d1 = uTime * vec2(1.6, 0.9), d2 = uTime * vec2(-0.9, 1.3);
      // (Chris's sea made to be seen from high up: one square covers 4 km, and again 11 km, crossing)
      vec3 sh = texture(layers, vec3((vW.xz + d1) / 210.0, 13.0)).rgb * 0.7;
      vec3 dp = 0.5 * (texture(layers, vec3((vW.xz + d1) / 420.0, 14.0)).rgb + texture(layers, vec3((mat2(0.8, -0.6, 0.6, 0.8) * vW.xz + d2) / 1100.0, 14.0)).rgb);
      vec3 base = mix(sh, dp * vec3(1.04, 1.08, 1.16), smoothstep(0.0, 0.7, d));` : `
      vec3 base = mix(vec3(0.10, 0.36, 0.46), vec3(0.035, 0.085, 0.22), smoothstep(0.0, 0.75, d));`}
      // the sea bed showing pale through the shallowest water
      base = mix(vec3(0.22, 0.44, 0.43), base, smoothstep(0.0, 0.13, d) * 0.75 + 0.25);
      vec3 c = water(base, vW, vDepth, 1.0, 1.0) * (0.7 + 0.3 * mix(1.0, sd.g, inner3)); // (the cliffs' shadows lie on it)
      // (Chris, November 17: no bands of surf rolling in along the coasts. Only the water's own pale edge where it
      // meets the land, soft and unmoving)
      c = mix(c, vec3(0.62, 0.74, 0.82), (1.0 - smoothstep(0.0, 0.03, d)) * 0.35 * inMap);
      gl_FragColor = vec4(finish(c, vW, vDepth, 1.0), 1.0);
    }`;
  // trees and buildings. Three sorts: a simple tree shape drawn thousands of times, each with its own colour; one mesh
  // of buildings with a colour per corner; and (MODEL) Chris's tree models, with their own colours, tinted per tree
  const THING_V = `
    #if defined(MODEL) || !defined(USE_INSTANCING_COLOR)
      attribute vec3 acolor;
    #endif
    varying vec3 vC, vW, vN; varying float vDepth;
    void main() {
      #ifdef USE_INSTANCING
        mat4 mm = modelMatrix * instanceMatrix;
      #else
        mat4 mm = modelMatrix;
      #endif
      #ifdef MODEL
        vC = acolor * instanceColor; vN = normalize(mat3(mm) * normal);
      #else
        vN = vec3(0.0, 1.0, 0.0);
        #ifdef USE_INSTANCING_COLOR
          vC = instanceColor;
        #else
          vC = acolor;
        #endif
      #endif
      vec4 w = mm * vec4(position, 1.0);
      vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
    }`;
  const THING_F = `
    uniform float uMood;
    varying vec3 vC, vW, vN; varying float vDepth;
    ${FINISH}
    void main() {
      #ifdef MODEL
        // a model's own directions; a leaf is lit on whichever side is seen, and a little from above always
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        n = normalize(n + vec3(0.0, 0.55, 0.0));
      #else
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      #endif
      gl_FragColor = vec4(finish(moonlit(mooded(vC, vW, uMood), n, shadeAt(vW)), vW, vDepth, 0.0), 1.0);
    }`;
  // the buildings: walls and roofs wearing the 3D game's own textures (tex), or their average colours where the phone
  // can't hold the textures
  const buildV = (tex) => `
    attribute vec3 buv, ${tex ? 'btint' : 'acolor'};
    varying vec3 vW, vUv, vT; varying float vDepth;
    void main() { vUv = buv; vT = ${tex ? 'btint' : 'acolor'}; vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const buildF = (tex) => `
    ${tex ? 'precision highp sampler2DArray; uniform sampler2DArray blayers;' : ''}
    uniform float uMood;
    varying vec3 vW, vUv, vT; varying float vDepth;
    ${FINISH}
    void main() {
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      vec2 sv = shadeAt(vW); float l = dot(n, uMoon);
      // (lit more gently than the ground: on a real graphics card the walls and roofs were washing out to white and pink)
      vec3 c = ${tex ? 'mooded(texture(blayers, vUv).rgb * 1.35 * vT, vW, uMood) * (vec3(0.8, 0.84, 0.98) * (0.62 + 0.38 * sv.y) + vec3(0.8) * max(l, 0.0) * sv.x)' : 'moonlit(mooded(vT, vW, uMood), n, sv)'};
      gl_FragColor = vec4(finish(c, vW, vDepth, 0.0), 1.0);
    }`;
  // a walking place's own ground, as the game lays it: cobbles, earth and paving over its grass, and its water lying
  // still (puv: across, down, and how far in from the patch's edge; the edge is ragged, so it melts into the land)
  const PG_V = `
    attribute vec3 puv; varying vec3 vW, vP; varying float vDepth;
    void main() { vP = puv; vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const pgF = (tex, land) => `
    ${tex ? 'precision highp sampler2DArray; uniform sampler2DArray players;' : ''}
    ${land ? 'uniform sampler2DArray layers; uniform vec3 uGT, uGT25, uGT26; uniform vec4 uG;' : ''}
    uniform sampler2D pgrounds; uniform vec4 uTile, uL, uRep; uniform vec3 uT0, uT1, uT2, uT3; uniform float uMood, uIce;
    varying vec3 vW, vP; varying float vDepth;
    ${FINISH}
    vec3 lay(float l, float r, vec3 t) { return ${tex ? 'texture(players, vec3(vW.xz * r, l)).rgb * t' : 't'}; }
    void main() {
      if (smoothstep(0.5, 7.0, vP.z) < 0.1 + 0.85 * fbm(vW.xz * 0.23)) discard;
      vec2 uv = uTile.xy + clamp(vP.xy, 0.004, 0.996) * uTile.zw;
      vec3 sp = texture2D(pgrounds, uv).rgb; float wet = texture2D(pgrounds, uv + vec2(0.0, uTile.w)).r;
      vec3 a = lay(uL.y, uRep.y, uT1);
      a = mix(a, lay(uL.z, uRep.z, uT2), smoothstep(0.2, 0.62, sp.g));
      a = mix(a, lay(uL.x, uRep.x, uT0), smoothstep(0.2, 0.62, sp.r));
      a = mix(a, lay(uL.w, uRep.w, uT3), smoothstep(0.2, 0.62, sp.b));
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); vec2 sv = shadeAt(vW);
      // where the place's ground has to climb or drop steeply to meet the land, bare rock
      float steep = 1.0 - smoothstep(0.5, 0.78, abs(n.y)); a = mix(a, vec3(0.34, 0.34, 0.4) * (0.8 + 0.4 * n2(vW.xz * 0.9 + vW.y * 1.7)), steep); wet *= 1.0 - steep;
      // (lit as the buildings are: these are the game's own textures, paler than the map's night-painted ground)
      float l = dot(n, uMoon);
      vec3 c = ${tex ? 'mooded(a, vW, uMood) * (vec3(0.8, 0.84, 0.98) * (0.62 + 0.38 * sv.y) + vec3(0.75) * max(l, 0.0) * sv.x)' : 'moonlit(mooded(a, vW, uMood), n, sv)'};
      ${land ? `
      // in zones 1 and 2 its grass is the map's own ground for where it stands (uG: the texture, how fine it is laid,
      // how much of the region's look it takes, and 1 for drifts of meadow and clover), with tufts and flower specks;
      // only what is made (paths, cobbles, paving) and a little of its own colour in its middle come from the game
      if (uG.x > -0.5) {
        // (its paths and cobbles a little greyer and darker here: under the violet night they were turning pink)
        float cl = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(c, vec3(cl) * vec3(0.96, 0.93, 1.0), 0.45) * 0.88;
        vec2 p = vW.xz * uG.y;
        vec3 gr = mix(texture(layers, vec3(p / 96.0, uG.x)).rgb, texture(layers, vec3(p / 21.0 + 0.11, uG.x)).rgb, 0.5) * uGT;
        float m1 = fbm(vW.xz * 0.021 + 4.0), m2 = fbm(vW.xz * 0.034 + 11.0);
        if (uG.w > 0.5) {
          gr = mix(gr, texture(layers, vec3(p / 70.0, 25.0)).rgb * uGT25, smoothstep(0.42, 0.6, m1) * 0.85);
          gr = mix(gr, texture(layers, vec3(p / 60.0, 26.0)).rgb * uGT26, smoothstep(0.52, 0.66, m2) * 0.8);
        }
        gr *= 0.8 + 0.42 * fbm(vW.xz * 0.075 + 1.5);
        gr *= 1.0 - 0.38 * smoothstep(0.22, 0.5, n2(vW.xz * 0.9) * n2(vW.xz * 2.3 + 3.0));
        gr += vec3(0.5, 0.48, 0.3) * smoothstep(0.86, 0.93, n2(vW.xz * 3.1 + 7.0)) * smoothstep(0.45, 0.6, m2);
        gr = mix(gr, vec3(0.34, 0.34, 0.4), steep);
        float made = clamp(max(max(smoothstep(0.2, 0.62, sp.r), smoothstep(0.2, 0.62, sp.g)), smoothstep(0.2, 0.62, sp.b)), 0.0, 1.0);
        c = mix(moonlitTex(mooded(gr, vW, uG.z), n, sv), c, mix(0.22 * smoothstep(6.0, 24.0, vP.z), 1.0, made));
      }` : ''}
      vec3 wc = uIce > 0.5 ? moonlit(vec3(0.62, 0.74, 0.86), vec3(0.0, 1.0, 0.0), sv) : water(vec3(0.07, 0.19, 0.34), vW, vDepth, 0.08, 0.0) * (0.62 + 0.38 * sv.x);
      c = mix(c, wc, smoothstep(0.35, 0.6, wet));
      gl_FragColor = vec4(finish(c, vW, vDepth, 1.0), 1.0);
    }`;
  // everything solid in a walking place, as the game builds it (pinfo: its texture, how many times that repeats in a
  // map unit, 1 if it gives light; ptint: its colour). The texture is laid on by which way each face looks
  const SOLID_V = `
    attribute vec3 pinfo, ptint; varying vec3 vW, vI, vT; varying float vDepth;
    void main() { vI = pinfo; vT = ptint; vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const solidF = (tex) => `
    ${tex ? 'precision highp sampler2DArray; uniform sampler2DArray players;' : ''}
    uniform float uMood;
    varying vec3 vW, vI, vT; varying float vDepth;
    ${FINISH}
    void main() {
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW))), an = abs(n), q = vW * vI.y;
      vec2 uv = an.y > 0.55 ? q.xz : (an.x > an.z ? q.zy : q.xy);
      vec3 t = ${tex ? 'vI.x < -0.5 ? vec3(0.8) : texture(players, vec3(uv, floor(vI.x + 0.5))).rgb * 1.35' : 'vec3(0.8)'};
      vec2 sv = shadeAt(vW); float l = dot(n, uMoon);
      vec3 c = mooded(t * vT, vW, uMood) * (vec3(0.8, 0.84, 0.98) * (0.62 + 0.38 * sv.y) + vec3(0.8) * max(l, 0.0) * sv.x);
      if (vI.z > 0.5) c = vT * (1.0 + 0.3 * uGlow);
      gl_FragColor = vec4(finish(c, vW, vDepth, 0.0), 1.0);
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

  // how much is drawn: 'phone' (what a Pixel 7a runs well) or 'laptop' (twice the land's squares each way, about
  // twice the trees with fuller shapes, the ground textures twice as sharp).
  // models: how many of the nearest trees are drawn as Chris's detailed tree models (near), as the middle models made
  // from them at about a quarter of the detail (mid), and as his light ones (far): the detailed once the view is closer
  // than nearZoom, the middle from 3 to 3.5 times as far off (midZoom), the light from zoom; looking no farther than
  // reach for them
  const DETAIL = {
    phone: { placeStep: 2, placeFar: 1300, squares: [576, 384], pieces: [4, 4], treeGap: 8.5, treeFar: 3900, layer: 256, sharp: 1.75, pine: [5, 2], leaf: [6, 1],
      models: { near: 56, mid: 400, far: 700, nearZoom: 360, midZoom: 1080, zoom: 1300, reach: 520 } },
    laptop: { placeStep: 1, placeFar: 3200, squares: [1152, 768], pieces: [8, 8], treeGap: 6, treeFar: 5000, treeFull: 1500, patches: [12, 8], layer: 512, sharp: 2, pine: [7, 3], leaf: [7, 2],
      models: { near: 150, mid: 1600, far: 3200, nearZoom: 560, midZoom: 1960, zoom: 2000, reach: 900 } },
  };
  function create(host, opts) {
    const P = window.MapPlaces, art = opts.art, detail = DETAIL[opts.detail] ? opts.detail : 'phone', LV = DETAIL[detail];
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    let pr = Math.min(window.devicePixelRatio || 1, LV.sharp);
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
    const landH = (ax, ay) => (Hf ? rawHeight(ax, ay) * EXAG : 0); // the land's own height, in scene units; below 0 is under the sea
    // ---- the walking places as the game builds them (map/place-models.js, made by tools/make-places.mjs): each keeps
    // its own ground, laid over the land where the place stands, 0.75 map units to a metre like the trees ----
    const PM = window.MAP_PLACE_MODELS || null, PL = [], PK = 0.75;
    async function unpackPlaces() {
      if (!PM || !PM.packed || typeof DecompressionStream === 'undefined') return null;
      const b = atob(PM.packed), raw = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) raw[i] = b.charCodeAt(i);
      return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    function setPlaces(buf) {
      const kx = 0.04 * PK, kz = 0.05 * PK;
      for (const [id, m] of Object.entries(PM.places)) {
        const p = P.PLACES[id]; if (!p) continue;
        const [nx, nz] = m.grid, H = new Int16Array(buf, m.h, (nx + 1) * (nz + 1));
        const a = { id, m, buf, at: p.at, nx, nz, H, x0: p.at[0] + (m.rect[0] - 768) * kx, y0: p.at[1] + (m.rect[1] - 512) * kz, x1: p.at[0] + (m.rect[2] - 768) * kx, y1: p.at[1] + (m.rect[3] - 512) * kz };
        let lo = 1e9; for (let i = 0; i < H.length; i++) lo = Math.min(lo, H[i]);
        // its ground meets the land at the place's middle, and none of it lies under the sea
        a.base = Math.max(Math.max(landH(p.at[0], p.at[1]), 0.5) - m.mid / 100 * PK, 0.4 - lo / 100 * PK);
        a.gh = (ax, ay) => { // the game's ground there, in scene units
          const fx = clamp((ax - a.x0) / (a.x1 - a.x0) * nx, 0, nx - 0.001), fy = clamp((ay - a.y0) / (a.y1 - a.y0) * nz, 0, nz - 0.001), x = fx | 0, y = fy | 0, tx = fx - x, ty = fy - y, i = y * (nx + 1) + x;
          return a.base + ((H[i] * (1 - tx) + H[i + 1] * tx) * (1 - ty) + (H[i + nx + 1] * (1 - tx) + H[i + nx + 2] * tx) * ty) / 100 * PK;
        };
        // how far in from its edge: the edge runs round the corners, so a place is never a plain rectangle on the land
        const cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2, hx = (a.x1 - a.x0) / 2, hy = (a.y1 - a.y0) / 2, RR = Math.min(hx, hy) * 0.55;
        a.edge = (ax, ay) => { const qx = Math.abs(ax - cx) - (hx - RR), qy = Math.abs(ay - cy) - (hy - RR); return RR - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0); };
        a.meet = Math.min(a.x1 - a.x0, a.y1 - a.y0) > 100 ? 24 : 13; // over how many units its ground comes to meet the land's (longer for the wide places)
        PL.push(a);
      }
    }
    const placeAt = (ax, ay) => { for (const a of PL) if (ax > a.x0 && ax < a.x1 && ay > a.y0 && ay < a.y1) return a; return null; };
    // the ground's height: the land's, and inside a walking place the place's own (the two meet over its outer few units)
    const heightAt = (ax, ay) => { const h = landH(ax, ay), a = placeAt(ax, ay); return a ? h + (a.gh(ax, ay) - h) * sstep(5, a.meet, a.edge(ax, ay)) : h; };
    // the land's sheet: under a walking place it drops a little below the place's ground, out of its way
    const sheetH = (ax, ay, s) => {
      const h = landH(ax, ay), a = placeAt(ax, ay); if (!a) return h;
      const d = a.edge(ax, ay); if (d < 3) return h;
      let lo = h; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) lo = Math.min(lo, heightAt(ax + i * s, ay + j * s));
      return h + (lo - 1.2 - h) * sstep(3, 10, d);
    };
    const groundAt = (ax, ay) => Math.max(0, heightAt(ax, ay)); // what a thing would stand on (the sea's top, at sea)
    const kindAt = (ax, ay) => (Kd ? Kd[clamp(Math.floor(ay / DS), 0, DH - 1) * DW + clamp(Math.floor(ax / DS), 0, DW - 1)] : 0);
    const W3 = (ax, ay, lift) => new THREE.Vector3(ax - AW / 2, groundAt(ax, ay) + (lift || 0), ay - AH / 2);

    const uniforms = {
      zones: { value: null }, uOpen: { value: new THREE.Vector4() }, uHere: { value: new THREE.Vector4() },
      uMoon: { value: MOON }, uFog: { value: FOG }, uMist: { value: MIST },
      uTime: { value: 0 }, uFogNear: { value: 0 }, uFogFar: { value: 1 }, uGlow: { value: 0 }, uViolet: { value: 1 },
      moods: { value: null }, hazes: { value: null }, shades: { value: null }, uEye: { value: null }, uMood: { value: 0.85 },
      uMistAmt: { value: 1 }, // 1: mist over the closed zones; 0: none (map.mist(0), to see the whole land)
      uPierce: { value: 0.55 }, // how far tall things stand out of the mist (buildings: 1, and half the mist)
    };
    uniforms.uEye.value = camera.position;
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

    // ---- each region's own look: what grows there is tinted, and its low ground hazed, as its walking places are in
    // the game (map/moods.js). Between places the looks blend; far from any (the east, the islands) nothing changes ----
    function moodTextures() {
      const MW = 192, MH = 128, moods = new Uint8Array(MW * MH * 4), hazes = new Uint8Array(MW * MH * 4), M = window.MAP_MOODS || {};
      const lum = (c) => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, base = lum([0.42, 0.43, 0.56]);
      const spots = Object.entries(P.PLACES).filter(([id]) => M[id]).map(([id, p]) => {
        const m = M[id], dim = Math.pow(lum(m.moon) / base, 0.75); // a darker moon there: darker ground
        // (the differences are made a little stronger than in the game, so they read from this height)
        return { x: p.at[0], y: p.at[1], tint: m.grow.map((v) => clamp((1 + (v - 1) * 1.8) * dim, 0.3, 1.9)), fog: m.fog, zone: p.zone };
      });
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const ax = (x + 0.5) * AW / MW, ay = (y + 0.5) * AH / MH; let wt = 0.012, t = [0.012, 0.012, 0.012], f = [0, 0, 0], wf = 1e-6;
        for (const sp of spots) { const d = Math.hypot(ax - sp.x, ay - sp.y), w = Math.exp(-d * d / (2 * 240 * 240)) + 0.02 / (1 + d * d / 90000); wt += w; wf += w; for (let c = 0; c < 3; c++) { t[c] += w * sp.tint[c]; f[c] += w * sp.fog[c]; } }
        const i = (y * MW + x) * 4, near = clamp((wt - 0.012) * 3.5, 0, 1);
        for (let c = 0; c < 3; c++) { moods[i + c] = clamp(t[c] / wt / 2, 0, 1) * 255; hazes[i + c] = clamp(f[c] / wf * 2.2, 0, 1) * 255; }
        moods[i + 3] = 255; hazes[i + 3] = near * 255;
      }
      const tex = (d) => { const t = new THREE.DataTexture(d, MW, MH, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
      uniforms.moods.value = tex(moods); uniforms.hazes.value = tex(hazes);
    }
    // the made ground textures: one picture of twenty-four squares (art/LABELS.md), cut into a stack of layers that each repeat
    async function loadLayers(url, size, per) {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('no ground textures')); i.src = url; });
      const PER = per || 4, L = size || LV.layer, cell = img.width / PER, n = Math.round(img.height / cell) * PER, data = new Uint8Array(L * L * 4 * n);
      const c = document.createElement('canvas'); c.width = c.height = L; const g = c.getContext('2d', { willReadFrequently: true });
      for (let i = 0; i < n; i++) { g.drawImage(img, (i % PER) * cell, Math.floor(i / PER) * cell, cell, cell, 0, 0, L, L); data.set(g.getImageData(0, 0, L, L).data, i * L * L * 4); }
      const t = new THREE.DataTexture2DArray(data, L, L, n);
      t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true;
      return t;
    }

    // ---- the land ----
    const landMeshes = [], stats = { trees: 0, houses: 0, detail };
    let GT = null; // the ground textures' tables, for the walking places' grass
    let layers = null; // the made ground textures, stacked (WebGL 2), or null: flat colours
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
      // the moon's shadows and the valleys' shade, worked out once from the land's shape (green and blue beside the
      // sea's depth in red). Shadow: from each spot, look toward the moon; if the land between stands higher than the
      // line to it, the spot is in shadow (softly, by how far above). Shade: how far a spot lies below the ground round it
      {
        const N = DW * DH, G = new Float32Array(N); for (let i = 0; i < N; i++) G[i] = Math.max(Hf[i], 0) * EXAG; // the ground, or the sea's top
        const mh = Math.hypot(MOON.x, MOON.z), sx = MOON.x / mh, sy = MOON.z / mh, climb = MOON.y / mh * DS; // per data pixel walked toward the moon
        const RING = [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, 2], [2, -2], [-2, -2], [7, 0], [-7, 0], [0, 7], [0, -7]];
        for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
          const i = y * DW + x, h0 = G[i]; let over = 0;
          for (let st = 1; st <= 30; st++) {
            const d = st * 1.6, px = Math.round(x + sx * d), py = Math.round(y + sy * d); if (px < 0 || py < 0 || px >= DW || py >= DH) break;
            const ex = (G[py * DW + px] - (h0 + 1.5 + d * climb)) / (2 + d * 0.5); if (ex > over) { over = ex; if (over >= 1) break; }
          }
          let round = 0; for (const [dx, dy] of RING) round += G[clamp(y + dy, 0, DH - 1) * DW + clamp(x + dx, 0, DW - 1)] / RING.length;
          dep[i * 4 + 1] = (1 - clamp(over, 0, 1)) * 255; dep[i * 4 + 2] = clamp(1 - Math.max(0, round - h0) / 34, 0, 1) * 255;
        }
        // softened once, so a shadow's edge isn't a row of squares
        const tmp = new Uint8Array(N);
        for (const c of [1, 2]) { for (let y = 1; y < DH - 1; y++) for (let x = 1; x < DW - 1; x++) { const i = y * DW + x; tmp[i] = (dep[i * 4 + c] * 4 + dep[(i - 1) * 4 + c] + dep[(i + 1) * 4 + c] + dep[(i - DW) * 4 + c] + dep[(i + DW) * 4 + c]) >> 3; } for (let i = DW; i < N - DW; i++) if (i % DW && (i + 1) % DW) dep[i * 4 + c] = tmp[i]; }
      }
      const depths = new THREE.DataTexture(dep, DW, DH, THREE.RGBAFormat); depths.magFilter = depths.minFilter = THREE.LinearFilter; depths.needsUpdate = true;
      uniforms.shades.value = depths;
      // the kind of ground at each spot, for the textures (read exactly, pixel by pixel). Under a river or a lake it is
      // the kind of the nearest land (the water is drawn over it, to its own smooth edge); under the sea's edge, sand
      const kd = new Uint8Array(DW * DH * 4);
      {
        const kk = Uint8Array.from(Kd), wetK = (v) => v === KIND.river || v === KIND.lake;
        for (let pass = 0; pass < 120; pass++) { let left = 0; const next = Uint8Array.from(kk);
          for (let y = 1; y < DH - 1; y++) for (let x = 1; x < DW - 1; x++) { const i = y * DW + x; if (!wetK(kk[i])) continue; let got = 0; for (const j of [i - 1, i + 1, i - DW, i + DW]) if (kk[j] > KIND.lake) { got = kk[j]; break; } if (got) next[i] = got; else left++; }
          kk.set(next); if (!left) break; }
        for (let i = 0; i < DW * DH; i++) { kd[i * 4] = kk[i] <= KIND.lake ? KIND.sand : kk[i]; kd[i * 4 + 3] = 255; }
      }
      const kinds = new THREE.DataTexture(kd, DW, DH, THREE.RGBAFormat); kinds.magFilter = kinds.minFilter = THREE.NearestFilter; kinds.needsUpdate = true;
      // which texture layer each kind of ground wears (art/LABELS.md), and how much of its region's tint it takes
      // (what grows takes it all; sand, rock and snow a little)
      // (what grows takes it all; sand, rock and snow a little). Grass, woods and fields change with the zone: zone 2's
      // flowered grass; zone 3's frosted heather, frosted firs and bracken; zone 4's frost meadow, snow-laden firs,
      // frosted undergrowth and frost moor. Each row: no zone, zones 1 to 4
      const LAYER = [[5], [12], [15], [0, 0, 0, 19, 20], [1, 1, 1, 21, 22], [2, 2, 16, 17, 18], [3, 3, 3, 3, 23], [4], [5], [6], [7], [8], [10]].map((r) => (r.length === 1 ? Array(5).fill(r[0]) : r)).flat();
      const MOODW = [0.3, 0.5, 0.5, 1, 1, 1, 0.8, 1, 0.3, 0.35, 0.3, 0.45, 0.4];
      // (the made textures are painted by night, at different brightnesses, and all lean blue: this evens them and gives
      // each its own colour back, so the dark pine wood, the pale beach and the red mesas sit together). By layer
      const TINT = new Float32Array([[1.8, 2.1, 1.7], [1.7, 1.9, 1.45], [1.25, 1.48, 1.02], [1.38, 1.3, 1.06], [1.5, 1.58, 1.28], [0.65, 0.62, 0.56], [1.27, 1.18, 0.76], [1.45, 1.0, 0.7],
        [0.94, 0.89, 0.83], [1.25, 1.25, 1.25], [1.22, 1.08, 0.93], [0.96, 0.96, 0.96], [1.25, 1.25, 1.25], [1.25, 1.25, 1.25], [1.25, 1.25, 1.25], [1.25, 1.25, 1.25],
        [2.1, 2.4, 1.8], [1.5, 1.5, 1.42], [1.7, 1.85, 1.65], [1.5, 1.75, 1.3], [0.95, 0.9, 0.82], [1.55, 1.45, 1.35], [1.45, 1.6, 1.6], [1.7, 1.65, 1.55],
        [1.0, 1.02, 1.05], [1.35, 1.6, 1.1], [1.3, 1.7, 1.15]].flat());
      // the sheet, in pieces (so what's off the screen isn't drawn): 576 x 384 squares on a phone, 1152 x 768 on a laptop
      const [PX, PY] = LV.pieces, nx = LV.squares[0] / PX, ny = LV.squares[1] / PY, pw = AW / PX, ph = AH / PY;
      GT = { LAYER, MOODW, TINT };
      const mat = material(LAND_V, landF(!!layers), { ground: { value: ground }, kinds: { value: kinds }, layers: { value: layers }, uLayer: { value: LAYER }, uMoodW: { value: MOODW }, uTint: { value: TINT } });
      for (let q = 0; q < PX * PY; q++) {
        const qx = (q % PX) * pw, qy = Math.floor(q / PX) * ph;
        const g = new THREE.PlaneGeometry(pw, ph, nx, ny); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position, nrm = new Float32Array(p.count * 3), v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          const ax = p.getX(i) + pw / 2 + qx, ay = p.getZ(i) + ph / 2 + qy;
          const s = AW / LV.squares[0];
          p.setXYZ(i, ax - AW / 2, sheetH(ax, ay, s), ay - AH / 2);
          const dx = landH(ax + s, ay) - landH(ax - s, ay), dz = landH(ax, ay + s) - landH(ax, ay - s);
          v.set(-dx, 2 * s, -dz).normalize(); nrm.set([v.x, v.y, v.z], i * 3);
        }
        g.deleteAttribute('normal'); g.deleteAttribute('uv');
        g.setAttribute('snormal', new THREE.BufferAttribute(nrm, 3)); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, mat); scene.add(mesh); landMeshes.push(mesh);
      }
      // the sea: one flat sheet at sea level, far past the map's edges
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), material(SEA_V, seaF(!!layers), { layers: { value: layers }, uViolet: { value: 0.35 } }));
      sea.rotation.x = -Math.PI / 2; scene.add(sea);
    }

    // ---- the trees: stood where the forests are, in patches of the map so the far ones needn't be drawn ----
    const treePatches = [], treeCells = [], CELL = 96, CELLS = Math.ceil(AW / CELL);
    const TM = new THREE.Matrix4(), TQ = new THREE.Quaternion(), TUP = new THREE.Vector3(0, 1, 0), TS = new THREE.Vector3(), TT = new THREE.Vector3();
    // where a tree's simple shape stands (hide: shrunk to nothing, while one of Chris's models stands there instead)
    const shapeMatrix = (t, hide) => TM.compose(TT.set(t.ax - AW / 2, t.y - 0.3, t.ay - AH / 2), TQ.setFromAxisAngle(TUP, t.ry), hide ? TS.set(0, 0, 0) : TS.set(t.size, t.size * (t.pine ? 1.15 : 1), t.size));
    function buildTrees() {
      const R = rng(1911), SP = LV.treeGap, [CX, CY] = LV.patches || [6, 4], cw = AW / CX, chh = AH / CY;
      const lists = { pine: [], leafy: [], bare: [] }; for (const k in lists) for (let i = 0; i < CX * CY; i++) lists[k].push([]);
      // how likely a tree stands on each kind of ground, and how likely that tree is a pine
      const ODDS = { [KIND.pine]: [0.95, 0.9], [KIND.leafy]: [0.9, 0.12], [KIND.fen]: [0.34, 0.2], [KIND.grass]: [0.05, 0.4], [KIND.farm]: [0.02, 0.2], [KIND.rock]: [0.1, 0.9], [KIND.sand]: [0.02, 0.3], [KIND.desert]: [0.012, 0.2], [KIND.mesa]: [0.02, 0.5], [KIND.snow]: [0.02, 1] };
      for (let gy = 0; gy < AH / SP; gy++) for (let gx = 0; gx < AW / SP; gx++) {
        const ax = (gx + R()) * SP, ay = (gy + R()) * SP, r1 = R(), r2 = R(), r3 = R(), r4 = R();
        if (ax < 12 || ay < 12 || ax > AW - 12 || ay > AH - 12) continue;
        const k = kindAt(ax, ay), o = ODDS[k]; if (!o || r1 > o[0] || cleared(ax, ay)) continue;
        const h = rawHeight(ax, ay); if (h < 0.9) continue;
        // not on a cliff face, and thinning out up the mountains
        const slope = Math.hypot(rawHeight(ax + 6, ay) - rawHeight(ax - 6, ay), rawHeight(ax, ay + 6) - rawHeight(ax, ay - 6)) / 12;
        if (slope > 0.85 || (k === KIND.rock && h > 150) || (k === KIND.snow && h > 120)) continue;
        const pine = r2 < o[1], size = 0.75 + r3 * 0.6, fen = k === KIND.fen, dry = k === KIND.desert || k === KIND.mesa;
        let c = pine ? [0.07 + r4 * 0.05, 0.22 + r4 * 0.1, 0.15 + r4 * 0.05] : fen ? [0.30 + r4 * 0.1, 0.42 + r4 * 0.08, 0.2] : dry ? [0.36, 0.42 + r4 * 0.06, 0.2] : [0.16 + r4 * 0.1, 0.4 + r4 * 0.14, 0.13 + r4 * 0.05];
        // the zones' own trees (the edge between zones ragged, as on the ground): zone 2's brighter leaves; zone 3's
        // frosted firs and rust-and-heather brush; zone 4's firs under snow
        const zone = World.bandAt(ax + (hash2(gx >> 3, gy >> 3) - 0.5) * 110, ay + (hash2(gy >> 3, gx >> 3) - 0.5) * 110);
        if (zone === 2 && !pine) c = [0.17 + r4 * 0.08, 0.46 + r4 * 0.14, 0.24 + r4 * 0.08];
        else if (zone === 3) c = pine ? [0.2 + r4 * 0.1, 0.36 + r4 * 0.1, 0.36 + r4 * 0.1] : r4 < 0.5 ? [0.36 + r4 * 0.16, 0.27, 0.22] : [0.3, 0.25 + r4 * 0.08, 0.34];
        else if (zone === 4) c = pine ? [0.56 + r4 * 0.16, 0.66 + r4 * 0.14, 0.86] : [0.5 + r4 * 0.1, 0.6 + r4 * 0.1, 0.6];
        // which of Chris's trees it is, seen close: by its ground, its zone, and whether water is by
        const r5 = hash2(gx * 1.37 + 3.1, gy * 2.11 + 1.7), wet = (q) => q === KIND.river || q === KIND.lake;
        const byWater = wet(kindAt(ax + 14, ay)) || wet(kindAt(ax - 14, ay)) || wet(kindAt(ax, ay + 14)) || wet(kindAt(ax, ay - 14));
        const sp = pine ? (zone >= 3 ? (r5 < 0.9 ? 'tree_spruce' : 'tree_snag') : (k === KIND.rock || r5 < 0.38 ? 'tree_ponderosa' : 'tree_spruce'))
          : fen ? (r5 < 0.62 ? 'tree_willow' : r5 < 0.82 ? 'tree_snag' : 'tree_cottonwood')
          : dry ? (r5 < 0.85 ? 'tree_mesquite' : 'tree_snag')
          : zone >= 3 ? (r5 < 0.6 ? 'tree_aspen' : r5 < 0.8 ? 'tree_snag' : 'tree_oak')
          : byWater ? (r5 < 0.55 ? 'tree_cottonwood' : 'tree_willow')
          : (r5 < 0.5 ? 'tree_oak' : r5 < 0.75 ? 'tree_aspen' : 'tree_cottonwood');
        lists[pine ? 'pine' : 'leafy'][clamp(Math.floor(ay / chh), 0, CY - 1) * CX + clamp(Math.floor(ax / cw), 0, CX - 1)].push({ ax, ay, size: size * (dry ? 0.6 : 1), ry: r4 * 6.28, c, pine, sp, zone });
      }
      // the walking places' own trees, each where the game has it (0 leafy, 1 fir, 2 bare and thorny)
      for (const a of PL) {
        const T = a.m.trees, zone = World.bandAt(a.at[0], a.at[1]), fen = kindAt(a.at[0], a.at[1]) === KIND.fen;
        for (let i = 0; i < T.length; i += 4) {
          const ax = a.at[0] + (T[i] - 768) * 0.04 * PK, ay = a.at[1] + (T[i + 1] - 512) * 0.05 * PK, kind = T[i + 3], r4 = hash2(T[i] * 0.37, T[i + 1] * 0.53), r5 = hash2(T[i + 1] * 1.31 + 2.2, T[i] * 0.71 + 5.1);
          if (ax < 12 || ay < 12 || ax > AW - 12 || ay > AH - 12 || heightAt(ax, ay) < 0.3) continue;
          if (r5 > sstep(-2, 12, a.edge(ax, ay)) * (kindAt(ax, ay) <= KIND.lake ? 0 : 1) + (a.edge(ax, ay) > 12 ? 1 : 0)) continue; // thinning out toward the place's edge, so its woods have no straight side; none in the land's own water
          const pine = kind === 1, bare = kind === 2;
          let c = pine ? [0.07 + r4 * 0.05, 0.22 + r4 * 0.1, 0.15 + r4 * 0.05] : fen ? [0.30 + r4 * 0.1, 0.42 + r4 * 0.08, 0.2] : [0.16 + r4 * 0.1, 0.4 + r4 * 0.14, 0.13 + r4 * 0.05];
          if (zone === 2 && !pine) c = [0.17 + r4 * 0.08, 0.46 + r4 * 0.14, 0.24 + r4 * 0.08];
          else if (zone === 3) c = pine ? [0.2 + r4 * 0.1, 0.36 + r4 * 0.1, 0.36 + r4 * 0.1] : r4 < 0.5 ? [0.36 + r4 * 0.16, 0.27, 0.22] : [0.3, 0.25 + r4 * 0.08, 0.34];
          else if (zone === 4) c = pine ? [0.56 + r4 * 0.16, 0.66 + r4 * 0.14, 0.86] : [0.5 + r4 * 0.1, 0.6 + r4 * 0.1, 0.6];
          if (bare) c = zone === 4 ? [0.5, 0.52, 0.56] : [0.24 + r4 * 0.06, 0.22, 0.2];
          const sp = bare ? 'tree_snag' : pine ? (zone < 3 && r5 < 0.3 ? 'tree_ponderosa' : 'tree_spruce') : fen ? (r5 < 0.7 ? 'tree_willow' : 'tree_cottonwood') : zone >= 3 ? (r5 < 0.7 ? 'tree_aspen' : 'tree_oak') : (r5 < 0.55 ? 'tree_oak' : r5 < 0.8 ? 'tree_aspen' : 'tree_cottonwood');
          lists[bare ? 'bare' : pine ? 'pine' : 'leafy'][clamp(Math.floor(ay / chh), 0, CY - 1) * CX + clamp(Math.floor(ax / cw), 0, CX - 1)].push({ ax, ay, size: clamp(T[i + 2] / 100, 0.6, 1.5) * 0.5, ry: r4 * 6.28, c, pine, sp, zone });
        }
      }
      // a pine: two cones, one on the other; a leafy tree: a round crown, a ring of faces under a low cap (both stand on
      // y = 0). Built by hand, a triangle per face, so nothing is drawn that can't be seen
      const ringAt = (r, y, n, i) => [Math.cos(i / n * 6.2832) * r, y, Math.sin(i / n * 6.2832) * r];
      const cone = (r, h, y, n) => { const p = []; for (let i = 0; i < n; i++) p.push(0, y + h, 0, ...ringAt(r, y, n, i + 1), ...ringAt(r, y, n, i)); return p; };
      const band = (r0, y0, r1, y1, n) => { const p = []; for (let i = 0; i < n; i++) { const a = ringAt(r0, y0, n, i), b = ringAt(r0, y0, n, i + 1), c = ringAt(r1, y1, n, i), d = ringAt(r1, y1, n, i + 1); p.push(...a, ...c, ...b, ...b, ...c, ...d); } return p; };
      const shape = (...ps) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([].concat(...ps), 3)); return g; };
      // (the plain shapes: 2 tiers of 5 faces, 10 triangles, and a crown of 18. A laptop's near trees: 3 tiers of 7, 21,
      // and a fuller crown of 49; its far trees are the plain shapes)
      const plain = { pine: shape(cone(3.3, 6.5, 0.6, 5), cone(2.2, 5.5, 4.6, 5)), leafy: shape(band(2.5, 1.0, 3.4, 3.4, 6), cone(3.4, 2.6, 3.4, 6)) };
      // a bare tree (the Thornwood's thorns, a dead tree): a thin trunk and five bare boughs, each two thin blades
      // crossed so it shows from the side and from above (Chris, November 17: from far off they were round purple
      // blobs, the leafy shape in a dead tree's colour)
      const bough = (a, y, len, rise) => { const cx = Math.cos(a), cz = Math.sin(a), tip = [cx * len, y + rise, cz * len], w = 0.42; return [0, y - 0.5, 0, 0, y + 0.6, 0, ...tip, -cz * w, y, cx * w, cz * w, y, -cx * w, ...tip]; };
      plain.bare = shape(cone(0.5, 9.4, 0, 3), bough(0.4, 3.2, 3.6, 2.6), bough(2.5, 4.3, 3.2, 2.9), bough(4.6, 5.3, 2.8, 2.6), bough(1.5, 6.3, 2.2, 2.4), bough(3.6, 7.2, 1.7, 2.0));
      const [ps, pt] = LV.pine, [ls, lb] = LV.leaf;
      const pineGeo = pt === 2 ? plain.pine : shape(cone(3.4, 5.2, 0.5, ps), cone(2.7, 4.6, 3.3, ps), cone(1.8, 4.4, 6.0, ps));
      const leafGeo = lb === 1 ? plain.leafy : shape(band(2.2, 0.8, 3.5, 2.6, ls), band(3.5, 2.6, 3.0, 4.6, ls), band(3.0, 4.6, 1.6, 5.9, ls), cone(1.6, 0.5, 5.9, ls));
      const mat = material(THING_V, THING_F, null, { side: THREE.DoubleSide }), C = new THREE.Color();
      for (const [kind, geo] of [['pine', pineGeo], ['leafy', leafGeo], ['bare', plain.bare]]) for (let ci = 0; ci < CX * CY; ci++) {
        const list = lists[kind][ci]; if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(geo, mat, list.length); let top = 0;
        list.forEach((t, i) => {
          t.y = heightAt(t.ax, t.ay); top = Math.max(top, t.y); t.mesh = mesh; t.i = i;
          mesh.setMatrixAt(i, shapeMatrix(t)); mesh.setColorAt(i, C.setRGB(t.c[0], t.c[1], t.c[2]));
          const cell = Math.floor(t.ax / CELL) + Math.floor(t.ay / CELL) * CELLS; (treeCells[cell] || (treeCells[cell] = [])).push(t);
        });
        mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.frustumCulled = false; // (an instanced mesh's own bounds are its one shape's: the patch is tested below instead)
        const cx = (ci % CX + 0.5) * cw - AW / 2, cz = (Math.floor(ci / CX) + 0.5) * chh - AH / 2;
        mesh.userData.sphere = new THREE.Sphere(new THREE.Vector3(cx, top / 2, cz), Math.hypot(cw, chh) / 2 + top / 2 + 20);
        scene.add(mesh); treePatches.push(mesh); stats.trees += list.length;
        if (LV.treeFull && geo !== plain[kind]) { // the same trees in their plain shapes, drawn instead when the patch is far off
          const far = new THREE.InstancedMesh(plain[kind], mat, list.length); far.instanceMatrix = mesh.instanceMatrix; far.instanceColor = mesh.instanceColor;
          far.frustumCulled = false; far.visible = false; scene.add(far); mesh.userData.far = far;
        }
      }
    }

    // ---- Chris's tree models (map/tree-models.js, from his Forest Builder), for the trees nearest the eye.
    // Far off a tree is its simple shape. As the view comes close, the nearest trees become his light models, then the
    // middle models (about a quarter of the detail, from three times as far off as the detailed), and the very nearest
    // his detailed ones: the same trees, in the same places, tinted to the same colours ----
    // how tall each stands on the map at size 1, in the map's units (trees are drawn about seven times life size, as the
    // simple shapes are, or a forest would be a film of moss at this scale)
    const TALL = { tree_spruce: 12, tree_ponderosa: 13.5, tree_oak: 7.6, tree_cottonwood: 8.8, tree_aspen: 10, tree_willow: 7.2, tree_mesquite: 6.5, tree_snag: 6.5 };
    const models = {}; let chosen = new Map(), lastPick = null, treeQ = 1; const MD = LV.models; // treeQ: the share of the budgets in use (it drops if the frames come slowly)
    function buildModels() {
      const src = window.MAP_TREES; if (!src) return;
      const mat = material(THING_V, THING_F, null, { side: THREE.DoubleSide, defines: { MODEL: '' } }), C = new THREE.Color(1, 1, 1);
      const unpack = (m) => {
        const raw = atob(m.data), bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const n = m.corners, i16 = new Int16Array(bytes.buffer, 0, n * 3), i8 = new Int8Array(bytes.buffer, n * 6, n * 4), u8 = new Uint8Array(bytes.buffer, n * 10, n * 4);
        const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), col = new Float32Array(n * 3);
        for (let i = 0; i < n * 3; i++) pos[i] = i16[i] * m.reach / 32767;
        for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { nrm[i * 3 + c] = i8[i * 4 + c] / 127; col[i * 3 + c] = u8[i * 4 + c] / 255; }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('acolor', new THREE.BufferAttribute(col, 3));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(bytes.buffer, n * 14, m.triangles * 3), 1));
        return g;
      };
      for (const [id, m] of Object.entries(src)) {
        const make = (lod, cap) => { const mesh = new THREE.InstancedMesh(unpack(m[lod]), mat, cap); mesh.setColorAt(0, C); mesh.count = 0; mesh.frustumCulled = false; scene.add(mesh); return mesh; };
        models[id] = { tall: m.tall, leaf: m.near.leaf, near: make('near', MD.near), mid: make('mid', MD.mid), far: make('far', MD.far) };
      }
      stats.treeModels = Object.keys(models).length;
    }
    // where a tree's model stands and what it is tinted: so that its foliage comes out the colour its simple shape has
    function modelMatrix(t) { const sc = TALL[t.sp] * t.size / models[t.sp].tall; return TM.compose(TT.set(t.ax - AW / 2, t.y - 0.1, t.ay - AH / 2), TQ.setFromAxisAngle(TUP, t.ry), TS.set(sc, sc, sc)); }
    function modelTint(t) {
      if (t.tint) return t.tint;
      const leaf = models[t.sp].leaf, snow = t.zone === 4 ? [1.5, 1.6, 1.9] : t.zone === 3 ? [1.05, 1.15, 1.25] : [1, 1, 1];
      if (!leaf) return (t.tint = snow.map((v) => v * 1.25));
      // (as bright as its simple shape, and partway to its colour: all the way would turn a green model strange hues
      // in the cold zones, where the shapes are pale blue)
      const lum = (c) => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15, even = lum(t.c) / lum(leaf), keep = t.zone >= 3 ? 0.35 : 0.7;
      return (t.tint = t.c.map((v, i) => clamp((v / leaf[i] * keep + even * (1 - keep)) * 1.08, 0.3, 5)));
    }
    const PC = new THREE.Color();
    function pickTrees() {
      if (!stats.treeModels) return;
      const cp = camera.position, now = uniforms.uTime.value;
      if (lastPick && (now - lastPick.t < 0.12 || (Math.hypot(cp.x - lastPick.x, cp.y - lastPick.y, cp.z - lastPick.z) < Math.max(2.5, C.dist * 0.04) && Math.abs(C.dist - lastPick.dist) < C.dist * 0.04))) return;
      lastPick = { x: cp.x, y: cp.y, z: cp.z, dist: C.dist, t: now };
      const want = new Map();
      if (C.dist < MD.zoom) {
        // the trees within reach of the camera and of the spot it looks at, nearest the camera first
        const cx = cp.x + AW / 2, cy = cp.z + AH / 2, reach = Math.min(MD.reach, C.dist * 1.1 + 110), r2 = reach * reach;
        const fwx = C.x - cx, fwy = C.y - cy, fl = Math.hypot(fwx, fwy), cand = [];
        const x0 = Math.max(0, Math.floor((Math.min(cx, C.x) - reach) / CELL)), x1 = Math.min(CELLS - 1, Math.floor((Math.max(cx, C.x) + reach) / CELL));
        const y0 = Math.max(0, Math.floor((Math.min(cy, C.y) - reach) / CELL)), y1 = Math.floor((Math.max(cy, C.y) + reach) / CELL);
        for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
          const cell = treeCells[gx + gy * CELLS]; if (!cell) continue;
          for (const t of cell) {
            const dx = t.ax - cx, dy = t.ay - cy, df = (t.ax - C.x) * (t.ax - C.x) + (t.ay - C.y) * (t.ay - C.y);
            if (dx * dx + dy * dy > r2 && df > r2) continue;
            if (fl > 30 && (dx * fwx + dy * fwy) / fl < -25) continue; // behind the camera
            const dh = t.y - cp.y; t.d = dx * dx + dy * dy + dh * dh; cand.push(t);
          }
        }
        cand.sort((a, b) => a.d - b.d);
        const nNear = C.dist < MD.nearZoom ? Math.min(Math.round(MD.near * treeQ), cand.length) : 0, nMid = nNear + (C.dist < MD.midZoom ? Math.round(MD.mid * treeQ) : 0);
        const nAll = Math.min(cand.length, nMid + Math.round(MD.far * treeQ));
        for (let i = 0; i < nAll; i++) want.set(cand[i], i < nNear ? 'near' : i < nMid ? 'mid' : 'far');
      }
      for (const m of Object.values(models)) { m.near.count = 0; m.mid.count = 0; m.far.count = 0; }
      const touched = new Set();
      for (const [t, tier] of want) {
        const mesh = models[t.sp][tier], i = mesh.count++, tint = modelTint(t);
        mesh.setMatrixAt(i, modelMatrix(t)); mesh.setColorAt(i, PC.setRGB(tint[0], tint[1], tint[2])); touched.add(mesh);
        if (!chosen.has(t)) { t.mesh.setMatrixAt(t.i, shapeMatrix(t, true)); touched.add(t.mesh); } // its simple shape steps aside
      }
      for (const t of chosen.keys()) if (!want.has(t)) { t.mesh.setMatrixAt(t.i, shapeMatrix(t)); touched.add(t.mesh); } // and comes back
      for (const mesh of touched) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
      chosen = want; stats.models = { near: 0, mid: 0, far: 0 }; for (const tier of want.values()) stats.models[tier]++;
    }

    // ---- the buildings. Where a walking place has buildings in the 3D game (map/buildings.js, read from the world-3d
    // job's places), they stand here in their true arrangement, each with its own storeys of wall, its ridge or lean-to
    // roof, its chimneys and belfry, wearing the game's own wall and roof textures. Like the trees they are drawn several
    // times life size (BK map units to the metre: a town is about 460 m across on the map, 61 m in the game), or a town
    // would be a speck. The castle and the towns no walking place covers are built the same way, in the same textures ----
    const BK = 0.75, BD = window.MAP_BUILDINGS || { layers: [], places: {} }, BL = (id) => Math.max(0, BD.layers.findIndex((l) => l.id === id));
    // the ground each town stands on is kept clear of trees
    const CLEAR = [];
    for (const [id, list] of Object.entries(BD.places)) {
      const p = P.PLACES[id]; if (!p || !list.length) continue;
      const xs = list.flatMap((b) => [b.fp[0], b.fp[2]]), ys = list.flatMap((b) => [b.fp[1], b.fp[3]]), kx = 0.04 * BK, kz = 0.05 * BK;
      CLEAR.push([p.at[0] + (Math.min(...xs) - 768) * kx - 3, p.at[1] + (Math.min(...ys) - 512) * kz - 3, p.at[0] + (Math.max(...xs) - 768) * kx + 3, p.at[1] + (Math.max(...ys) - 512) * kz + 3]);
    }
    CLEAR.push([2340 - 50, 1240 - 42, 2340 + 50, 1240 + 42]);
    // (a walking place brings its own trees; the land's scattered ones stop a little inside its edge)
    const cleared = (ax, ay) => { const a = placeAt(ax, ay); return !!(a && a.edge(ax, ay) > 5) || clearedTown(ax, ay); };
    const clearedTown = (ax, ay) => CLEAR.some((r) => ax > r[0] && ay > r[1] && ax < r[2] && ay < r[3]);
    function Struct() {
      const pos = [], uv = [], tint = [], flat = [], REP = 2.6, ONE = [1, 1, 1];
      const push = (p, u, v, layer, t) => { pos.push(p[0], p[1], p[2]); uv.push(u / REP, v / REP, layer); tint.push(t[0], t[1], t[2]); const a = (BD.layers[layer] || { avg: [0.3, 0.3, 0.3] }).avg; flat.push(a[0] * t[0] * 2.2, a[1] * t[1] * 2.2, a[2] * t[2] * 2.2); };
      const S = {
        tri(a, b, c, layer, uvs, t) { t = t || ONE; push(a, uvs[0][0], uvs[0][1], layer, t); push(b, uvs[1][0], uvs[1][1], layer, t); push(c, uvs[2][0], uvs[2][1], layer, t); },
        // a four-cornered face; r: the texture's reach over it, [u0, v0, u1, v1] in map units
        quad(a, b, c, d, layer, r, t) { S.tri(a, b, c, layer, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]]], t); S.tri(a, c, d, layer, [[r[0], r[1]], [r[2], r[3]], [r[0], r[3]]], t); },
        // an upright wall from (x0, z0) to (x1, z1), from y0 up to y1
        wall(x0, z0, x1, z1, y0, y1, layer, t) { S.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], layer, [0, y0, Math.hypot(x1 - x0, z1 - z0), y1], t); },
        box(x0, z0, x1, z1, y0, y1, layer, t, top) {
          S.wall(x0, z1, x1, z1, y0, y1, layer, t); S.wall(x1, z1, x1, z0, y0, y1, layer, t); S.wall(x1, z0, x0, z0, y0, y1, layer, t); S.wall(x0, z0, x0, z1, y0, y1, layer, t);
          if (top !== undefined) S.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top, [x0, z0, x1, z1], t);
        },
        // a round tower's wall (r1 at the foot, r0 at the top) and a pointed roof
        drum(x, z, y0, y1, r0, r1, n, layer, t) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; S.quad([x + Math.cos(a) * r1, y0, z + Math.sin(a) * r1], [x + Math.cos(b) * r1, y0, z + Math.sin(b) * r1], [x + Math.cos(b) * r0, y1, z + Math.sin(b) * r0], [x + Math.cos(a) * r0, y1, z + Math.sin(a) * r0], layer, [a * r1, y0, b * r1, y1], t); } },
        cone(x, z, y, r, h, n, layer, t, turn) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + (turn || 0), b = (i + 1) / n * 6.2832 + (turn || 0); S.tri([x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r], [x, y + h, z], layer, [[a * r, 0], [b * r, 0], [(a + b) / 2 * r, Math.hypot(r, h)]], t); } },
        // a house as the 3D game builds one: storeys of wall (levels: [[texture, height]]), then a ridged roof with its two
        // gables, or a lean-to's single slope (roof: [texture, 1 if the ridge runs east-west, rise, overhang, the high side])
        house(x0, z0, x1, z1, base, low, levels, roof, t) {
          let y = base; levels.forEach(([layer, h], i) => { S.box(x0, z0, x1, z1, i ? y : low, y + h, layer, t); y += h; });
          const E = y, top = levels[levels.length - 1][0], [rl, ew, rise, o, lean] = roof, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
          if (lean) {
            const hy = (x, z) => E + rise * (lean === 'n' ? (z1 - z) / d : lean === 's' ? (z - z0) / d : lean === 'w' ? (x1 - x) / w : (x - x0) / w);
            S.quad([x0 - o, hy(x0 - o, z1 + o), z1 + o], [x1 + o, hy(x1 + o, z1 + o), z1 + o], [x1 + o, hy(x1 + o, z0 - o), z0 - o], [x0 - o, hy(x0 - o, z0 - o), z0 - o], rl, lean === 'n' || lean === 's' ? [0, 0, w + 2 * o, Math.hypot(d + 2 * o, rise)] : [0, 0, w + 2 * o, d + 2 * o], t);
            for (const [xa, za, xb, zb] of [[x0, z1, x1, z1], [x1, z1, x1, z0], [x1, z0, x0, z0], [x0, z0, x0, z1]]) S.quad([xa, E, za], [xb, E, zb], [xb, hy(xb, zb), zb], [xa, hy(xa, za), za], top, [0, E, Math.hypot(xb - xa, zb - za), E + rise], t);
          } else if (!ew) { // the ridge runs north-south
            S.tri([x0, E, z1], [x1, E, z1], [cx, E + rise, z1], top, [[0, E], [w, E], [w / 2, E + rise]], t); S.tri([x1, E, z0], [x0, E, z0], [cx, E + rise, z0], top, [[0, E], [w, E], [w / 2, E + rise]], t);
            const sl = rise / (w / 2), ye = E - o * sl, yr = E + rise, len = d + 2 * o, run = Math.hypot(w / 2 + o, rise + o * sl);
            S.quad([x0 - o, ye, z1 + o], [x0 - o, ye, z0 - o], [cx, yr, z0 - o], [cx, yr, z1 + o], rl, [0, 0, len, run], t); S.quad([x1 + o, ye, z0 - o], [x1 + o, ye, z1 + o], [cx, yr, z1 + o], [cx, yr, z0 - o], rl, [0, 0, len, run], t);
          } else {
            S.tri([x1, E, z1], [x1, E, z0], [x1, E + rise, cz], top, [[0, E], [d, E], [d / 2, E + rise]], t); S.tri([x0, E, z0], [x0, E, z1], [x0, E + rise, cz], top, [[0, E], [d, E], [d / 2, E + rise]], t);
            const sl = rise / (d / 2), ye = E - o * sl, yr = E + rise, len = w + 2 * o, run = Math.hypot(d / 2 + o, rise + o * sl);
            S.quad([x1 + o, ye, z0 - o], [x0 - o, ye, z0 - o], [x0 - o, yr, cz], [x1 + o, yr, cz], rl, [0, 0, len, run], t); S.quad([x0 - o, ye, z1 + o], [x1 + o, ye, z1 + o], [x1 + o, yr, cz], [x0 - o, yr, cz], rl, [0, 0, len, run], t);
          }
          // how high the roof stands over a spot (for a chimney)
          return { E, rise, roofY: (x, z) => (lean ? E + rise * 0.5 : !ew ? E + rise * (1 - Math.abs(x - cx) / (w / 2)) : E + rise * (1 - Math.abs(z - cz) / (d / 2))) };
        },
        mesh(material) {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('buv', new THREE.Float32BufferAttribute(uv, 3));
          g.setAttribute('btint', new THREE.Float32BufferAttribute(tint, 3)); g.setAttribute('acolor', new THREE.Float32BufferAttribute(flat, 3));
          g.computeBoundingSphere(); return new THREE.Mesh(g, material);
        },
        get triangles() { return pos.length / 9; },
      };
      return S;
    }
    // the walking places themselves: for each, its ground (a fine sheet over the land) and everything solid in it
    function buildGamePlaces(players, pgrounds) {
      const two = !!players, D = THREE.DoubleSide, lay = PM.layers, per = PM.gper, rows = Math.ceil(Object.keys(PM.places).length / per), GWt = per * PM.gw, GHt = rows * PM.gh * 2;
      const solidMat = material(SOLID_V, solidF(two), { players: { value: players }, uMood: { value: 0.3 }, uViolet: { value: 0.55 } }, { side: D }); // (walls and roofs take less of the violet night than the land: stone was turning bright purple)
      let tris = 0;
      for (const a of PL) {
        const m = a.m, st = LV.placeStep, gx = Math.ceil(a.nx / st), gz = Math.ceil(a.nz / st), zone = World.bandAt(a.at[0], a.at[1]);
        // its ground
        const pos = new Float32Array((gx + 1) * (gz + 1) * 3), puv = new Float32Array((gx + 1) * (gz + 1) * 3), idx = new Uint32Array(gx * gz * 6);
        for (let j = 0; j <= gz; j++) for (let i = 0; i <= gx; i++) {
          const ax = a.x0 + (a.x1 - a.x0) * i / gx, ay = a.y0 + (a.y1 - a.y0) * j / gz, k = (j * (gx + 1) + i) * 3;
          pos[k] = ax - AW / 2; pos[k + 1] = heightAt(ax, ay) + 0.08; pos[k + 2] = ay - AH / 2; puv[k] = i / gx; puv[k + 1] = j / gz; puv[k + 2] = a.edge(ax, ay);
        }
        for (let j = 0, q = 0; j < gz; j++) for (let i = 0; i < gx; i++) { const v = j * (gx + 1) + i; idx.set([v, v + gx + 1, v + 1, v + 1, v + gx + 1, v + gx + 2], q); q += 6; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('puv', new THREE.BufferAttribute(puv, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
        const G = m.ground, tc = (i) => { const t = G.tint[i], av = two ? [1, 1, 1] : (lay[G.layers[i]] || { avg: [90, 100, 90] }).avg.map((v) => v / 255 * 2.2); return new THREE.Vector3(t[0] * av[0], t[1] * av[1], t[2] * av[2]); };
        const tx = (m.tile % per) * PM.gw, ty = Math.floor(m.tile / per) * PM.gh * 2;
        // the map's own ground for its grass, in zones 1 and 2: the fen's in the bog, else open grass (the zone's own)
        const onLand = two && !!layers && !!GT, row = kindAt(a.at[0], a.at[1]) === KIND.fen ? KIND.fen : KIND.grass, GL = onLand && zone >= 1 && zone <= 2 ? GT.LAYER[row * 5 + zone] : -1;
        const tv = (l) => new THREE.Vector3(GT.TINT[l * 3], GT.TINT[l * 3 + 1], GT.TINT[l * 3 + 2]);
        const mesh = new THREE.Mesh(g, material(PG_V, pgF(two, onLand), { players: { value: players }, pgrounds: { value: pgrounds }, layers: { value: layers },
          uG: { value: new THREE.Vector4(GL, GL > 15.5 ? 2.4 : 1, GL < 0 ? 0 : GT.MOODW[row], row === KIND.grass && zone <= 1 ? 1 : 0) }, uGT: { value: onLand && GL >= 0 ? tv(GL) : new THREE.Vector3(1, 1, 1) }, uGT25: { value: onLand ? tv(25) : new THREE.Vector3(1, 1, 1) }, uGT26: { value: onLand ? tv(26) : new THREE.Vector3(1, 1, 1) },
          uTile: { value: new THREE.Vector4(tx / GWt, 1 - ty / GHt, PM.gw / GWt, -PM.gh / GHt) }, uL: { value: new THREE.Vector4(...G.layers) }, uRep: { value: new THREE.Vector4(...G.rep.map((r) => 1 / (r * PK))) },
          uT0: { value: tc(0) }, uT1: { value: tc(1).multiplyScalar(zone <= 2 ? 1.4 : 1.15) }, uT2: { value: tc(2) }, uT3: { value: tc(3) }, uMood: { value: 0.3 }, uIce: { value: zone === 4 ? 1 : 0 } }));
        mesh.matrixAutoUpdate = false; scene.add(mesh); tris += idx.length / 3;
        // everything solid in it: each point stands on the ground under it, so nothing floats where the place's
        // ground meets the land
        let nv = 0, ni = 0; for (const gr of m.groups) { nv += gr.n; ni += gr.in; }
        if (!nv) continue;
        const sp = new Float32Array(nv * 3), info = new Float32Array(nv * 3), tint = new Float32Array(nv * 3), si = new Uint32Array(ni); let v0 = 0, i0 = 0;
        for (const gr of m.groups) {
          const V = new Int16Array(a.buf, gr.v, gr.n * 3), I = gr.wide ? new Uint32Array(a.buf, gr.i, gr.in) : new Uint16Array(a.buf, gr.i, gr.in);
          const av = two || gr.layer < 0 || gr.glow ? [1, 1, 1] : lay[gr.layer].avg.map((c) => c / 255 * 1.7), r = 1 / (gr.rep * PK);
          for (let k = 0; k < gr.n; k++) {
            const ax = a.at[0] + V[k * 3] / 50 * PK, ay = a.at[1] + V[k * 3 + 2] / 50 * PK, o = (v0 + k) * 3;
            sp[o] = ax - AW / 2; sp[o + 1] = heightAt(ax, ay) + V[k * 3 + 1] / 50 * PK - (a.gh(ax, ay) - a.base); sp[o + 2] = ay - AH / 2;
            info[o] = gr.layer; info[o + 1] = r; info[o + 2] = gr.glow; tint[o] = gr.tint[0] * av[0]; tint[o + 1] = gr.tint[1] * av[1]; tint[o + 2] = gr.tint[2] * av[2];
          }
          for (let k = 0; k < gr.in; k++) si[i0 + k] = I[k] + v0;
          v0 += gr.n; i0 += gr.in;
        }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('pinfo', new THREE.BufferAttribute(info, 3)); sg.setAttribute('ptint', new THREE.BufferAttribute(tint, 3)); sg.setIndex(new THREE.BufferAttribute(si, 1)); sg.computeBoundingSphere();
        const sm = new THREE.Mesh(sg, solidMat); sm.matrixAutoUpdate = false; scene.add(sm); tris += ni / 3; a.solid = sm; a.mid = sg.boundingSphere.center;
      }
      stats.places = PL.length; stats.placeTriangles = Math.round(tris);
    }
    function buildPlaces(blayers) {
      const S = Struct(), R = rng(404), glow = [];
      const STONE = BL('shared_stone_wall_rough'), TIMBER = BL('wick_wall_timber_plaster'), TILE = BL('shared_roof_tiles_red'), THATCH = BL('shared_roof_thatch'), PLANKS = BL('shared_planks_wall'),
        SHINGLE = BL('shared_roof_shingle'), CASTLE = BL('shared_wall_castle'), SLATE = BL('misthollow_roof_blue_slate'), FROST = BL('shared_stone_wall_frosted'), SNOWSLATE = BL('shared_roof_slate_snow');
      const sx = (ax) => ax - AW / 2, sz = (ay) => ay - AH / 2;
      // the ground under a footprint: where its floor stands (base) and how far down its walls must reach (low)
      const footing = (ax0, ay0, ax1, ay1) => { const g = [[(ax0 + ax1) / 2, (ay0 + ay1) / 2], [ax0, ay0], [ax1, ay0], [ax0, ay1], [ax1, ay1]].map(([x, y]) => groundAt(x, y)), lo = Math.min(...g), hi = Math.max(...g); return { base: Math.max(g[0], (lo + hi) / 2), low: lo - 1.5 }; };
      // ---- the walking places' own buildings ----
      for (const a of PL) { const L = a.m.lamps; for (let i = 0; i < L.length; i += 4) { const ax = a.at[0] + L[i] * PK, ay = a.at[1] + L[i + 2] * PK; glow.push([ax, heightAt(ax, ay) + L[i + 1] * PK - (a.gh(ax, ay) - a.base) + 0.3, ay]); } }
      for (const [id, list] of Object.entries(BD.places)) {
        const p = P.PLACES[id]; if (!p || PL.some((a) => a.id === id)) continue;
        const kx = 0.04 * BK, kz = 0.05 * BK, X = (px) => p.at[0] + (px - 768) * kx, Y = (py) => p.at[1] + (py - 512) * kz, stilts = id.indexOf('bogmire') === 0;
        for (const b of list) {
          const ax0 = X(b.fp[0]), ay0 = Y(b.fp[1]), ax1 = X(b.fp[2]), ay1 = Y(b.fp[3]), f = footing(ax0, ay0, ax1, ay1), x0 = sx(ax0), z0 = sz(ay0), x1 = sx(ax1), z1 = sz(ay1);
          const base = f.base + (stilts ? 1.5 : 0); // (the fen's houses stand on stilts over the water)
          if (stilts) for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) S.box(px - 0.18, pz - 0.18, px + 0.18, pz + 0.18, f.low, base, PLANKS);
          const h = S.house(x0, z0, x1, z1, base, stilts ? base - 0.25 : f.low, b.walls.map(([l, m]) => [l, m * BK]), [b.roof[0], b.roof[1], b.roof[2] * BK, b.roof[3] * BK, b.roof[4]]);
          for (const [cxp, cyp, cw, cd, ch] of b.chim || []) { const cx = sx(X(cxp)), cz = sz(Y(cyp)), hw = Math.max(0.45, cw * BK / 2), hd = Math.max(0.45, cd * BK / 2); S.box(cx - hw, cz - hd, cx + hw, cz + hd, h.E - 0.2, h.roofY(cx, cz) + ch * BK * 0.6, b.walls[0][0], null, b.walls[0][0]); }
          if (b.belfry) { const cx = (x0 + x1) / 2, bz = z1 - 1.1, by = h.E + h.rise - 0.5; S.box(cx - 0.7, bz - 0.7, cx + 0.7, bz + 0.7, by, by + 1.9, b.walls[0][0]); S.cone(cx, bz, by + 1.9, 1.15, 1.5, 4, b.roof[0], null, Math.PI / 4); glow.push([(ax0 + ax1) / 2, by + 1.2, ay1 - 1.1]); }
          for (const [side, along, zm] of b.win || []) glow.push([side === 'e' ? ax1 + 0.1 : side === 'w' ? ax0 - 0.1 : X(along), base + zm * BK, side === 's' ? ay1 + 0.1 : side === 'n' ? ay0 - 0.1 : Y(along)]);
          stats.houses++;
        }
      }
      // ---- the rest, in the same make: a round tower, a plain house, a cluster of them ----
      const tower = (ax, ay, r, h, wall, roof, sides, t) => { const g = groundAt(ax, ay); S.drum(sx(ax), sz(ay), g - 8, g + h, r, r * 1.08, sides || 8, wall, t); S.cone(sx(ax), sz(ay), g + h, r * 1.25, r * 2.1, sides || 8, roof, t); glow.push([ax, g + h * 0.72, ay]); };
      const house = (ax, ay, s, walls, roof, t) => {
        if (rawHeight(ax, ay) < 0.6) return false;
        let w = (4.4 + R() * 2.4) * s, d = (3.4 + R() * 1.2) * s; const ew = R() < 0.5; if (!ew) [w, d] = [d, w]; // the ridge runs the long way
        const f = footing(ax - w / 2, ay - d / 2, ax + w / 2, ay + d / 2), levels = walls.length > 1 ? [[walls[0], 2.2 * s], [walls[1], 1.7 * s]] : [[walls[0], (2.3 + R() * 0.8) * s]];
        S.house(sx(ax - w / 2), sz(ay - d / 2), sx(ax + w / 2), sz(ay + d / 2), f.base, f.low, levels, [roof, ew ? 1 : 0, (2.0 + R() * 0.9) * s, 0.35, ''], t);
        if (R() < 0.75) glow.push([ax + (ew ? 0 : w / 2 + 0.1), f.base + 1.3 * s, ay + (ew ? d / 2 + 0.1 : 0)]);
        stats.houses++; return true;
      };
      const cluster = (ax, ay, n, spread, s, walls, roof, t) => { const made = []; for (let k = 0; k < n * 12 && made.length < n; k++) { const a = R() * 6.28, r = Math.sqrt(R()) * spread, x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r * 0.8; if (made.some(([mx, my]) => Math.abs(mx - x) < 8.5 * s && Math.abs(my - y) < 8.5 * s)) continue; if (house(x, y, s, walls, roof, t)) made.push([x, y]); } };
      // Hearthstone Keep (atlas 2340, 1240): a ring wall with towers, the keep and its spires, houses within
      {
        const cx = 2340, cy = 1240, RW = 44, n = 10;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * 6.283, a1 = (i + 1) / n * 6.283, ax0 = cx + Math.cos(a0) * RW, ay0 = cy + Math.sin(a0) * RW * 0.8, ax1 = cx + Math.cos(a1) * RW, ay1 = cy + Math.sin(a1) * RW * 0.8;
          const g = Math.max(groundAt((ax0 + ax1) / 2, (ay0 + ay1) / 2), groundAt(ax0, ay0), groundAt(ax1, ay1)), len = Math.hypot(ax1 - ax0, ay1 - ay0), nx = -(ay1 - ay0) / len * 1.5, ny = (ax1 - ax0) / len * 1.5;
          // the rampart: its outer face, its inner face, and the walk along its top
          S.wall(sx(ax0 + nx), sz(ay0 + ny), sx(ax1 + nx), sz(ay1 + ny), g - 14, g + 8, CASTLE); S.wall(sx(ax1 - nx), sz(ay1 - ny), sx(ax0 - nx), sz(ay0 - ny), g - 14, g + 8, CASTLE);
          S.quad([sx(ax0 + nx), g + 8, sz(ay0 + ny)], [sx(ax1 + nx), g + 8, sz(ay1 + ny)], [sx(ax1 - nx), g + 8, sz(ay1 - ny)], [sx(ax0 - nx), g + 8, sz(ay0 - ny)], CASTLE, [0, 0, len, 3]);
          tower(ax0, ay0, 4.2, 15 + (i % 2) * 4, CASTLE, SLATE);
        }
        const g = groundAt(cx, cy);
        S.house(sx(cx - 12), sz(cy - 10), sx(cx + 12), sz(cy + 10), g, g - 12, [[CASTLE, 22]], [SLATE, 1, 9, 1, '']);
        for (const [dx, dy, h] of [[-13, -10, 34], [13, -10, 40], [-13, 10, 30], [13, 10, 36]]) tower(cx + dx, cy + dy, 3.6, h - (groundAt(cx + dx, cy + dy) - g), CASTLE, SLATE);
        tower(cx + 2, cy - 1, 5.2, 54, CASTLE, SLATE, 10);
        const made = []; for (let k = 0; k < 400 && made.length < 22; k++) { const a = R() * 6.28, r = 18 + R() * 19, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8; if (made.some(([mx, my]) => Math.abs(mx - x) < 8 && Math.abs(my - y) < 8)) continue; if (house(x, y, 0.95, [STONE, TIMBER], R() < 0.6 ? TILE : SLATE)) made.push([x, y]); }
        for (let i = 0; i < 14; i++) { const a = R() * 6.28; glow.push([cx + Math.cos(a) * 40, g + 6 + R() * 26, cy + Math.sin(a) * 30]); }
      }
      // the towns no walking place covers, and the landmarks (texture-packs/world/aethermoor/inventory.md)
      const SAND = [1.4, 1.15, 0.82];
      cluster(990, 728, 6, 24, 1, [STONE, TIMBER], THATCH); cluster(3790, 538, 8, 26, 1, [FROST], SNOWSLATE); tower(3794, 535, 2.8, 13, FROST, SNOWSLATE);
      cluster(2898, 2588, 6, 26, 1, [PLANKS], SHINGLE); cluster(3560, 2108, 6, 24, 1, [STONE], THATCH, SAND);
      tower(1138, 2318, 3.2, 16, STONE, TILE, 8, [1.25, 0.95, 0.9]); tower(2914, 212, 3.4, 20, FROST, SNOWSLATE); tower(1525, 905, 3, 12, CASTLE, SLATE);
      tower(4040, 1818, 2.2, 24, STONE, TILE, 8, SAND); tower(4062, 1828, 2.2, 21, STONE, TILE, 8, SAND); tower(3525, 1588, 4.4, 8, STONE, THATCH, 10, SAND);
      // (the castle and the towers show through the mist more than the land does: they are what to steer by)
      const tex = !!blayers, mat = new THREE.ShaderMaterial({ uniforms: Object.assign({}, uniforms, { blayers: { value: blayers }, uPierce: { value: 1 }, uMood: { value: 0.2 } }), vertexShader: buildV(tex), fragmentShader: buildF(tex), side: THREE.DoubleSide, extensions: { derivatives: true } });
      scene.add(S.mesh(mat)); stats.buildingTriangles = S.triangles;
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
    const DMIN = 55, TMIN = 0.16, TMAX = 1.5; let DMAX = 6200; // (as close as 550 m: near enough to see a tree as a tree)
    function placeCamera() {
      C.x = clamp(C.x, 0, AW); C.y = clamp(C.y, 0, AH); C.dist = clamp(C.dist, DMIN, DMAX); C.tilt = clamp(C.tilt, TMIN, TMAX);
      const gy = groundAt(C.x, C.y); C.gy += (gy - C.gy) * 0.15;
      const hd = Math.cos(C.tilt) * C.dist, tx = C.x - AW / 2, tz = C.y - AH / 2;
      camera.position.set(tx + Math.sin(C.yaw) * hd, C.gy + Math.sin(C.tilt) * C.dist, tz + Math.cos(C.yaw) * hd);
      // never inside a hill
      const under = groundAt(camera.position.x + AW / 2, camera.position.z + AH / 2) + 17 + C.dist * 0.02; // (and over the treetops)
      if (camera.position.y < under) camera.position.y = under;
      camera.lookAt(tx, C.gy, tz);
      camera.near = Math.max(2, C.dist * 0.02); camera.far = 90000; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
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
        if (fps < 40 && pr > 1) { if (++slow >= 2) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); resize(); slow = 0; } } else slow = 0;
        // and if the frames still come slowly with tree models on the screen, fewer of them are drawn as models
        if (fps < 26 && chosen.size && treeQ > 0.3) { treeQ = Math.max(0.3, treeQ * 0.75); lastPick = null; } }
    }
    function step(dt, real) {
      uniforms.uTime.value += dt; uniforms.uGlow.value = 0.5 + 0.5 * Math.sin(uniforms.uTime.value * 1.8);
      stepFly(real || dt); // a flight keeps to its time even if a frame comes late
      if (!pts.size && !fly) { // a flick keeps turning, or sliding, for a moment
        if (Math.abs(spin.yaw) + Math.abs(spin.tilt) > 0.05) { turn(spin.yaw, spin.tilt); spin.yaw *= 0.9; spin.tilt *= 0.85; }
        if (Math.abs(vel.x) + Math.abs(vel.y) > 0.05) { pan(vel.x, vel.y); vel.x *= 0.9; vel.y *= 0.9; }
      }
      placeCamera();
      pickTrees();
      // a place's houses and walls are drawn only from near enough to make them out
      for (const a of PL) if (a.solid) a.solid.visible = camera.position.distanceTo(a.mid) < LV.placeFar;
      // trees: only the patches on the screen and near enough to be more than specks
      pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
      for (const m of treePatches) {
        const s = m.userData.sphere, d = camera.position.distanceTo(s.center), seen = d < LV.treeFar + s.radius && frustum.intersectsSphere(s), far = m.userData.far;
        if (far) { const full = d < LV.treeFull + s.radius; m.visible = seen && full; far.visible = seen && !full; } else m.visible = seen;
      }
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
      numbers() { return { detail, textured: !!layers, models: stats.models, treeShare: treeQ, fps: Math.round(fps), triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, sharp: pr, trees: stats.trees, houses: stats.houses }; },
      stop() { running = false; },
      P: { scene, camera, renderer, C },
    };
    api.ready = (async () => {
      const [hp, kp] = await Promise.all([loadPixels(art.height), loadPixels(art.kinds)]);
      if (api.onStage) api.onStage('land');
      Hf = new Float32Array(DW * DH); Kd = new Uint8Array(DW * DH);
      for (let i = 0; i < DW * DH; i++) {
        Kd[i] = kp[i * 4]; let h = (hp[i * 4] * 256 + hp[i * 4 + 1]) / 10 - 100;
        // the land slips under the sea at the map's very edges (the painting cuts some islands off there)
        const x = i % DW, y = (i / DW) | 0, e = Math.min(x, y, DW - 1 - x, DH - 1 - y);
        if (e < 14 && h > -3) h = -3 + (h + 3) * sstep(1, 14, e);
        Hf[i] = h;
      }
      uniforms.zones.value = zoneTexture();
      moodTextures();
      if (art.layers && renderer.capabilities.isWebGL2) layers = await loadLayers(art.layers).catch(() => null);
      const blayers = art.blayers && renderer.capabilities.isWebGL2 ? await loadLayers(art.blayers, 256).catch(() => null) : null;
      // the walking places as the game builds them (if this browser can't unpack them, the map keeps its plain houses)
      let players = null, pgrounds = null;
      const pbuf = art.pgrounds ? await unpackPlaces().catch(() => null) : null;
      if (pbuf) {
        pgrounds = await new Promise((ok) => new THREE.TextureLoader().load(art.pgrounds, ok, undefined, () => ok(null)));
        if (pgrounds) { pgrounds.minFilter = pgrounds.magFilter = THREE.LinearFilter; pgrounds.generateMipmaps = false; setPlaces(pbuf); }
        if (pgrounds && art.players && renderer.capabilities.isWebGL2) players = await loadLayers(art.players, PM.tile, PM.per).catch(() => null);
      }
      buildLand(); if (PL.length) buildGamePlaces(players, pgrounds); buildTrees(); buildModels(); buildPlaces(blayers); makeTags();
      api.setOpen(api.open);
      resize();
      if (opts.io) api.setIo(opts.io.place, opts.io.spot, false);
      C.gy = groundAt(C.x, C.y); placeCamera();
      requestAnimationFrame((t) => { lastT = t; frame(t); });
      return api;
    })();
    return api;
  }
  window.WorldMap = { create, AW, AH, EXAG, KIND, DETAIL };
})();
