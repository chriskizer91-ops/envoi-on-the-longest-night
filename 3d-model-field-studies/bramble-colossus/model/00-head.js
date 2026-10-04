// colossus.js: the Bramble Colossus, field-study version (the reference model). three.js r128 (global THREE).
// Defines makeBrambleColossus(opts) only, with the same interface, moves, hit times and anchors as the game's model
// (3d-model-new-character-ideas/bramble-colossus/colossus.js), so it can stand in for it unchanged.
//
// What it is: a blackberry thicket that hunts, grown as big as a house over a century or more. A mound of twisted roots,
// a spire of three old canes braided round each other, and on top a thorned bud taller than a person that opens into a
// five-petalled flower round its heart, a glowing blackberry the size of a barrel. Four great canes grow from the spire:
// the two in front are its arms, the two behind arch back like a mane. Six more arch out over the soil as its legs. It has
// no face: the bud turns toward its prey, gapes and feeds, and each heartbeat runs down the spire into its roots.
//
// This version keeps that body, its rig and every move, and rebuilds how it looks at the level of detail a laptop can
// draw, thinking about what it is in the world: it lives where Noctara's cold comes down off the frozen pass, and its
// heart is warm. So its breath steams in the night air, frost furs the tips of its outermost canes and leaves but never
// the ones near its heart, and its roots run on far under the meadow (state.xray shows them, with the heartbeat running
// out along them). Everything is built from what a real blackberry is made of: five-angled canes with a waxy bloom and
// hooked prickles flattened at the base, compound leaves of three and five toothed leaflets that are paler and felted
// underneath and glow when the moon is behind them, fruit at every stage from hard green to glossy black with the dry
// styles still on each drupelet, old grey dead canes tangled through the mound, and a flower with crinkled petals and a
// crowd of stamens.
//
// opts: { detail .25 to 1 (1, the default, is the laptop reference; .5 is about a third of its triangles; .25 is near the
//         game's budget), level 1 to 20 (bigger, darker, longer thorns, veins that glow at rest), size (an extra overall
//         scale; 1 = about 7.5 m tall and 11 m across at rest, its arms reaching 9 m), shadows (true: it casts and takes
//         shadows, with depth materials that match its cuts and fades), linear (default true: colours are painted for a
//         linear, tone-mapped renderer; false for the game's plain one) }
function makeBrambleColossus(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, the mound on the ground at the origin. Its right side is -X; the lead arm (the one
 // that lances) is the front great cane on its right.
 opts = opts || {};
 const DET = Math.max(.25, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 90217;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 let seed2 = 4471;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 let seed3 = 31337; // a third stream for the fine detail (prickles, drupelets, hairs), so its counts never shift the rest
 const rnd3 = () => (seed3 = (seed3 * 16807) % 2147483647) / 2147483647;
 const r3 = (a, b) => a + (b - a) * rnd3();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const YAX = V3(0, 1, 0);
 // colour: everything is painted and listed in sRGB as an artist would pick it; LIN turns vertex colours linear for a
 // tone-mapped renderer, and marks painted colour maps as sRGB so the renderer decodes them
 const LIN = opts.linear !== false;
 const lin1 = (v) => (LIN ? Math.pow(cl(v, 0, 8), 2.2) : v);
 const lc = (c) => [lin1(c[0]), lin1(c[1]), lin1(c[2])];
 const C3 = (r, g, b) => new THREE.Color(lin1(r), lin1(g), lin1(b));
 const tex = (c, rx, ry, data) => {
  const t = new THREE.CanvasTexture(c);
  if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); }
  t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding;
  return t;
 };
 const dataTex = (c, rx, ry) => tex(c, rx, ry, true);

 // ---------- its size and the level look ----------
 const LEVEL = cl(opts.level === undefined ? 1 : Math.round(+opts.level) || 1, 1, 20), TIER = (LEVEL - 1) / 19;
 const SZ = (1 + .1 * TIER) * (opts.size > 0 ? +opts.size : 1);
 const CR = 2.1, CH = 1.4, MOSS = .4;                  // the root mound: radius, height, moss
 const NS = 10;                                        // a cane's segments: NS + 1 bones
 const SPN = 6, SPH = CH * .55, SPL = 4.3, SPS = SPL / SPN, BY = SPH + SPL + .1; // the spire: segments, where it starts, its length; BY the bud's base
 const DARK = 1 - .16 * TIER, THS = 1 + .3 * TIER, VEIN = .3 + .5 * sm(.3, 1, TIER);
 const REACH = 8.2;                                    // where its prey stands, from its middle
 const WARM = 4.5, COLD = 9.5;                         // frost: none within WARM of its middle, full past COLD (body meters)

 const root = new THREE.Group(); root.name = 'BrambleColossus';
 const base = new THREE.Group(); root.add(base);       // everything of the body, scaled by SZ
 const fx = new THREE.Group(); fx.name = root.name + 'FX';
