// sfx.js: this cutscene's own sounds, made in code, besides the field study's (sounds.js): footsteps in the frost, Sol's
// blade lighting amber, and the ground rumbling before it splits. They play through the field study's meadow (its
// context, its Bramble bus for effects, and its reverb), so they sit in the same night.
// Defines cutsceneSfx(snd, volume) only, for player.js. Returns { play(id, { gain, pan, far }) }.
function cutsceneSfx(snd, volume) {
  'use strict';
  const ctx = snd.ctx; if (!ctx) return null;
  const SR = ctx.sampleRate, TAU = Math.PI * 2;
  let seed = 9001; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const buf = (s) => new Float32Array(Math.ceil(s * SR));
  const env = (x, a, h, r) => (x < 0 ? 0 : x < a ? .5 - .5 * Math.cos(Math.PI * x / a) : x < a + h ? 1 : x < a + h + r ? .5 + .5 * Math.cos(Math.PI * (x - a - h) / r) : 0);
  function svf() { const f = { lo: 0, bp: 0, hi: 0 }; f.run = (x, hz, q) => { const F = 2 * Math.sin(Math.PI * Math.min(hz, SR * .2) / SR); f.lo += F * f.bp; f.hi = x - f.lo - f.bp / Math.max(q, .5); f.bp += F * f.hi; }; return f; }
  function norm(d, to) { let m = 1e-9; for (const v of d) m = Math.max(m, Math.abs(v)); for (let i = 0; i < d.length; i++) d[i] *= to / m; return d; }
  // a footstep in frosted grass over frozen ground: a soft thud, then the crunch of frost crystals giving way
  function makeStep() {
    const len = .3, d = buf(len), f = svf(), g = svf();
    let th = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / SR;
      th += (rnd() * 2 - 1 - th) * .02; g.run(th, 120, .7);
      const crunch = rnd() < .14 * Math.exp(-t / .07) ? (rnd() * 2 - 1) : 0; f.run(crunch + (rnd() * 2 - 1) * .05 * Math.exp(-t / .05), 2400 + 1800 * rnd(), 1.4);
      d[i] = g.lo * 3 * env(t, .004, .02, .09) + f.bp * .9 * env(t, .002, .05, .16);
    }
    return norm(d, .8);
  }
  // her sunsteel lighting: air drawn past the blade, then a warm hum rising with a shimmer over it
  function makeBlade() {
    const len = 2.2, d = buf(len), f = svf(); let ph = [0, 0, 0, 0];
    for (let i = 0; i < d.length; i++) {
      const t = i / SR, sw = Math.min(1, t / .45);
      f.run(rnd() * 2 - 1, 500 + 3200 * sw * sw, 2.2);
      const whoosh = f.bp * env(t, .25, .1, .5) * .9;
      const hz = 98 + 14 * Math.min(1, t / .8);
      ph[0] += TAU * hz / SR; ph[1] += TAU * hz * 2.003 / SR; ph[2] += TAU * hz * 3.01 / SR; ph[3] += TAU * 1180 * (1 + .002 * Math.sin(t * 9)) / SR;
      const hum = (Math.sin(ph[0]) * .6 + Math.sin(ph[1]) * .3 + Math.sin(ph[2]) * .12) * env(t, .5, .5, 1.1) * .5;
      const shimmer = Math.sin(ph[3]) * env(t, .35, .25, 1.2) * .07 * (.6 + .4 * Math.sin(t * 23));
      d[i] = whoosh + hum + shimmer;
    }
    return norm(d, .75);
  }
  // the ground under the frost groaning before it splits: a deep, slow swell
  function makeRumble() {
    const len = 2.6, d = buf(len), f = svf(), g = svf();
    for (let i = 0; i < d.length; i++) {
      const t = i / SR;
      f.run(rnd() * 2 - 1, 55 + 25 * Math.sin(t * 2.1), 1.2); g.run(rnd() * 2 - 1, 220, .8);
      d[i] = (f.bp * 2.4 + g.lo * .25 * (.5 + .5 * Math.sin(t * 17))) * env(t, 1.3, .6, .7);
    }
    return norm(d, .9);
  }
  const BUF = {};
  const make = { step0: makeStep, step1: makeStep, step2: makeStep, blade0: makeBlade, rumble0: makeRumble };
  for (const k in make) { try { const d = make[k](), b = ctx.createBuffer(1, d.length, SR); b.copyToChannel(d, 0); BUF[k] = b; } catch (e) { /* left out */ } }
  const LEVEL = { step: .32, blade: .7, rumble: .9 };
  let last = -1;
  return {
    play(id, o) {
      if (!snd.ctx || snd.muted) return; o = o || {};
      let b = BUF[id + '0'];
      if (id === 'step') { let v = Math.floor(rnd() * 3); if (v === last) v = (v + 1) % 3; last = v; b = BUF['step' + v]; }
      if (!b) return;
      const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (rnd() - .5) * (id === 'step' ? .16 : .04);
      const gn = ctx.createGain(); gn.gain.value = (o.gain === undefined ? 1 : o.gain) * (LEVEL[id] || .5) * (1 - .5 * (o.far || 0));
      let tail = gn; s.connect(gn);
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan || 0)); gn.connect(p); tail = p; }
      const bus = snd.bus('bramble'); if (bus) tail.connect(bus);
      if (snd.wet) { const send = ctx.createGain(); send.gain.value = .12 + .5 * (o.far || 0); tail.connect(send); send.connect(snd.wet); }
      s.start(ctx.currentTime + .01);
    }
  };
}
