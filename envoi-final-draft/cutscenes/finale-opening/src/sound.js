// sound.js: every sound in the finale's opening, made in code when the page may make sound (after a tap): no recordings.
// Beds that run under the whole scene: the wind over the peaks, coming in gusts, with a thin whistle high in it; the
// empty well's hush, a low hollow breath out of nothing; a low drone for music (the game's Music volume; Chris's songs,
// or the game's own "Beneath the Stone", could take its place later); and the braziers burning low, heard only near
// them. And one-shots: frost cracking in the cold, a banner snapping in a gust, footsteps on frosted stone, Sol's blade
// lighting, Halcyon's blade turning as she takes her stance, Noctara's rite as she opens her arms to the eclipse, and a
// great bell far down in Misthollow, tolling once as the longest night begins. Everything plays through one reverb shaped
// like a stone court high among mountains.
// Defines makeMoonwellSounds() only, with the interface player.js uses: { init(), ready, setVolumes({ music, effects,
//   surroundings }), setWind(v), tick(dt), setQuiet(on), hush(seconds), night(id, { gain, pan, far }) (a bed's level, or a
//   one-shot of the place's), play(id, { gain, pan, far }) (a one-shot effect), bramble(id, o) (the same as play),
//   setMuted(on), muted, close(), ctx, bus(group), wet }.
function makeMoonwellSounds() {
  'use strict';
  const TAU = Math.PI * 2;
  let SR = 44100, ctx = null, master = null, wet = null, ready = false, muted = false, quiet = false, hushT = 0;
  const VOL = { music: 1, effects: 1, surroundings: 1 }, BUS = {}, BED = {}, BUF = {};
  let seed = 3203; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const buf = (s) => new Float32Array(Math.ceil(s * SR));
  const env = (x, a, h, r) => (x < 0 ? 0 : x < a ? .5 - .5 * Math.cos(Math.PI * x / a) : x < a + h ? 1 : x < a + h + r ? .5 + .5 * Math.cos(Math.PI * (x - a - h) / r) : 0);
  function svf() { const f = { lo: 0, bp: 0, hi: 0 }; f.run = (x, hz, q) => { const F = 2 * Math.sin(Math.PI * Math.min(hz, SR * .2) / SR); f.lo += F * f.bp; f.hi = x - f.lo - f.bp / Math.max(q, .5); f.bp += F * f.hi; }; return f; }
  function norm(d, to) { let m = 1e-9; for (const v of d) m = Math.max(m, Math.abs(v)); for (let i = 0; i < d.length; i++) d[i] *= to / m; return d; }
  // a loop that joins smoothly: its last second crossfaded into its first
  function looped(d, fade) { const n = Math.round(fade * SR), L = d.length - n, out = new Float32Array(L); for (let i = 0; i < L; i++) out[i] = d[i]; for (let i = 0; i < n; i++) { const k = i / n; out[i] = d[i] * k + d[L + i] * (1 - k); } return out; }
  function modes(x, list) { const y = new Float32Array(x.length); for (const [f, tau, g] of list) { const r = Math.exp(-1 / (tau * SR)), w = TAU * Math.min(f, SR * .45) / SR, a1 = 2 * r * Math.cos(w), a2 = -r * r, s = Math.sin(w); let y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i] * s + a1 * y1 + a2 * y2; y2 = y1; y1 = v; y[i] += v * g; } } return y; }

  // ---------- the beds ----------
  function makeWind() {
    const len = 24, L = buf(len), R = buf(len), fl = svf(), fr = svf(), wh = svf();
    let g = 0, gt = .4, gn = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / SR;
      if (--gn <= 0) { gt = rr(.15, 1); gn = Math.round(rr(1.5, 4.5) * SR); }
      g += (gt - g) * .00002;
      const n1 = rnd() * 2 - 1, n2 = rnd() * 2 - 1;
      fl.run(n1, 280 + 520 * g, .7); fr.run(n2, 300 + 560 * g, .7); wh.run(n1 * .5 + n2 * .5, 1500 + 700 * Math.sin(t * .37) + 500 * g, 9);
      const w = (.35 + .9 * g);
      L[i] = (fl.bp * .9 + fl.lo * .25) * w + wh.bp * .08 * g * g; R[i] = (fr.bp * .9 + fr.lo * .25) * w + wh.bp * .07 * g * g;
    }
    return [looped(norm(L, .8), 2), looped(norm(R, .8), 2)];
  }
  // the empty well: a low hollow breath, as wind over a deep shaft
  function makeHush() {
    const len = 16, d = buf(len), f = svf(), f2 = svf();
    for (let i = 0; i < d.length; i++) { const t = i / SR, n = rnd() * 2 - 1; f.run(n, 62 + 4 * Math.sin(t * .4), 9); f2.run(n, 124 + 6 * Math.sin(t * .27 + 1), 7); d[i] = (f.bp * 1.1 + f2.bp * .45) * (.7 + .3 * Math.sin(t * TAU / 8)); }
    return [looped(norm(d, .7), 2)];
  }
  // music: a low drone in A minor, swelling slowly, very soft (strings and a far choir, more felt than heard)
  function makeDrone() {
    const len = 32, L = buf(len), R = buf(len), notes = [55, 82.41, 110, 130.81, 164.81], ph = notes.map(() => [rnd() * TAU, rnd() * TAU]), fl = svf(), fr = svf();
    for (let i = 0; i < L.length; i++) {
      const t = i / SR; let a = 0, b = 0;
      notes.forEach((f, k) => {
        const sw = .5 + .5 * Math.sin(TAU * t / (16 + k * 3) + k), amp = (k === 0 ? .5 : k === 2 ? .35 : .22) * (.55 + .45 * sw);
        ph[k][0] += TAU * f * (1 + .0012) / SR; ph[k][1] += TAU * f * (1 - .0012) / SR;
        // a soft saw for each voice, two of them a hair apart
        const s1 = ((ph[k][0] / TAU) % 1) * 2 - 1, s2 = ((ph[k][1] / TAU) % 1) * 2 - 1; a += s1 * amp; b += s2 * amp;
      });
      fl.run(a, 360 + 90 * Math.sin(t * .2), .8); fr.run(b, 380 + 90 * Math.sin(t * .23 + 1), .8);
      L[i] = fl.lo; R[i] = fr.lo;
    }
    return [looped(norm(L, .7), 3), looped(norm(R, .7), 3)];
  }
  // the braziers: coals ticking and settling, a low breath of flame
  function makeFire() {
    const len = 10, d = buf(len), f = svf(), g = svf();
    for (let i = 0; i < d.length; i++) {
      const t = i / SR, n = rnd() * 2 - 1; f.run(n, 700, .6); g.run(n, 190, .7);
      const tick = rnd() < .0009 ? (rnd() * 2 - 1) * rr(.5, 1.6) : 0;
      d[i] = g.lo * (.5 + .2 * Math.sin(t * 3.1)) + f.bp * .08 + tick;
    }
    const o = modes(d, [[1800, .01, .3], [3200, .006, .2]]); for (let i = 0; i < d.length; i++) d[i] = d[i] * .8 + o[i];
    return [looped(norm(d, .7), 1)];
  }
  // ---------- one-shots ----------
  function makeCrack() { const len = .7, x = buf(len), d = buf(len); x[0] = 1; for (let i = 1; i < 60; i++) x[i] = (rnd() * 2 - 1) * Math.exp(-i / 18); const m = modes(x, [[rr(2600, 3800), .03, 1], [rr(5200, 6800), .015, .5], [rr(900, 1400), .05, .3]]); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = m[i] + (rnd() < .02 * Math.exp(-t / .12) ? (rnd() * 2 - 1) * .4 : 0); } return [norm(d, .8)]; }
  function makeFlap() { const len = .9, d = buf(len), f = svf(); for (let i = 0; i < d.length; i++) { const t = i / SR, k = Math.sin(TAU * 7 * t) > .3 ? 1 : .2; f.run(rnd() * 2 - 1, 900 + 600 * Math.sin(t * 23), 1.4); d[i] = f.bp * k * env(t, .05, .4, .4); } return [norm(d, .7)]; }
  function makeStep() { const len = .32, d = buf(len), f = svf(), g = svf(); let th = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; th += (rnd() * 2 - 1 - th) * .03; g.run(th, 160, .8); const c = rnd() < .1 * Math.exp(-t / .05) ? (rnd() * 2 - 1) : 0; f.run(c + (rnd() * 2 - 1) * .04 * Math.exp(-t / .04), 3000 + 1500 * rnd(), 1.6); d[i] = g.lo * 2.6 * env(t, .003, .015, .07) + f.bp * .8 * env(t, .002, .03, .12); } return [norm(d, .8)]; }
  function makeBlade() {
    const len = 2.2, d = buf(len), f = svf(), ph = [0, 0, 0, 0];
    for (let i = 0; i < d.length; i++) {
      const t = i / SR, sw = Math.min(1, t / .45); f.run(rnd() * 2 - 1, 500 + 3200 * sw * sw, 2.2);
      const hz = 98 + 14 * Math.min(1, t / .8); ph[0] += TAU * hz / SR; ph[1] += TAU * hz * 2.003 / SR; ph[2] += TAU * hz * 3.01 / SR; ph[3] += TAU * 1180 * (1 + .002 * Math.sin(t * 9)) / SR;
      d[i] = f.bp * env(t, .25, .1, .5) * .9 + (Math.sin(ph[0]) * .6 + Math.sin(ph[1]) * .3 + Math.sin(ph[2]) * .12) * env(t, .5, .5, 1.1) * .5 + Math.sin(ph[3]) * env(t, .35, .25, 1.2) * .07 * (.6 + .4 * Math.sin(t * 23));
    }
    return [norm(d, .75)];
  }
  // Halcyon's blade turning as she takes her stance: a long scrape of steel and a cold ring
  function makeVow() {
    const len = 2.6, x = buf(len), d = buf(len), f = svf();
    for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (rnd() * 2 - 1) * env(t, .02, .35, .3) * .2; }
    const ring = modes(x, [[1318, .9, 1], [2120, .6, .5], [3311, .35, .3], [658, 1.2, .3]]);
    for (let i = 0; i < d.length; i++) { const t = i / SR; f.run(rnd() * 2 - 1, 4200 - 2400 * Math.min(1, t / .6), 3); d[i] = f.bp * env(t, .03, .4, .25) * .5 + ring[i] * .9; }
    return [norm(d, .7)];
  }
  // Noctara's rite: a dark swell from below, and over it a glassy shimmer, the stars rising out of her lining
  function makeRite() {
    const len = 6, L = buf(len), R = buf(len), ph = [0, 0, 0], f = svf();
    for (let i = 0; i < L.length; i++) {
      const t = i / SR, sw = env(t, 1.6, 2.4, 2); ph[0] += TAU * 41.2 / SR; ph[1] += TAU * 61.7 / SR; ph[2] += TAU * 82.4 * (1 + .003 * Math.sin(t * 5)) / SR;
      f.run(rnd() * 2 - 1, 120 + 300 * sw, 1.2);
      const low = (Math.sin(ph[0]) * .6 + Math.sin(ph[1]) * .35 + Math.sin(ph[2]) * .25) * sw + f.bp * .3 * sw;
      let sh = 0; for (let k = 0; k < 5; k++) sh += Math.sin(TAU * (1760 + k * 330 + 40 * Math.sin(t * (1.3 + k))) * t) * (.5 + .5 * Math.sin(t * (7 + k * 3) + k));
      const shim = sh * .03 * env(t, 2.2, 1.6, 2);
      L[i] = low + shim * (.6 + .4 * Math.sin(t * 2.1)); R[i] = low * .96 + shim * (.6 + .4 * Math.cos(t * 1.9));
    }
    return [norm(L, .8), norm(R, .8)];
  }
  // a great bell, far down in the town: one toll, its hum lasting long after
  function makeBell() { const len = 9, x = buf(len); for (let i = 0; i < 80; i++) x[i] = (rnd() * 2 - 1) * (1 - i / 80); const d = modes(x, [[98, 4.5, 1], [196.5, 3.2, .6], [233, 2.6, .5], [293.7, 2, .4], [392, 1.4, .3], [523, .9, .2], [784, .5, .12]]); return [norm(d, .8)]; }
  const MAKE = { verb: null, wind: makeWind, hush: makeHush, drone: makeDrone, fire: makeFire, crack0: makeCrack, crack1: makeCrack, flap0: makeFlap, flap1: makeFlap, step0: makeStep, step1: makeStep, step2: makeStep, blade0: makeBlade, vow0: makeVow, rite0: makeRite, bell0: makeBell };
  // the reverb: a stone court open to the mountains, a long, dark tail
  function makeVerb() { const len = 3.4, L = buf(len), R = buf(len); for (let i = 0; i < L.length; i++) { const t = i / SR, e = Math.pow(1 - t / len, 3.2) * (t < .012 ? t / .012 : 1); L[i] = (rnd() * 2 - 1) * e; R[i] = (rnd() * 2 - 1) * e; } const fl = svf(), fr = svf(); for (let i = 0; i < L.length; i++) { fl.run(L[i], 5200 - 3800 * i / L.length, .7); fr.run(R[i], 5200 - 3800 * i / R.length, .7); L[i] = fl.lo; R[i] = fr.lo; } return [L, R]; }
  MAKE.verb = makeVerb;
  const LEVEL = { wind: .45, hush: .32, drone: .3, fire: 0, crack: .3, flap: .32, step: .3, blade: .7, vow: .6, rite: .75, bell: .55 };
  const FAM = { wind: 'surroundings', hush: 'surroundings', drone: 'music', fire: 'surroundings', crack: 'surroundings', flap: 'surroundings', step: 'effects', blade: 'effects', vow: 'effects', rite: 'effects', bell: 'surroundings' };
  const next = { crack: 6, flap: 9 };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC({ sampleRate: 44100 }); } catch (e) { ctx = new AC(); }
    SR = ctx.sampleRate;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .3;
    master.connect(comp); comp.connect(ctx.destination);
    for (const g of ['music', 'effects', 'surroundings']) { const b = ctx.createGain(); b.gain.value = VOL[g]; b.connect(master); BUS[g] = b; }
    wet = ctx.createGain(); wet.connect(master);
    const names = Object.keys(MAKE); let i = 0;
    const step = () => {
      if (!ctx) return;
      if (i >= names.length) { ready = true; return; }
      const k = names[i++];
      try { const chs = MAKE[k](), b = ctx.createBuffer(chs.length, chs[0].length, SR); chs.forEach((d, c) => b.copyToChannel(d, c)); BUF[k] = b; } catch (e) { /* left out */ }
      if (k === 'verb' && BUF.verb) { const v = ctx.createConvolver(); v.buffer = BUF.verb; wet.disconnect(); wet.connect(v); v.connect(master); }
      if (['wind', 'hush', 'drone', 'fire'].includes(k)) startBed(k);
      setTimeout(step, 0);
    };
    step();
  }
  function startBed(id) {
    if (!BUF[id] || BED[id]) return;
    const s = ctx.createBufferSource(); s.buffer = BUF[id]; s.loop = true;
    const g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(BUS[FAM[id]]);
    const send = ctx.createGain(); send.gain.value = id === 'drone' ? .35 : .2; g.connect(send); send.connect(wet);
    // (a level asked for before the bed was made is kept for it)
    const want = BED['_' + id]; s.start(ctx.currentTime + .05, rr(0, BUF[id].duration * .8)); BED[id] = { s, g, level: want !== undefined ? want : id === 'fire' ? 0 : 1 };
    g.gain.setTargetAtTime(LEVEL[id] * BED[id].level, ctx.currentTime, 2);
  }
  function bedTo(id, v, secs) { const B = BED[id]; if (!B || !ctx) { if (BED[id] === undefined) BED['_' + id] = v; return; } B.level = v; B.g.gain.setTargetAtTime(LEVEL[id] * v * (quiet && id !== 'drone' ? .5 : 1), ctx.currentTime, secs || 1.2); }
  function place(b, bus, at, pan, far, g) {
    const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (rnd() - .5) * .04;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 14000 - 10000 * far;
    const gn = ctx.createGain(); gn.gain.value = g * (1 - .5 * far);
    s.connect(lp); lp.connect(gn); let tail = gn;
    if (ctx.createStereoPanner && b.numberOfChannels === 1) { const p = ctx.createStereoPanner(); p.pan.value = cl(pan || 0, -1, 1); gn.connect(p); tail = p; }
    const dry = ctx.createGain(); dry.gain.value = 1 - .55 * far; tail.connect(dry); dry.connect(bus);
    const send = ctx.createGain(); send.gain.value = .15 + .55 * far; tail.connect(send); send.connect(wet);
    s.start(at);
  }
  function play(id, o) {
    o = o || {}; if (!ctx || !ready && !BUF[id + '0']) return;
    const n = ['crack', 'flap', 'step'].includes(id) ? (id === 'step' ? 3 : 2) : 1, b = BUF[id + Math.floor(rnd() * n)] || BUF[id + '0']; if (!b) return;
    place(b, BUS[FAM[id]] || BUS.effects, ctx.currentTime + .01 + (o.delay || 0), o.pan || 0, cl(o.far || 0, 0, 1), (o.gain === undefined ? 1 : o.gain) * (LEVEL[id] || .5));
  }
  const api = {
    init, play, bramble: play,
    get ready() { return ready; }, get muted() { return muted; }, get ctx() { return ctx; }, get wet() { return wet; },
    bus: (g) => BUS[g === 'bramble' ? 'effects' : g === 'night' ? 'surroundings' : g] || null,
    setVolumes(v) { Object.assign(VOL, v || {}); for (const g in BUS) BUS[g].gain.setTargetAtTime(VOL[g], ctx.currentTime, .1); },
    setGroup(g, v) { const k = g === 'bramble' ? 'effects' : g === 'night' ? 'surroundings' : g; VOL[k] = v; if (BUS[k]) BUS[k].gain.setTargetAtTime(v, ctx.currentTime, .1); },
    setWind(v) { bedTo('wind', cl(v / .5, 0, 2), 1.5); },
    // a bed's level ('wind', 'hush', 'drone', 'fire'), or one of the place's one-shots ('crack', 'flap', 'bell')
    night(id, o) { o = o || {}; if (BED[id] || ['wind', 'hush', 'drone', 'fire'].includes(id)) bedTo(id, o.gain === undefined ? 1 : o.gain, o.secs); else play(id, o); },
    setQuiet(on) { quiet = !!on; for (const id in BED) if (id[0] !== '_') bedTo(id, BED[id].level, 2); },
    hush(secs) { hushT = Math.max(hushT, secs || 0); },
    // now and then: frost cracking somewhere in the court, a banner snapping in a gust
    tick(dt) {
      if (!ready || muted) return; hushT -= dt; if (hushT > 0 || quiet) return;
      for (const id in next) { next[id] -= dt; if (next[id] <= 0) { play(id, { pan: rr(-.8, .8), far: rr(.25, .7), gain: rr(.5, 1) }); next[id] = id === 'crack' ? rr(5, 13) : rr(8, 18); } }
    },
    setMuted(on) { muted = !!on; if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .08); },
    close() { const c = ctx; ctx = null; ready = false; if (c && c.close) return c.close().catch(() => {}); }
  };
  return api;
}
