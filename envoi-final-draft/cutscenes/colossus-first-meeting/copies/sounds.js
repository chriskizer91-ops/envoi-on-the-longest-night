// sounds.js: every sound in the field study, made in code (the project has no recordings of nature).
// Two families. The Bramble's own sounds, organic ones: green wood creaking under strain, leathery leaves rustling, roots
// tearing out of the frozen soil as a leg lifts and frost crunching as it plants, canes swishing through the air, a cane
// driven into the earth, its heartbeat muffled in the thicket, steam breathed out of the bud. And round it a quiet,
// sparse night: wind in the spruce in gusts, owls, the lake ice singing, redwings passing over, a tree cracking in the
// frost, wolves far off. Each is built sample by sample once the page may make sound (after a click), and all of them
// play through one reverb shaped like a snowy meadow ringed by forest.
// Defines makeFieldSounds() only. Returns { init(), ready, renderMs, bramble(id, { gain, pan, far, delay }),
//   night(id, { gain, pan, far, pick }), tick(dt), hush(seconds), setQuiet(on), setHold(on), setWind(v), list,
//   setLevel(id, v), level(id), setOn(id, on), on(id), setGroup('bramble' | 'night', v), group(name), setMuted(on),
//   reset(), settings(), load(saved) }.
// cutscene: this copy (envoi-final-draft/cutscenes/colossus-first-meeting/) also gives the cutscene's own sounds a way in
//   (ctx, bus(group), wet: its context, its two groups' buses and its reverb) and close() (the context is shut and freed
//   when the cutscene ends); each line marked "cutscene:".
function makeFieldSounds() {
  'use strict';
  const TAU = Math.PI * 2;
  let SR = 44100, ctx = null, master = null, wet = null, ready = false, renderMs = 0, muted = false;
  const GROUP = { bramble: { v: .9, bus: null }, night: { v: .55, bus: null } };
  let windGain = null, windV = .6, quiet = false, hold = false;
  let seed = 4242;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---------- what there is ----------
  // the Bramble's: [id, name, what it is, level, variations]
  const BR = [
    ['creak', 'A cane creaking', 'Green wood bending under its own weight, catching and slipping.', .55, 4],
    ['rustle', 'Its leaves', 'Leathery winter leaves moving against each other.', .45, 3],
    ['step', 'A leg coming down', 'A cane’s tip planting through the frost into frozen soil, its rootlets catching.', .5, 4],
    ['pull', 'Roots tearing free', 'A tip lifting: the roots it put down snapping out of the ground.', .4, 3],
    ['heart', 'Its heartbeat', 'Two soft, deep beats, muffled in the thicket. Only heard close to.', .5, 1],
    ['breath', 'Steam breathed out', 'A long, hollow exhale out of the bud.', .35, 1],
    ['groan', 'The whole thicket straining', 'Every cane creaking at once as it heaves itself up.', .8, 1],
    ['swish', 'A cane swung', 'Air torn round a cane as it whips past, its leaves fluttering.', .55, 3],
    ['impact', 'A cane into the ground', 'A spear of cane through the frost crust into the earth, and clods falling back.', .85, 2],
    ['heavy', 'Hammerfall', 'Both arms coming down as one club, and the ground taking it.', .95, 1],
    ['bloom', 'The flower opening', 'Sepals peeling apart, petals creaking as they spread, a breath of pollen.', .65, 1],
    ['gulp', 'Swallowing', 'The bud shutting on what it holds: a wet, low squeeze.', .6, 1],
    ['shoots', 'Thornwood', 'The soil splitting and cane after cane bursting up out of it.', .85, 1],
    ['thorns', 'Thorn volley', 'Thorns flicked off the canes whistling out and pattering down.', .5, 1],
    ['sizzle', 'Fire on it', 'Sap hissing and spitting, leaves crackling as they curl.', .55, 1],
    ['crash', 'Felled', 'The spire’s wood giving way, a split, and the fall.', .95, 1]
  ];
  // the night's: [id, name, what it is, level, seconds between calls (fewest, most)]; the wind is always there
  const NI = [
    ['wind', 'Wind in the spruce', 'Gusts coming through the forest and dying away. It follows the Wind slider in Explore.', .35, null],
    ['owl', 'Eagle owl', 'A deep “oo-HOO” from the forest edge, a few times over.', .7, [60, 140]],
    ['tawny', 'Tawny owl', 'A long hoot, a pause, then a quavering answer.', .5, [90, 200]],
    ['ice', 'The lake ice', 'Frostmere’s ice shifting in the cold: falling, ringing notes, now and then a deep boom.', .55, [45, 110]],
    ['redwings', 'Redwings overhead', 'The thin “tseep” of thrushes flying south in the dark.', .4, [80, 180]],
    ['trees', 'Trees in the frost', 'A trunk splitting with a crack in the cold, or creaking.', .45, [70, 160]],
    ['wolves', 'Wolves on the pass', 'Two wolves howling far off, up toward the snow.', .45, [220, 420]]
  ];
  const L = {};
  for (const [id, name, desc, level, n] of BR) L[id] = { id, name, desc, level, start: level, on: true, n, fam: 'bramble', last: -1 };
  for (const [id, name, desc, level, every] of NI) L[id] = { id, name, desc, level, start: level, on: true, every, fam: 'night', next: 0, bed: !every };
  const BUF = {};

  // ---------- tools for building a sound sample by sample (a sound is an array of channels) ----------
  const buf = (secs) => new Float32Array(Math.ceil(secs * SR));
  // a smooth envelope: rises over a, holds for h, falls over r
  const env = (x, a, h, r) => { if (x < 0) return 0; if (x < a) return .5 - .5 * Math.cos(Math.PI * x / a); if (x < a + h) return 1; if (x < a + h + r) return .5 + .5 * Math.cos(Math.PI * (x - a - h) / r); return 0; };
  // a state-variable filter, one sample at a time: f.run(x, Hz, q) leaves f.lo, f.bp and f.hi
  function svf() { const f = { lo: 0, bp: 0, hi: 0 }; f.run = (x, hz, q) => { const F = 2 * Math.sin(Math.PI * Math.min(hz, SR * .2) / SR); f.lo += F * f.bp; f.hi = x - f.lo - f.bp / Math.max(q, .5); f.bp += F * f.hi; }; return f; }
  const lpK = (hz) => 1 - Math.exp(-TAU * hz / SR);
  function peak(d) { let m = 1e-9; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); return m; }
  function norm(d, to) { const k = to / peak(d); for (let i = 0; i < d.length; i++) d[i] *= k; return d; }
  function fadeEnds(d, secs) { const n = Math.min(d.length >> 1, Math.round(secs * SR)); for (let i = 0; i < n; i++) { const k = i / n; d[i] *= k; d[d.length - 1 - i] *= k; } return d; }
  function lowpass(d, hz) { let y = 0; const k = lpK(hz); for (let i = 0; i < d.length; i++) { y += (d[i] - y) * k; d[i] = y; } return d; }
  function sat(d, k) { for (let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * k); return d; }
  function mix(d, s, g) { for (let i = 0; i < d.length && i < s.length; i++) d[i] += s[i] * g; return d; }
  // a soft knock: a short raised-cosine push (as strong as a click of a, but rounder), for things that land rather than click
  function push(x, t, w, a) { const n0 = Math.round(t * SR), n = Math.max(2, Math.round(w * SR)); for (let i = 0; i < n && n0 + i < x.length; i++) x[n0 + i] += a * 2 / n * (.5 - .5 * Math.cos(TAU * i / n)); }
  // the ringing of a body (wood, soil, ice) struck by x: a damped resonance per [Hz, seconds to die by 1/e, loudness]
  function modes(x, list) {
    const y = new Float32Array(x.length);
    for (const [f, tau, g] of list) {
      const r = Math.exp(-1 / (tau * SR)), w = TAU * Math.min(f, SR * .45) / SR, a1 = 2 * r * Math.cos(w), a2 = -r * r, s = Math.sin(w); let y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const v = x[i] * s + a1 * y1 + a2 * y2; y2 = y1; y1 = v; y[i] += v * g; }
    }
    return y;
  }
  // one small hit with its own ringing (a fibre snapping, a clod landing): modes of Hz each nudged at random
  function ping(d, t, list, g) {
    const n0 = Math.round(t * SR);
    for (const [f0, tau, a] of list) {
      const f = f0 * rr(.8, 1.25), w = TAU * Math.min(f, SR * .45) / SR, dk = Math.exp(-1 / (tau * SR)), n = Math.min(d.length - n0, Math.round(tau * 6 * SR)); let e = g * a;
      for (let i = 0; i < n; i++) { d[n0 + i] += Math.sin(w * i) * e; e *= dk; }
    }
  }
  // crackle: tiny clicks arriving at dens(t) a second, each a burst of noise dying over tau, most faint and a few loud,
  // kept to the band lo to hi. Leaves, frost, soil and fibres are all made of it, at different rates and bands.
  function crackle(d, t0, dur, dens, tau, lo, hi, g) {
    const n0 = Math.round(t0 * SR), n = Math.round(dur * SR), dk = Math.exp(-1 / (tau * SR)), kL = lpK(hi), kH = lpK(lo); let e = 0, y = 0, h = 0;
    for (let i = 0; i < n && n0 + i < d.length; i++) {
      if (rnd() < dens(i / SR) / SR) e += Math.pow(rnd(), 2.5);
      e *= dk; y += ((rnd() * 2 - 1) * e - y) * kL; h += (y - h) * kH; d[n0 + i] += (y - h) * g;
    }
  }
  // stick and slip: wood or bark catching and letting go, rate(t) times a second, as loud as amp(t)
  function stick(x, t0, dur, rate, amp, jit) {
    let t = 0;
    while (t < dur) { const i = Math.round((t0 + t) * SR), a = amp(t); if (i >= 0 && i + 1 < x.length) { x[i] += a * (.7 + .6 * rnd()); x[i + 1] -= a * .4 * rnd(); } t += (1 / Math.max(1, rate(t))) * (1 + (rnd() - .5) * jit); }
  }
  // a voice: harmonics on a pitch curve fn(t) in Hz with a loudness curve amp(t), and a little breath (owls, wolves)
  function voice(out, t0, dur, fn, amp, harm, breath) {
    let ph = 0; const n0 = Math.round(t0 * SR), n = Math.round(dur * SR), f = svf();
    for (let i = 0; i < n && n0 + i < out.length; i++) {
      const t = i / SR, hz = fn(t), a = amp(t); ph += TAU * hz / SR;
      let s = 0; for (let k = 0; k < harm.length; k++) s += harm[k] * Math.sin(ph * (k + 1));
      if (breath) { f.run(rnd() * 2 - 1, hz, 4); s += f.bp * breath; }
      out[n0 + i] += s * a;
    }
  }
  const wood = (f) => [[170 * f, .03, 1], [390 * f, .018, .8], [820 * f, .01, .5], [1650 * f, .005, .3], [2900 * f, .003, .15]];

  // ---------- the Bramble ----------
  function makeCreak() { // a cane bending under its own weight: green wood catching and slipping
    const dur = rr(.7, 1.5), x = buf(dur + .3), r0 = rr(25, 60), r1 = r0 * rr(1.3, 2.4), wob = rr(3, 7), flut = rr(9, 17);
    stick(x, .02, dur, (t) => r0 + (r1 - r0) * sm(0, dur, t) + 6 * Math.sin(t * wob), (t) => env(t, dur * .25, dur * .35, dur * .4) * (.5 + .5 * Math.sin(t * flut)) * (.4 + .6 * rnd()), .55);
    return [norm(fadeEnds(modes(x, wood(rr(.8, 1.25))), .01), .7)];
  }
  function makeRustle(len) { // leathery winter leaves moving against each other, with the soft swish of their faces sliding
    const d = buf(len + .1), fl = rr(11, 19), f = svf();
    const e = (t) => Math.pow(env(t, len * .3, len * .15, len * .55), 1.3);
    crackle(d, .02, len, (t) => 1300 * e(t) * (.6 + .4 * Math.sin(t * fl)), .0012, 900, 4500, 1);
    for (let i = 0; i < d.length; i++) { f.run(rnd() * 2 - 1, 1800, .8); d[i] += f.bp * e(i / SR - .02) * .12; }
    return [norm(fadeEnds(d, .01), .55)];
  }
  function makeStep() { // a leg planting: down through the frost into frozen soil, a weighty thud, rootlets catching
    const d = buf(.7), x = buf(.7); push(x, .006, .012, 1);
    mix(d, sat(modes(x, [[rr(70, 95), .05, 1], [rr(150, 190), .03, .6], [rr(330, 420), .012, .3]]), 2.5), .8);
    crackle(d, .006, .2, (t) => 2500 * Math.exp(-t / .05), .0004, 1500, 7000, .45);  // frost crunching
    crackle(d, .01, .25, (t) => 600 * Math.exp(-t / .08), .002, 250, 1400, .35);     // soil
    const n = 2 + Math.floor(rnd() * 4); for (let k = 0; k < n; k++) ping(d, rr(.05, .35), [[1300, .004, 1], [2800, .002, .5]], rr(.1, .3)); // rootlets catching
    return [norm(fadeEnds(d, .004), .7)];
  }
  function makePull() { // a tip tearing its roots out of the frozen ground: fibres snapping faster and faster, then free
    const dur = rr(.35, .6), d = buf(dur + .5);
    let t = .02, gap = rr(.04, .07); while (t < dur) { ping(d, t, [[1100, .005, 1], [2400, .003, .6], [450, .01, .5]].map(([f, tau, a]) => [f * rr(.6, 1.5), tau, a]), rr(.2, .7)); t += gap * rr(.6, 1.4); gap = Math.max(.008, gap * .86); }
    crackle(d, .02, dur, (u) => 400 + 1800 * sm(0, dur, u), .0006, 700, 3500, .3);   // fibres tearing
    crackle(d, dur * .8, .45, (u) => 300 * Math.exp(-u / .15), .003, 150, 900, .45); // soil falling away
    return [norm(fadeEnds(d, .004), .6)];
  }
  function makeHeart() { // its heartbeat, heard through the thicket: two soft, deep beats
    const x = buf(1); push(x, .01, .018, 1); push(x, .29, .02, .7);
    const y = sat(modes(x, [[52, .09, 1], [104, .05, .6], [150, .035, .45], [230, .02, .28], [380, .01, .12]]), 2);
    return [norm(lowpass(fadeEnds(y, .01), 900), .7)];
  }
  function makeBreath() { // steam out of the bud: a long, slow, hollow exhale
    const dur = 2.6, d = buf(dur + .2), f1 = svf(), f2 = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR, e = env(t, .7, .4, 1.4), w = rnd() * 2 - 1; f1.run(w, 300 + 50 * e, 5); f2.run(w, 740, 4); d[i] = (f1.bp + f2.bp * .6) * e; }
    return [norm(lowpass(fadeEnds(d, .02), 1400), .45)];
  }
  function makeGroan() { // the whole thicket straining at once: slow creaks deep in many canes, and its leaves
    const dur = 3.2, d = buf(dur + .6);
    for (let k = 0; k < 4; k++) {
      const x = buf(dur + .6), st = rr(0, .6), ln = rr(1.6, 2.6), r0 = rr(9, 18), r1 = r0 * rr(1.5, 2.5), f = rr(.7, 1.3);
      stick(x, st, ln, (t) => r0 + (r1 - r0) * sm(0, ln, t), (t) => env(t, ln * .3, ln * .3, ln * .4), .4);
      mix(d, modes(x, [[85 * f, .09, 1], [160 * f, .06, .8], [310 * f, .03, .6], [640 * f, .012, .3], [1300 * f, .006, .15]]), k ? .7 : 1);
    }
    crackle(d, .2, dur, (t) => 300 + 900 * env(t, 1.2, .8, 1.2), .0008, 900, 4500, .2);
    return [norm(fadeEnds(d, .02), .8)];
  }
  function makeSwish(len) { // a cane swung fast: air torn round it, rising as it speeds up and falling as it slows; leaves fluttering
    const d = buf(len + .15), f = svf();
    for (let i = 0; i < d.length; i++) { const u = cl(i / SR / len, 0, 1), v = Math.pow(Math.sin(Math.PI * u), 2.2); f.run(rnd() * 2 - 1, 250 + 1300 * v, 2.2); d[i] = f.bp * v * .7; }
    crackle(d, len * .25, len * .7, (t) => 900 * Math.sin(Math.PI * cl(t / (len * .7), 0, 1)), .0006, 1500, 6000, .3);
    return [norm(fadeEnds(d, .01), .7)];
  }
  function clods(d, t0, spread, n, g) { // clods of soil falling back onto the frozen ground
    for (let k = 0; k < n; k++) { const t = t0 + Math.pow(rnd(), 1.4) * spread; if (t < d.length / SR - .1) ping(d, t, [[360, .009, 1], [1000, .004, .5]], rr(.1, .6) * (1 - .6 * (t - t0) / spread) * g); }
  }
  function makeImpact() { // a cane driven into frozen earth: the frost crust breaking, a heavy thud, clods after
    const d = buf(1.2), x = buf(1.2); push(x, .004, .006, 1);
    mix(d, sat(modes(x, [[rr(55, 70), .12, 1], [rr(110, 140), .07, .7], [rr(240, 300), .03, .4], [rr(520, 640), .012, .2]]), 3), .9);
    crackle(d, 0, .25, (t) => 5000 * Math.exp(-t / .04), .0003, 1800, 9000, .55);
    crackle(d, .01, .5, (t) => 900 * Math.exp(-t / .12), .0015, 200, 1500, .45);
    clods(d, .15, .8, 12, .5);
    return [norm(fadeEnds(d, .004), .85)];
  }
  function makeHeavy() { // Hammerfall: the ground takes both arms at once; a rumble rolls away; clods rain back down
    const d = buf(2.4), x = buf(2.4); push(x, .004, .008, 1); push(x, .03, .01, .5);
    mix(d, sat(modes(x, [[48, .2, 1], [92, .12, .7], [180, .05, .4], [380, .02, .25]]), 3.5), 1);
    let br = 0, y = 0; const k = lpK(160);
    for (let i = 0; i < d.length; i++) { const t = i / SR; br = (br + .02 * (rnd() * 2 - 1)) / 1.02; y += (br * 12 - y) * k; d[i] += y * Math.exp(-t / .6) * Math.min(1, t / .02) * .6; }
    crackle(d, 0, .35, (t) => 6000 * Math.exp(-t / .05), .0003, 1500, 8000, .6);
    crackle(d, .01, .9, (t) => 1200 * Math.exp(-t / .2), .002, 150, 1200, .55);
    clods(d, .2, 1.8, 30, .6);
    const s = buf(2.4); stick(s, .05, .8, (t) => 40 - 20 * t, (t) => Math.exp(-t / .3), .4); mix(d, modes(s, [[140, .04, 1], [330, .02, .6], [700, .01, .3]]), .4);
    return [norm(fadeEnds(d, .01), .9)];
  }
  function makeBloom() { // the flower opening: sepals peeling apart, petals creaking as they spread, then a breath of pollen
    const dur = 2.6, d = buf(dur + .4), f = svf();
    crackle(d, .05, 1.5, (t) => 120 + 500 * sm(0, 1.2, t), .0012, 500, 2600, .4);
    for (let k = 0; k < 5; k++) {
      const x = buf(dur + .4), t0 = .2 + k * .32 + rr(0, .15), ln = rr(.25, .5), r0 = rr(70, 140);
      stick(x, t0, ln, (t) => r0 * (1 + .8 * t / ln), (t) => env(t, ln * .3, ln * .2, ln * .5), .2);
      mix(d, modes(x, [[rr(500, 700), .012, 1], [rr(1200, 1600), .006, .5], [rr(2500, 3200), .003, .25]]), .4);
    }
    for (let i = 0; i < d.length; i++) { const e = env(i / SR - 1.6, .3, .2, .9); f.run(rnd() * 2 - 1, 900, 1.2); d[i] += f.bp * e * .3; }
    return [norm(fadeEnds(d, .02), .65)];
  }
  function makeGulp() { // the bud shutting on what it holds: a wet, low squeeze, and fibres creaking round it
    const d = buf(.9), f = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR; f.run(rnd() * 2 - 1, 260 - 120 * cl(t / .4, 0, 1), 6); d[i] = f.bp * env(t, .06, .1, .35); }
    const x = buf(.9); for (let k = 0; k < 6; k++) x[Math.round(rr(.03, .4) * SR)] = rr(.3, 1);
    mix(d, modes(x, [[rr(700, 900), .006, 1], [rr(1500, 1900), .003, .5]]), .25);
    const s = buf(.9); stick(s, .1, .5, (t) => 60 + 40 * t, (t) => env(t, .1, .2, .2), .3); mix(d, modes(s, [[220, .02, 1], [520, .01, .5]]), .3);
    return [norm(lowpass(fadeEnds(d, .01), 2500), .7)];
  }
  function makeShoots() { // Thornwood: the soil splitting, then cane after cane bursting up out of it
    const dur = 2.2, d = buf(dur + .6);
    crackle(d, 0, .6, (t) => 3000 * Math.exp(-t / .2), .0006, 300, 3000, .5);
    for (let k = 0; k < 7; k++) {
      const t0 = .25 + k * .17 + rr(0, .06), x = buf(dur + .6), f = svf(), ln = rr(.18, .3);
      push(x, t0, .008, rr(.6, 1)); mix(d, sat(modes(x, [[rr(80, 120), .04, 1], [rr(200, 280), .02, .5]]), 2), .5);
      crackle(d, t0, .15, (t) => 2500 * Math.exp(-t / .04), .0005, 800, 5000, .4);
      const n0 = Math.round(t0 * SR); for (let i = 0; i < ln * SR && n0 + i < d.length; i++) { const u = i / SR / ln, v = Math.sin(Math.PI * u); f.run(rnd() * 2 - 1, 300 + 1200 * u, 2); d[n0 + i] += f.bp * v * .35; }
      const s = buf(dur + .6); stick(s, t0 + .05, .3, (t) => 90 + 60 * t, (t) => env(t, .05, .1, .15), .3); mix(d, modes(s, wood(rr(.9, 1.3))), .3);
    }
    return [norm(fadeEnds(d, .01), .85)];
  }
  function makeThorns() { // a volley: thorns flicked off the canes whistle out, then patter down on the frozen ground
    const d = buf(1.8);
    for (let k = 0; k < 14; k++) { const t0 = rr(0, .35), f0 = rr(2500, 4200), len = rr(.07, .16), a = rr(.1, .25), n0 = Math.round(t0 * SR); let ph = 0; for (let i = 0; i < len * SR; i++) { const t = i / SR; ph += TAU * f0 * (1 - .35 * t / len) / SR; d[n0 + i] += Math.sin(ph) * env(t, .01, len * .3, len * .6) * a; } }
    const c = buf(1.8); for (let k = 0; k < 26; k++) c[Math.round((.45 + Math.pow(rnd(), .8) * 1.1) * SR)] = rr(.1, .5);
    mix(d, modes(c, [[rr(1800, 2600), .003, 1], [rr(4000, 5200), .0015, .4]]), .5);
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeSizzle() { // fire on it: sap hissing and spitting, leaves crackling as they curl
    const dur = 1.8, d = buf(dur + .2), f = svf();
    crackle(d, 0, dur, (t) => 500 * env(t, .1, .6, 1.1), .0003, 2500, 9000, .5);
    const x = buf(dur + .2); for (let k = 0; k < 25; k++) x[Math.round(rr(0, dur) * SR)] = rr(.2, 1);
    mix(d, modes(x, [[rr(1500, 2500), .002, 1], [rr(500, 900), .004, .5]]), .6);
    for (let i = 0; i < d.length; i++) { f.run(rnd() * 2 - 1, 5000, .7); d[i] += f.hi * env(i / SR, .15, .5, 1.1) * .05; }
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeCrash() { // felled: the spire's wood giving way in a long tearing creak, a split, and the fall into its thicket
    const d = buf(4.2), s = buf(4.2), x = buf(4.2), y = buf(4.2);
    stick(s, 0, 1.6, (t) => 15 + 35 * t, (t) => .3 + .7 * sm(0, 1.6, t), .4); mix(d, modes(s, [[110, .05, 1], [240, .03, .7], [520, .015, .4], [1100, .006, .2]]), .6);
    push(x, 1.6, .003, 1); mix(d, modes(x, [[220, .1, 1], [560, .06, .6], [1200, .03, .3], [2600, .015, .2]]), .7);
    crackle(d, 1.6, .4, (t) => 4000 * Math.exp(-t / .06), .0004, 800, 7000, .55);
    push(y, 2.4, .01, 1); push(y, 2.43, .01, .6); mix(d, sat(modes(y, [[45, .25, 1], [90, .15, .7], [190, .06, .4]]), 3), .9);
    crackle(d, 2.3, 1.6, (t) => 2500 * Math.exp(-t / .4), .0007, 1000, 6000, .35);
    return [norm(fadeEnds(d, .02), .9)];
  }

  // ---------- the night ----------
  // the wind: a 36 second loop in stereo that joins up without a seam. Not a steady hiss: gusts of different strengths
  // every few seconds with calm spells between, dark and low when it is light, opening as a gust comes through, and
  // reaching one ear a moment before the other.
  function makeWind() {
    const N = 36, X = 3, len = Math.round((N + X) * SR), nN = Math.round(N * SR), nX = Math.round(X * SR), out = [];
    const pts = []; let t = 0; while (t < N - 2) { pts.push([t, .15 + .85 * Math.pow(rnd(), 1.4)]); t += rr(2.5, 6); } pts.push([N, pts[0][1]]);
    for (let i = 0; i < 3; i++) { const j = 1 + Math.floor(rnd() * (pts.length - 2)); pts[j][1] = .04; }
    const G = (tt) => { tt = ((tt % N) + N) % N; let i = 0; while (i < pts.length - 2 && tt > pts[i + 1][0]) i++; const [a, va] = pts[i], [b, vb] = pts[i + 1], s = sm(a, b, tt); return va + (vb - va) * s; };
    for (let c = 0; c < 2; c++) {
      const d = new Float32Array(len), fLow = svf(), fRush = svf(), lag = c ? .5 : 0;
      let br = 0, p0 = 0, p1 = 0, p2 = 0, lp = 0, flut = 0, gs = G(-lag);
      for (let i = 0; i < len; i++) {
        const g = G(i / SR - lag), w = rnd() * 2 - 1;
        gs += (g - gs) * .0005;
        br = (br + .02 * w) / 1.02;
        p0 = .99765 * p0 + w * .099046; p1 = .963 * p1 + w * .2965164; p2 = .57 * p2 + w * 1.0526913;
        fLow.run(br * 7, 140 + 520 * gs, .8);                                       // the roar of it in the trees
        fRush.run((p0 + p1 + p2 + w * .1848) * .2, 300 + 900 * gs, 1.1);             // the rush through the needles
        lp += (w - lp) * lpK(2600); flut += (rnd() - flut) * lpK(9);
        d[i] = fLow.lo * .6 * Math.pow(gs, 1.6) + fRush.bp * .5 * gs * gs + lp * .02 * gs * gs * gs * (.3 + .7 * flut);
      }
      for (let i = 0; i < nX; i++) { const k = i / nX; d[i] = d[i] * Math.sqrt(k) + d[nN + i] * Math.sqrt(1 - k); }
      out.push(d.slice(0, nN));
    }
    const m = Math.max(peak(out[0]), peak(out[1])); out.forEach((d) => { for (let i = 0; i < d.length; i++) d[i] *= .6 / m; });
    return out;
  }
  function makeEagleOwl(v) { // "oo-HOO": a soft short note, then the deep one, rising a little and falling away
    const d = buf(1.7), f0 = 290 + v * 16;
    voice(d, .05, .32, (t) => f0 * (.97 + .05 * Math.sin(Math.PI * t / .32)), (t) => env(t, .06, .1, .16) * .5, [1, .16, .05], .06);
    voice(d, .5, .95, (t) => f0 * 1.12 * (1 + .04 * Math.sin(Math.PI * Math.min(1, t / .5)) - .06 * t), (t) => env(t, .08, .35, .5), [1, .18, .06], .06);
    return [norm(lowpass(fadeEnds(d, .02), 1600), .8)];
  }
  function makeTawny() { // "hoooo" ... then "hu", and "hu-hoo-oo-oo-oo", quavering
    const d = buf(7.6), f = 600;
    voice(d, .05, 1.1, (t) => f * (1.02 - .07 * t), (t) => env(t, .1, .5, .5), [1, .1, .03], .07);
    voice(d, 4.1, .22, () => f * .96, (t) => env(t, .03, .05, .12) * .7, [1, .1], .06);
    voice(d, 4.95, 2.4, (t) => f * (1.03 - .06 * t / 2.4) * (1 + .02 * Math.sin(TAU * 6.5 * t)), (t) => env(t, .08, 1.4, .85) * (.66 + .34 * Math.sin(TAU * (7.5 - .5 * t) * t)), [1, .12, .03], .07);
    return [norm(lowpass(fadeEnds(d, .02), 2200), .7)];
  }
  // ice sings: a crack sends a wave through the sheet whose high notes travel faster than its low ones, so each crack
  // arrives as a falling, ringing note, with the far shore's echoes after it
  function chirp(d, t0, f0, f1, tau, dec, g) {
    let ph = 0; const n0 = Math.round(t0 * SR), n = Math.round(dec * 6 * SR);
    for (let i = 0; i < n && n0 + i < d.length; i++) { const t = i / SR; ph += TAU * (f1 + (f0 - f1) * Math.exp(-t / tau)) / SR; d[n0 + i] += Math.sin(ph) * g * Math.exp(-t / dec) * Math.min(1, t / .002); }
  }
  function makeIce() {
    const d = buf(3), base = rr(.75, 1.25), n = 1 + Math.floor(rnd() * 3); let t0 = .05;
    for (let k = 0; k < n; k++) {
      const g = k ? rr(.4, .8) : 1, f0 = rr(3000, 5000) * base, f1 = rr(170, 320) * base, tau = rr(.05, .1);
      chirp(d, t0, f0, f1, tau, rr(.18, .3), g); chirp(d, t0 + rr(.05, .09), f0 * .9, f1 * 1.05, tau * 1.2, .2, g * .45); chirp(d, t0 + rr(.13, .2), f0 * .8, f1, tau * 1.4, .25, g * .22);
      const c0 = Math.round(t0 * SR); for (let i = 0; i < 120; i++) d[c0 + i] += (rnd() * 2 - 1) * g * .35 * Math.exp(-i / 20);
      t0 += rr(.2, .6);
    }
    return [norm(fadeEnds(d, .01), .6)];
  }
  function makeBoom() { // the ice settling: a deep boom rolling across the lake, rich enough to hear on small speakers
    const d = buf(4); let ph = 0, br = 0; const f = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR; ph += TAU * (52 + 30 * Math.exp(-t / .25)) / SR; br = (br + .02 * (rnd() * 2 - 1)) / 1.02; f.run(br * 10, 260 + 300 * Math.exp(-t / .3), .9); d[i] = Math.tanh(2.2 * Math.sin(ph)) * Math.exp(-t / .9) * Math.min(1, t / .012) * .7 + f.lo * Math.exp(-t / 1.3) * Math.min(1, t / .04) * .9; }
    chirp(d, .06, 1100, 80, .14, .5, .3);
    return [norm(fadeEnds(d, .01), .85)];
  }
  function makeTseep() { const d = buf(.5), f = rr(6600, 7600); voice(d, .02, .38, (t) => f * (1 - .1 * t / .38), (t) => env(t, .05, .08, .22), [1], 0); return [norm(fadeEnds(d, .01), .5)]; }
  function makeTreeCrack() { // a trunk splitting in the cold: a sharp report, the ring of the wood, a short tearing
    const d = buf(1.4), md = [[rr(180, 260), .12], [rr(480, 640), .07], [rr(1000, 1400), .04], [rr(2200, 2900), .02]];
    for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; for (const [fq, dc] of md) s += Math.sin(TAU * fq * t) * Math.exp(-t / dc); d[i] = s * .5 + (rnd() * 2 - 1) * Math.exp(-t / .006) * 1.4 + (t > .02 && t < .3 ? (rnd() * 2 - 1) * .12 * Math.exp(-(t - .02) / .08) : 0); }
    return [norm(lowpass(fadeEnds(d, .004), 5200), .8)];
  }
  function howl(d, t0, f0, len, g) {
    const fall = .9;
    voice(d, t0, len, (t) => { const up = Math.min(1, t / .7); let hz = f0 * (.66 + .34 * (1 - Math.pow(1 - up, 2))); if (t > len - fall) hz *= 1 - .3 * Math.pow((t - (len - fall)) / fall, 1.5); return hz * (1 + .012 * Math.sin(TAU * 4.6 * t)); }, (t) => env(t, .45, len - 1.2, .7) * g, [1, .3, .1, .04], .05);
  }
  function makeWolves() { const d = buf(6.4); howl(d, .05, 520, 4.3, 1); howl(d, 1.5, 625, 3.7, .7); return [norm(lowpass(fadeEnds(d, .05), 1800), .6)]; }
  // the place: a snowy meadow ringed by forest, about two and a half seconds of tail, darker as it dies, the forest edge
  // throwing an echo back
  function makeVerb() {
    const len = Math.round(3 * SR), out = [];
    for (let c = 0; c < 2; c++) {
      const d = new Float32Array(len); let y = 0;
      for (let i = 0; i < len; i++) { const t = i / SR, k = .5 - .45 * Math.min(1, t / 2.4); y += (rnd() * 2 - 1 - y) * k; d[i] = t < .012 ? 0 : y * Math.exp(-t * 2.6); }
      for (const [t, g] of [[.031, .5], [.047, .35], [.073, .3], [.38, .2], [.41, .16], [.47, .1]]) { const n = Math.round((t + (c ? .004 : 0)) * SR); for (let j = 0; j < 220; j++) d[n + j] += (rnd() * 2 - 1) * g * Math.exp(-j / 60); }
      out.push(d);
    }
    return out;
  }

  // what to build, in the order it is needed: the Bramble's quiet sounds first, the night last
  const MAKE = { verb: makeVerb, heart0: makeHeart };
  const add = (id, fns) => fns.forEach((f, i) => { MAKE[id + i] = f; });
  add('creak', [makeCreak, makeCreak, makeCreak, makeCreak]); add('rustle', [() => makeRustle(.8), () => makeRustle(1.3), () => makeRustle(2)]);
  add('step', [makeStep, makeStep, makeStep, makeStep]); add('pull', [makePull, makePull, makePull]);
  MAKE.breath0 = makeBreath; MAKE.groan0 = makeGroan; add('swish', [() => makeSwish(.45), () => makeSwish(.7), () => makeSwish(1)]); add('impact', [makeImpact, makeImpact]);
  MAKE.heavy0 = makeHeavy; MAKE.bloom0 = makeBloom; MAKE.gulp0 = makeGulp; MAKE.shoots0 = makeShoots; MAKE.thorns0 = makeThorns; MAKE.sizzle0 = makeSizzle; MAKE.crash0 = makeCrash;
  Object.assign(MAKE, { wind: makeWind, owl0: () => makeEagleOwl(0), owl1: () => makeEagleOwl(1), ice0: makeIce, ice1: makeIce, ice2: makeIce, boom: makeBoom,
    tseep0: makeTseep, tseep1: makeTseep, tseep2: makeTseep, treeCrack: makeTreeCrack, treeCreak0: makeCreak, treeCreak1: makeCreak, tawny: makeTawny, wolves: makeWolves });
  const PICK = { owl: ['owl0', 'owl1'], tawny: ['tawny'], ice: ['ice0', 'ice1', 'ice2', 'ice0', 'boom'], redwings: ['tseep0', 'tseep1', 'tseep2'], trees: ['treeCrack', 'treeCreak0', 'treeCreak1'], wolves: ['wolves'] };

  // ---------- playing ----------
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC({ sampleRate: 44100 }); } catch (e) { ctx = new AC(); }
    SR = ctx.sampleRate;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
    master.connect(comp); comp.connect(ctx.destination);
    for (const g in GROUP) { const b = ctx.createGain(); b.gain.value = GROUP[g].v; b.connect(master); GROUP[g].bus = b; }
    wet = ctx.createGain(); wet.connect(master);
    const t0 = performance.now(), names = Object.keys(MAKE); let i = 0;
    const step = () => { // one at a time, so the page keeps moving while they are made
      if (!ctx) return; // cutscene: closed before they were all made
      if (i >= names.length) { renderMs = performance.now() - t0; ready = true; return; }
      const k = names[i++];
      try { const chs = MAKE[k](), b = ctx.createBuffer(chs.length, chs[0].length, SR); chs.forEach((d, c) => b.copyToChannel(d, c)); BUF[k] = b; } catch (e) { /* that one is left out */ }
      if (k === 'verb' && BUF.verb) { const v = ctx.createConvolver(); v.buffer = BUF.verb; wet.disconnect(); wet.connect(v); v.connect(master); }
      if (k === 'wind') startWind();
      if (k === 'wolves') for (const id in L) if (L[id].every) L[id].next = rr(8, L[id].every[0] * .5);
      setTimeout(step, 0);
    };
    step();
  }
  function windTarget() { return L.wind.on ? L.wind.level * Math.pow(cl(windV / .6, 0, 2), .8) : 0; }
  function startWind() {
    if (!BUF.wind) return;
    const s = ctx.createBufferSource(); s.buffer = BUF.wind; s.loop = true;
    windGain = ctx.createGain(); windGain.gain.value = 0; s.connect(windGain); windGain.connect(GROUP.night.bus);
    const send = ctx.createGain(); send.gain.value = .15; windGain.connect(send); send.connect(wet);
    s.start(ctx.currentTime + .05, rr(0, 30)); windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, 2);
  }
  // one sound, placed: pan -1 (left) to 1 (right); far 0 (close) to 1 (far off: quieter, duller, more of the meadow)
  function place(b, bus, at, pan, far, g, bright) {
    const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (rnd() - .5) * .05;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 15000 : 12000 - 9000 * far; lp.Q.value = .5;
    const gn = ctx.createGain(); gn.gain.value = g * (1 - .55 * far);
    s.connect(lp); lp.connect(gn); let tail = gn;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = cl(pan || 0, -1, 1); gn.connect(p); tail = p; }
    const dry = ctx.createGain(); dry.gain.value = 1 - .6 * far; tail.connect(dry); dry.connect(bus);
    const send = ctx.createGain(); send.gain.value = .12 + .6 * far; tail.connect(send); send.connect(wet);
    s.start(at);
  }
  // one of the Bramble's sounds; a few of them silence the night for a while
  function bramble(id, o) {
    const l = L[id]; o = o || {}; if (!ready && !(l && BUF[id + '0'])) return; if (!ctx || !l || l.fam !== 'bramble' || (!l.on && !o.force)) return;
    let v = Math.floor(rnd() * l.n); if (l.n > 1 && v === l.last) v = (v + 1) % l.n; l.last = v;
    const b = BUF[id + v] || BUF[id + '0']; if (!b) return;
    place(b, GROUP.bramble.bus, ctx.currentTime + .01 + (o.delay || 0), o.pan || 0, cl(o.far || 0, 0, 1), (o.gain === undefined ? 1 : o.gain) * l.level);
    if (id === 'groan' || id === 'heavy' || id === 'crash' || id === 'shoots') hush(35);
  }
  // one of the night's
  function night(id, o) {
    const l = L[id], names = PICK[id]; if (!ready || !ctx || !l || !names) return; o = o || {};
    const t = ctx.currentTime + .03, g = (o.gain === undefined ? 1 : o.gain) * l.level, one = () => BUF[names[Math.floor(rnd() * names.length)]];
    const pan = o.pan === undefined ? rr(-.9, .9) : o.pan, far = o.far === undefined ? rr(.45, .9) : o.far, bus = GROUP.night.bus;
    if (l.next < l.every[0] * .5) l.next = l.every[0] * .5;
    if (id === 'owl') { const n = 2 + Math.floor(rnd() * 2), b = one(); for (let k = 0; k < n; k++) place(b, bus, t + k * rr(5.5, 8.5), pan, far, g); return; }
    if (id === 'redwings') { const n = 2 + Math.floor(rnd() * 3); let p = pan, at = t; for (let k = 0; k < n; k++) { place(one(), bus, at, p, cl(far - .35, .1, .6), g * rr(.6, 1), true); p = cl(p + rr(-.45, .45), -1, 1); at += rr(.6, 2.6); } return; }
    const pick = o.pick && BUF[o.pick] ? o.pick : names[Math.floor(rnd() * names.length)];
    place(BUF[pick], bus, t, pan, id === 'wolves' ? Math.max(.85, far) : far, g * (pick === 'boom' ? 1.1 : 1));
  }
  function hush(secs) { for (const id in L) if (L[id].every) L[id].next = Math.max(L[id].next, secs + rr(0, 10)); }
  // each kind of night sound calls again after a while; quiet (while the Bramble hunts) and hold (in the sound check) stop them
  function tick(dt) {
    if (!ready || muted || quiet || hold) return;
    for (const id in L) { const l = L[id]; if (!l.every || !l.on) continue; l.next -= dt; if (l.next <= 0) { night(id); l.next = rr(l.every[0], l.every[1]); } }
  }
  function settings() { const o = { groups: {}, layers: {} }; for (const g in GROUP) o.groups[g] = GROUP[g].v; for (const id in L) o.layers[id] = [L[id].on ? 1 : 0, L[id].level]; return o; }
  function load(s) {
    if (!s || typeof s !== 'object') return;
    if (s.groups) for (const g in GROUP) if (typeof s.groups[g] === 'number') api.setGroup(g, s.groups[g]);
    if (s.layers) for (const id in L) { const v = s.layers[id]; if (Array.isArray(v)) { api.setOn(id, !!v[0]); if (typeof v[1] === 'number') api.setLevel(id, v[1]); } }
  }
  const api = {
    init, bramble, night, tick, hush, settings, load,
    list: Object.values(L).map((l) => ({ id: l.id, name: l.name, desc: l.desc, fam: l.fam, start: l.start, bed: !!l.bed })),
    setQuiet(on) { on = !!on; if (quiet && !on) for (const id in L) if (L[id].every) L[id].next = rr(4, L[id].every[0] * .4); quiet = on; },
    setHold(on) { hold = !!on; },
    setWind(v) { windV = v; if (windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .8); },
    setLevel(id, v) { const l = L[id]; if (!l) return; l.level = cl(v, 0, 1.5); if (l.bed && windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .2); },
    level: (id) => (L[id] ? L[id].level : 0), on: (id) => (L[id] ? L[id].on : false),
    setOn(id, on) { const l = L[id]; if (!l) return; l.on = !!on; if (l.bed && windGain) windGain.gain.setTargetAtTime(windTarget(), ctx.currentTime, .4); },
    setGroup(g, v) { if (!GROUP[g]) return; GROUP[g].v = cl(v, 0, 1.5); if (GROUP[g].bus) GROUP[g].bus.gain.setTargetAtTime(GROUP[g].v, ctx.currentTime, .1); },
    group: (g) => (GROUP[g] ? GROUP[g].v : 0),
    setMuted(on) { muted = !!on; if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .08); },
    reset() { for (const id in L) { api.setOn(id, true); api.setLevel(id, L[id].start); } api.setGroup('bramble', .9); api.setGroup('night', .55); },
    get muted() { return muted; }, get ready() { return ready; }, get renderMs() { return renderMs; }, get started() { return !!ctx; },
    get ctx() { return ctx; }, get wet() { return wet; }, bus: (g) => (GROUP[g] ? GROUP[g].bus : null), // cutscene: a way in for the cutscene's own sounds
    close() { const c = ctx; ctx = null; ready = false; if (c && c.close) return c.close().catch(() => {}); }, // cutscene: shut the context when it ends
    // for headless checks: build one sound and give back its channels
    _build(name, sr) { SR = sr || 44100; return MAKE[name](); }, _names: () => Object.keys(MAKE)
  };
  return api;
}
