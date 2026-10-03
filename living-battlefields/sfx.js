// sfx.js: the fight's sounds, every one made in code: no recordings. Defines makeFightSound() only.
// When the page asks for sound (after a tap: browsers start audio only then), each sound is rendered once into a
// buffer with an OfflineAudioContext, from oscillators, filtered noise, grains and resonators: shrieking roars through
// formant filters, smashes with a sub thump, a crack, crunching earth and a rattle of falling stones, splintering wood,
// whip cracks, thorn rain, fire, blades, bells and thunder. Playing one then costs no more than a recording would. A
// reverb made in code gives them the meadow's space, and four loops (wind, rain, insects and a storm's rumble) follow
// the weather. The sounds the game's battle screen already has (src/battle/sound.js) keep their names where they
// overlap (hit, boom, fire, chime, blade, heal, shriek), so either can stand in for the other later.
// Returns { init() (call from a tap), play(name, { pan -1 to 1, gain, rate, delay }), ambience({ wind, gust, rain,
//   wrath, night }), setMuted(on), muted, names, label(name), ready, renderMs }.
function makeFightSound() {
  'use strict';
  const SR = 32000;
  let ctx = null, master = null, sfxBus = null, ambBus = null, verbIn = null, muted = false, renderMs = 0, ready = false;
  const BUF = {};
  // a seeded random, so each sound comes out the same every time
  const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // ---------- the toolkit, on one offline context ----------
  function kit(oc, R) {
    const sr = oc.sampleRate, T = oc.length / sr, NB = {};
    const out = oc.createGain(); out.connect(oc.destination);
    const nbuf = (kind) => {
      const b = oc.createBuffer(1, oc.length, sr), d = b.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = R() * 2 - 1;
        if (kind === 'white') d[i] = w;
        else if (kind === 'pink') { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; }
        else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
      }
      return b;
    };
    const buf = (kind) => NB[kind] || (NB[kind] = nbuf(kind));
    // noise from t0 for len seconds (from a random place in the buffer)
    const noise = (kind, t0, len) => { const s = oc.createBufferSource(); s.buffer = buf(kind || 'white'); t0 = t0 || 0; len = Math.min(len || T - t0, T - t0); s.start(t0, R() * Math.max(0, T - len - .01), len); return s; };
    const osc = (type, f, t0, t1) => { const o = oc.createOscillator(); o.type = type; o.frequency.value = Math.min(f, sr * .48); o.start(t0 || 0); o.stop(t1 || T); return o; };
    const gain = (v) => { const g = oc.createGain(); g.gain.value = v === undefined ? 1 : v; return g; };
    const filt = (type, f, Q) => { const b = oc.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q === undefined ? 1 : Q; return b; };
    const shaper = (k) => { const w = oc.createWaveShaper(), n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); } w.curve = c; return w; };
    const chain = (...ns) => { for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]); return ns[ns.length - 1]; };
    // a parameter's path through time: [[t, v], ...], straight or exponential
    const path = (p, pts, exp) => { p.setValueAtTime(pts[0][1], pts[0][0]); for (let i = 1; i < pts.length; i++) { const [t, v] = pts[i]; if (exp) p.exponentialRampToValueAtTime(Math.max(1e-4, v), t); else p.linearRampToValueAtTime(v, t); } };
    // a gain that rises in a and dies away (to about 1% in d)
    const ad = (t0, a, d, peak) => { const g = gain(0); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak === undefined ? 1 : peak, t0 + a); g.gain.setTargetAtTime(0, t0 + a, d / 4.6); return g; };
    const until = (t, len) => Math.min(T, t + len * 2.2 + .05);
    // a grain of noise: at t, len long, through a band at f
    const grain = (t, len, f, Q, g, kind, dest) => {
      const s = noise(kind || 'white', t, len + .005), b = filt('bandpass', f, Q), e = gain(0);
      e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(1e-4, t + len); chain(s, b, e, dest || out);
    };
    // a click that rings a resonance (wood, earth, a thorn going in)
    const knock = (t, f, Q, g, decay, dest) => {
      const s = noise('white', t, .006), b = filt('bandpass', f, Q), e = gain(g * Q * .5);
      chain(s, b, e, dest || out); const b2 = filt('bandpass', f * 2.3, Q * .7); s.connect(b2); b2.connect(e);
      e.gain.setValueAtTime(g * Q * .5, t); e.gain.setTargetAtTime(0, t + .006, (decay || .08) / 2.3);
    };
    // a falling sine: the weight under a blow
    const thump = (t, f0, f1, len, g, dest) => { const o = osc('sine', f0, t, until(t, len)); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len * .6); const e = ad(t, .004, len, g); chain(o, e, dest || out); };
    // metal: inharmonic partials of a struck bar, the high ones dying first
    const ring = (t, f, len, g, dest) => { [[1, 1], [2.76, .5], [5.4, .32], [8.93, .18], [13.3, .1]].forEach(([k, a], i) => { const o = osc('sine', f * k, t, until(t, len)); chain(o, ad(t, .002, len / (1 + i * .8), g * a), dest || out); }); };
    // a bell (FM): its brightness falls as it rings
    const bell = (t, f, len, g, ratio, dest) => {
      const c = osc('sine', f, t, until(t, len)), mo = osc('sine', f * (ratio || 1.4), t, until(t, len)), mg = gain(0);
      mg.gain.setValueAtTime(f * 3, t); mg.gain.setTargetAtTime(f * .3, t, len / 4); mo.connect(mg); mg.connect(c.frequency);
      chain(c, ad(t, .003, len, g), dest || out);
    };
    // a voice through three formants (for roars): src -> bands -> dest, the vowel moving along the given path
    const formants = (src, fpts, dest) => {
      const sum = gain(1);
      [[0, 1, 5], [1, .62, 6], [2, .34, 7]].forEach(([k, a, q]) => {
        const b = filt('bandpass', fpts[0][1][k], q), g = gain(a); path(b.frequency, fpts.map(([t, f]) => [t, f[k]]), true); chain(src, b, g, sum);
      });
      sum.connect(dest || out); return sum;
    };
    // something wobbling a parameter: a low oscillator at f, depth d
    const wobble = (param, f, d, t0, type) => { const l = osc(type || 'sine', f, t0 || 0), g = gain(d); chain(l, g); g.connect(param); return l; };
    return { T, sr, out, R, noise, osc, gain, filt, shaper, chain, path, ad, grain, knock, thump, ring, bell, formants, wobble, rr: (a, b) => a + (b - a) * R() };
  }

  // ---------- the sounds: [label, seconds, level, how much reverb, how it is made] ----------
  // level is the loudness it plays at (each is rendered to full scale); reverb 0 to 1
  const DEF = {
    roar: ['Roar', 3, 1, .5, (k) => {
      const { T, out, osc, gain, filt, shaper, chain, path, formants, wobble, noise, ad } = k;
      // the growl: two rough, detuned saws that rise and fall, through the colossus's throat (formants), shaking
      const body = gain(0); path(body.gain, [[0, 0], [.22, .9], [1.6, .75], [2.4, .5], [T, 0]]);
      for (const [f, d] of [[64, 0], [97, 7]]) { const o = osc('sawtooth', f); o.detune.value = d; path(o.frequency, [[0, f * .8], [.35, f * 1.25], [1.4, f * 1.05], [T, f * .7]], true); wobble(o.frequency, 27, f * .06); o.connect(body); }
      const trem = gain(1); wobble(trem.gain, 31, .35); const grit = chain(body, shaper(3.2), trem);
      formants(grit, [[0, [380, 1000, 2500]], [.5, [620, 1240, 2700]], [1.6, [520, 900, 2400]], [T, [400, 800, 2300]]], out);
      // the shriek on top: three detuned voices gliding up, with a vibrato, through a resonant band
      const sh = gain(0); path(sh.gain, [[0, 0], [.2, 0], [.55, .55], [1.3, .45], [2.1, .12], [T, 0]]);
      for (const d of [-9, 0, 11]) { const o = osc(d ? 'sawtooth' : 'square', 760); o.detune.value = d; path(o.frequency, [[0, 640], [.6, 1480], [1.4, 1250], [T, 820]], true); wobble(o.frequency, 6.5, 32); o.connect(sh); }
      const bp = filt('bandpass', 1800, 6); path(bp.frequency, [[0, 1400], [.6, 2900], [T, 1600]], true);
      const am = gain(1); wobble(am.gain, 47, .5); chain(sh, filt('highpass', 520, .7), bp, am, gain(.6), out);
      // breath, and a sub under it
      const br = noise('pink'), bb = filt('bandpass', 3200, .8); chain(br, bb, ad(.1, .3, 2.2, .35), out);
      const sub = osc('sine', 46); chain(sub, ad(0, .25, 1.8, .55), out);
    }],
    growl: ['Growl', 1.6, .75, .4, (k) => {
      const { T, out, osc, gain, shaper, chain, path, formants, wobble, ad } = k;
      const body = gain(0); path(body.gain, [[0, 0], [.2, .9], [1, .7], [T, 0]]);
      for (const [f, d] of [[52, 0], [79, 9]]) { const o = osc('sawtooth', f); o.detune.value = d; path(o.frequency, [[0, f], [.5, f * 1.2], [T, f * .8]], true); wobble(o.frequency, 23, f * .07); o.connect(body); }
      const trem = gain(1); wobble(trem.gain, 26, .45); formants(chain(body, shaper(3.5), trem), [[0, [330, 820, 2300]], [.6, [480, 980, 2450]], [T, [360, 760, 2200]]], out);
      chain(osc('sine', 40), ad(0, .2, 1.2, .5), out);
    }],
    shriek: ['Shriek', 1.4, .7, .45, (k) => {
      const { T, out, osc, gain, filt, chain, path, wobble } = k;
      const sh = gain(0); path(sh.gain, [[0, 0], [.08, .8], [.5, .6], [T, 0]]);
      for (const d of [-12, 0, 14]) { const o = osc('sawtooth', 1500); o.detune.value = d; path(o.frequency, [[0, 1300], [.15, 2100], [T, 700]], true); wobble(o.frequency, 9, 60); o.connect(sh); }
      const bp = filt('bandpass', 2400, 4); path(bp.frequency, [[0, 2000], [.2, 3400], [T, 1500]], true);
      const am = gain(1); wobble(am.gain, 53, .55); chain(sh, filt('highpass', 600, .7), bp, am, out);
    }],
    smash: ['Smash', 3, 1, .45, (k) => {
      const { T, out, noise, filt, chain, path, ad, grain, thump, rr, shaper, gain } = k;
      const bus = gain(1); chain(bus, shaper(1.6), out);
      thump(0, 130, 32, 1.4, 1, bus); thump(0, 62, 28, 2, .7, bus);
      // the crack of the blow and the earth crushing under it
      grain(0, .02, 3200, .7, 1.2, 'white', bus); grain(.004, .05, 1400, 1, .9, 'white', bus);
      for (let i = 0; i < 12; i++) grain(rr(0, .14), rr(.01, .04), rr(500, 2600), 2.5, rr(.4, .9), 'white', bus);
      // the body: dark noise that closes down
      const b = noise('brown'), lp = filt('lowpass', 1200, .7); path(lp.frequency, [[0, 1400], [1.2, 140]], true); chain(b, lp, ad(0, .006, 1.5, 1.1), bus);
      // stones and clods raining down, fewer and fewer
      for (let i = 0; i < 70; i++) { const t = .12 + Math.pow(k.R(), 1.6) * 2.2; grain(t, rr(.004, .02), rr(1500, 6500), 3, rr(.08, .35) * (1 - t / 2.6), 'white', bus); }
      // and the rumble that rolls away
      const r = noise('brown'), rl = filt('lowpass', 110, .7); chain(r, rl, ad(.05, .2, 2.6, .9), bus);
    }],
    slam: ['Spear strike', 1.5, .85, .4, (k) => {
      const { out, noise, filt, chain, path, ad, grain, thump, knock, rr } = k;
      const w = noise('white'), bp = filt('bandpass', 400, 2); path(bp.frequency, [[0, 350], [.22, 1800]], true); chain(w, bp, ad(0, .2, .06, .5), out);
      thump(.22, 110, 38, .9, 1); grain(.22, .025, 2600, .8, 1); knock(.22, 210, 10, .7, .25);
      for (let i = 0; i < 9; i++) grain(.22 + rr(0, .12), rr(.01, .03), rr(600, 2400), 2.5, rr(.3, .7));
      for (let i = 0; i < 26; i++) grain(.3 + rr(0, 1), rr(.004, .015), rr(2000, 6000), 3, rr(.05, .2));
    }],
    crack: ['Ground splitting', 1.8, .8, .35, (k) => {
      const { T, out, noise, filt, chain, ad, knock, grain, rr, gain, path } = k;
      // a run of cracks, faster and faster, through the soil and the roots
      let t = 0; for (let i = 0; i < 26 && t < T - .2; i++) { knock(t, rr(260, 1300), rr(9, 18), rr(.4, 1), rr(.05, .14)); grain(t, rr(.01, .03), rr(800, 3000), 2, rr(.2, .5)); t += rr(.015, .09) * (1 - i / 34); }
      // and the tearing under it
      const n = noise('brown'), lp = filt('lowpass', 500, 1), am = gain(1); path(am.gain, [[0, .2], [.08, 1], [.6, .6], [T, 0]]); chain(n, lp, am, ad(0, .02, 1.3, 1), out);
    }],
    crash: ['Felled', 4.2, 1, .5, (k) => {
      const { T, out, noise, filt, chain, path, ad, grain, thump, knock, rr, shaper, gain } = k;
      const bus = gain(1); chain(bus, shaper(1.4), out);
      // the great trunk hitting the ground
      thump(0, 95, 28, 2.4, 1, bus); thump(.03, 55, 24, 2.8, .7, bus); grain(0, .03, 1800, .8, 1, 'white', bus);
      const b = noise('brown'), lp = filt('lowpass', 900, .7); path(lp.frequency, [[0, 1100], [2, 90]], true); chain(b, lp, ad(0, .01, 2, 1.1), bus);
      // wood splintering after it, and the canes snapping one by one
      for (let i = 0; i < 46; i++) { const t = rr(.03, 1.8) * rr(.4, 1); knock(t, rr(350, 2200), rr(8, 16), rr(.25, .8), rr(.03, .1), bus); }
      // leaves and branches settling
      const lv = noise('pink'), hp = filt('highpass', 1800, .7); chain(lv, hp, ad(.15, .3, 2.6, .35), bus);
      for (let i = 0; i < 50; i++) { const t = .2 + Math.pow(k.R(), 1.5) * 3.2; grain(t, rr(.004, .02), rr(1200, 5000), 3, rr(.05, .25) * (1 - t / T), 'white', bus); }
      const r = noise('brown'), rl = filt('lowpass', 80, .7); chain(r, rl, ad(0, .3, 3.6, 1), bus);
    }],
    debris: ['Falling stones', 2, .55, .35, (k) => {
      const { T, grain, knock, rr } = k;
      for (let i = 0; i < 90; i++) { const t = Math.pow(k.R(), 1.4) * (T - .2); grain(t, rr(.004, .025), rr(1200, 6500), 3, rr(.1, .5) * (1 - t / T)); }
      for (let i = 0; i < 9; i++) knock(rr(.05, 1.2), rr(140, 420), 8, rr(.3, .7), .12);
    }],
    shockwave: ['Shockwave', 2, .9, .45, (k) => {
      const { T, out, noise, filt, chain, path, ad, thump, gain, wobble } = k;
      const n = noise('brown'), lp = filt('lowpass', 300, .8); path(lp.frequency, [[0, 700], [1.2, 90]], true); chain(n, lp, ad(0, .04, 1.1, 1.2), out);
      thump(0, 75, 30, 1.3, .9);
      // the grass bowing all at once, a rush of leaves
      const g = noise('pink'), hp = filt('highpass', 2200, .7), am = gain(1); wobble(am.gain, 17, .4); chain(g, hp, am, ad(.08, .15, 1.4, .5), out);
    }],
    rustle: ['Rustling grass', 1.1, .45, .25, (k) => {
      const { out, noise, filt, chain, ad, gain, wobble } = k;
      const g = noise('pink'), hp = filt('highpass', 1600, .7), am = gain(1); wobble(am.gain, 23, .6, 0, 'square'); chain(g, hp, am, ad(0, .12, .8, .9), out);
    }],
    whip: ['Whip crack', .7, .85, .4, (k) => {
      const { out, noise, filt, chain, path, ad, grain, knock } = k;
      const w = noise('white'), bp = filt('bandpass', 400, 1.8); path(bp.frequency, [[0, 300], [.16, 2600]], true); chain(w, bp, ad(0, .15, .03, .5), out);
      grain(.16, .004, 4000, .5, 1.5); grain(.163, .03, 6500, 1.2, .8); knock(.16, 2500, 20, .5, .05);
    }],
    swoosh: ['Swing', .6, .6, .35, (k) => {
      const { out, noise, filt, chain, path, gain } = k;
      const w = noise('white'), bp = filt('bandpass', 300, 2.5); path(bp.frequency, [[0, 260], [.22, 950], [.5, 300]], true);
      const e = gain(0); path(e.gain, [[0, 0], [.22, 1], [.55, 0]]); chain(w, bp, e, out);
    }],
    thorns: ['Thorn rain', 1.4, .6, .4, (k) => {
      const { out, osc, chain, path, ad, noise, filt, rr } = k;
      for (let i = 0; i < 14; i++) { const t = rr(0, .7), o = osc('sine', 2600, t, t + .45); path(o.frequency, [[t, rr(2400, 3600)], [t + .4, rr(1100, 1700)]], true); chain(o, ad(t, .05, .35, rr(.08, .2)), out); }
      chain(noise('white'), filt('bandpass', 3000, 1.2), ad(0, .3, 1, .25), out);
    }],
    thunk: ['Thorn strikes', .3, .5, .2, (k) => { k.thump(0, 150, 70, .12, .9); k.grain(0, .01, 2200, 2, .7); k.knock(0, 420, 9, .5, .06); }],
    grab: ['Seized', .9, .7, .3, (k) => {
      const { out, noise, filt, chain, ad, thump, knock, rr } = k;
      for (let i = 0; i < 8; i++) knock(rr(0, .25), rr(300, 900), 12, rr(.3, .6), .08);
      chain(noise('pink'), filt('highpass', 1500, .7), ad(0, .05, .5, .5), out); thump(.05, 90, 45, .3, .6);
    }],
    thud: ['Thud', .5, .6, .25, (k) => { k.thump(0, 110, 50, .3, 1); k.chain(k.noise('brown'), k.filt('lowpass', 600, .7), k.ad(0, .005, .25, .8), k.out); }],
    shoots: ['Thornwood', 2, .85, .4, (k) => {
      const { out, osc, gain, filt, chain, path, ad, knock, grain, thump, rr } = k;
      for (let j = 0; j < 6; j++) {
        const t = j * .11 + rr(0, .05);
        thump(t, 120, 55, .25, .5); grain(t, .03, rr(900, 2000), 1.5, .7);
        for (let i = 0; i < 5; i++) knock(t + rr(0, .15), rr(400, 1400), 12, rr(.3, .6), .07);
        // the shoot shooting up: a woody tone rising
        const o = osc('sawtooth', 180, t, t + .6), b = filt('bandpass', 600, 4); path(o.frequency, [[t, 160], [t + .4, 520]], true); chain(o, b, ad(t, .02, .4, .18), out);
      }
    }],
    squeeze: ['Squeeze', 1.4, .6, .3, (k) => {
      const { T, out, osc, gain, filt, chain, path, wobble, ad } = k;
      // wood straining: a slow sticking and slipping
      const c = osc('sawtooth', 150), am = gain(0); path(c.frequency, [[0, 130], [T, 210]], true); wobble(c.frequency, 3.3, 25);
      const pulse = osc('square', 34), pg = gain(.5); chain(pulse, pg, am.gain); chain(c, am, filt('bandpass', 700, 3), ad(0, .2, 1.1, .8), out);
    }],
    creak: ['Creak', 1.5, .55, .35, (k) => {
      const { T, out, osc, gain, filt, chain, path, wobble, ad, rr } = k;
      const c = osc('sawtooth', 120), am = gain(0); path(c.frequency, [[0, rr(90, 130)], [T, rr(150, 230)]], true); wobble(c.frequency, 2.1, 18);
      const pulse = osc('square', rr(24, 38)), pg = gain(.55); wobble(pulse.frequency, 1.3, 8); chain(pulse, pg, am.gain);
      chain(c, am, filt('bandpass', 560, 2.5), ad(0, .15, 1.2, 1), out);
    }],
    rise: ['Rising', 1.8, .6, .4, (k) => {
      const { T, out, noise, filt, chain, path, gain } = k;
      const w = noise('pink'), bp = filt('bandpass', 200, 2); path(bp.frequency, [[0, 180], [1.5, 900]], true);
      const e = gain(0); path(e.gain, [[0, 0], [1.4, .9], [T, 0]]); chain(w, bp, e, out);
    }],
    whirl: ['Maelstrom', 3.6, .85, .45, (k) => {
      const { T, out, noise, filt, chain, path, gain, wobble } = k;
      // wind wound up into a vortex: whooshes coming faster and higher
      const w = noise('white'), bp = filt('bandpass', 400, 2.2); path(bp.frequency, [[0, 300], [T * .8, 1400], [T, 600]], true);
      const lfo = k.osc('sine', 1.5); path(lfo.frequency, [[0, 1.5], [T * .7, 6]]); const lg = gain(350); chain(lfo, lg); lg.connect(bp.frequency);
      const e = gain(0); path(e.gain, [[0, 0], [.6, .8], [T * .85, 1], [T, 0]]); const am = gain(.7); wobble(am.gain, 5, .3); chain(w, bp, am, e, out);
      chain(noise('brown'), filt('lowpass', 160, .7), gain(.6), out);
    }],
    rumble: ['Rumbling earth', 4.5, .85, .3, (k) => {
      const { T, out, noise, filt, chain, path, gain, wobble, osc, grain, rr } = k;
      const r = noise('brown'), lp = filt('lowpass', 95, .8), e = gain(0); path(e.gain, [[0, 0], [.6, 1], [3, .9], [T, 0]]); const am = gain(.7); wobble(am.gain, 2.3, .3); chain(r, lp, am, e, out);
      chain(osc('sine', 37), gain(.35), e);
      for (let i = 0; i < 18; i++) grain(rr(.3, 3.6), rr(.02, .06), rr(200, 700), 2, rr(.2, .45));
    }],
    sizzle: ['Sizzle', 1.5, .5, .3, (k) => {
      const { out, noise, filt, chain, ad, grain, rr } = k;
      chain(noise('white'), filt('highpass', 4200, .7), ad(0, .03, 1.1, .5), out);
      for (let i = 0; i < 40; i++) grain(rr(0, 1.2), .004, rr(2500, 7000), 3, rr(.2, .6));
    }],
    slash: ['Dagger', .4, .5, .3, (k) => {
      const { out, noise, filt, chain, path, gain } = k;
      const w = noise('white'), bp = filt('bandpass', 1500, 3); path(bp.frequency, [[0, 1300], [.12, 4200]], true);
      const e = gain(0); path(e.gain, [[0, 0], [.08, 1], [.2, 0]]); chain(w, bp, e, out);
    }],
    cut: ['Cut', .35, .55, .25, (k) => { k.knock(0, 950, 7, .8, .05); k.grain(0, .03, 2600, 1.5, .5); k.grain(.01, .06, 1200, 2, .3); }],
    spell: ['Flame spell', 1.1, .6, .5, (k) => {
      const { T, out, osc, noise, filt, chain, path, ad, wobble } = k;
      const o = osc('triangle', 300); path(o.frequency, [[0, 280], [.5, 1150]], true); wobble(o.frequency, 9, 30); chain(o, ad(0, .1, .6, .35), out);
      const n = noise('pink'), lp = filt('lowpass', 400, .8); path(lp.frequency, [[0, 300], [.6, 3200]], true); chain(n, lp, ad(.05, .3, .6, .6), out);
    }],
    fireBurst: ['Fire burst', 1.1, .75, .4, (k) => {
      const { out, noise, filt, chain, path, ad, grain, rr, thump } = k;
      const n = noise('brown'), lp = filt('lowpass', 2500, .7); path(lp.frequency, [[0, 3000], [.8, 300]], true); chain(n, lp, ad(0, .02, .8, 1.2), out);
      thump(0, 90, 45, .3, .5);
      for (let i = 0; i < 40; i++) grain(rr(.02, .9), .005, rr(1800, 6000), 3, rr(.15, .45));
    }],
    fireHit: ['Fire on wood', .9, .65, .35, (k) => {
      const { out, noise, filt, chain, ad, grain, rr } = k;
      chain(noise('pink'), filt('bandpass', 900, .6), ad(0, .03, .6, .9), out);
      for (let i = 0; i < 30; i++) grain(rr(0, .7), .004, rr(1500, 5000), 3, rr(.2, .55));
    }],
    flare: ['Flare', 1.3, .7, .45, (k) => {
      const { out, noise, filt, chain, path, ad, ring } = k;
      const n = noise('pink'), lp = filt('lowpass', 300, .8); path(lp.frequency, [[0, 250], [.35, 3800], [1.1, 900]], true); chain(n, lp, ad(0, .25, .8, 1), out);
      ring(.3, 1180, 1, .16);
    }],
    swordHit: ['Blade on wood', .7, .75, .35, (k) => {
      const { knock, ring, grain, thump, rr } = k;
      knock(0, 300, 9, 1, .12); ring(0, 640 + rr(-30, 30), .55, .22); thump(0, 120, 60, .15, .5);
      for (let i = 0; i < 6; i++) grain(rr(0, .08), rr(.01, .03), rr(800, 2600), 2, rr(.25, .5));
    }],
    rush: ['Ember Rush', 2, .6, .35, (k) => {
      const { out, noise, filt, chain, path, ad, thump, rr } = k;
      for (let i = 0; i < 6; i++) thump(.08 + i * .1 + rr(0, .02), 90, 50, .1, .45);
      for (const t of [.55, .8, 1.05, 1.3]) { const n = noise('pink'), lp = filt('lowpass', 500, .8); path(lp.frequency, [[t, 400], [t + .15, 2800], [t + .4, 600]], true); chain(n, lp, ad(t, .08, .3, .6), out); }
    }],
    weak: ['Weak point', 1.4, .85, .55, (k) => {
      const { bell, thump, grain, rr } = k;
      thump(0, 85, 35, .9, .8); grain(0, .02, 5000, .8, .8);
      // a glassy shatter of high rings, then a bright bell
      for (let i = 0; i < 18; i++) bell(rr(0, .25), rr(2600, 6200), rr(.3, .8), rr(.05, .12), rr(2.2, 3.6));
      bell(.02, 1318, 1.2, .3, 1.4); bell(.06, 1975, 1, .2, 1.4);
    }],
    moon: ['Waxing Light', 2.6, .6, .7, (k) => {
      const { T, out, osc, gain, chain, path, bell, rr } = k;
      // a soft chord, rising in, with bells drifting over it
      for (const f of [293.7, 370, 440, 587.3]) { for (const d of [-6, 6]) { const o = osc('sine', f); o.detune.value = d; const e = gain(0); path(e.gain, [[0, 0], [.9, .1], [2, .08], [T, 0]]); chain(o, e, out); } }
      for (let i = 0; i < 9; i++) bell(.3 + i * .18, [1760, 2217, 2637, 3520][i % 4] * (rr(0, 1) < .5 ? 1 : .5), 1, .08, 2);
    }],
    heal: ['Heal', 1.4, .55, .6, (k) => { [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => k.bell(i * .08, f, 1, .22, 1.4)); }],
    charm: ['Charm', 1.8, .55, .65, (k) => { [880, 1108.7, 1318.5, 1760].forEach((f, i) => k.bell(i * .12, f, 1.3, .2, 3.5)); }],
    bloom: ['Blooming', 1.8, .65, .5, (k) => {
      const { T, out, noise, filt, chain, path, ad, osc, gain } = k;
      const n = noise('pink'), bp = filt('bandpass', 300, 1.5); path(bp.frequency, [[0, 260], [1.2, 1300]], true); chain(n, bp, ad(0, .6, .9, .8), out);
      for (const f of [196, 293.7]) { const o = osc('triangle', f), e = gain(0); path(e.gain, [[0, 0], [.8, .12], [T, 0]]); chain(o, e, out); }
    }],
    pollen: ['Pollen', 2.6, .45, .7, (k) => {
      const { T, out, noise, filt, chain, ad, osc, rr } = k;
      chain(noise('white'), filt('highpass', 6000, .7), ad(0, .8, 1.6, .18), out);
      for (let i = 0; i < 46; i++) { const t = rr(0, T - .2), o = osc('sine', rr(3000, 8000), t, t + .08); chain(o, ad(t, .002, .05, rr(.04, .12)), out); }
    }],
    burst: ['Bud bursting', 1.3, .85, .5, (k) => {
      const { out, noise, filt, chain, path, ad, thump, grain, rr, bell } = k;
      const n = noise('brown'), lp = filt('lowpass', 500, 1); path(lp.frequency, [[0, 200], [.08, 1600], [.6, 300]], true); chain(n, lp, ad(0, .04, .5, 1.2), out);
      thump(0, 85, 40, .5, .8);
      for (let i = 0; i < 30; i++) grain(rr(.02, .4), rr(.01, .04), rr(1000, 4000), 1.5, rr(.15, .4), 'pink');
      for (let i = 0; i < 6; i++) bell(rr(.05, .4), rr(1800, 3600), .6, .05, 2.5);
    }],
    birds: ['Birds', 2.6, .45, .4, (k) => {
      const { out, noise, filt, chain, ad, gain, wobble, osc, path, rr } = k;
      for (let j = 0; j < 7; j++) { const t = rr(0, .9), n = noise('white', t, 1.4), am = gain(1); wobble(am.gain, rr(11, 19), .9, t, 'square'); chain(n, filt('bandpass', rr(900, 2400), 1.2), am, ad(t, .05, 1, rr(.15, .35)), out); }
      for (let i = 0; i < 10; i++) { const t = rr(.1, 2), o = osc('sine', 3000, t, t + .12); path(o.frequency, [[t, rr(2600, 3400)], [t + .06, rr(3800, 4600)], [t + .11, rr(2400, 3000)]], true); chain(o, ad(t, .005, .08, rr(.05, .12)), out); }
    }],
    heartbeat: ['Heartbeat', 1.3, .85, .3, (k) => { for (const [t, g] of [[0, 1], [.28, .75]]) { k.thump(t, 62, 38, .35, g); k.chain(k.noise('brown', t, .3), k.filt('lowpass', 180, .8), k.ad(t, .01, .25, g * .8), k.out); } }],
    gulp: ['Gulp', .8, .65, .35, (k) => {
      const { out, osc, filt, chain, path, ad, noise, gain, wobble } = k;
      const o = osc('sine', 180), lp = filt('lowpass', 600, 4); path(o.frequency, [[0, 200], [.4, 85]], true); path(lp.frequency, [[0, 300], [.15, 900], [.5, 200]], true); chain(o, lp, ad(0, .03, .45, 1), out);
      const n = noise('pink'), am = gain(1); wobble(am.gain, 38, .8); chain(n, filt('bandpass', 700, 2), am, ad(.05, .05, .3, .5), out);
    }],
    thunder: ['Thunder', 5.5, .8, .3, (k) => {
      const { T, out, noise, filt, chain, gain, path, grain, rr } = k;
      chain(noise('white'), filt('bandpass', 1400, .8), k.ad(0, .05, .4, .25), out);
      // the rolling: dark noise swelling and falling as the sound comes back from far off
      const r = noise('brown'), lp = filt('lowpass', 150, .8), e = gain(0); const pts = [[0, 0], [.3, .9]]; let t = .3; while (t < T - .5) { t += rr(.25, .7); pts.push([t, rr(.35, 1) * (1 - t / T)]); } pts.push([T, 0]); path(e.gain, pts); chain(r, lp, e, out);
      for (let i = 0; i < 12; i++) grain(rr(.1, 1.5), rr(.03, .1), rr(150, 500), 1.5, rr(.2, .5));
    }],
    thunderNear: ['Thunderclap', 5, 1, .35, (k) => {
      const { T, out, noise, filt, chain, gain, path, grain, rr, shaper } = k;
      const bus = gain(1); chain(bus, shaper(1.8), out);
      grain(0, .03, 2500, .5, 1.5, 'white', bus); grain(.01, .12, 900, .8, 1, 'white', bus);
      for (let i = 0; i < 20; i++) grain(rr(0, .5), rr(.01, .05), rr(600, 4000), 2, rr(.3, .8), 'white', bus);
      const r = noise('brown'), lp = filt('lowpass', 220, .8), e = gain(0); const pts = [[0, 0], [.05, 1.2]]; let t = .05; while (t < T - .5) { t += rr(.2, .5); pts.push([t, rr(.4, 1.1) * (1 - t / T)]); } pts.push([T, 0]); path(e.gain, pts); chain(r, lp, e, bus);
    }],
    victory: ['Victory', 3.2, .6, .55, (k) => {
      const { T, out, osc, gain, filt, chain, path } = k;
      const brass = (t, f, len, g) => { for (const d of [-5, 5]) { const o = osc('sawtooth', f, t, t + len + .1); o.detune.value = d; const lp = filt('lowpass', 900, 1), e = gain(0); path(lp.frequency, [[t, 600], [t + .06, 2600], [t + len, 1200]]); path(e.gain, [[t, 0], [t + .04, g], [t + len * .7, g * .7], [t + len, 0]]); chain(o, lp, e, out); } };
      [[0, 587.3], [.14, 740], [.28, 880], [.42, 1174.7]].forEach(([t, f]) => brass(t, f, .2, .14));
      for (const f of [587.3, 740, 880, 1174.7]) brass(.62, f, 2.2, .1);
      for (const f of [146.8, 293.7]) brass(.62, f, 2.2, .1);
    }],
  };
  // the order they are made in: what the fight needs first, first
  const ORDER = ['rumble', 'crack', 'roar', 'burst', 'birds', 'creak', 'swoosh', 'flare', 'swordHit', 'fireHit', 'sizzle', 'shriek', 'slam', 'spell', 'fireBurst', 'rise', 'heartbeat', 'smash', 'debris', 'shockwave', 'crash', 'thud', 'moon', 'heal', 'rush', 'thorns', 'thunk', 'whip', 'slash', 'cut', 'growl', 'thunder', 'thunderNear', 'whirl', 'rustle', 'grab', 'gulp', 'weak', 'shoots', 'squeeze', 'bloom', 'pollen', 'charm', 'victory'];

  async function render(name, seed) {
    const [, dur, , , fn] = DEF[name];
    const oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.ceil(dur * SR), SR);
    fn(kit(oc, rng(seed)));
    const b = await oc.startRendering();
    // to full scale, and a fade at the very end
    const d = b.getChannelData(0); let pk = 1e-6; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    const s = .95 / pk, fade = Math.min(d.length, Math.round(SR * .03)); for (let i = 0; i < d.length; i++) d[i] *= s * (i > d.length - fade ? (d.length - i) / fade : 1);
    return b;
  }
  // the meadow's reverb: two seconds of decaying noise, a little darker as it dies
  function reverbIR(c) {
    const len = Math.round(c.sampleRate * 2.3), b = c.createBuffer(2, len, c.sampleRate), R = rng(91);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / c.sampleRate, k = .25 + .7 * Math.min(1, t / 1.5); lp += (R() * 2 - 1 - lp) * (1 - k); d[i] = lp * Math.exp(-t * 2.6) * (t < .012 ? t / .012 : 1); } }
    return b;
  }
  // the four loops under everything: wind, rain, insects and a storm's rumble
  const AMB = {};
  function ambLoops() {
    const mk = (secs, fill) => { const b = ctx.createBuffer(1, Math.round(ctx.sampleRate * secs), ctx.sampleRate); fill(b.getChannelData(0), ctx.sampleRate, rng(secs * 1000 | 0)); return b; };
    const pinkFill = (d, sr, R) => { let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = R() * 2 - 1; b0 = .997 * b0 + w * .029591; b1 = .985 * b1 + w * .032534; b2 = .95 * b2 + w * .048056; d[i] = (b0 + b1 + b2 + w * .1848) * 1.2; } };
    const loops = {
      wind: mk(6, pinkFill),
      rain: mk(4, (d, sr, R) => { for (let i = 0; i < d.length; i++) d[i] = (R() * 2 - 1) * .3; for (let n = 0; n < 900; n++) { const at = (R() * (d.length - 200)) | 0, f = 2000 + R() * 5000, g = .2 + R() * .6; for (let j = 0; j < 160; j++) d[at + j] += Math.sin(j / sr * f * 6.283) * g * Math.exp(-j / 30); } }),
      insects: mk(6, (d, sr, R) => { for (const [f, per] of [[4400, .52], [4900, .61], [3900, .73]]) for (let t = R() * per; t < d.length / sr - .2; t += per * (.9 + .2 * R())) for (let p = 0; p < 3; p++) { const at = Math.round((t + p * .034) * sr); for (let j = 0; j < sr * .016 && at + j < d.length; j++) d[at + j] += Math.sin(j / sr * f * 6.283) * Math.sin(Math.PI * j / (sr * .016)) * .22; } }),
      storm: mk(6, (d, sr, R) => { let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (R() * 2 - 1)) / 1.02; d[i] = l * 3; } }),
    };
    for (const k in loops) {
      const s = ctx.createBufferSource(); s.buffer = loops[k]; s.loop = true;
      const f = ctx.createBiquadFilter(), g = ctx.createGain(); g.gain.value = 0;
      if (k === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = .8; }
      else if (k === 'rain') { f.type = 'highpass'; f.frequency.value = 1400; f.Q.value = .5; }
      else if (k === 'insects') { f.type = 'highpass'; f.frequency.value = 2500; f.Q.value = .5; }
      else { f.type = 'lowpass'; f.frequency.value = 110; f.Q.value = .7; }
      s.connect(f); f.connect(g); g.connect(ambBus); s.start(ctx.currentTime + Math.random());
      AMB[k] = { f, g };
    }
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : .9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = .003; comp.release.value = .25;
    master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = .9; ambBus.connect(master);
    const verb = ctx.createConvolver(); verb.buffer = reverbIR(ctx); verbIn = ctx.createGain(); verbIn.gain.value = .55; verbIn.connect(verb); verb.connect(master);
    ambLoops();
    // make every sound, in the order the fight needs them, a few at a time
    const t0 = performance.now();
    (async () => {
      const names = ORDER.concat(Object.keys(DEF).filter((n) => !ORDER.includes(n)));
      for (let i = 0; i < names.length; i += 4) {
        await Promise.all(names.slice(i, i + 4).map(async (n) => { try { BUF[n] = await render(n, 1000 + n.length * 97 + n.charCodeAt(0)); } catch (e) { /* that sound is left out */ } }));
      }
      renderMs = performance.now() - t0; ready = true;
    })();
  }
  function play(name, o) {
    if (!ctx || muted) return; const b = BUF[name], D = DEF[name]; if (!b || !D) return; o = o || {};
    const t = ctx.currentTime + (o.delay || 0), s = ctx.createBufferSource(); s.buffer = b;
    s.playbackRate.value = (o.rate || 1) * (1 + (Math.random() - .5) * .06);
    const g = ctx.createGain(); g.gain.value = D[2] * (o.gain === undefined ? 1 : o.gain);
    let tail = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan || 0)); g.connect(p); tail = p; }
    s.connect(g); tail.connect(sfxBus);
    const w = ctx.createGain(); w.gain.value = D[3]; tail.connect(w); w.connect(verbIn);
    s.start(t);
    // the loud ones hush the meadow for a moment
    if (D[2] * (o.gain || 1) > .85) { const a = ambBus.gain; a.cancelScheduledValues(t); a.setTargetAtTime(.45, t, .03); a.setTargetAtTime(.9, t + .4, .6); }
  }
  // the loops follow the weather: wind blows harder in gusts and storms, the rain comes and goes, the insects fall
  // silent in the storm, and a wrath brings a rumble under everything
  function ambience(o) {
    if (!ctx || !AMB.wind) return; const t = ctx.currentTime, w = o.wind || 0, gust = o.gust || 0, rain = o.rain || 0, wrath = o.wrath || 0;
    AMB.wind.g.gain.setTargetAtTime(.05 + .45 * w * (.7 + .3 * gust), t, .5); AMB.wind.f.frequency.setTargetAtTime(320 + 900 * w, t, .5);
    AMB.rain.g.gain.setTargetAtTime(.5 * rain, t, .8);
    AMB.insects.g.gain.setTargetAtTime((o.night || 0) * .14 * Math.max(0, 1 - rain * 1.5 - wrath * 2), t, 1);
    AMB.storm.g.gain.setTargetAtTime(.6 * Math.max(wrath, rain * .5), t, 1);
  }
  return {
    init, play, ambience,
    setMuted(on) { muted = !!on; if (master) master.gain.setTargetAtTime(muted ? 0 : .9, ctx.currentTime, .05); },
    get muted() { return muted; }, get ready() { return ready; }, get renderMs() { return renderMs; },
    names: ORDER.slice(), label: (n) => (DEF[n] ? DEF[n][0] : n),
    // for headless checks: render one sound and give back its samples
    _render: render,
  };
}
