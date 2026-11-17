// sound.js: every sound and the music of the Moon Faire witches' battle, all made in the browser (Web Audio), nothing
// recorded. Written for the battle-sound job (November 16, 2026; Chris: "scrap all of the sounds, [keep] the beats they hit
// on ... remake all of the noises"). It has the same face as Envoi's src/battle/sound.js, so the pages only swap one file:
//   makeBattleSound() -> { init, sfx, startMusic, stopMusic, setMuted, setMusicOff, setVolumes, muted, musicOn }
// Call init() from a tap or a click: browsers only start audio after the player touches the page.
//
// HOW IT IS LAID OUT (so a sound can be found, and lifted into another game)
//   1. the desk: the master, a limiter that never lets a peak past 0.9, one bus for effects and one for music, one reverb
//   2. the tool box: small builders every sound is made from (tone, noise, fm, bell, jingle, chain, knock, creak, rustle,
//      voice, fire ...). Each takes where it plays (a channel), when (seconds on the audio clock) and how loud
//   3. THE SOUNDS, family by family. Each is written def(name, what it is for, the beats that use it, how it is made).
//      The same list feeds the Sound Board page (moon-faire-witches/sound/sound-board.html), so the page can never
//      disagree with this file
//   4. the music: three looping parts (battle, boss, lift) and three short pieces (victory, fanfare, defeat), written as
//      notes in this file and played by a scheduler a little ahead of the audio clock. Since November 17 there are also
//      three darker looping parts for Chris to choose from (ashenReel, ethereal, ominous): startMusic('ashenReel')
// Extra, beyond Envoi's face (all optional): startMusic('battle' | 'boss'), setMood(name), lift(seconds or a function),
// catalog (every sound: name, family, what, beats, demo), parts (the music's parts), missing and errors (for tests),
// score(part, seconds) (for an offline render), and makeBattleSound({ context }) to play into a context of your own.
function makeBattleSound(opts) {
  'use strict';
  opts = opts || {};
  let ctx = null, master = null, sfxBus = null, sfxWet = null, musBus = null, musWet = null, muted = false;
  const BUF = {};
  // how loud each bus sits before the limiter (the game's Music and Effects settings scale these: setVolumes)
  const MASTER = 0.9, SFX = 0.62, MUS = 0.36, WET = 0.5;
  const missing = new Set(), errors = [];

  // ================================================== 1. THE DESK ==================================================
  // a little random generator of our own, so the noise and the reverb are the same on every phone and in every test
  let seed = 20261116;
  const rand = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  function init() {
    if (ctx) { if (ctx.state === 'suspended' && ctx.resume) ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = opts.context || (AC ? new AC() : null); if (!ctx) return;
    const sr = ctx.sampleRate;
    // the limiter: a compressor that holds the whole mix down when a lot lands at once (slow enough to let the crack of
    // a blow through), then a soft ceiling that cannot be passed (0.9 at the very most), so nothing clips on a phone
    master = gain(muted ? 0 : MASTER);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 6; comp.attack.value = 0.008; comp.release.value = 0.2;
    const pre = gain(0.5), ceil = ctx.createWaveShaper(), curve = new Float32Array(4097);
    for (let i = 0; i < 4097; i++) { const x = (i / 2048 - 1) * 2; curve[i] = 0.9 * Math.tanh(x / 0.9); }
    ceil.curve = curve;
    if (opts.noLimiter) master.connect(ctx.destination);      // only for the measuring tool, to see a sound's level before the limiter
    else { master.connect(comp); comp.connect(pre); pre.connect(ceil); ceil.connect(ctx.destination); }
    sfxBus = gain(SFX); sfxBus.connect(master); musBus = gain(0); musBus.connect(master);
    // noise to cut sounds from: white (hiss), pink (softer, like wind and fire), brown (rumble)
    const mk = (fn) => { const b = ctx.createBuffer(1, sr * 2, sr), d = b.getChannelData(0); fn(d); return b; };
    BUF.white = mk((d) => { for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1; });
    BUF.pink = mk((d) => { let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = rand() * 2 - 1; b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22; } });
    BUF.brown = mk((d) => { let v = 0; for (let i = 0; i < d.length; i++) { v = (v + (rand() * 2 - 1) * 0.02) / 1.02; d[i] = v * 3.5; } });
    // the reverb: a room made of fading noise (2.4 seconds, darker as it fades), shared by every sound that asks for it
    const len = Math.floor(sr * 2.4), ir = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < len; i++) { const x = i / len, a = i < sr * 0.012 ? 0 : Math.pow(1 - x, 2) * Math.exp(-3.2 * x); lp += ((rand() * 2 - 1) - lp) * (0.75 - 0.6 * x); d[i] = lp * a; }
    }
    const conv = ctx.createConvolver(); conv.buffer = ir; const ret = gain(WET); conv.connect(ret); ret.connect(master);
    sfxWet = gain(SFX); sfxWet.connect(conv); musWet = gain(0); musWet.connect(conv);
    initMusic();
  }
  const now = () => ctx.currentTime;
  // the balance between the sounds: how much louder than written each of the quiet ones plays (measured with
  // sound/measure.mjs, so a swish or a menu tap is still heard over the music on a phone). 1 when a sound isn't listed
  const LEVEL = { menu: 1.6, menuBack: 1.6, select: 1.6, swing: 1.8, swish: 1.4, chainLash: 1.8, fateRipple: 1.6, moonBladeFly: 2.2, moonBladeHit: 1.3, seedSow: 1.5, prayer: 1.5,
    wingBeat: 1.6, wellSurge: 1.3, moonbeamHit: 1.3, letterBurn: 1.3, lettersSent: 2, wispSip: 1.8, wispTouch: 1.3, wraithSwing: 2, wraithBolt: 2, wraithBoltHit: 1.5, caneSwing: 2.2,
    colossusSwing: 1.8, budBurst: 1.2, lightDrink: 1.5, shardCast: 1.5, frostDust: 1.5, release: 1.8, soulHome: 1.3, windowLight: 2, flee: 1.4, thunder: 1.2 };
  let lvl = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  // a channel for one sound: where in the stereo picture it sits (pan, -1 left to 1 right) and how much room it gets (wet)
  function chan(o) {
    o = o || {}; const g = gain((o.g == null ? 1 : o.g) * lvl); let n = g;
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; if (o.panTo != null) p.pan.linearRampToValueAtTime(o.panTo, now() + (o.panT || 1)); g.connect(p); n = p; }
    n.connect(o.music ? musBus : sfxBus);
    if (o.wet) { const w = gain(o.wet); n.connect(w); w.connect(o.music ? musWet : sfxWet); }
    return g;
  }

  // ================================================ 2. THE TOOL BOX ================================================
  // loudness shapes: struck (up at once, dying away) and swelled (rising, held, falling)
  // (struck: `dur` is how long it takes to fall to a hundredth of its peak; it is silent a moment after)
  function perc(p, t, a, peak, dur) { peak = Math.max(0.0002, peak); dur = Math.max(dur, a + 0.01); p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(peak * 0.01, t + dur); p.setTargetAtTime(0, t + dur, 0.012); }
  function swell(p, t, a, peak, dur, rel) { a = Math.min(a, dur * 0.6); rel = Math.min(rel, dur - a); p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.setValueAtTime(peak, t + dur - rel); p.linearRampToValueAtTime(0.0001, t + dur); }
  const shape = (p, t, dur, peak, o) => (o.swell ? swell(p, t, o.att || dur * 0.4, peak, dur, o.rel || dur * 0.4) : perc(p, t, o.att || 0.004, peak, dur));
  // a wobble in pitch (vibrato) for anything that sings
  function vibrato(param, t, dur, hz, depth) { const l = ctx.createOscillator(), g = gain(depth); l.frequency.value = hz; l.connect(g); g.connect(param); l.start(t); l.stop(t + dur + 0.1); }
  // one plain note. o: to (glide to this pitch), glide (seconds), swell/att/rel, vib (Hz), vibD (depth in Hz), det (cents)
  function tone(d, type, f, t, dur, peak, o) {
    o = o || {}; const os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.det) os.detune.value = o.det; if (o.vib) vibrato(os.frequency, t, dur, o.vib, o.vibD || f * 0.012);
    shape(g.gain, t, dur, peak, o); os.connect(g); g.connect(d); os.start(t); os.stop(t + dur + 0.05); return os;
  }
  // a cut of noise through a filter. o: buf (white, pink, brown), type and f and q (the filter), to (sweep the filter)
  function noise(d, t, dur, peak, o) {
    o = o || {}; const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = BUF[o.buf || 'white']; s.loop = true; f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    shape(g.gain, t, dur, peak, o); s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return f;
  }
  // a note with a second note shaking its pitch very fast (FM): metal, glass, zaps. ratio: the shaker's pitch against the
  // note's; idx: how hard it shakes at the start; o.idx1: at the end
  function fm(d, f, ratio, idx, t, dur, peak, o) {
    o = o || {}; const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.type = o.type || 'sine'; c.frequency.setValueAtTime(f, t); m.frequency.setValueAtTime(f * ratio, t);
    if (o.to) { c.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur)); m.frequency.exponentialRampToValueAtTime(o.to * ratio, t + (o.glide || dur)); }
    mg.gain.setValueAtTime(Math.max(0.01, f * ratio * idx), t); mg.gain.exponentialRampToValueAtTime(Math.max(0.01, f * ratio * (o.idx1 == null ? idx * 0.1 : o.idx1)), t + (o.idxT || dur));
    shape(g.gain, t, dur, peak, o); m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(d);
    c.start(t); m.start(t); c.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
  }
  // a loudness flutter for whatever plays through it (wings, flames, a moth): returns the channel to play into
  function trem(d, hz, depth, t, dur, type) { const g = gain(1 - depth / 2), l = ctx.createOscillator(), lg = gain(depth / 2); l.type = type || 'sine'; l.frequency.value = hz; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(t + dur + 0.3); g.connect(d); return g; }
  // several pure notes at once, each [pitch against f, loudness, seconds]: how struck things ring
  function partials(d, f, t, list, peak, len) { for (const p of list) if (f * p[0] < 15000) tone(d, 'sine', f * p[0], t, Math.max(0.03, p[2] * (len || 1)), peak * p[1], { att: 0.002 }); }
  const RING = {
    // a small cast bell (Kore's gold bells): hum, strike note (twice, a hair apart, so it shimmers), minor third, fifth,
    // octave and the bright crown above
    bell: [[0.5, 0.22, 1], [1, 1, 1], [1.004, 0.5, 0.9], [1.2, 0.34, 0.7], [1.5, 0.28, 0.6], [2, 0.7, 0.55], [2.51, 0.3, 0.4], [3.01, 0.42, 0.3], [4.1, 0.28, 0.2], [5.43, 0.2, 0.14], [6.8, 0.12, 0.09]],
    // a great church bell (Risset's bell): its low pairs beat slowly against each other for the long tail
    toll: [[0.56, 1, 1], [0.563, 0.67, 0.9], [0.92, 1, 0.65], [0.923, 1.8, 0.55], [1.19, 2.67, 0.325], [1.7, 1.67, 0.35], [2, 1.46, 0.25], [2.74, 1.33, 0.2], [3, 1.33, 0.15], [3.76, 1, 0.1], [4.07, 1.33, 0.075]],
    glass: [[1, 1, 1], [2.32, 0.45, 0.55], [4.25, 0.22, 0.3], [6.63, 0.1, 0.18]],        // a struck glass: Io's moonlight
    wood: [[1, 1, 1], [3.93, 0.32, 0.35], [9.2, 0.1, 0.15]],                              // a struck bar of wood
    steel: [[1, 1, 1], [1.47, 0.7, 0.8], [2.09, 0.55, 0.6], [2.56, 0.5, 0.5], [3.39, 0.3, 0.35], [4.1, 0.25, 0.25], [5.2, 0.15, 0.15]], // a sword
  };
  // a struck bell at pitch f. o.set: which of RING; o.len: seconds its lowest note rings; o.strike: how hard the clapper clicks
  function bell(d, f, t, peak, o) {
    o = o || {}; const set = RING[o.set || 'bell']; let sum = 0; for (const p of set) sum += p[1];
    partials(d, f, t, set, peak / (sum * 0.45), o.len || 1.2);
    const st = o.strike == null ? 1 : o.strike;
    if (st) { noise(d, t, 0.03, peak * 0.45 * st, { type: 'highpass', f: 4500, att: 0.001 }); fm(d, Math.min(9000, f * 2.9), 1.41, 3, t, 0.07, peak * 0.28 * st, { idx1: 0.2 }); }
  }
  // one small tinkle of a pellet bell, and a shake of several
  function jingle(d, t, peak, f) { f = f || rnd(2600, 4300); partials(d, f, t, [[1, 1, 0.17], [1.48, 0.6, 0.11], [2.37, 0.45, 0.07]], peak * 0.5); noise(d, t, 0.02, peak * 0.6, { f: Math.min(12000, f * 2.2), q: 3, att: 0.001 }); }
  function jingles(d, t, dur, n, peak) { for (let i = 0; i < n; i++) jingle(d, t + dur * (i + Math.random() * 0.7) / n, peak * rnd(0.5, 1)); }
  // a chain: many tiny bright ticks tumbling over each other, and a few links that ring
  function chain(d, t, dur, peak) {
    const n = Math.max(4, Math.round(dur * 42));
    for (let i = 0; i < n; i++) noise(d, t + dur * Math.pow(Math.random(), 1.4), rnd(0.012, 0.03), peak * rnd(0.6, 2), { f: rnd(2400, 6500), q: rnd(4, 9), att: 0.001 });
    for (let i = 0; i < 3; i++) partials(d, rnd(1900, 3100), t + dur * Math.random() * 0.8, [[1, 1, 0.06], [1.47, 0.7, 0.045], [2.56, 0.4, 0.03]], peak * 0.4);
  }
  // a low thump that still speaks on a phone speaker: the deep note, and a buzzier one an octave up for small speakers
  function thump(d, t, f0, f1, dur, peak) {
    tone(d, 'sine', f0, t, dur, peak * 0.8, { to: f1, att: 0.003 });
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.connect(d); tone(lp, 'sawtooth', f0 * 2, t, dur * 0.7, peak * 0.4, { to: f1 * 2, att: 0.003 });
  }
  // wood: one knock, and a creak (a slow buzz through a narrow filter, the way a bending branch sticks and slips)
  function knock(d, t, f, peak, len) { partials(d, f, t, RING.wood, peak, len || 0.13); noise(d, t, 0.016, peak * 0.7, { f: f * 2.6, q: 1.5, att: 0.001 }); }
  function creak(d, t, dur, peak, o) {
    o = o || {}; const os = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), f0 = o.f || 900;
    os.type = 'sawtooth'; os.frequency.setValueAtTime(o.r0 || 22, t); os.frequency.exponentialRampToValueAtTime(o.r1 || 55, t + dur);
    f.type = 'bandpass'; f.Q.value = o.q || 7; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(o.f1 || f0 * 1.5, t + dur);
    swell(g.gain, t, dur * 0.3, peak * 3, dur, dur * 0.35); os.connect(f); f.connect(g); g.connect(d); os.start(t); os.stop(t + dur + 0.05);
  }
  // leaves, paper, cloth: a cloud of tiny grains of hiss. o: n (grains a second), f0 to f1 (how bright), g0 to g1 (grain seconds)
  function rustle(d, t, dur, peak, o) {
    o = o || {}; const n = Math.max(3, Math.round(dur * (o.n || 34)));
    for (let i = 0; i < n; i++) { const x = (i + Math.random()) / n, k = o.rise ? x : Math.sin(Math.PI * Math.min(1, x * 1.05)); noise(d, t + dur * x, rnd(o.g0 || 0.02, o.g1 || 0.07), peak * (0.35 + 0.65 * k) * rnd(0.5, 1), { f: rnd(o.f0 || 3000, o.f1 || 7000), q: o.q || 1.4, att: 0.004 }); }
  }
  // a voice: a buzz through the mouth shapes of a vowel (form: [pitch, narrowness, loudness] each). Laughter, prayers, moans
  const AH = [[850, 5, 1], [1300, 7, 0.6], [2700, 6, 0.2]], OO = [[380, 5, 1], [820, 6, 0.45], [2500, 6, 0.1]], OH = [[500, 5, 1], [900, 6, 0.5], [2500, 6, 0.15]];
  function voice(d, f, t, dur, peak, o) {
    o = o || {}; const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur)); if (o.vib) vibrato(os.frequency, t, dur, o.vib, o.vibD || f * 0.015);
    for (const p of o.form || AH) { const b = ctx.createBiquadFilter(), bg = gain(p[2] * 2.2); b.type = 'bandpass'; b.frequency.value = p[0]; b.Q.value = p[1]; os.connect(b); b.connect(bg); bg.connect(g); }
    shape(g.gain, t, dur, peak, o); g.connect(d); os.start(t); os.stop(t + dur + 0.05);
  }
  // a hollow note, like breath over the neck of a bottle: what a wisp sounds like
  function hollow(d, f, t, dur, peak, o) {
    o = o || {}; const q = { swell: true, att: o.att || dur * 0.3, rel: o.rel || dur * 0.45, to: o.to, glide: o.glide, vib: o.vib == null ? 6 : o.vib, vibD: f * 0.012 };
    tone(d, 'sine', f, t, dur, peak * 0.6, q); tone(d, 'triangle', f * 2.01, t, dur, peak * 0.12, q);
    noise(d, t, dur, peak * 2.2, { f, to: o.to, glide: o.glide, q: 16, swell: true, att: q.att, rel: q.rel, buf: 'pink' });
  }
  // fire: a roar that flutters, with crackles. o: f0 to f1 (how bright the roar), crack (how many crackles)
  function fire(d, t, dur, peak, o) {
    o = o || {}; const fl = trem(d, o.flutter || 17, 0.5, t, dur, 'triangle');
    noise(fl, t, dur, peak, { buf: 'pink', f: o.f0 || 500, to: o.f1 || 1300, q: 0.7, swell: true, att: o.att || dur * 0.25, rel: o.rel || dur * 0.5 });
    noise(d, t, dur, peak * 0.5, { buf: 'brown', type: 'lowpass', f: 260, swell: true, att: dur * 0.3, rel: dur * 0.5 });
    for (let i = 0; i < (o.crack == null ? Math.round(dur * 9) : o.crack); i++) noise(d, t + dur * Math.random() * 0.9, rnd(0.008, 0.02), peak * rnd(0.3, 0.9), { type: 'highpass', f: rnd(2500, 6000), att: 0.001 });
  }
  // air moving: a swing, a rush. f0 to f1: where the hiss sweeps
  function whoosh(d, t, dur, peak, f0, f1, o) { o = o || {}; noise(d, t, dur, peak, { buf: o.buf, f: f0, to: f1, q: o.q || 1.5, swell: true, att: o.att || dur * 0.55, rel: o.rel || dur * 0.4 }); }
  // a soft round drop: potion, sap, water
  function bloop(d, t, f, peak, up) { tone(d, 'sine', f, t, 0.09, peak, { to: f * (up || 1.9), att: 0.008 }); }
  // note names to pitches: 'e5', 'f#4', 'bb3'
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function hz(n) { const m = /^([a-g])([#b]?)(-?\d)$/.exec(n); return 440 * Math.pow(2, (SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1) - 69) / 12); }
  const H = (s) => s.split(' ').map(hz);

  // ================================================= 3. THE SOUNDS =================================================
  // def(name, what it is for, which beats use it, how it is made, example arguments for the Sound Board).
  // Each sound is made as fn(t, ...arguments): t is when it starts on the audio clock. RAW keeps them by name so one
  // sound can be built from another; sfx (at the end) is what the game calls.
  const RAW = {}, catalog = [], families = [];
  let fam = '';
  const family = (name, about) => { fam = name; families.push({ name, about }); };
  // demo: the arguments the Sound Board plays it with; takes: other ways to hear it, by label ({ 'Io': ['io'] })
  const def = (name, what, beats, fn, demo, takes) => { RAW[name] = fn; catalog.push({ name, family: fam, what, beats, demo: demo || [], takes: takes || null }); };
  const KORE = H('e6 g6 b6 d7');     // Kore's four gold bells (E, G, B, D: they sit inside the battle theme's key)
  const GOLD = 0xffd890;             // the colour screen.js gives the Jester's blows (strikeFx): how `strike` knows her

  // ------------------------------------------------- the menus -------------------------------------------------
  family('Menus', 'Quiet, soft taps that don’t tire the ear.');
  def('menu', 'Moving up or down a menu: one soft wooden tap.', 'screen.js UI.move (arrow keys)', (t) => {
    const d = chan(); tone(d, 'sine', 880 * rnd(0.98, 1.02), t, 0.06, 0.1, { to: 700 }); noise(d, t, 0.012, 0.05, { f: 2200, q: 1.5, att: 0.001 });
  });
  def('menuBack', 'Stepping back out of a menu: the same tap, lower.', 'screen.js: Escape or Backspace in a menu', (t) => {
    const d = chan(); tone(d, 'sine', 620, t, 0.08, 0.1, { to: 440 }); noise(d, t, 0.012, 0.04, { f: 1600, q: 1.5, att: 0.001 });
  });
  def('select', 'Choosing a command: two soft plucked notes, the second higher.', 'screen.js UI.pick (every menu choice)', (t) => {
    const d = chan({ wet: 0.08 }); tone(d, 'triangle', 659.3, t, 0.12, 0.13); tone(d, 'triangle', 987.8, t + 0.06, 0.2, 0.12); noise(d, t, 0.01, 0.04, { f: 2600, q: 1.5, att: 0.001 });
  });

  // -------------------------------------------- Kore, the Jester: bells and chain --------------------------------------------
  family('Kore (the Jester)', 'Her flail is the gold bells at her hip: bells and chain, laughter and capers, and the one deep bell of a seal.');
  // her flail landing: her gold bells struck together, the chain, and the blow's weight under them
  function bellBlow(t, p) {
    const n = p > 1 ? 4 : 3;
    for (let i = 0; i < n; i++) bell(chan({ pan: (i - (n - 1) / 2) * 0.35, wet: 0.25 }), KORE[i] * rnd(0.995, 1.005), t + i * rnd(0.006, 0.018), 0.36 * p, { len: 0.9 + 0.2 * i });
    const d = chan({ wet: 0.1 }); thump(d, t, 190, 70, 0.14, 0.5 * p); noise(d, t, 0.05, 0.4 * p, { type: 'lowpass', f: 2400, to: 500, att: 0.001 });
  }
  // Io's golden harvest sickle landing: a keen slice, the blade's ring, a leafy thwack
  function sickleCut(t, p) {
    const d = chan({ wet: 0.12 }); noise(d, t, 0.09, 0.5 * p, { type: 'highpass', f: 3500, to: 7000, att: 0.002 }); fm(d, 2100 * rnd(0.96, 1.04), 2.76, 1.2, t, 0.28, 0.16 * p, { idx1: 0.1 });
    noise(d, t, 0.07, 0.5 * p, { f: 700, q: 1.2, att: 0.002 }); thump(d, t, 170, 80, 0.1, 0.4 * p); rustle(d, t + 0.02, 0.12, 0.2 * p, { f0: 3500, f1: 7000 });
  }
  def('strike', 'A hero’s blow lands on a foe. The Jester’s (gold) is her bells struck together with the blow’s weight under them; Io’s is her golden sickle: a keen slice, the blade’s ring and a leafy thwack.',
    'screen.js strikeFx: every blow of melee() (Io’s Harvest Crescent) and of jesterCast() (the Jester’s blows). Arguments: how hard (0.9, or 1.2 for a big blow), and the blow’s colour (gold is the Jester)',
    (t, p, color) => { p = p || 1; if (color === GOLD) bellBlow(t, p); else if (color == null) sickleCut(t, p); else RAW.hit(t, p); }, [1.2, GOLD], { 'The Jester, a big blow': [1.2, GOLD], 'The Jester': [0.9, GOLD], 'Io’s sickle': [0.9], 'Io’s sickle, a big blow': [1.2] });
  def('chainLash', 'The chain of her flail whipping through after the bells: a rattle of links and a last jingle.', 'screen.js jesterCast: with each of the Jester’s blows, on top of `strike`', (t, p) => {
    p = p || 1; chain(chan({ pan: -0.2, wet: 0.15 }), t, 0.24, 0.3 * p); jingles(chan({ pan: 0.3, wet: 0.25 }), t + 0.05, 0.3, 4, 0.22 * p);
  }, [0.9]);
  def('bellFlail', 'She swings the flail up for Gilded Rebuke: the bells ring round through the air on their chain.', 'screen.js JESTER_MOVES.rebuke (as her move starts)', (t) => {
    whoosh(chan({ wet: 0.15 }), t, 0.36, 0.3, 900, 2600); chain(chan({ pan: -0.3 }), t + 0.02, 0.32, 0.2); jingles(chan({ pan: 0.3, wet: 0.2 }), t, 0.36, 7, 0.32);
  });
  // her laugh: quick falling "ha"s, each doubled by a tiny bell, so it is half a voice and half her bells
  function laugh(d, t, n, f0, peak, gap) {
    for (let i = 0; i < n; i++) {
      const tt = t + i * (gap || 0.115), f = f0 * Math.pow(2, -i * 1.5 / 12), a = peak * (1 - i * 0.1);
      voice(d, f * 1.07, tt, 0.085, a, { to: f * 0.93, att: 0.012 }); noise(d, tt, 0.035, a * 0.3, { f: 1800, q: 1, att: 0.003 });
      partials(d, f * 4, tt, [[1, 1, 0.1], [2.76, 0.4, 0.05]], a * 0.4);
    }
  }
  def('jesterJab', 'Her taunting jab: a caper, a mocking laugh and a flick of the bells.', 'screen.js JESTER_MOVES.jab (as her move starts)', (t) => {
    const d = chan({ wet: 0.22 }); laugh(d, t, 4, 700, 0.32); whoosh(d, t + 0.3, 0.2, 0.2, 1200, 3200); jingles(chan({ pan: 0.25, wet: 0.2 }), t + 0.28, 0.25, 5, 0.3);
  });
  def('jesterHeal', 'Her taunt that heals her: bright laughter, and her bells climbing.', 'screen.js JESTER_MOVES.hheal (as her move starts)', (t) => {
    const d = chan({ wet: 0.3 }); laugh(d, t, 5, 780, 0.28, 0.105);
    H('e6 g#6 b6 e7').forEach((f, i) => bell(chan({ pan: -0.3 + i * 0.2, wet: 0.35 }), f, t + 0.5 + i * 0.09, 0.2, { len: 0.8, strike: 0.5 }));
    tone(d, 'sine', 659.3, t + 0.5, 1.1, 0.08, { swell: true });
  });
  def('sealToll', 'A foe’s Fate has met its Life: she closes the seal, and one deep bell tolls for everyone to hear. Its tail rings for seven seconds.', 'screen.js apply(): the engine’s `sealed` event (the word SEALED over the foe)', (t) => {
    const d = chan({ wet: 0.55 }), f = 164.81;
    bell(d, f, t, 1.0, { set: 'toll', len: 7, strike: 0 });
    noise(d, t, 0.07, 0.5, { type: 'lowpass', f: 1400, to: 300, att: 0.002 });                    // the clapper's weight
    partials(d, f, t, [[5.4, 0.3, 0.7], [6.8, 0.22, 0.5], [8.2, 0.14, 0.35]], 0.3);               // the bright crown of the strike
    tone(d, 'sine', f / 2, t, 4.5, 0.3, { att: 0.01 });
  });
  def('sealBegin', 'She begins Sealed Fate: her small bells tick like a clock running out, faster and faster, over a low held note. At a Curtain Call two curtains of night sweep in from the sides as well.',
    'screen.js sealedFate (as the move starts). Argument: true at a Curtain Call', (t, curtain) => {
      const d = chan({ wet: 0.3 }); fm(d, 82.4, 0.5, 2, t, 1.9, 0.26, { swell: true, to: 98, idx1: 4 }); tone(d, 'triangle', 329.6, t, 1.9, 0.07, { swell: true, to: 392 });
      let tt = t; for (let i = 0; i < 9; i++) { jingle(chan({ pan: i % 2 ? 0.4 : -0.4, wet: 0.3 }), tt, 0.3 + i * 0.02, i % 2 ? 2637 : 3136); tt += 0.36 * Math.pow(0.8, i); }
      if (curtain) [-0.85, 0.85].forEach((pan, i) => noise(chan({ pan, panTo: pan * 0.1, panT: 1.6, wet: 0.2 }), t + 0.15 + i * 0.12, 1.6, 0.5, { buf: 'pink', type: 'lowpass', f: 300, to: 1500, swell: true, att: 1.0, rel: 0.5 }));
    }, [false], { 'Sealed Fate': [false], 'Curtain Call': [true] });
  def('fateEnds', 'The seal closes and the sealed foe is ended: a deep bell struck and stopped short, a heavy gilded lock, the chain falling slack.', 'screen.js sealedFate (the word Ended)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.4 });
    bell(d, 164.81, t, 0.8 * p, { set: 'toll', len: 0.9, strike: 0.6 }); thump(d, t, 150, 45, 0.5, 0.7 * p);
    noise(d, t, 0.18, 0.5 * p, { type: 'lowpass', f: 3000, to: 200, att: 0.001 }); fm(d, 420, 1.41, 4, t, 0.22, 0.3 * p, { idx1: 0.3 });
    chain(chan({ pan: 0.2, wet: 0.2 }), t + 0.04, 0.3, 0.26 * p);
  }, [1.2]);
  def('fateRipple', 'The ended foe’s end runs out along the ground to every other foe: a gold zing and a scatter of bells.', 'screen.js sealedFate (each other foe it wounds)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3, pan: rnd(-0.5, 0.5) });
    fm(d, 660, 2, 1.5, t, 0.3, 0.2 * p, { to: 1320, idx1: 0.2 }); jingles(d, t + 0.04, 0.22, 4, 0.3 * p); thump(d, t + 0.05, 200, 90, 0.12, 0.35 * p);
  }, [0.8]);
  def('curtainCall', 'Curtain Call begins: every bell she has rolls up together over a stage drum, and the music lifts.', 'screen.js sealedFate, at a Curtain Call (before she moves). It also starts the music’s lift', (t) => {
    const d = chan({ wet: 0.45 });
    for (let i = 0; i < 16; i++) jingle(chan({ pan: rnd(-0.7, 0.7), wet: 0.35 }), t + i * 0.07, 0.12 + i * 0.022, pick(KORE) * 2);
    noise(trem(d, 15, 0.8, t, 1.2), t, 1.2, 0.6, { buf: 'brown', type: 'lowpass', f: 420, swell: true, att: 1.0, rel: 0.15 });
    tone(d, 'sine', 220, t, 1.2, 0.14, { to: 880, swell: true, att: 1.0, rel: 0.15 });
    [659.3, 987.8, 1318.5].forEach((f, i) => bell(chan({ pan: (i - 1) * 0.5, wet: 0.5 }), f, t + 1.18, 0.34, { len: 2.2 }));
    thump(d, t + 1.18, 160, 55, 0.4, 0.5);
    lift(26);
  });
  def('curtainBow', 'The fainted friends get up for the bow: her bells run up a bright scale, with a breath of air under them.', 'screen.js sealedFate, at a Curtain Call (the fallen rise)', (t) => {
    H('e5 g#5 b5 e6 g#6 b6').forEach((f, i) => bell(chan({ pan: -0.5 + i * 0.2, wet: 0.4 }), f, t + i * 0.085, 0.24, { len: 1.3, strike: 0.6 }));
    const d = chan({ wet: 0.4 }); whoosh(d, t, 0.9, 0.2, 800, 4000, { buf: 'pink' }); tone(d, 'sine', 329.6, t, 1.6, 0.1, { swell: true }); tone(d, 'sine', 493.9, t, 1.6, 0.08, { swell: true });
  });
  def('doomDance', 'Her trance, the Doom Dance: her bells dance up and down in a whirl from ear to ear, with stars twinkling over a dark, sweet chord.', 'screen.js transform (the Jester’s trance begins)', (t) => {
    const fig = H('e6 b6 g6 d7 b6 e7 d7 g7 e7 b6 d7 g6');
    fig.forEach((f, i) => bell(chan({ pan: Math.sin(i * 1.3) * 0.8, wet: 0.35 }), f, t + 0.25 + i * 0.1, 0.18, { len: 0.5, strike: 0.5 }));
    const d = chan({ wet: 0.45 }); H('e4 g4 b4 f#5').forEach((f) => { tone(d, 'sawtooth', f, t, 2.2, 0.02, { swell: true, att: 0.9, rel: 0.8, det: 6 }); tone(d, 'sine', f, t, 2.2, 0.05, { swell: true, att: 0.7, rel: 0.9 }); });
    for (let i = 0; i < 9; i++) partials(chan({ pan: rnd(-0.9, 0.9), wet: 0.5 }), rnd(3200, 6000), t + rnd(0.2, 2.0), RING.glass, 0.05, 0.3);
  });
  def('lanternSpark', 'The Jester’s bells strike a spark for Envoi’s heart lantern: two bells and a bright spit of fire.', 'screen.js summonEnvoi and envoiMade (her blow that lights the lantern)', (t) => {
    bell(chan({ pan: -0.3, wet: 0.3 }), KORE[1], t, 0.3, { len: 0.7 }); bell(chan({ pan: 0.3, wet: 0.3 }), KORE[3], t + 0.05, 0.28, { len: 0.7 });
    const d = chan({ wet: 0.2 }); fm(d, 900, 3.1, 4, t + 0.06, 0.22, 0.16, { to: 3600, idx1: 0.5 }); for (let i = 0; i < 6; i++) noise(d, t + 0.06 + i * rnd(0.01, 0.04), 0.012, 0.3, { type: 'highpass', f: rnd(3000, 7000), att: 0.001 });
  });
  def('fateWrite', 'Spare, not used yet: Fate being written on a foe. A quill’s quick scratch and one small gold bell. (The game has no beat for it today: the `fate` event plays no sound.)', 'none yet: for the hub, at the engine’s `fate` event', (t) => {
    const d = chan({ wet: 0.2 }); noise(trem(d, 38, 0.9, t, 0.22, 'square'), t, 0.22, 0.25, { f: 3600, to: 4800, q: 2.5, swell: true, att: 0.03, rel: 0.08 }); jingle(d, t + 0.2, 0.28, 3136);
  });

  // ------------------------------------- Io, the Herbal Witch: wood, leaf and glass -------------------------------------
  family('Io (the Herbal Witch)', 'Roots, thorns, leaves, seeds, potions and moonflowers, and a golden sickle: her magic is woody, leafy and glassy.');
  def('swing', 'A hero’s blow on its way, just before it lands. Io’s sickle: a quick keen swish with a thread of gold ringing in it. Anyone else: a plain swish.', 'screen.js melee (before each blow). Argument: who is striking', (t, who) => {
    if (who !== 'io') { RAW.swish(t); return; }
    const d = chan({ wet: 0.1, pan: -0.2, panTo: 0.3, panT: 0.15 }); whoosh(d, t, 0.14, 0.34, 2600, 6500, { q: 1.2 }); fm(d, 2400, 2.76, 0.6, t, 0.16, 0.05, { idx1: 0.1 });
  }, ['io'], { 'Io': ['io'], 'Anyone else': ['jester'] });
  def('witchfire', 'Flame Bolt: purple witch-fire kindles in her hand with a whump, flutters, and whistles like wet glass as she throws it.', 'screen.js IO_MOVES.flame (as she throws)', (t) => {
    const d = chan({ wet: 0.2 }); noise(d, t, 0.3, 0.5, { type: 'lowpass', f: 300, to: 1800, swell: true, att: 0.2, rel: 0.1 });
    fire(d, t + 0.1, 0.8, 0.5, { f0: 700, f1: 1600, flutter: 26, crack: 5 }); fm(d, 880, 2, 2.5, t + 0.15, 0.7, 0.1, { to: 1760, idx1: 0.3, swell: true });
  });
  def('witchfireBurst', 'The witch-fire bursts on its foe: a burst of flame, crackles, and a splinter of purple glass.', 'screen.js IO_MOVES.flame (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3 }); noise(d, t, 0.5, 0.75 * p, { type: 'lowpass', f: 3200, to: 300, att: 0.002 }); thump(d, t, 160, 50, 0.3, 0.7 * p);
    fire(d, t + 0.03, 0.5, 0.36 * p, { f0: 1400, f1: 500, att: 0.03, crack: 7 }); partials(d, 1760, t, RING.glass, 0.16 * p, 0.5); partials(d, 2489, t + 0.03, RING.glass, 0.1 * p, 0.4);
  }, [0.8]);
  def('moonBlades', 'Five blades of moonlight rise round her: five glass notes climbing, each a little further across, over a soft held hum.', 'screen.js IO_MOVES.crescent (as she raises them)', (t) => {
    H('e6 g6 a6 b6 d7').forEach((f, i) => { const d = chan({ pan: -0.6 + i * 0.3, wet: 0.4 }); partials(d, f, t + 0.1 + i * 0.11, RING.glass, 0.2, 0.8); noise(d, t + 0.1 + i * 0.11, 0.02, 0.08, { type: 'highpass', f: 6000, att: 0.001 }); });
    const d = chan({ wet: 0.3 }); tone(d, 'sine', 659.3, t, 1.0, 0.08, { swell: true }); tone(d, 'sine', 987.8, t, 1.0, 0.05, { swell: true }); noise(d, t, 0.9, 0.06, { type: 'highpass', f: 6000, swell: true });
  });
  def('moonBladeFly', 'One blade of moonlight flies: a thin glass zip, a little different each time.', 'screen.js IO_MOVES.crescent (each of the five as it leaves)', (t) => {
    const k = rnd(0.85, 1.2), d = chan({ pan: rnd(-0.4, 0.4), wet: 0.15 }); whoosh(d, t, 0.16, 0.26, 5200 * k, 2600 * k, { q: 3 }); tone(d, 'sine', 3200 * k, t, 0.14, 0.07, { to: 1800 * k });
  });
  def('moonBladeHit', 'A blade of moonlight lands: a glass tink and a small clean cut.', 'screen.js IO_MOVES.crescent (each blade landing)', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.25 }); partials(d, rnd(2000, 2900), t, RING.glass, 0.26 * p, 0.3); noise(d, t, 0.03, 0.4 * p, { type: 'highpass', f: 4000, att: 0.001 }); thump(d, t, 220, 110, 0.08, 0.4 * p);
  }, [0.7]);
  def('rootCast', 'Briar Grasp: she calls the roots. Earth stirs, three hollow knocks climb, leaves shiver.', 'screen.js IO_MOVES.briars (as she casts)', (t) => {
    const d = chan({ wet: 0.2 }); noise(d, t, 0.6, 0.6, { buf: 'brown', type: 'lowpass', f: 320, swell: true }); noise(d, t, 0.6, 0.12, { buf: 'pink', f: 700, q: 1, swell: true });
    [196, 247, 294].forEach((f, i) => knock(d, t + 0.08 + i * 0.13, f, 0.4, 0.2)); rustle(chan({ pan: 0.3, wet: 0.2 }), t + 0.1, 0.5, 0.14);
  });
  def('briarsRise', 'Roots and briars burst up out of the ground: a creak that climbs, soil breaking, and a run of woody snaps going up.', 'screen.js IO_MOVES.briars and IO_MOVES.thorn (the briars come up)', (t) => {
    const d = chan({ wet: 0.2 }); creak(d, t, 0.5, 0.2, { f: 700, f1: 1500, r0: 20, r1: 60 }); noise(d, t, 0.3, 0.5, { type: 'lowpass', f: 1100, to: 300, att: 0.01 });
    for (let i = 0; i < 7; i++) knock(chan({ pan: rnd(-0.4, 0.4), wet: 0.15 }), t + 0.05 + i * 0.055, 320 * Math.pow(1.16, i), 0.3, 0.08);
    rustle(d, t + 0.1, 0.4, 0.14);
  });
  def('thornHit', 'A thorn drives home: a sharp woody snap, the prick of the point, and the weight behind it.', 'screen.js IO_MOVES.briars and IO_MOVES.thorn (the blow)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.15 }); knock(d, t, 520, 0.6 * p, 0.12); noise(d, t, 0.04, 0.6 * p, { f: 2600, q: 1, att: 0.001 }); thump(d, t, 180, 70, 0.14, 0.6 * p); fm(d, 3200, 1.5, 1, t, 0.05, 0.1 * p);
  }, [1.1]);
  // her healing: soft struck notes of wood and glass together, climbing
  function herbNotes(t, notes, gap, peak, wet) { notes.forEach((f, i) => { const d = chan({ pan: -0.3 + 0.6 * i / notes.length, wet: wet || 0.35 }); partials(d, f, t + i * gap, RING.wood, peak, 0.5); partials(d, f * 2, t + i * gap, RING.glass, peak * 0.3, 0.6); }); }
  def('mend', 'Her healing touch: leaves stir, and four soft notes of wood and glass climb in a warm chord.', 'screen.js IO_MOVES.mend (as she casts)', (t) => {
    rustle(chan({ wet: 0.2 }), t, 0.5, 0.12); herbNotes(t + 0.08, H('e5 g#5 b5 e6'), 0.1, 0.24); const d = chan({ wet: 0.4 }); tone(d, 'sine', 329.6, t, 1.1, 0.09, { swell: true }); tone(d, 'sine', 415.3, t, 1.1, 0.06, { swell: true });
  });
  def('waxingLight', 'Waxing Light: moonlight gathers over the party in a slow silver swell, then falls on them in glints.', 'screen.js IO_MOVES.waxing (as she casts)', (t) => {
    const d = chan({ wet: 0.45 }); H('e4 b4 e5 b5').forEach((f, i) => tone(d, 'sine', f, t, 2.0, 0.08 - i * 0.012, { swell: true, att: 0.9, rel: 0.8, vib: 0.4 + i * 0.2, vibD: 1.5 }));
    noise(d, t, 1.8, 0.05, { type: 'highpass', f: 6500, swell: true });
    H('b6 g#6 e6 b5 g#5 e5').forEach((f, i) => partials(chan({ pan: rnd(-0.6, 0.6), wet: 0.4 }), f, t + 0.8 + i * 0.12, RING.glass, 0.16, 0.7));
  });
  def('blessCast', 'She blesses a friend’s weapon: a short hummed note rising, a leaf’s shiver, one glass ping.', 'screen.js IO_MOVES.moonsteel and IO_MOVES.harvest (as she casts)', (t) => {
    const d = chan({ wet: 0.3 }); voice(d, 330, t, 0.6, 0.2, { to: 392, form: OO, swell: true, vib: 5 }); rustle(d, t, 0.3, 0.08); partials(d, 1568, t + 0.45, RING.glass, 0.14, 0.6);
  });
  def('moonsteel', 'Moonsteel sinks into the weapon: a long cold shimmer, like a wet finger round a glass rim, and a silver "shing".', 'screen.js IO_MOVES.moonsteel (it lands)', (t) => {
    const d = chan({ wet: 0.4 }); fm(d, 2637, 1.5, 0.8, t, 1.3, 0.12, { idx1: 0.05 }); tone(d, 'sine', 1318.5, t, 1.3, 0.1, { swell: true, att: 0.15, rel: 0.9, vib: 7, vibD: 5 });
    noise(d, t, 0.5, 0.2, { type: 'highpass', f: 6000, att: 0.03 }); partials(d, 1976, t + 0.05, RING.glass, 0.12, 1);
  });
  def('harvestMoon', 'Harvest Moon sinks into a friend: a warm amber swell, low and round, with a hearth’s flutter in it.', 'screen.js IO_MOVES.harvest (it lands)', (t) => {
    const d = chan({ wet: 0.35 }); H('a3 c#4 e4').forEach((f) => { tone(d, 'triangle', f, t, 1.5, 0.12, { swell: true, att: 0.4, rel: 0.8 }); tone(d, 'sine', f * 2, t, 1.5, 0.04, { swell: true, att: 0.5, rel: 0.8 }); });
    fire(d, t, 1.0, 0.16, { f0: 500, f1: 900, crack: 3 }); partials(d, 440, t + 0.1, RING.glass, 0.18, 1.6);
  });
  def('ioGuard', 'Io’s Defend: her moon shield closes round her: a rising glass "whum" and one clear ping.', 'screen.js IO_MOVES.defend', (t) => {
    const d = chan({ wet: 0.3 }); fm(d, 440, 2, 1.6, t, 0.5, 0.2, { swell: true, att: 0.25, rel: 0.2, idx1: 0.2 }); tone(d, 'triangle', 220, t, 0.45, 0.16, { to: 330, swell: true }); partials(d, 1318.5, t + 0.25, RING.glass, 0.2, 0.9);
  });
  def('moonlight', 'Moonlight, her great spell: voices gather and rise, glints climb, and the air draws up toward the moon. The beam’s blows follow as `moonlightHit`.', 'screen.js IO_MOVES.moonlight (as she casts)', (t) => {
    const d = chan({ wet: 0.5 }); H('d4 a4 d5').forEach((f, i) => voice(chan({ pan: (i - 1) * 0.5, wet: 0.5 }), f, t, 2.6, 0.14, { swell: true, att: 1.2, rel: 0.8, vib: 4.5, to: f * 1.122, glide: 2.4 }));
    whoosh(d, t + 0.4, 2.0, 0.1, 800, 5000, { buf: 'pink', q: 1 }); H('a5 d6 e6 a6 d7 e7').forEach((f, i) => partials(chan({ pan: rnd(-0.6, 0.6), wet: 0.5 }), f, t + 0.9 + i * 0.22, RING.glass, 0.1, 0.9));
  });
  def('moonlightHit', 'The moonbeam strikes: a bright zip straight down, a burst of glass and a hard white thud.', 'screen.js IO_MOVES.moonlight (each blow of the beam)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.4 }); tone(d, 'sine', 4200, t, 0.12, 0.2 * p, { to: 600 }); noise(d, t, 0.25, 0.6 * p, { type: 'highpass', f: 2500, att: 0.001 });
    thump(d, t + 0.02, 190, 55, 0.35, 0.8 * p); [1568, 2093, 3136].forEach((f) => partials(d, f, t + 0.02, RING.glass, 0.14 * p, 0.8));
  }, [1.1]);
  def('thornwakeCast', 'Thornwake: her sickle rings as she cuts the air, and the thorns begin to wake under it.', 'screen.js IO_MOVES.thorn (as she casts)', (t) => {
    const d = chan({ wet: 0.2 }); whoosh(d, t, 0.18, 0.3, 2400, 6000); fm(d, 2100, 2.76, 1.2, t + 0.05, 0.5, 0.1, { idx1: 0.1 }); creak(d, t + 0.15, 0.45, 0.12, { f: 600, f1: 1100 }); rustle(d, t + 0.15, 0.4, 0.1);
  });
  def('salveOpen', 'Silverleaf Salve: a cork pops, the potion glugs, leaves are crushed.', 'screen.js IO_MOVES.salve (as she starts)', (t) => {
    const d = chan({ wet: 0.15 }); tone(d, 'sine', 950, t, 0.05, 0.36, { to: 320 }); noise(d, t, 0.03, 0.3, { f: 1500, q: 1.2, att: 0.001 });
    [0.2, 0.31, 0.4].forEach((x, i) => bloop(d, t + x, 300 + i * 70, 0.26)); rustle(d, t + 0.15, 0.4, 0.14, { f0: 2000, f1: 5000 });
  });
  def('salve', 'The salve soothes: round drops climbing, and a warm chord of glass under them.', 'screen.js IO_MOVES.salve (it heals)', (t) => {
    const d = chan({ wet: 0.35 }); [392, 494, 587, 784, 988].forEach((f, i) => bloop(d, t + i * 0.07, f, 0.2, 1.25)); herbNotes(t + 0.15, H('e5 b5 g#5 e6'), 0.09, 0.18, 0.4);
    noise(d, t, 0.8, 0.05, { type: 'highpass', f: 5500, swell: true });
  });
  def('seedSow', 'Seeds are sown: a handful of tiny ticks pattering down, and a pat of earth. Moonflower Garden, and the Elderwood Guardian’s seed.', 'screen.js IO_MOVES.garden (as she starts)', (t) => {
    for (let i = 0; i < 8; i++) knock(chan({ pan: rnd(-0.5, 0.5), wet: 0.12 }), t + 0.05 + i * 0.05 + rnd(0, 0.03), rnd(1300, 2500), 0.2, 0.04);
    const d = chan({ wet: 0.15 }); noise(d, t + 0.5, 0.12, 0.4, { type: 'lowpass', f: 700, att: 0.01 }); thump(d, t + 0.5, 150, 90, 0.1, 0.3);
  });
  def('gardenBloom', 'The moonflowers open: four soft puffs, each with a glass note, and a shimmer over them.', 'screen.js IO_MOVES.garden (the flowers heal)', (t) => {
    H('e5 b5 g#5 e6').forEach((f, i) => { const d = chan({ pan: -0.5 + i * 0.33, wet: 0.4 }), tt = t + i * 0.13; tone(d, 'sine', 500, tt, 0.1, 0.14, { to: 900, att: 0.02 }); noise(d, tt, 0.12, 0.14, { buf: 'pink', f: 1800, q: 0.8, att: 0.03 }); partials(d, f, tt + 0.04, RING.glass, 0.2, 0.9); });
    noise(chan({ wet: 0.3 }), t, 1.0, 0.05, { type: 'highpass', f: 6500, swell: true });
  });
  def('rootCall', 'Rootbound Return begins: roots stir under a fallen friend: a low creak, earth shifting, a hummed note.', 'screen.js IO_MOVES.revive (as she starts)', (t) => {
    const d = chan({ wet: 0.25 }); creak(d, t, 0.7, 0.16, { f: 450, f1: 700, r0: 14, r1: 30 }); noise(d, t, 0.8, 0.5, { buf: 'brown', type: 'lowpass', f: 300, swell: true }); voice(d, 196, t + 0.1, 0.7, 0.14, { form: OO, swell: true, vib: 4 });
  });
  def('rootboundReturn', 'The roots lift her friend back up: a creak that climbs, and warm notes of wood climbing after it to a held glass chord.', 'screen.js IO_MOVES.revive (the friend rises)', (t) => {
    const d = chan({ wet: 0.3 }); creak(d, t, 0.6, 0.16, { f: 500, f1: 1600, r0: 18, r1: 70 }); rustle(d, t + 0.1, 0.6, 0.12);
    herbNotes(t + 0.1, H('e4 b4 e5 g#5 b5'), 0.1, 0.26, 0.4); H('e5 g#5 b5').forEach((f) => partials(chan({ wet: 0.5 }), f * 2, t + 0.65, RING.glass, 0.1, 1.6));
  });
  def('brambleCradle', 'Bramble Cradle: brambles weave round her from both sides, creaking, and lock shut with a woody clack.', 'screen.js IO_MOVES.cradle', (t) => {
    [0, 1, 2].forEach((i) => creak(chan({ pan: i % 2 ? 0.6 : -0.6, wet: 0.2 }), t + i * 0.2, 0.3, 0.16, { f: 600 + i * 150, f1: 900 + i * 200 }));
    const d = chan({ wet: 0.2 }); for (let i = 0; i < 4; i++) knock(d, t + 0.1 + i * 0.16, rnd(500, 900), 0.2, 0.06); rustle(d, t, 0.7, 0.14); knock(d, t + 0.72, 260, 0.6, 0.2); knock(d, t + 0.735, 390, 0.4, 0.15);
  });
  def('herb', 'A herb from the bag: a leaf crushed between the fingers, and two soft notes.', 'screen.js useHerb (either hero)', (t) => {
    const d = chan({ wet: 0.25 }); rustle(d, t, 0.2, 0.3, { f0: 2000, f1: 5200, n: 60, g1: 0.04 }); herbNotes(t + 0.18, H('b5 e6'), 0.1, 0.22);
  });
  def('lunarTrance', 'Her trance, moonlight in silver and green: a high shimmering chord that beats slowly, glass notes climbing through it, leaves stirring under it.', 'screen.js transform (Io’s trance begins)', (t) => {
    const d = chan({ wet: 0.5 }); [880, 1318.5, 1760].forEach((f, i) => { tone(d, 'sine', f, t, 2.4, 0.06, { swell: true, att: 0.8, rel: 1.0 }); tone(d, 'sine', f * 1.003, t, 2.4, 0.05, { swell: true, att: 1.0, rel: 1.0 }); });
    noise(d, t, 2.2, 0.06, { type: 'highpass', f: 5000, swell: true }); rustle(chan({ pan: -0.4, wet: 0.3 }), t + 0.2, 1.6, 0.08);
    H('e5 b5 e6 f#6 b6 e7').forEach((f, i) => partials(chan({ pan: -0.6 + i * 0.24, wet: 0.5 }), f, t + 0.4 + i * 0.2, RING.glass, 0.12, 1));
  });

  // ---------------------------------------------- the trance (either witch) ----------------------------------------------
  family('Trance', 'A witch’s gauge fills, and she changes. Io’s is silver-green moonlight; the Jester’s is purple.');
  def('tranceReady', 'A Trance gauge is full. Io: two glass notes rising a fourth, with a leaf’s shiver. The Jester: two of her bells, and a tick of chain.', 'screen.js apply(): the engine’s `tranceReady` event. Argument: whose', (t, who) => {
    if (who === 'jester') { bell(chan({ pan: -0.2, wet: 0.35 }), KORE[0], t, 0.26, { len: 0.8 }); bell(chan({ pan: 0.2, wet: 0.35 }), KORE[2], t + 0.11, 0.26, { len: 1.1 }); chain(chan(), t, 0.1, 0.1); return; }
    const d = chan({ wet: 0.4 }); partials(d, 987.8, t, RING.glass, 0.24, 0.7); partials(d, 1318.5, t + 0.11, RING.glass, 0.24, 1.1); rustle(d, t, 0.25, 0.08);
  }, ['io'], { 'Io': ['io'], 'The Jester': ['jester'] });
  // the swell every trance starts with: air and a note climbing, over two heartbeats
  function tranceSwell(t) {
    const d = chan({ wet: 0.35 }); whoosh(d, t, 1.0, 0.26, 400, 3200, { buf: 'pink', att: 0.85, rel: 0.12 }); tone(d, 'sine', 220, t, 1.0, 0.16, { to: 880, swell: true, att: 0.85, rel: 0.1 });
    thump(d, t, 110, 70, 0.16, 0.4); thump(d, t + 0.42, 120, 75, 0.16, 0.45);
  }
  def('tranceBegin', 'A witch steps into her trance: two heartbeats, and air and a note climbing. The music lifts with it, and comes back down when her trance ends.',
    'screen.js transform (as she begins). Arguments: who, and a function that says whether her trance is still on (the music asks it at each bar)', (t, who, still) => { tranceSwell(t); lift(still || 14); }, ['io']);
  def('tranceBurst', 'The change itself: a bright flash of sound, a thud, and light falling away.', 'screen.js transform (the flash as she changes)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.45 }); noise(d, t, 0.4, 0.7 * p, { type: 'highpass', f: 2000, att: 0.001 }); thump(d, t, 200, 60, 0.35, 0.8 * p); tone(d, 'sine', 3000, t, 0.7, 0.1 * p, { to: 500 });
  }, [0.7]);
  def('tranceShine', 'After the flash, her chord rings on. Io: glass, bright and open. The Jester: her bells, sweet and dark.', 'screen.js transform (with the flash). Argument: who', (t, who) => {
    if (who === 'jester') H('e5 g5 b5 f#6').forEach((f, i) => bell(chan({ pan: -0.6 + i * 0.4, wet: 0.5 }), f, t + i * 0.03, 0.2, { len: 2.4, strike: 0.5 }));
    else H('e5 b5 f#6 g#6').forEach((f, i) => partials(chan({ pan: -0.6 + i * 0.4, wet: 0.5 }), f, t + i * 0.03, RING.glass, 0.2, 2.2));
  }, ['io'], { 'Io': ['io'], 'The Jester': ['jester'] });

  // ------------------------------------------------ Io's summons ------------------------------------------------
  family('Summons', 'Her summons are prayers that take a moment to come: the Elderwood Guardian (a stag of living wood), Lunara (the moth goddess) and Envoi (a wyrm of folded letters with a lantern heart).');
  def('prayer', 'Io prays for a summon: three hummed notes and a breath, ending on one glass note. The tune differs for each: Lunara’s rises, the Guardian’s is low, Envoi’s falls and lifts.',
    'screen.js IO_MOVES.guardian, summonLunara, summonEnvoi, envoiMade and finaleEnding (as she begins). Argument: who she calls', (t, who) => {
      const tune = who === 'guardian' ? H('e4 g4 a4') : who === 'envoi' ? H('b4 a4 e5') : H('b4 d5 e5'), d = chan({ wet: 0.45 });
      tune.forEach((f, i) => voice(d, f, t + i * 0.27, i === 2 ? 0.6 : 0.3, 0.2, { form: OO, swell: true, att: 0.07, rel: i === 2 ? 0.35 : 0.1, vib: 5 }));
      noise(d, t, 1.0, 0.04, { buf: 'pink', f: 2200, q: 0.8, swell: true }); partials(d, tune[2] * 2, t + 0.8, RING.glass, 0.14, 1.2);
    }, ['lunara'], { 'For Lunara': ['lunara'], 'For the Guardian': ['guardian'], 'For Envoi': ['envoi'] });
  // the Elderwood Guardian
  def('guardianGrow', 'The seed splits and the stag grows: a crack, wood creaking upward three times through rustling leaves, then the stag’s call: a low, two-note bell of a voice.', 'screen.js IO_MOVES.guardian (the stag takes shape)', (t) => {
    const d = chan({ wet: 0.3 }); knock(d, t, 420, 0.5, 0.1); noise(d, t, 0.04, 0.4, { f: 2400, q: 1, att: 0.001 });
    [0, 1, 2].forEach((i) => creak(chan({ pan: (i - 1) * 0.4, wet: 0.25 }), t + 0.1 + i * 0.3, 0.34, 0.16, { f: 420 + i * 200, f1: 700 + i * 320, r0: 16 + i * 6, r1: 40 + i * 14 }));
    rustle(chan({ wet: 0.25 }), t + 0.1, 1.1, 0.16, { rise: true });
    const v = chan({ wet: 0.5 }), form = [[520, 4, 1], [1100, 6, 0.5], [2300, 6, 0.12]];
    voice(v, 196, t + 1.15, 0.4, 0.3, { form, to: 262, glide: 0.15, swell: true, att: 0.06, rel: 0.1 }); voice(v, 262, t + 1.5, 0.75, 0.32, { form, to: 233, swell: true, att: 0.05, rel: 0.5, vib: 5 });
  });
  def('guardianCharge', 'The stag charges: hooves of wood at a gallop, leaves streaming behind, the air rushing up.', 'screen.js IO_MOVES.guardian (it charges)', (t) => {
    [0, 0.09, 0.2, 0.36, 0.45, 0.56, 0.7, 0.78].forEach((x, i) => { const d = chan({ pan: -0.5 + i * 0.13, wet: 0.15 }); knock(d, t + x, 150 + (i % 3) * 22, 0.5, 0.1); noise(d, t + x, 0.03, 0.3, { type: 'lowpass', f: 900, att: 0.002 }); });
    const d = chan({ wet: 0.2, pan: -0.4, panTo: 0.5, panT: 0.9 }); whoosh(d, t, 0.95, 0.24, 500, 2400, { att: 0.8, rel: 0.12 }); rustle(d, t, 0.9, 0.14, { rise: true });
  });
  def('guardianBurst', 'The stag strikes and bursts into vines: a great crack of wood, a deep thud, leaves flying, vines creaking as they take hold.', 'screen.js IO_MOVES.guardian (the blow)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); knock(d, t, 190, 0.8 * p, 0.3); knock(d, t + 0.012, 310, 0.5 * p, 0.2); noise(d, t, 0.1, 0.7 * p, { f: 1800, q: 0.7, att: 0.001 }); thump(d, t, 140, 40, 0.5, 0.8 * p);
    rustle(chan({ wet: 0.3 }), t + 0.02, 0.7, 0.3 * p, { n: 50 }); for (let i = 0; i < 5; i++) knock(chan({ pan: rnd(-0.6, 0.6), wet: 0.2 }), t + rnd(0.08, 0.5), rnd(400, 900), 0.2 * p, 0.06);
    creak(chan({ pan: 0.3, wet: 0.25 }), t + 0.3, 0.5, 0.1 * p, { f: 700, f1: 500, r0: 40, r1: 16 });
  }, [1.3]);
  // Lunara, the moth goddess
  def('moonwellWake', 'The Moonwell answers her: water stirs and bubbles, a deep note sounds in the well, and a silver chord rises out of it.', 'screen.js summonLunara (her light reaches the well)', (t) => {
    const d = chan({ wet: 0.5 }); for (let i = 0; i < 14; i++) bloop(chan({ pan: rnd(-0.5, 0.5), wet: 0.3 }), t + rnd(0, 1.1), rnd(450, 1500), 0.1, 1.5);
    tone(d, 'sine', 196, t, 2.0, 0.2, { swell: true, att: 0.5, rel: 1.0 }); tone(d, 'triangle', 392, t, 2.0, 0.06, { swell: true, att: 0.7, rel: 1.0 });
    H('g4 d5 g5 b5').forEach((f, i) => tone(d, 'sine', f, t + 0.3 + i * 0.12, 1.9, 0.06, { swell: true, att: 0.6, rel: 1.0, vib: 0.5, vibD: 2 }));
    noise(d, t + 0.3, 1.5, 0.05, { type: 'highpass', f: 6000, swell: true });
  });
  def('wellSurge', 'Light bursts up out of the well: a rush upward and a soft deep thud.', 'screen.js summonLunara (with `moonwellWake`)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); whoosh(d, t, 0.7, 0.5 * p, 300, 4200, { buf: 'pink', att: 0.5, rel: 0.2 }); thump(d, t, 130, 50, 0.4, 0.6 * p);
  }, [0.6]);
  def('lunaraRise', 'Lunara rises: a wide soft chord of voices, moth wings fluttering in the air, glints of glass.', 'screen.js summonLunara (she appears)', (t) => {
    H('d4 a4 f#5').forEach((f, i) => voice(chan({ pan: (i - 1) * 0.6, wet: 0.55 }), f, t, 1.9, 0.16, { swell: true, att: 0.5, rel: 1.0, vib: 4.5 }));
    const d = chan({ wet: 0.4 }); noise(trem(d, 13, 0.9, t, 1.6), t, 1.6, 0.14, { buf: 'pink', f: 2600, q: 0.7, swell: true });
    H('a6 d7 f#7').forEach((f, i) => partials(chan({ pan: rnd(-0.7, 0.7), wet: 0.5 }), f, t + 0.3 + i * 0.25, RING.glass, 0.08, 0.9));
  });
  def('wingBeat', 'Her great wings beat once, twice: soft, deep pushes of air, one from each side.', 'screen.js summonLunara (with `lunaraRise`)', (t, p) => {
    p = p || 1; [-0.6, 0.6].forEach((pan, i) => { const d = chan({ pan, wet: 0.3 }); noise(d, t + i * 0.3, 0.4, 0.9 * p, { buf: 'brown', type: 'lowpass', f: 500, swell: true, att: 0.12, rel: 0.25 }); noise(d, t + i * 0.3, 0.35, 0.16 * p, { buf: 'pink', f: 900, q: 0.8, swell: true, att: 0.1, rel: 0.2 }); });
  }, [0.5]);
  def('lunaraEmbrace', 'The Pale Mother’s Embrace: her wings sweep closed over the party, and a harp of glass climbs in a warm chord as they heal.', 'screen.js summonLunara (the Embrace)', (t) => {
    const w = chan({ pan: -0.7, panTo: 0.7, panT: 0.9, wet: 0.3 }); whoosh(w, t, 0.9, 0.4, 1800, 400, { buf: 'pink', q: 0.8 });
    H('a4 c#5 e5 a5 c#6 e6 a6').forEach((f, i) => { const d = chan({ pan: -0.5 + i * 0.17, wet: 0.5 }); partials(d, f, t + 0.5 + i * 0.1, RING.glass, 0.18, 1.2); tone(d, 'triangle', f, t + 0.5 + i * 0.1, 0.5, 0.05); });
    const d = chan({ wet: 0.5 }); H('a3 e4 c#5').forEach((f) => tone(d, 'sine', f, t + 0.4, 1.9, 0.08, { swell: true, att: 0.6, rel: 1.0 }));
  });
  def('requiemGather', 'Silver Requiem: the moon gathers over her: a slow rising shimmer, glass ticks quickening.', 'screen.js lunaraStrike (she charges)', (t) => {
    const d = chan({ wet: 0.5 }); tone(d, 'sine', 440, t, 2.0, 0.1, { to: 660, swell: true, att: 1.4, rel: 0.4 }); fm(d, 1760, 1.5, 0.6, t, 2.0, 0.07, { to: 2637, swell: true, att: 1.4, rel: 0.4 });
    noise(d, t, 2.0, 0.1, { type: 'highpass', f: 5000, swell: true, att: 1.6, rel: 0.3 });
    let tt = t; for (let i = 0; i < 12; i++) { partials(chan({ pan: rnd(-0.6, 0.6), wet: 0.4 }), 1568 * Math.pow(1.06, i), tt, RING.glass, 0.06 + i * 0.008, 0.3); tt += 0.3 * Math.pow(0.86, i); }
  });
  def('requiemRelease', 'She lets the moon go: a bright rising "zing" and a burst of glass.', 'screen.js lunaraStrike (the release)', (t) => {
    const d = chan({ wet: 0.4 }); tone(d, 'sine', 800, t, 0.3, 0.2, { to: 3600 }); whoosh(d, t, 0.4, 0.26, 1500, 6000); [2093, 2637, 3136].forEach((f, i) => partials(d, f, t + 0.05 + i * 0.03, RING.glass, 0.14, 0.7));
  });
  def('moonbeamHit', 'One of the six moonbeams lands: a zip down and a glassy thud. Each comes at its own pitch, so the six make a falling phrase.', 'screen.js lunaraStrike (each beam)', (t, p) => {
    p = p || 1; const f = pick(H('e6 d6 b5 a5 g5')), d = chan({ pan: rnd(-0.5, 0.5), wet: 0.35 });
    tone(d, 'sine', f * 3, t, 0.09, 0.16 * p, { to: f }); partials(d, f, t + 0.01, RING.glass, 0.26 * p, 0.6); thump(d, t, 200, 80, 0.14, 0.6 * p); noise(d, t, 0.04, 0.4 * p, { type: 'highpass', f: 3500, att: 0.001 });
  }, [0.8]);
  def('moonfallDrop', 'Moonfall: the moon comes down: a long falling whistle that grows, and the ground beginning to rumble.', 'screen.js lunaraStrike (the moon starts to fall)', (t) => {
    const d = chan({ wet: 0.4 }); tone(d, 'sine', 2600, t, 1.5, 0.16, { to: 280, swell: true, att: 1.3, rel: 0.1 }); tone(d, 'triangle', 1300, t, 1.5, 0.08, { to: 140, swell: true, att: 1.3, rel: 0.1 });
    whoosh(d, t, 1.5, 0.3, 4000, 500, { buf: 'pink', att: 1.3, rel: 0.1 }); noise(d, t, 1.5, 0.8, { buf: 'brown', type: 'lowpass', f: 300, swell: true, att: 1.35, rel: 0.1 });
  });
  def('moonfallImpact', 'The moon lands: the biggest blow in the game. A deep slam, a white crack, and glass breaking everywhere.', 'screen.js lunaraStrike (Moonfall lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.55 }); thump(d, t, 120, 30, 0.9, 0.9 * p); tone(d, 'sawtooth', 220, t, 0.5, 0.2 * p, { to: 55 });
    noise(d, t, 0.7, 0.9 * p, { type: 'lowpass', f: 5000, to: 200, att: 0.002 }); noise(d, t, 0.2, 0.5 * p, { type: 'highpass', f: 3000, att: 0.001 });
    for (let i = 0; i < 12; i++) partials(chan({ pan: rnd(-0.9, 0.9), wet: 0.5 }), rnd(1800, 5200), t + rnd(0, 0.45), RING.glass, 0.1 * p, 0.5);
  }, [1.5]);
  def('moonfallRing', 'After Moonfall: a huge soft bell of glass ringing on, and light settling.', 'screen.js lunaraStrike (with `moonfallImpact`)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.6 }); [220, 330, 440].forEach((f) => partials(d, f, t + 0.03, RING.glass, 0.2 * p, 3)); noise(d, t + 0.1, 1.8, 0.07 * p, { type: 'highpass', f: 7000, to: 2500, att: 0.1 });
  }, [1.0]);
  // Envoi, the Letter Wyrm
  def('lettersFold', 'Io’s letters fold into the wyrm: paper riffling and fluttering, folding faster and faster, with a warm note rising in it.', 'screen.js summonEnvoi, envoiMade and finaleEnding (Envoi takes shape)', (t) => {
    rustle(chan({ pan: -0.3, panTo: 0.3, panT: 1.2, wet: 0.2 }), t, 1.2, 0.34, { f0: 1500, f1: 4500, n: 46, g0: 0.008, g1: 0.03, rise: true });
    const d = chan({ wet: 0.2 }); let tt = t + 0.05; for (let i = 0; i < 10; i++) { noise(d, tt, 0.05, 0.4, { type: 'lowpass', f: 2200 + i * 150, att: 0.003 }); tt += 0.2 * Math.pow(0.85, i); }
    tone(d, 'triangle', 330, t, 1.2, 0.09, { to: 660, swell: true, att: 0.9, rel: 0.2 });
  });
  def('heartLantern', 'Envoi’s heart lantern lights: a soft whoomp, a warm round bell, a small flame settling.', 'screen.js summonEnvoi and envoiMade (the banner Heart Lantern)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.4 }); noise(d, t, 0.3, 0.9 * p, { type: 'lowpass', f: 250, to: 1300, swell: true, att: 0.1, rel: 0.2 }); thump(d, t, 150, 80, 0.2, 0.5 * p);
    partials(d, 392, t + 0.05, RING.glass, 0.3 * p, 1.6); partials(d, 587.3, t + 0.07, RING.glass, 0.2 * p, 1.4); fire(d, t + 0.1, 0.8, 0.2 * p, { f0: 600, f1: 1000, crack: 3 });
  }, [0.6]);
  def('sealBreak', 'The wax seal on the letters breaks: a sharp snap, a thud, paper bursting free, and a bright bell.', 'screen.js summonEnvoi and envoiMade (the banner Seal Break)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3 }); noise(d, t, 0.03, 0.8 * p, { type: 'highpass', f: 3000, att: 0.001 }); knock(d, t, 700, 0.6 * p, 0.08); thump(d, t, 170, 60, 0.25, 0.7 * p);
    rustle(chan({ wet: 0.25 }), t + 0.02, 0.5, 0.3 * p, { f0: 1500, f1: 4500, g0: 0.008, g1: 0.03, n: 50 }); bell(chan({ wet: 0.5 }), 1174.7, t + 0.02, 0.3 * p, { len: 1.6 });
  }, [1.0]);
  def('wardHit', 'A blow lands on Envoi’s Folding Ward and the party takes nothing: a thick thump on a wall of paper, pages fluttering, a warm ring.', 'screen.js wardHit', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3 }); noise(d, t, 0.09, 0.8 * p, { type: 'lowpass', f: 1500, to: 300, att: 0.002 }); thump(d, t, 180, 70, 0.2, 0.7 * p);
    rustle(d, t + 0.03, 0.35, 0.3 * p, { f0: 1500, f1: 4200, g0: 0.008, g1: 0.03, n: 50 }); tone(d, 'sine', 587.3, t, 0.5, 0.12 * p); tone(d, 'sine', 880, t, 0.4, 0.07 * p);
  }, [1.0]);
  def('envoiWrap', 'Envoi wraps its foe and its tail catches fire: a long rush of paper sweeping round, flame rising under it, the wyrm’s low voice.', 'screen.js envoiStrike and finaleEnding (Envoi’s strike begins)', (t) => {
    rustle(chan({ pan: -0.7, panTo: 0.7, panT: 1.3, wet: 0.25 }), t, 1.3, 0.34, { f0: 1500, f1: 4500, g0: 0.008, g1: 0.03, n: 50 });
    const d = chan({ wet: 0.3 }); fire(d, t + 0.2, 1.3, 0.4, { f0: 400, f1: 1800, att: 1.0, rel: 0.25 }); fm(d, 110, 0.5, 3, t, 1.4, 0.24, { swell: true, to: 147, idx1: 5 });
  });
  def('letterBurn', 'One blow of Envoi’s ring of fire: a puff of flame, paper snapping, a small hot thud.', 'screen.js envoiStrike and finaleEnding (each of its eight blows)', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.4, 0.4), wet: 0.25 }); noise(d, t, 0.2, 0.6 * p, { buf: 'pink', f: 700, to: 1900, q: 0.8, att: 0.01 }); thump(d, t, 190, 80, 0.14, 0.6 * p);
    for (let i = 0; i < 4; i++) noise(d, t + rnd(0, 0.14), 0.012, 0.5 * p, { type: 'highpass', f: rnd(2500, 6000), att: 0.001 }); rustle(d, t, 0.14, 0.2 * p, { f0: 1500, f1: 4000, g1: 0.03 });
  }, [0.8]);
  def('lastWord', 'Envoi’s Last Word: its heart drops: a great warm burst of fire, a deep slam, and a chord of bells opening over it.', 'screen.js envoiStrike and finaleEnding (the last blow)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.5 }); thump(d, t, 130, 35, 0.9, 0.9 * p); tone(d, 'sawtooth', 196, t, 0.5, 0.18 * p, { to: 65 });
    noise(d, t, 0.8, 0.8 * p, { type: 'lowpass', f: 4000, to: 250, att: 0.002 }); fire(d, t + 0.05, 1.2, 0.3 * p, { f0: 1600, f1: 500, att: 0.05 });
    H('e4 g#4 b4 e5').forEach((f, i) => bell(chan({ pan: -0.5 + i * 0.33, wet: 0.55 }), f * 2, t + 0.04 + i * 0.02, 0.16 * p, { len: 2.6, strike: 0.4 }));
  }, [1.5]);
  def('lettersSent', 'The letters scatter as embers, sent at last: a cloud of paper fluttering upward, and sparks ticking as they climb.', 'screen.js envoiStrike (with `lastWord`)', (t, p) => {
    p = p || 1; rustle(chan({ wet: 0.35 }), t + 0.1, 1.5, 0.26 * p, { f0: 1800, f1: 5500, g0: 0.008, g1: 0.03, n: 40 });
    for (let i = 0; i < 10; i++) partials(chan({ pan: rnd(-0.8, 0.8), wet: 0.5 }), 1400 * Math.pow(1.09, i) * rnd(0.97, 1.03), t + 0.2 + i * 0.13, RING.glass, 0.07 * p, 0.4);
  }, [1.0]);

  // ------------------------------------------------- the foes -------------------------------------------------
  family('Wisps', 'A wisp is a soul starting to go hollow, craving light: breath over the neck of a bottle.');
  def('wispFlicker', 'A wisp flickers at its prey: a hollow note fluttering upward, and a spit of spark.', 'screen.js WISP_MOVES.flicker (as it starts)', (t) => {
    const d = chan({ wet: 0.35 }); hollow(trem(d, 22, 0.8, t, 0.45), 520, t, 0.45, 0.4, { to: 800, vib: 0 }); noise(d, t + 0.38, 0.015, 0.2, { type: 'highpass', f: 5000, att: 0.001 });
  });
  def('wispTouch', 'A wisp’s touch lands: a cold hollow puff, more a chill than a blow.', 'screen.js WISP_MOVES.flicker (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3 }); noise(d, t, 0.07, 0.6 * p, { f: 1200, q: 3, att: 0.002 }); hollow(d, 440, t, 0.22, 0.4 * p, { to: 330, att: 0.01, rel: 0.18, vib: 0 }); thump(d, t, 160, 90, 0.1, 0.4 * p);
  }, [0.8]);
  def('wispCling', 'A wisp latches on to drink: the air drawn in, and a hollow note sinking.', 'screen.js WISP_MOVES.cling (as it starts)', (t) => {
    const d = chan({ wet: 0.35 }); whoosh(d, t, 0.55, 0.3, 2200, 500, { q: 2.5, att: 0.45, rel: 0.08 }); hollow(d, 660, t, 0.6, 0.3, { to: 495 });
  });
  def('wispSip', 'One sip of its prey’s light: a short hollow slurp.', 'screen.js WISP_MOVES.cling (each sip)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.25 }); whoosh(d, t, 0.13, 0.5 * p, 500, 1700, { q: 3, att: 0.1, rel: 0.02 }); hollow(d, 600, t, 0.14, 0.3 * p, { to: 800, att: 0.02, rel: 0.08, vib: 0 });
  }, [0.6]);
  def('wispWail', 'A wisp wails for the light it can’t have: two hollow voices rising together and falling apart.', 'screen.js WISP_MOVES.wail. Argument: how long, in seconds', (t, len) => {
    len = len || 0.9; [0, 1].forEach((i) => { const d = chan({ pan: i ? 0.4 : -0.4, wet: 0.45 }), f = i ? 523 : 494; hollow(d, f, t, len * 0.45, 0.34, { to: f * 1.5, att: len * 0.1, rel: 0.02 }); hollow(d, f * 1.5, t + len * 0.45, len * 0.55, 0.34, { to: f * (i ? 0.84 : 0.94), att: 0.02, rel: len * 0.4 }); });
  }, [0.9]);
  def('frostBreath', 'A frost wisp breathes cold on the party: icy air, a low hollow note, and tiny crystals ticking.', 'screen.js WISP_MOVES.breath', (t) => {
    const d = chan({ wet: 0.4 }); noise(d, t, 0.9, 0.2, { type: 'highpass', f: 4000, swell: true, att: 0.25, rel: 0.5 }); whoosh(d, t, 0.9, 0.2, 2400, 1500, { q: 2 }); hollow(d, 392, t, 0.8, 0.2, { to: 349 });
    for (let i = 0; i < 9; i++) partials(chan({ pan: rnd(-0.7, 0.7), wet: 0.4 }), rnd(3000, 6500), t + rnd(0.15, 0.85), RING.glass, 0.05, 0.2);
  });

  family('Shadow Wraiths', 'What a wisp becomes when nobody helps it: a cold, hollow voice, and the wisp it was still whistling inside it.');
  // a wraith's voice: two voices a half-step apart sliding down, breath, and the old wisp whistling high in it
  function wraithVoice(t, len, peak) {
    [310, 329].forEach((f, i) => voice(chan({ pan: i ? 0.3 : -0.3, wet: 0.5 }), f, t, len, peak, { form: OH, to: f * 0.6, swell: true, att: 0.05, rel: len * 0.5, vib: 5.5, vibD: 9 }));
    const d = chan({ wet: 0.5 }); noise(d, t, len, peak * 0.35, { buf: 'pink', f: 1400, to: 600, q: 2, swell: true, att: 0.05, rel: len * 0.5 }); hollow(d, 930, t, len, peak * 0.5, { to: 620, att: 0.04, rel: len * 0.5 });
  }
  def('wraithCry', 'A Shadow Wraith cries out as it moves to strike: a cold double voice sliding down.', 'screen.js WRAITH_MOVES sweep, bolts, eclipse and breath (as each starts). Argument: how long, in seconds', (t, len) => wraithVoice(t, len || 0.8, 0.26), [0.8]);
  def('wraithRise', 'The first wraith rises out of the Thornwood: the ground hums, and its cry comes up out of it.', 'screen.js intro (the first fight’s wraith appears). Argument: how long, in seconds', (t, len) => {
    len = len || 1.2; const d = chan({ wet: 0.4 }); noise(d, t, len, 0.7, { buf: 'brown', type: 'lowpass', f: 250, to: 500, swell: true }); tone(d, 'triangle', 110, t, len, 0.14, { to: 165, swell: true }); wraithVoice(t + 0.25, len, 0.26);
  }, [1.2]);
  def('wraithSwing', 'A wraith’s arm sweeps: a cold rush of air with a hollow whistle in it.', 'screen.js WRAITH_MOVES.sweep (the swing)', (t) => {
    const d = chan({ wet: 0.3, pan: 0.4, panTo: -0.3, panT: 0.3 }); whoosh(d, t, 0.3, 0.4, 500, 1700, { q: 2 }); hollow(d, 700, t, 0.3, 0.16, { to: 1100, vib: 0 });
  });
  def('wraithClaw', 'A wraith’s blow lands on a hero: a cold, hollow thud with two sour notes ringing in it.', 'screen.js WRAITH_MOVES.sweep (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); thump(d, t, 150, 50, 0.25, 0.8 * p); noise(d, t, 0.12, 0.7 * p, { type: 'lowpass', f: 1800, to: 300, att: 0.002 });
    hollow(d, 392, t, 0.3, 0.24 * p, { att: 0.01, rel: 0.25, vib: 0 }); hollow(d, 415, t, 0.3, 0.24 * p, { att: 0.01, rel: 0.25, vib: 0 }); noise(d, t, 0.02, 0.3 * p, { type: 'highpass', f: 5000, att: 0.001 });
  }, [1.1]);
  def('wraithBolt', 'A wraith looses a green bolt: a sour falling zap.', 'screen.js WRAITH_MOVES.bolts (each bolt as it leaves)', (t) => {
    const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.25 }); fm(d, 700, 1.5, 3, t, 0.28, 0.2, { to: 330, idx1: 0.5 }); whoosh(d, t, 0.25, 0.2, 1800, 900, { q: 2, att: 0.05, rel: 0.2 });
  });
  def('wraithBoltHit', 'A green bolt lands: a wet, sour splat.', 'screen.js WRAITH_MOVES.bolts (each bolt landing)', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.25 }); noise(d, t, 0.12, 0.7 * p, { f: 900, q: 1.5, att: 0.002 }); fm(d, 330, 1.5, 3, t, 0.18, 0.2 * p, { to: 160 }); thump(d, t, 170, 80, 0.12, 0.5 * p);
  }, [0.7]);
  def('graveGrasp', 'Grave Grasp: cold tendrils drag up out of the ground: a low shuddering drag, a moan underneath, things creeping.', 'screen.js WRAITH_MOVES.grasp (as it starts)', (t) => {
    const d = chan({ wet: 0.35 }); noise(trem(d, 9, 0.7, t, 1.0), t, 1.0, 0.9, { buf: 'brown', type: 'lowpass', f: 380, swell: true }); voice(d, 110, t, 1.0, 0.2, { form: OH, to: 82, swell: true });
    for (let i = 0; i < 8; i++) knock(chan({ pan: rnd(-0.5, 0.5), wet: 0.2 }), t + rnd(0.1, 0.9), rnd(200, 320), 0.2, 0.06);
  });
  def('graspHit', 'The grasp closes: a heavy crunch and two low sour notes.', 'screen.js WRAITH_MOVES.grasp (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); thump(d, t, 140, 45, 0.3, 0.9 * p); noise(d, t, 0.15, 0.7 * p, { f: 600, q: 1, att: 0.002 }); hollow(d, 196, t, 0.35, 0.3 * p, { att: 0.01, rel: 0.3, vib: 0 }); hollow(d, 208, t, 0.35, 0.3 * p, { att: 0.01, rel: 0.3, vib: 0 });
  }, [1.2]);
  def('blackSun', 'Eclipse: a black sun rises over the wraith: a deep drone that opens slowly, cold voices a half-step apart, breath rising.', 'screen.js WRAITH_MOVES.eclipse (as it starts)', (t) => {
    const d = chan({ wet: 0.5 }), lp = ctx.createBiquadFilter(), g = gain(1); lp.type = 'lowpass'; lp.Q.value = 3; lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(1100, t + 2.5); lp.connect(g); g.connect(d);
    [55, 55.6, 82.6].forEach((f) => tone(lp, 'sawtooth', f, t, 2.6, 0.16, { swell: true, att: 1.6, rel: 0.5 })); tone(d, 'sine', 41, t, 2.6, 0.3, { to: 36, swell: true });
    [233, 247].forEach((f, i) => voice(chan({ pan: i ? 0.5 : -0.5, wet: 0.5 }), f, t + 0.4, 2.2, 0.1, { form: OH, swell: true, att: 1.4, rel: 0.5, vib: 4 })); whoosh(d, t, 2.6, 0.12, 400, 1400, { buf: 'pink', att: 2.0, rel: 0.4 });
  });
  def('blackSunFall', 'The eclipse falls on the party: a deep dropping slam and a cold chord of voices cut short.', 'screen.js WRAITH_MOVES.eclipse (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.55 }); thump(d, t, 110, 28, 0.9, 0.9 * p); noise(d, t, 0.9, 0.9 * p, { type: 'lowpass', f: 2500, to: 120, att: 0.002 }); tone(d, 'sawtooth', 165, t, 0.5, 0.16 * p, { to: 50 });
    [196, 233, 277].forEach((f) => voice(d, f, t, 0.8, 0.14 * p, { form: OH, to: f * 0.8, att: 0.02 }));
  }, [1.3]);
  def('stolenFire', 'The great wraith breathes the town’s stolen fire: a wide roar of flame with a growl under it.', 'screen.js WRAITH_MOVES.breath, the great wraith’s (the fire comes)', (t) => {
    const d = chan({ wet: 0.3, pan: 0.4, panTo: -0.4, panT: 1.0 }); fire(d, t, 1.1, 0.7, { f0: 500, f1: 1500, flutter: 14 }); tone(d, 'sawtooth', 70, t, 1.0, 0.12, { to: 95, swell: true }); tone(d, 'triangle', 210, t, 1.0, 0.07, { to: 285, swell: true });
  });
  def('stolenFireHit', 'A wave of the stolen fire washes over the party: a hot gust and a thud.', 'screen.js WRAITH_MOVES.breath, the great wraith’s (each wave)', (t) => {
    const d = chan({ wet: 0.3 }); fire(d, t, 0.45, 0.7, { f0: 1500, f1: 600, att: 0.03, rel: 0.35, crack: 5 }); thump(d, t, 170, 60, 0.2, 0.6);
  });
  def('lampDrink', 'The great wraith drinks the lamplight to heal: the air drawn in harder and harder, warm notes swallowed one by one, a low gulp.', 'screen.js WRAITH_MOVES.swallow (as it starts)', (t) => {
    const d = chan({ wet: 0.35 }); whoosh(d, t, 1.2, 0.4, 300, 2600, { q: 2, att: 1.1, rel: 0.06 }); H('a5 g5 e5 d5 a4').forEach((f, i) => tone(d, 'sine', f, t + 0.15 + i * 0.19, 0.2, 0.14 - i * 0.015, { to: f * 0.85 }));
    tone(d, 'sine', 200, t + 1.2, 0.2, 0.4, { to: 90 }); thump(d, t + 1.2, 150, 70, 0.2, 0.4);
  });

  family('Brambles', 'The Bramble Horrors and the Bramble Colossus: canes, thorns and berries. Wood that creaks, whips that crack, fruit that is sweet and wrong.');
  def('caneSwing', 'A bramble cane lashes out: a fast whip of air, a creak, leaves tearing along it.', 'screen.js BRAMBLE_MOVES.strike and sweep, COLOSSUS_MOVES.volley (as the canes go)', (t) => {
    const d = chan({ wet: 0.2, pan: 0.5, panTo: -0.4, panT: 0.22 }); whoosh(d, t, 0.22, 0.44, 800, 3400, { q: 2.5 }); creak(d, t, 0.2, 0.1, { f: 900, f1: 1500, r0: 30, r1: 70 }); rustle(d, t, 0.2, 0.12);
  });
  def('thornLash', 'A cane lands on a hero: a whip’s crack, thorns ripping, a woody thud and a wet berry splat.', 'screen.js thornFx: every blow of the Bramble Horror and the Colossus', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.2 }); noise(d, t, 0.025, 0.9 * p, { type: 'highpass', f: 2500, att: 0.001 }); knock(d, t, 600, 0.5 * p, 0.08); thump(d, t, 170, 70, 0.16, 0.7 * p);
    rustle(d, t + 0.01, 0.12, 0.3 * p, { f0: 2500, f1: 5000, n: 70, g1: 0.03 }); noise(d, t + 0.02, 0.07, 0.5 * p, { type: 'lowpass', f: 700, att: 0.004 });
  }, [1.2]);
  def('caneGrab', 'Its canes hook their prey and drag her in: three slow creaks from side to side, leaves dragging.', 'screen.js BRAMBLE_MOVES.grab and COLOSSUS_MOVES.devour (as it starts)', (t) => {
    [0, 1, 2].forEach((i) => creak(chan({ pan: i % 2 ? 0.5 : -0.5, wet: 0.25 }), t + i * 0.32, 0.4, 0.2, { f: i % 2 ? 520 : 700, f1: i % 2 ? 800 : 480, r0: 14, r1: 34 }));
    const d = chan({ wet: 0.2 }); rustle(d, t, 1.0, 0.14); noise(d, t, 1.0, 0.5, { buf: 'brown', type: 'lowpass', f: 400, swell: true });
  });
  def('rootFeed', 'It feeds through its roots: earth shifting, a creak, something wet gurgling below.', 'screen.js BRAMBLE_MOVES.consume (as it starts)', (t) => {
    const d = chan({ wet: 0.25 }); noise(d, t, 0.9, 0.7, { buf: 'brown', type: 'lowpass', f: 320, swell: true }); creak(d, t + 0.1, 0.5, 0.12, { f: 450, f1: 380, r0: 12, r1: 22 });
    for (let i = 0; i < 5; i++) bloop(d, t + 0.15 + i * 0.14, rnd(170, 260), 0.26, 0.6);
  });
  def('rootPulse', 'One pulse of its feeding: a wet thump, and a thorn’s tick.', 'screen.js BRAMBLE_MOVES.consume (each pulse)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.2 }); thump(d, t, 130, 60, 0.2, 0.7 * p); bloop(d, t, 250, 0.4 * p, 0.55); noise(d, t, 0.06, 0.4 * p, { type: 'lowpass', f: 800, att: 0.004 }); knock(d, t + 0.03, 1400, 0.14 * p, 0.03);
  }, [0.8]);
  def('caneStab', 'It stabs its canes into the soil: two woody stabs, soil crunching, a creak as they sink.', 'screen.js BRAMBLE_MOVES.undergrowth and COLOSSUS_MOVES.briar (as it starts)', (t) => {
    const d = chan({ wet: 0.2 }); [0, 0.18].forEach((x, i) => { knock(d, t + x, 240 - i * 40, 0.6, 0.12); noise(d, t + x, 0.1, 0.6, { type: 'lowpass', f: 1200, to: 400, att: 0.003 }); thump(d, t + x, 150, 70, 0.14, 0.5); });
    creak(d, t + 0.3, 0.4, 0.12, { f: 500, f1: 380, r0: 30, r1: 14 });
  });
  def('groundBreak', 'Thorned shoots burst up round their prey: soil breaking, snaps, a creak rising.', 'screen.js BRAMBLE_MOVES.undergrowth (the shoots come up)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.25 }); noise(d, t, 0.4, 0.9 * p, { type: 'lowpass', f: 1200, to: 200, att: 0.004 }); thump(d, t, 130, 45, 0.35, 0.8 * p);
    for (let i = 0; i < 5; i++) knock(chan({ pan: rnd(-0.5, 0.5), wet: 0.2 }), t + rnd(0.02, 0.3), rnd(350, 800), 0.4 * p, 0.07); creak(d, t + 0.05, 0.35, 0.14 * p, { f: 600, f1: 1400, r0: 25, r1: 70 });
  }, [0.6]);
  def('lure', 'The Lure: it holds its fruit out: a sweet little music-box tune whose last note sours and sinks, a sticky drip, a creak under it.', 'screen.js lureTurn', (t) => {
    const d = chan({ wet: 0.45 }); H('e6 g#6 b6').forEach((f, i) => { partials(d, f, t + i * 0.16, RING.glass, 0.2, 0.7); tone(d, 'triangle', f, t + i * 0.16, 0.3, 0.05); });
    tone(d, 'sine', hz('d#7'), t + 0.48, 0.9, 0.14, { to: hz('d7') * 0.985, glide: 0.7, vib: 6, vibD: 14 }); bloop(d, t + 0.75, 320, 0.2, 0.6); creak(chan({ wet: 0.2 }), t + 0.2, 0.9, 0.06, { f: 420, f1: 380, r0: 9, r1: 14 });
  });

  family('The Bramble Colossus', 'A thicket as big as a house: everything a bramble does, slower, lower and much heavier.');
  def('colossusHeave', 'The Colossus draws back for a blow: two great slow creaks, a groan from deep inside it, heavy leaves shifting.', 'screen.js COLOSSUS_MOVES lance, slam, whirl and enrage (as each starts)', (t) => {
    [0, 1].forEach((i) => creak(chan({ pan: i ? 0.4 : -0.4, wet: 0.3 }), t + i * 0.4, 0.6, 0.24, { f: 300 + i * 120, f1: 460 + i * 150, r0: 9, r1: 24, q: 6 }));
    const d = chan({ wet: 0.35 }); voice(d, 65, t, 1.0, 0.3, { form: [[300, 4, 1], [700, 5, 0.5]], to: 82, swell: true }); rustle(d, t, 1.0, 0.14, { f0: 1500, f1: 4000 });
  });
  def('colossusSwing', 'A cane as thick as a tree comes round: a huge low rush of air.', 'screen.js COLOSSUS_MOVES lance, whirl and volley (the swing)', (t) => {
    const d = chan({ wet: 0.25, pan: 0.6, panTo: -0.5, panT: 0.45 }); whoosh(d, t, 0.5, 0.7, 200, 1300, { q: 1.2, buf: 'pink' }); whoosh(d, t, 0.45, 0.2, 900, 2600, { q: 2 }); creak(d, t, 0.4, 0.1, { f: 500, f1: 900, r0: 20, r1: 50 });
  });
  def('quake', 'The ground takes a great blow: a deep slam, a rolling rumble, and stones settling after.', 'screen.js quake (the Colossus’s Lance, Hammerfall and Thornwood). Argument: how hard', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); thump(d, t, 95, 28, 0.7, 0.9 * p); noise(d, t, 0.25, 0.8 * p, { type: 'lowpass', f: 1500, to: 200, att: 0.002 });
    noise(trem(d, 11, 0.6, t, 0.9), t, 0.9, 0.9 * p, { buf: 'brown', type: 'lowpass', f: 450, att: 0.01 }); for (let i = 0; i < 6; i++) knock(chan({ pan: rnd(-0.7, 0.7), wet: 0.2 }), t + rnd(0.2, 0.9), rnd(300, 900), 0.16 * p, 0.05);
  }, [1.1]);
  def('heartBlaze', 'Hammerfall hangs in the air and its heart blazes: a harsh note climbing, a heartbeat quickening, fire fluttering.', 'screen.js COLOSSUS_MOVES.slam (the club hangs)', (t) => {
    const d = chan({ wet: 0.35 }); fm(d, 98, 2, 1, t, 1.2, 0.24, { to: 147, idx1: 5, swell: true, att: 1.0, rel: 0.1 }); fire(d, t, 1.2, 0.26, { f0: 500, f1: 1600, att: 1.0, rel: 0.1 });
    let tt = t; for (let i = 0; i < 5; i++) { thump(d, tt, 120, 70, 0.14, 0.4 + i * 0.06); tt += 0.32 * Math.pow(0.82, i); }
  });
  def('shockwave', 'Hammerfall’s shockwave rolls out over the whole party: a low wave of air and grit passing through.', 'screen.js COLOSSUS_MOVES.slam (the second blow, on everyone)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3, pan: 0.5, panTo: -0.5, panT: 0.6 }); noise(d, t, 0.7, 0.9 * p, { buf: 'pink', type: 'lowpass', f: 400, to: 1800, swell: true, att: 0.25, rel: 0.4 }); thump(d, t + 0.1, 120, 50, 0.3, 0.6 * p);
    rustle(d, t + 0.1, 0.5, 0.2 * p, { f0: 1200, f1: 3500 });
  }, [0.9]);
  def('maelstrom', 'Maelstrom: every cane whirls round it: a long wind going round and round from ear to ear, creaking as it goes.', 'screen.js COLOSSUS_MOVES.whirl (the whirl begins)', (t) => {
    const d = chan({ wet: 0.3 }), p = ctx.createStereoPanner ? ctx.createStereoPanner() : gain(1); p.connect(d);
    if (p.pan) { const l = ctx.createOscillator(), lg = gain(0.9); l.frequency.setValueAtTime(1.5, t); l.frequency.linearRampToValueAtTime(3.5, t + 1.6); l.connect(lg); lg.connect(p.pan); l.start(t); l.stop(t + 1.8); }
    const f = noise(p, t, 1.7, 0.6, { buf: 'pink', f: 700, q: 1.6, swell: true, att: 0.5, rel: 0.4 }); vibrato(f.frequency, t, 1.7, 3, 350); whoosh(p, t, 1.7, 0.16, 1500, 3000, { q: 2 });
    [0.2, 0.7, 1.2].forEach((x) => creak(p, t + x, 0.35, 0.1, { f: 500, f1: 900, r0: 20, r1: 50 })); rustle(p, t, 1.6, 0.14);
  });
  def('whipCrack', 'A whip-crack that flings its thorns into the sky: one sharp crack and its slap, thorns whistling upward.', 'screen.js COLOSSUS_MOVES.volley (each of the two cracks)', (t) => {
    const d = chan({ wet: 0.35 }); noise(d, t, 0.02, 1.0, { type: 'highpass', f: 3000, att: 0.001 }); noise(d, t + 0.01, 0.09, 0.6, { f: 1500, q: 1, att: 0.002 }); thump(d, t, 220, 110, 0.06, 0.4);
    for (let i = 0; i < 5; i++) tone(chan({ pan: rnd(-0.6, 0.6), wet: 0.3 }), 'sine', rnd(1800, 2400), t + 0.03 + i * 0.03, 0.22, 0.05, { to: rnd(3800, 5000) });
  });
  def('gulp', 'Devour: one gulp inside the shut flower: deep, wet and close.', 'screen.js COLOSSUS_MOVES.devour (each gulp)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.25 }); tone(d, 'sine', 210, t, 0.2, 0.6 * p, { to: 85 }); tone(d, 'triangle', 420, t, 0.16, 0.2 * p, { to: 170 }); bloop(d, t + 0.1, 300, 0.3 * p, 0.5);
    noise(d, t, 0.14, 0.5 * p, { type: 'lowpass', f: 600, att: 0.01 }); creak(d, t, 0.2, 0.06 * p, { f: 400, f1: 320, r0: 20, r1: 12 });
  }, [0.85]);
  def('budBurst', 'The flower bursts open and sets her down: a soft pop, petals and leaves flying.', 'screen.js COLOSSUS_MOVES.devour (it opens again)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.3 }); noise(d, t, 0.1, 0.9 * p, { f: 1200, q: 1, att: 0.002 }); thump(d, t, 160, 60, 0.2, 0.7 * p); rustle(chan({ wet: 0.3 }), t + 0.02, 0.5, 0.36 * p, { n: 50 });
  }, [0.6]);
  def('wrathBurst', 'Its Wrath: it bursts open in a ring of red light: a great tearing burst, fire in it, canes snapping all round.', 'screen.js COLOSSUS_MOVES.enrage (it bursts open)', (t) => {
    const d = chan({ wet: 0.45 }); noise(d, t, 0.9, 0.9, { type: 'lowpass', f: 4000, to: 300, att: 0.002 }); thump(d, t, 110, 35, 0.8, 0.9); fire(d, t + 0.05, 1.2, 0.36, { f0: 1500, f1: 500, att: 0.05 });
    for (let i = 0; i < 9; i++) knock(chan({ pan: rnd(-0.8, 0.8), wet: 0.25 }), t + rnd(0, 0.6), rnd(300, 900), 0.36, 0.07);
  });
  def('colossusRoar', 'The Colossus roars: a huge low growl with a rattle in it, wood groaning with it.', 'screen.js COLOSSUS_MOVES.enrage (with `wrathBurst`). Argument: how long, in seconds', (t, len) => {
    len = len || 1.3; const d = chan({ wet: 0.45 }), g = trem(d, 27, 0.7, t, len, 'sawtooth'), form = [[280, 3, 1], [650, 4, 0.7], [1400, 5, 0.35]];
    voice(g, 62, t, len, 0.5, { form, to: 48, swell: true, att: 0.08, rel: len * 0.5 }); voice(g, 93.5, t, len, 0.3, { form, to: 71, swell: true, att: 0.08, rel: len * 0.5 });
    noise(g, t, len, 0.3, { buf: 'pink', f: 800, q: 0.8, swell: true, att: 0.08, rel: len * 0.5 }); creak(d, t + 0.1, len * 0.7, 0.12, { f: 400, f1: 280, r0: 30, r1: 12 });
  }, [1.3]);
  def('sirenBloom', 'Siren Bloom: its flower opens and pours pollen: two sweet voices in harmony, pollen glittering, and something sour far underneath.', 'screen.js bloomTurn', (t) => {
    [587.3, 740].forEach((f, i) => voice(chan({ pan: i ? 0.5 : -0.5, wet: 0.55 }), f, t, 1.7, 0.16, { swell: true, att: 0.5, rel: 0.7, vib: 5, vibD: 8 }));
    for (let i = 0; i < 14; i++) partials(chan({ pan: rnd(-0.8, 0.8), wet: 0.4 }), rnd(2800, 6000), t + rnd(0.3, 1.7), RING.glass, 0.04, 0.2);
    const d = chan({ wet: 0.3 }); tone(d, 'triangle', 207.7, t, 1.7, 0.07, { swell: true }); tone(d, 'triangle', 415.3, t, 1.7, 0.03, { swell: true });
  });

  family('Halcyon', 'A paladin who glows: cold steel, and a pale light humming in open fifths.');
  def('bladeSwing', 'Halcyon’s blade swings: a hard bright swish with steel singing in it.', 'screen.js counterBlow, halMelee, HALCYON_MOVES.blackNoon and NOCTARA_MOVES.blackout (her swing)', (t) => {
    const d = chan({ wet: 0.2, pan: -0.4, panTo: 0.4, panT: 0.18 }); whoosh(d, t, 0.17, 0.44, 3000, 7500, { q: 1.2 }); fm(d, 1850, 1.41, 0.8, t, 0.32, 0.06, { idx1: 0.1 });
  });
  def('bladeHit', 'Her blade lands: a clang of steel, a hard thud, and her pale light ringing for a moment.', 'screen.js counterBlow and halHitFx: every blow of Halcyon’s', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); partials(d, 880 * rnd(0.97, 1.03), t, RING.steel, 0.14 * p, 0.55); noise(d, t, 0.05, 0.8 * p, { type: 'highpass', f: 2200, att: 0.001 }); thump(d, t, 160, 60, 0.18, 0.8 * p);
    tone(d, 'sine', 1318.5, t, 0.5, 0.06 * p); tone(d, 'sine', 1323, t, 0.5, 0.06 * p);
  }, [1.2]);
  def('lightDrink', 'Light-Drinker: the light she stole streams up into her blade: glass ticks climbing into a cold held note, the air drawn in.', 'screen.js halMelee (she heals from the blow)', (t) => {
    const d = chan({ wet: 0.4 }); for (let i = 0; i < 6; i++) partials(d, 880 * Math.pow(1.12, i), t + i * 0.06, RING.glass, 0.1, 0.25);
    tone(d, 'sine', 1174.7, t + 0.3, 0.8, 0.12, { swell: true }); tone(d, 'sine', 1760, t + 0.3, 0.8, 0.07, { swell: true }); whoosh(d, t, 0.5, 0.2, 3200, 800, { q: 2, att: 0.4, rel: 0.08 });
  });
  def('duskArc', 'Dusk Arc: one wide sweep of her blade through the whole party, from one ear to the other.', 'screen.js HALCYON_MOVES.duskArc', (t) => {
    const d = chan({ wet: 0.3, pan: -0.8, panTo: 0.8, panT: 0.42 }); whoosh(d, t, 0.45, 0.5, 1200, 5500, { q: 1.2 }); fm(d, 1480, 1.41, 1, t, 0.6, 0.08, { to: 1850, idx1: 0.1 });
  });
  def('vowStance', 'Warden’s Vow: she plants her blade: steel into the ground, and her light rising in a hum of open fifths.', 'screen.js HALCYON_MOVES.vowStance', (t) => {
    const d = chan({ wet: 0.45 }); knock(d, t, 300, 0.6, 0.15); partials(d, 660, t, RING.steel, 0.12, 0.5); thump(d, t, 140, 60, 0.2, 0.6);
    H('a3 e4 a4 e5').forEach((f, i) => tone(d, i % 2 ? 'sine' : 'triangle', f, t + 0.1, 1.0, 0.08, { swell: true, att: 0.5, rel: 0.4 }));
  });
  def('blackNoon', 'Black Noon, let go: low voices swelling in a cold chord, steel beginning to ring, the floor dropping away.', 'screen.js HALCYON_MOVES.blackNoon (as it starts)', (t) => {
    H('d3 a3 f4').forEach((f, i) => voice(chan({ pan: (i - 1) * 0.5, wet: 0.5 }), f, t, 1.6, 0.16, { form: OH, swell: true, att: 1.3, rel: 0.15 }));
    const d = chan({ wet: 0.4 }); fm(d, 1100, 1.41, 0.6, t, 1.6, 0.05, { to: 1650, swell: true, att: 1.4, rel: 0.1 }); tone(d, 'sine', 73.4, t, 1.6, 0.3, { to: 55, swell: true }); tone(d, 'triangle', 220, t, 1.6, 0.06, { to: 165, swell: true });
  });
  def('blackNoonFall', 'Black Noon falls on the whole party: a huge slam, a low clang of steel that rings on, cold light falling away.', 'screen.js HALCYON_MOVES.blackNoon (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.55 }); thump(d, t, 100, 26, 1.0, 0.9 * p); noise(d, t, 0.9, 0.9 * p, { type: 'lowpass', f: 3500, to: 150, att: 0.002 });
    partials(d, 220, t, RING.steel, 0.14 * p, 1.6); tone(d, 'sine', 2600, t, 0.9, 0.08 * p, { to: 400 });
  }, [1.5]);
  def('darkRetreat', 'The dark takes her: everything sinking and closing, one faint ring of steel left behind.', 'screen.js retreatEnding and sparedEnding (Halcyon leaves)', (t) => {
    const d = chan({ wet: 0.5 }); noise(d, t, 1.7, 0.4, { buf: 'pink', type: 'lowpass', f: 1500, to: 150, swell: true, att: 0.3, rel: 1.2 }); tone(d, 'triangle', 196, t, 1.7, 0.12, { to: 98, swell: true, att: 0.2, rel: 1.2 });
    partials(d, 1320, t + 0.2, RING.steel, 0.04, 1.2);
  });

  family('The cold court', 'The Starless one’s old moves, kept in the battle’s code: ice, frost and the void. Thin, glassy and cold.');
  def('shardCast', 'Crown Shards: slivers of ice leave the crown one after another: thin cold zips.', 'screen.js NOCTARA_MOVES.crownShards (as it starts)', (t) => {
    for (let i = 0; i < 5; i++) { const d = chan({ pan: -0.6 + i * 0.3, wet: 0.3 }); fm(d, 2400 + i * 300, 2.3, 1.5, t + i * 0.09, 0.18, 0.1, { to: 4200 + i * 300 }); noise(d, t + i * 0.09, 0.03, 0.2, { type: 'highpass', f: 6000, att: 0.001 }); }
  });
  def('shardHit', 'A shard of ice lands: glass cracking, a small hard knock.', 'screen.js NOCTARA_MOVES.crownShards (each shard)', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.4, 0.4), wet: 0.3 }); noise(d, t, 0.03, 0.8 * p, { type: 'highpass', f: 4000, att: 0.001 }); partials(d, rnd(2600, 3300), t, RING.glass, 0.2 * p, 0.2); thump(d, t, 200, 90, 0.1, 0.5 * p);
  }, [0.8]);
  def('voidOpen', 'Void Sphere opens over the party: the air sucked away, a low note falling, thin notes rubbing against each other.', 'screen.js NOCTARA_MOVES.voidSphere (as it starts)', (t) => {
    const d = chan({ wet: 0.45 }); whoosh(d, t, 1.5, 0.3, 2400, 200, { buf: 'pink', q: 1.5, att: 1.3, rel: 0.1 }); tone(d, 'sine', 110, t, 1.5, 0.3, { to: 40, swell: true }); tone(d, 'triangle', 330, t, 1.5, 0.06, { to: 120, swell: true });
    [932, 988, 1047].forEach((f) => tone(d, 'sine', f, t, 1.5, 0.04, { swell: true, att: 1.2, rel: 0.2 }));
  });
  def('voidCollapse', 'The void collapses on everyone: a breath snatched inward, then a deep dark slam.', 'screen.js NOCTARA_MOVES.voidSphere (it lands)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.55 }); whoosh(d, t, 0.12, 0.6 * p, 600, 5000, { att: 0.1, rel: 0.01 }); thump(d, t + 0.12, 90, 25, 0.9, 0.9 * p);
    noise(d, t + 0.12, 0.8, 0.9 * p, { type: 'lowpass', f: 2800, to: 120, att: 0.002 }); [147, 156, 220].forEach((f) => tone(d, 'sawtooth', f, t + 0.12, 0.8, 0.06 * p, { to: f * 0.7 }));
  }, [1.5]);
  def('frostDust', 'Frost Dust drifts down: a cloud of tiny crystals ticking, a thin cold hiss.', 'screen.js NOCTARA_MOVES.frostDust', (t) => {
    for (let i = 0; i < 22; i++) partials(chan({ pan: rnd(-0.9, 0.9), wet: 0.4 }), rnd(3500, 7500), t + rnd(0, 1.2), RING.glass, 0.06, 0.18);
    noise(chan({ wet: 0.3 }), t, 1.3, 0.1, { type: 'highpass', f: 6500, swell: true });
  });
  def('blackout', 'Blackout: the light leaves: a note and the air both falling and closing until nothing is left.', 'screen.js NOCTARA_MOVES.blackout (as it starts)', (t) => {
    const d = chan({ wet: 0.4 }); tone(d, 'sine', 880, t, 1.3, 0.14, { to: 110, swell: true, att: 0.1, rel: 0.5 }); tone(d, 'triangle', 1320, t, 1.3, 0.05, { to: 165, swell: true, att: 0.1, rel: 0.5 });
    noise(d, t, 1.3, 0.4, { buf: 'pink', type: 'lowpass', f: 6000, to: 200, swell: true, att: 0.1, rel: 0.6 });
  });
  def('frostCrack', 'The frost thaws and its waiting blow lands: ice cracking across in a run of small cracks, and a thud.', 'screen.js thaw', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); noise(d, t, 0.04, 0.9 * p, { type: 'highpass', f: 2500, att: 0.001 }); thump(d, t, 180, 60, 0.2, 0.7 * p);
    for (let i = 0; i < 7; i++) { const dd = chan({ pan: rnd(-0.6, 0.6), wet: 0.3 }), tt = t + 0.02 + i * rnd(0.02, 0.05); noise(dd, tt, 0.015, 0.5 * p, { type: 'highpass', f: rnd(3000, 7000), att: 0.001 }); partials(dd, rnd(2400, 4800), tt, RING.glass, 0.08 * p, 0.2); }
  }, [1.1]);
  def('darkGather', 'A foe gathers a charged blow that will fall on its next turn: a low note swelling and beating faster, the air drawn in toward it.', 'screen.js chargeTurn (Black Noon, Void Sphere and any other charged blow)', (t) => {
    const d = chan({ wet: 0.4 }), l = ctx.createOscillator(), lg = gain(0.4), g = gain(0.6); l.frequency.setValueAtTime(3, t); l.frequency.exponentialRampToValueAtTime(14, t + 1.8); l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(t + 2); g.connect(d);
    fm(g, 73.4, 1.5, 1, t, 1.8, 0.3, { to: 87.3, idx1: 5, swell: true, att: 1.3, rel: 0.3 }); tone(g, 'triangle', 220, t, 1.8, 0.08, { to: 262, swell: true, att: 1.3, rel: 0.3 }); whoosh(d, t, 1.8, 0.2, 3000, 500, { buf: 'pink', att: 1.5, rel: 0.2 });
  });

  family('The fire that will not end', 'The final boss. Spare sounds, ready for when it joins the battle (its own page, bigbad.js, still calls the plain names): fire that roars and never quite goes out.');
  def('fireBlow', 'Spare: the final boss strikes: a gout of fire thrown, and a heavy burning slam.', 'none yet: for the final boss’s blow', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.4 }); fire(d, t, 0.9, 0.7 * p, { f0: 1800, f1: 500, att: 0.03, rel: 0.7, flutter: 21 }); thump(d, t, 120, 35, 0.6, 0.9 * p); noise(d, t, 0.3, 0.7 * p, { type: 'lowpass', f: 3000, to: 300, att: 0.002 });
  }, [1.2]);
  def('fireCall', 'Spare: the final boss calls its helpers: a roar of flame that rises like a voice, with a low horn of a note under it.', 'none yet: for the final boss’s call', (t) => {
    const d = chan({ wet: 0.45 }); fire(d, t, 1.8, 0.5, { f0: 400, f1: 1700, att: 1.2, rel: 0.4 }); voice(d, 98, t, 1.8, 0.3, { form: OH, to: 131, swell: true, att: 0.8, rel: 0.5 }); voice(d, 147, t + 0.2, 1.6, 0.2, { form: OH, to: 196, swell: true, att: 0.8, rel: 0.5 });
  });
  def('fireHurt', 'Spare: the final boss is hurt: its fire gutters and spits, and catches again.', 'none yet: for the final boss’s flinch', (t) => {
    const d = chan({ wet: 0.3 }); fire(d, t, 0.25, 0.6, { f0: 1500, f1: 400, att: 0.02, rel: 0.2, crack: 8 }); fire(d, t + 0.35, 0.6, 0.4, { f0: 400, f1: 1200, att: 0.4, rel: 0.15 });
  });
  def('fireChange', 'Spare: the final boss breaks open into its last form: a long roar climbing, then a burst of white fire and a deep slam.', 'none yet: for the final boss’s change of form', (t) => {
    const d = chan({ wet: 0.5 }); fire(d, t, 2.4, 0.5, { f0: 300, f1: 2400, att: 2.1, rel: 0.2 }); tone(d, 'sawtooth', 55, t, 2.4, 0.14, { to: 110, swell: true, att: 2.1, rel: 0.2 });
    noise(d, t + 2.4, 0.9, 0.9, { type: 'lowpass', f: 5000, to: 250, att: 0.002 }); thump(d, t + 2.4, 120, 30, 0.9, 0.9); fire(d, t + 2.45, 1.3, 0.4, { f0: 1800, f1: 500, att: 0.05 });
  });

  family('Any foe', 'What every kind of foe shares: arriving, healing itself, and being released.');
  def('foesAppear', 'The foes rise as a fight begins. Wisps: hollow notes flickering in. Wraiths: their cold cry. Brambles: a thicket creaking awake, with a quake under the Colossus. Halcyon: steel and her pale hum.',
    'screen.js intro (the foes rise where they stand). Argument: the first foe’s kind', (t, kind) => {
      if (kind === 'wisp') { [523, 659, 784].forEach((f, i) => hollow(trem(chan({ pan: (i - 1) * 0.6, wet: 0.45 }), 19, 0.7, t, 0.6), f, t + i * 0.14, 0.5, 0.3, { to: f * 1.12 })); return; }
      if (kind === 'bramble' || kind === 'colossus') { const big = kind === 'colossus'; [0, 1, 2].forEach((i) => creak(chan({ pan: (i - 1) * 0.5, wet: 0.3 }), t + i * 0.18, 0.5, 0.2, { f: (big ? 320 : 520) + i * 120, f1: (big ? 520 : 800) + i * 150, r0: 12, r1: 36 })); rustle(chan({ wet: 0.3 }), t, 0.9, 0.2); voice(chan({ wet: 0.4 }), big ? 62 : 98, t + 0.1, 0.8, 0.24, { form: [[300, 4, 1], [700, 5, 0.5]], swell: true }); if (big) RAW.quake(t + 0.3, 0.7); return; }
      if (kind === 'halcyon') { const d = chan({ wet: 0.45 }); partials(d, 880, t, RING.steel, 0.12, 0.9); whoosh(d, t, 0.25, 0.3, 3000, 7000); H('a3 e4 a4').forEach((f) => tone(d, 'triangle', f, t + 0.1, 1.0, 0.09, { swell: true })); return; }
      const d = chan({ wet: 0.4 }); noise(d, t, 0.9, 0.6, { buf: 'brown', type: 'lowpass', f: 300, swell: true }); wraithVoice(t + 0.1, 0.9, 0.24);
    }, ['wraith'], { 'Wraiths': ['wraith'], 'Wisps': ['wisp'], 'A Bramble Horror': ['bramble'], 'The Colossus': ['colossus'], 'Halcyon': ['halcyon'] });
  def('foeHeal', 'A foe heals itself: three notes climbing, but in a dark key. A wraith’s are hollow; a bramble’s are wood, with a wet gulp of sap.', 'screen.js WRAITH_MOVES.swallow, BRAMBLE_MOVES.consume, COLOSSUS_MOVES.devour and anyMove (a foe’s heal). Argument: its kind', (t, kind) => {
    const d = chan({ wet: 0.4 }), tune = H('a4 c5 e5');
    if (kind === 'bramble') { bloop(d, t, 240, 0.3, 0.6); tune.forEach((f, i) => knock(d, t + 0.05 + i * 0.09, f, 0.3, 0.3)); }
    else tune.forEach((f, i) => hollow(d, f, t + i * 0.1, 0.4, 0.26, { att: 0.02, rel: 0.3 }));
    tone(d, 'sine', 220, t, 0.7, 0.08, { swell: true });
  }, ['wraith'], { 'A wraith': ['wraith'], 'A bramble': ['bramble'] });
  // the pale moth: wings fluttering in the air and drifting up and aside, under a few soft notes that climb
  function moth(t, dur, notes, gap, peak) {
    const d = chan({ pan: -0.2, panTo: 0.5, panT: dur, wet: 0.55 });
    noise(trem(d, 23, 0.95, t, dur), t, dur, peak * 0.8, { buf: 'pink', f: 3000, to: 5200, q: 0.8, swell: true, att: dur * 0.25, rel: dur * 0.6 });
    notes.forEach((f, i) => { tone(d, 'sine', f, t + 0.15 + i * gap, 1.3, peak * 0.6, { att: 0.06 }); tone(d, 'triangle', f * 2, t + 0.15 + i * gap, 0.8, peak * 0.1, { att: 0.08 }); });
  }
  def('release', 'A beaten foe is not killed: it is released. A last soft breath out, and a pale moth rises from it: wings fluttering, three quiet notes climbing. A bramble settles with a creak first; a wisp’s flame puffs out.',
    'screen.js apply(): the engine’s `down` event for a foe, and finaleEnding (Halcyon goes home as a moth). Argument: the foe’s kind', (t, kind) => {
      const d = chan({ wet: 0.45 });
      if (kind === 'bramble' || kind === 'colossus') { creak(d, t, 0.5, 0.14, { f: 600, f1: 380, r0: 30, r1: 10 }); rustle(d, t + 0.1, 0.7, 0.14); }
      else if (kind === 'wisp') { hollow(d, 660, t, 0.4, 0.24, { to: 440, att: 0.02, rel: 0.3 }); noise(d, t, 0.12, 0.2, { buf: 'pink', f: 1500, q: 0.8, att: 0.01 }); }
      whoosh(d, t, 0.8, 0.22, 700, 2400, { buf: 'pink', q: 0.9, att: 0.3, rel: 0.5 });
      moth(t + 0.35, 1.9, kind === 'wisp' ? H('b5 e6 g#6') : H('e5 b5 e6'), 0.28, 0.2);
    }, ['wraith'], { 'A wraith': ['wraith'], 'A wisp': ['wisp'], 'A bramble': ['bramble'] });
  def('soulHome', 'The last foe falls and its soul goes home: the robe falls empty (or the flame goes out) with a soft low thump, then the moth rises and drifts away over four slow notes that climb and stay.',
    'screen.js finish (a won fight, as the last foe falls). Argument: that foe’s kind', (t, kind) => {
      const d = chan({ wet: 0.45 }); thump(d, t, 130, 50, 0.4, 0.6); noise(d, t, 0.5, 0.5, { buf: 'pink', type: 'lowpass', f: 1600, to: 300, att: 0.02 });
      if (kind === 'bramble' || kind === 'colossus') { rustle(d, t, 0.9, 0.24); creak(d, t, 0.6, 0.12, { f: 500, f1: 300, r0: 26, r1: 9 }); } else rustle(d, t, 0.5, 0.14, { f0: 1200, f1: 3500 });
      moth(t + 1.1, 3.2, H('e5 g#5 b5 e6'), 0.42, 0.22); H('e4 b4').forEach((f) => tone(d, 'sine', f, t + 1.2, 3.0, 0.06, { swell: true, att: 1.0, rel: 1.5 }));
    }, ['wraith'], { 'A wraith': ['wraith'], 'A bramble': ['bramble'] });

  family('The fight around them', 'Thunder, the town’s lights, running away, and the end card.');
  def('thunder', 'Thunder: far off it is a soft roll; close, a crack first and then the roll.', 'screen.js lightning (the red storm of the Colossus’s Wrath) and arenaField (an arena’s weather). Argument: how near (0.4 far to 1.3 close)', (t, p) => {
    p = p || 0.8; const d = chan({ wet: 0.5, pan: rnd(-0.5, 0.5) });
    if (p > 1) { noise(d, t, 0.12, 0.9, { type: 'highpass', f: 1800, att: 0.001 }); noise(d, t, 0.4, 0.8, { type: 'lowpass', f: 3500, to: 400, att: 0.002 }); }
    const g = trem(d, rnd(5, 8), 0.7, t, 2.4, 'triangle'); noise(g, t, 2.4, 0.9 * p, { buf: 'brown', type: 'lowpass', f: 380, att: 0.05 }); noise(g, t, 1.8, 0.3 * p, { buf: 'pink', type: 'lowpass', f: 900, att: 0.05 }); thump(d, t, 90, 35, 0.8, 0.6 * p);
  }, [1.3], { 'Close': [1.3], 'Far off': [0.5] });
  def('windowLight', 'A stolen lamplight reaches home and a window glows again: one warm soft note, a different one each time, so a street of them plays a little tune.', 'screen.js relightTown (each window)', (t) => {
    const f = pick(H('e5 g5 a5 b5 d6 e6')), d = chan({ pan: rnd(-0.7, 0.7), wet: 0.45 }); tone(d, 'sine', f, t, 0.9, 0.16, { att: 0.01 }); tone(d, 'triangle', f * 2, t, 0.4, 0.04); noise(d, t, 0.08, 0.06, { buf: 'pink', f: 1200, q: 0.8, att: 0.02 });
  });
  def('starsReturn', 'The stars come back: high glass notes twinkling all across the sky over a soft open chord.', 'screen.js finaleEnding (the Starless one becomes night with stars in it)', (t) => {
    for (let i = 0; i < 16; i++) partials(chan({ pan: rnd(-0.95, 0.95), wet: 0.5 }), pick(H('e6 f#6 g#6 b6 c#7 e7 f#7')), t + rnd(0, 2.6), RING.glass, 0.1, 0.7);
    const d = chan({ wet: 0.5 }); H('e4 b4 f#5 g#5').forEach((f) => tone(d, 'sine', f, t, 3.0, 0.06, { swell: true, att: 1.2, rel: 1.4 }));
  });
  def('levelUp', 'The party gains a level: a quick bright run up, capped with a bell.', 'screen.js showEnd (the level-up box on the end card)', (t) => {
    H('e5 g#5 b5 e6').forEach((f, i) => { const d = chan({ wet: 0.3 }); tone(d, 'triangle', f, t + i * 0.08, 0.22, 0.14); partials(d, f * 2, t + i * 0.08, RING.glass, 0.08, 0.4); });
    bell(chan({ wet: 0.45 }), hz('b6'), t + 0.34, 0.26, { len: 1.4 }); bell(chan({ pan: 0.3, wet: 0.45 }), hz('e7'), t + 0.36, 0.2, { len: 1.2 });
  });
  def('flee', 'The party turns and runs: quick soft footfalls hurrying away across the picture, and the air behind them.', 'screen.js flee', (t) => {
    for (let i = 0; i < 7; i++) { const d = chan({ pan: 0.5 - i * 0.18, wet: 0.15 }), tt = t + i * 0.1 * (1 - i * 0.03); thump(d, tt, 150, 90, 0.07, 0.4 - i * 0.03); noise(d, tt, 0.03, 0.3 - i * 0.02, { type: 'lowpass', f: 1400, att: 0.002 }); }
    whoosh(chan({ pan: 0.3, panTo: -0.7, panT: 0.7, wet: 0.2 }), t, 0.7, 0.2, 900, 2200);
  });

  // ------------------------- choices: three new versions of each of the ten sounds heard most -------------------------
  // (November 17, 2026; Chris: "the 10 most common sound effects that will happen, can you give me a few different
  // variations of each of those?") Nothing in the battle plays these yet. Each keeps its original's job, length and
  // arguments, so the one Chris picks can take the original's place as it stands. For every sound the three go three
  // ways: B softer and further away, C darker and lower, D crisper and more physical.
  // `like` plays a version at the level its original gets from LEVEL (near the top), so a version's numbers are written
  // on the same scale as its original's: when one is chosen, its making moves under the old name unchanged.
  family('Choices: the ten most common', 'Three new versions of each of the ten sounds heard most; the first version is the one in the battle now.');
  const like = (base, fn) => (t, ...a) => { const was = lvl; lvl = was * (LEVEL[base] || 1); try { fn(t, ...a); } finally { lvl = was; } };
  const TEN = ['select', 'menu', 'swing', 'strike', 'moonBladeFly', 'moonBladeHit', 'wispSip', 'wraithClaw', 'release', 'sealToll'];
  const choices = TEN.map((name) => ({ name, options: [name, name + '_b', name + '_c', name + '_d'] }));
  const choiceOf = (name) => 'not in the battle yet: a choice for `' + name + '` (' + catalog.find((c) => c.name === name).beats + ')';

  // ---- 1. select: choosing a command ----
  def('select_b', 'B, softer and further away: two small notes of glass, the second higher, ringing for a moment in the room.', choiceOf('select'), like('select', (t) => {
    const d = chan({ wet: 0.14 }); partials(d, 987.8, t, RING.glass, 0.1, 0.16); partials(d, 1318.5, t + 0.07, RING.glass, 0.1, 0.2);
  }));
  def('select_c', 'C, darker and lower: two low notes of a music box, the second higher, round and close.', choiceOf('select'), like('select', (t) => {
    const d = chan({ wet: 0.1 });
    [329.6, 493.9].forEach((f, i) => { tone(d, 'sine', f, t + i * 0.07, 0.16 + i * 0.1, 0.1); tone(d, 'triangle', f * 2, t + i * 0.07, 0.07, 0.027); });
    noise(d, t, 0.012, 0.04, { f: 1200, q: 1.5, att: 0.001 });
  }));
  def('select_d', 'D, crisper and more physical: a small latch closing: a wooden click, then one bright plucked note.', choiceOf('select'), like('select', (t) => {
    const d = chan({ wet: 0.06 }); knock(d, t, 1318.5, 0.135, 0.04); partials(d, 1975.5, t + 0.045, [[1, 1, 0.14], [2, 0.3, 0.06], [3.01, 0.12, 0.03]], 0.12);
  }));

  // ---- 2. menu: moving through a menu ----
  def('menu_b', 'B, softer and further away: hardly a tap at all: one small round note with a breath of air on it.', choiceOf('menu'), like('menu', (t) => {
    const d = chan({ wet: 0.2 }); tone(d, 'sine', 1046.5 * rnd(0.98, 1.02), t, 0.08, 0.09, { att: 0.012 }); noise(d, t, 0.03, 0.03, { buf: 'pink', f: 1500, q: 1, att: 0.01 });
  }));
  def('menu_c', 'C, darker and lower: one low wooden tock.', choiceOf('menu'), like('menu', (t) => {
    const d = chan(), f = 440 * rnd(0.98, 1.02); knock(d, t, f, 0.08, 0.07); tone(d, 'sine', f, t, 0.05, 0.03, { to: f * 0.75 });
  }));
  def('menu_d', 'D, crisper and more physical: a tiny dry tick, like a fingernail on glass.', choiceOf('menu'), like('menu', (t) => {
    const d = chan(); partials(d, 1760 * rnd(0.98, 1.02), t, RING.glass, 0.1, 0.035); noise(d, t, 0.008, 0.075, { f: 3200, q: 2, att: 0.001 });
  }));

  // ---- 3. swing: a hero's blow on its way (Io's sickle, or anyone else's plain swing) ----
  def('swing_b', 'B, softer and further away: a breath of air passing, with room round it. Io’s has a faint high note of moonlight rising in it.', choiceOf('swing'), like('swing', (t, who) => {
    const io = who === 'io', d = chan({ wet: 0.25, pan: -0.25, panTo: 0.3, panT: 0.2 });
    whoosh(d, t, io ? 0.18 : 0.24, io ? 0.5 : 0.6, io ? 1800 : 800, io ? 4200 : 2400, { buf: 'pink', q: 0.9 });
    if (io) tone(d, 'sine', 1975.5, t + 0.02, 0.16, 0.03, { swell: true, to: 2349.3 });
  }), ['io'], { 'Io': ['io'], 'Anyone else': ['jester'] });
  def('swing_c', 'C, darker and lower: a heavy, low rush of air, like a cloak swung round. Io’s keeps a dull ring of her sickle in it.', choiceOf('swing'), like('swing', (t, who) => {
    const io = who === 'io', len = io ? 0.17 : 0.22, d = chan({ wet: 0.12, pan: -0.2, panTo: 0.3, panT: 0.2 });
    whoosh(d, t, len, io ? 0.36 : 0.6, io ? 900 : 420, io ? 2200 : 1300, { q: 1.3 }); noise(d, t, len, 0.4, { buf: 'brown', type: 'lowpass', f: 500, swell: true });
    if (io) fm(d, 1200, 2.76, 0.6, t, 0.18, 0.05, { idx1: 0.1 });
  }), ['io'], { 'Io': ['io'], 'Anyone else': ['jester'] });
  def('swing_d', 'D, crisper and more physical: a quick tight whip of air that ends in a snap. Io’s sickle sings a bright "shing" in it.', choiceOf('swing'), like('swing', (t, who) => {
    const io = who === 'io', len = io ? 0.09 : 0.12, d = chan({ wet: 0.06, pan: -0.3, panTo: 0.4, panT: 0.1 });
    whoosh(d, t, len, io ? 0.45 : 0.65, io ? 3000 : 1400, io ? 7000 : 4600, { q: 2.5, att: len * 0.7, rel: 0.02 });
    noise(d, t + len * 0.85, 0.014, 0.3, { type: 'highpass', f: 5000, att: 0.001 });           // the snap at the end of the whip
    if (io) fm(d, 3100, 2.76, 0.8, t, 0.12, 0.07, { idx1: 0.1 });
  }), ['io'], { 'Io': ['io'], 'Anyone else': ['jester'] });

  // ---- 4. strike: a hero's blow landing (Kore's gold bells, or Io's sickle; any other colour is the plain `hit`) ----
  const STRIKES = { 'The Jester, a big blow': [1.2, GOLD], 'The Jester': [0.9, GOLD], 'Io’s sickle': [0.9], 'Io’s sickle, a big blow': [1.2] };
  def('strike_b', 'B, softer and further away: the Jester’s bells are touched more than struck, one a hair after the other, and ring on in a big room; Io’s sickle is a soft slice through leaves with a thin silver ring.', choiceOf('strike'), like('strike', (t, p, color) => {
    p = p || 1;
    if (color === GOLD) {
      const n = p > 1 ? 4 : 3;
      for (let i = 0; i < n; i++) bell(chan({ pan: (i - (n - 1) / 2) * 0.5, wet: 0.6 }), KORE[i] * rnd(0.995, 1.005), t + i * 0.022, 0.3 * p, { len: 1.3 + 0.2 * i, strike: 0.25 });
      const d = chan({ wet: 0.3 }); thump(d, t, 170, 80, 0.12, 0.28 * p); noise(d, t, 0.08, 0.2 * p, { buf: 'pink', type: 'lowpass', f: 1600, to: 500, att: 0.004 });
    } else if (color == null) {
      const d = chan({ wet: 0.45 }); noise(d, t, 0.14, 0.6 * p, { buf: 'pink', type: 'highpass', f: 2500, to: 5000, att: 0.01 });
      fm(d, 1568 * rnd(0.97, 1.03), 2.76, 0.5, t, 0.4, 0.18 * p, { idx1: 0.05 }); thump(d, t, 160, 85, 0.1, 0.36 * p); rustle(d, t + 0.02, 0.2, 0.32 * p, { f0: 2500, f1: 5500 });
    } else RAW.hit(t, p);
  }), [1.2, GOLD], STRIKES);
  def('strike_c', 'C, darker and lower: the Jester’s bells an octave down, bronze more than gold, with a heavy blow under them; Io’s sickle bites deep: a low slice, a woody chop and a dull ring.', choiceOf('strike'), like('strike', (t, p, color) => {
    p = p || 1;
    if (color === GOLD) {
      const n = p > 1 ? 4 : 3;
      for (let i = 0; i < n; i++) bell(chan({ pan: (i - (n - 1) / 2) * 0.35, wet: 0.3 }), KORE[i] / 2 * rnd(0.995, 1.005), t + i * rnd(0.006, 0.018), 0.34 * p, { len: 1.1 + 0.2 * i });
      const d = chan({ wet: 0.15 }); thump(d, t, 150, 48, 0.24, 0.7 * p); noise(d, t, 0.09, 0.45 * p, { type: 'lowpass', f: 1500, to: 300, att: 0.001 });
    } else if (color == null) {
      const d = chan({ wet: 0.15 }); noise(d, t, 0.1, 0.6 * p, { f: 1400, to: 600, q: 1.1, att: 0.002 }); fm(d, 1050 * rnd(0.96, 1.04), 2.76, 1.2, t, 0.3, 0.15 * p, { idx1: 0.1 });
      knock(d, t, 260, 0.4 * p, 0.1); thump(d, t, 140, 55, 0.18, 0.52 * p); rustle(d, t + 0.02, 0.12, 0.2 * p, { f0: 1800, f1: 4000 });
    } else RAW.hit(t, p);
  }), [1.2, GOLD], STRIKES);
  def('strike_d', 'D, crisper and more physical: the Jester’s bells hit hard and stopped short, with a clack and a tight punch; Io’s sickle is one quick "tchk": the edge, a short ring of steel and a knock of wood.', choiceOf('strike'), like('strike', (t, p, color) => {
    p = p || 1;
    if (color === GOLD) {
      const n = p > 1 ? 4 : 3;
      for (let i = 0; i < n; i++) bell(chan({ pan: (i - (n - 1) / 2) * 0.3, wet: 0.1 }), KORE[i] * rnd(0.995, 1.005), t + i * 0.003, 0.38 * p, { len: 0.7, strike: 1.3 });
      const d = chan({ wet: 0.06 }); thump(d, t, 230, 95, 0.08, 0.66 * p); knock(d, t, 700, 0.36 * p, 0.05); noise(d, t, 0.02, 0.35 * p, { type: 'highpass', f: 3000, att: 0.001 });
    } else if (color == null) {
      const d = chan({ wet: 0.06 }); noise(d, t, 0.045, 0.55 * p, { type: 'highpass', f: 4000, to: 8000, att: 0.001 }); partials(d, 1900 * rnd(0.96, 1.04), t, RING.steel, 0.2 * p, 0.16);
      knock(d, t, 480, 0.45 * p, 0.07); thump(d, t, 210, 95, 0.07, 0.5 * p); rustle(d, t + 0.01, 0.06, 0.2 * p, { f0: 3500, f1: 7000 });
    } else RAW.hit(t, p);
  }), [1.2, GOLD], STRIKES);

  // ---- 5. moonBladeFly: one of Io's blades of moonlight leaving ----
  def('moonBladeFly_b', 'B, softer and further away: a soft sigh of glass that rises as it drifts across, a little different each time.', choiceOf('moonBladeFly'), like('moonBladeFly', (t) => {
    const k = rnd(0.85, 1.2), pan = rnd(0.15, 0.4) * (Math.random() < 0.5 ? -1 : 1), d = chan({ pan, panTo: -pan, panT: 0.2, wet: 0.3 });
    whoosh(d, t, 0.18, 0.24, 2600 * k, 3800 * k, { buf: 'pink', q: 1.5 }); tone(d, 'sine', 1568 * k, t, 0.18, 0.048, { to: 2093 * k, swell: true }); tone(d, 'sine', 3136 * k, t, 0.18, 0.012, { to: 4186 * k, swell: true });
  }));
  def('moonBladeFly_c', 'C, darker and lower: a low cold "vwoom", a heavier blade falling in pitch as it goes, a little different each time.', choiceOf('moonBladeFly'), like('moonBladeFly', (t) => {
    const k = rnd(0.85, 1.2), d = chan({ pan: rnd(-0.4, 0.4), wet: 0.2 });
    whoosh(d, t, 0.18, 0.3, 1700 * k, 750 * k, { q: 2.5 }); tone(d, 'sine', 1100 * k, t, 0.16, 0.08, { to: 520 * k }); tone(d, 'triangle', 550 * k, t, 0.16, 0.04, { to: 260 * k });
  }));
  def('moonBladeFly_d', 'D, crisper and more physical: a quick flick: a tick of glass and a short tight zip, a little different each time.', choiceOf('moonBladeFly'), like('moonBladeFly', (t) => {
    const k = rnd(0.85, 1.2), d = chan({ pan: rnd(-0.4, 0.4), wet: 0.08 });
    partials(d, 2637 * k, t, RING.glass, 0.085, 0.06); whoosh(d, t, 0.08, 0.36, 3200 * k, 6000 * k, { q: 4, att: 0.02, rel: 0.05 }); fm(d, 4200 * k, 1.5, 1, t, 0.07, 0.03, { to: 2400 * k });
  }));

  // ---- 6. moonBladeHit: a blade of moonlight landing ----
  def('moonBladeHit_b', 'B, softer and further away: one clear note of glass ringing in a big room, with its faint echo above it. Each blade picks a note of the night’s key, so five make a small tune.', choiceOf('moonBladeHit'), like('moonBladeHit', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.6 }), f = pick(H('g6 a6 b6 d7'));
    partials(d, f, t, RING.glass, 0.2 * p, 0.5); partials(d, f * 1.5, t + 0.05, RING.glass, 0.06 * p, 0.4); noise(d, t, 0.06, 0.12 * p, { buf: 'pink', f: 2500, q: 0.8, att: 0.008 });
  }), [0.7]);
  def('moonBladeHit_c', 'C, darker and lower: the blade bites deep: a low note of glass and a heavy little thud.', choiceOf('moonBladeHit'), like('moonBladeHit', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.25 }); partials(d, rnd(950, 1300), t, RING.glass, 0.26 * p, 0.35); thump(d, t, 170, 70, 0.14, 0.6 * p); noise(d, t, 0.06, 0.4 * p, { type: 'lowpass', f: 2200, to: 500, att: 0.001 });
  }), [0.7]);
  def('moonBladeHit_d', 'D, crisper and more physical: glass cracking on its mark: a sharp tick, a short bright ring, a tight knock and two tiny splinters.', choiceOf('moonBladeHit'), like('moonBladeHit', (t, p) => {
    p = p || 1; const d = chan({ pan: rnd(-0.3, 0.3), wet: 0.18 }); noise(d, t, 0.014, 0.65 * p, { type: 'highpass', f: 4500, att: 0.001 }); fm(d, rnd(2600, 3300), 1.41, 1.5, t, 0.16, 0.22 * p, { idx1: 0.1 }); thump(d, t, 260, 130, 0.05, 0.6 * p);
    for (let i = 0; i < 2; i++) partials(d, rnd(3400, 4800), t + 0.02 + i * rnd(0.015, 0.035), RING.glass, 0.11 * p, 0.09);
  }), [0.7]);

  // ---- 7. wispSip: a wisp drinking its prey's light ----
  def('wispSip_b', 'B, softer and further away: a thin, high sip, more air than throat, with room round it.', choiceOf('wispSip'), like('wispSip', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.5 }); whoosh(d, t, 0.15, 0.6 * p, 1200, 2800, { buf: 'pink', q: 2, att: 0.11, rel: 0.03 }); hollow(d, 880, t, 0.16, 0.31 * p, { to: 1175, att: 0.04, rel: 0.1, vib: 0 });
  }), [0.6]);
  def('wispSip_c', 'C, darker and lower: a deep hollow draw and a gulp at the end of it.', choiceOf('wispSip'), like('wispSip', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.2 }); whoosh(d, t, 0.14, 0.5 * p, 260, 900, { q: 3, att: 0.1, rel: 0.03 }); hollow(d, 330, t, 0.16, 0.32 * p, { to: 415, att: 0.02, rel: 0.09, vib: 0 }); thump(d, t + 0.11, 210, 120, 0.08, 0.25 * p);
  }), [0.6]);
  def('wispSip_d', 'D, crisper and more physical: a quick wet slurp that ends in a small pop.', choiceOf('wispSip'), like('wispSip', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.12 }); whoosh(d, t, 0.09, 0.65 * p, 700, 2600, { q: 5, att: 0.075, rel: 0.012 }); hollow(d, 700, t, 0.1, 0.26 * p, { to: 1000, att: 0.01, rel: 0.05, vib: 0 });
    bloop(d, t + 0.085, 620, 0.26 * p, 1.9); noise(d, t + 0.088, 0.008, 0.2 * p, { f: 2800, q: 2, att: 0.001 });
  }), [0.6]);

  // ---- 8. wraithClaw: a wraith's blow landing on a hero ----
  def('wraithClaw_b', 'B, softer and further away: a cold wash more than a blow: a soft thud, and two sour hollow notes sinking away into a big room, one in each ear.', choiceOf('wraithClaw'), like('wraithClaw', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.6 }); thump(d, t, 140, 65, 0.18, 0.5 * p); noise(d, t, 0.25, 0.55 * p, { buf: 'pink', f: 1100, to: 500, q: 0.9, att: 0.02 });
    [784, 830.6].forEach((f, i) => hollow(chan({ pan: i ? 0.35 : -0.35, wet: 0.6 }), f, t, 0.45, 0.3 * p, { to: f * 0.94, att: 0.03, rel: 0.38, vib: 0 }));
  }), [1.1]);
  def('wraithClaw_c', 'C, darker and lower: a deep slam with a short growl in it, and the two sour notes an octave down.', choiceOf('wraithClaw'), like('wraithClaw', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.35 }); thump(d, t, 115, 36, 0.4, 0.85 * p); noise(d, t, 0.2, 0.75 * p, { type: 'lowpass', f: 1500, to: 220, att: 0.002 }); noise(d, t, 0.35, 0.4 * p, { buf: 'brown', type: 'lowpass', f: 300, att: 0.005 });
    hollow(d, 196, t, 0.35, 0.4 * p, { att: 0.01, rel: 0.3, vib: 0 }); hollow(d, 207.7, t, 0.35, 0.4 * p, { att: 0.01, rel: 0.3, vib: 0 }); voice(d, 98, t, 0.3, 0.2 * p, { form: OH, to: 70, att: 0.01 });
  }), [1.1]);
  def('wraithClaw_d', 'D, crisper and more physical: a rake of claws: three quick scratches from one side to the other, a tight thud and one short sour ring.', choiceOf('wraithClaw'), like('wraithClaw', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.18 });
    for (let i = 0; i < 3; i++) noise(chan({ pan: -0.3 + i * 0.3, wet: 0.15 }), t + i * 0.035, 0.06, 1.0 * p, { f: 2400 + i * 500, to: 1300 + i * 300, q: 2.5, att: 0.002 });
    thump(d, t + 0.03, 180, 70, 0.12, 0.85 * p); noise(d, t + 0.03, 0.08, 0.7 * p, { type: 'lowpass', f: 2600, to: 500, att: 0.001 }); fm(d, 392, 1.06, 2, t + 0.03, 0.22, 0.3 * p, { idx1: 0.3 });
  }), [1.1]);

  // ---- 9. release: a beaten foe released, a moth rising ----
  // what a beaten foe does first, before its moth rises: a bramble settles with a creak, a wisp's flame puffs out. k: how low
  function settle(d, t, kind, k, peak) {
    if (kind === 'bramble' || kind === 'colossus') { creak(d, t, 0.5, 0.14 * peak, { f: 600 * k, f1: 380 * k, r0: 30, r1: 10 }); rustle(d, t + 0.1, 0.7, 0.14 * peak); }
    else if (kind === 'wisp') { hollow(d, 660 * k, t, 0.4, 0.24 * peak, { to: 440 * k, att: 0.02, rel: 0.3 }); noise(d, t, 0.12, 0.2 * peak, { buf: 'pink', f: 1500 * k, q: 0.8, att: 0.01 }); }
  }
  const RELEASES = { 'A wraith': ['wraith'], 'A wisp': ['wisp'], 'A bramble': ['bramble'] };
  def('release_b', 'B, softer and further away: the breath out, then the moth far off: wings hardly heard, and three notes of glass climbing over a soft held chord, in a big room. A bramble still creaks first; a wisp’s flame still puffs out.', choiceOf('release'), like('release', (t, kind) => {
    const d = chan({ wet: 0.7 }), m = chan({ pan: -0.3, panTo: 0.6, panT: 2.2, wet: 0.7 });
    settle(d, t, kind, 1, 0.8); whoosh(d, t, 0.9, 0.2, 900, 2600, { buf: 'pink', q: 0.7, att: 0.4, rel: 0.5 });
    noise(trem(m, 17, 0.9, t + 0.35, 1.9), t + 0.35, 1.9, 0.12, { buf: 'pink', f: 3400, to: 5000, q: 0.8, swell: true, att: 0.5, rel: 1.2 });
    (kind === 'wisp' ? H('e6 g#6 b6') : H('b5 e6 b6')).forEach((f, i) => partials(m, f, t + 0.5 + i * 0.3, RING.glass, 0.1, 1.2));
    H('e5 b5').forEach((f) => tone(m, 'sine', f, t + 0.4, 1.8, 0.035, { swell: true, att: 0.7, rel: 0.9 }));
  }), ['wraith'], RELEASES);
  def('release_c', 'C, darker and lower: a low sigh, heavy slow wings, and three low notes that still climb, but in the night’s own minor key, over a deep hum. A bramble’s creak and a wisp’s last puff are lower too.', choiceOf('release'), like('release', (t, kind) => {
    const d = chan({ wet: 0.45 }), m = chan({ pan: -0.2, panTo: 0.5, panT: 1.9, wet: 0.55 });
    settle(d, t, kind, 0.75, 1); hollow(d, 247, t, 0.8, 0.15, { to: 185, att: 0.25, rel: 0.5, vib: 0 }); whoosh(d, t, 0.8, 0.22, 400, 1300, { buf: 'pink', q: 0.9, att: 0.3, rel: 0.5 });
    noise(trem(m, 13, 0.95, t + 0.35, 1.9), t + 0.35, 1.9, 0.2, { buf: 'pink', f: 1400, to: 2600, q: 0.8, swell: true, att: 0.5, rel: 1.1 });
    (kind === 'wisp' ? H('b4 e5 g5') : H('e4 g4 b4')).forEach((f, i) => { tone(m, 'sine', f, t + 0.5 + i * 0.28, 1.3, 0.1, { att: 0.05 }); tone(m, 'triangle', f * 2, t + 0.5 + i * 0.28, 0.8, 0.03, { att: 0.06 }); });
    tone(m, 'sine', 164.81, t + 0.4, 1.8, 0.04, { swell: true, att: 0.6, rel: 1 }); tone(m, 'triangle', 329.63, t + 0.4, 1.8, 0.02, { swell: true, att: 0.6, rel: 1 });
  }), ['wraith'], RELEASES);
  def('release_d', 'D, crisper and more physical: a short breath out, then the moth close by: each beat of its wings heard, quickening as it climbs, and three plucked notes of wood and glass going up. A bramble creaks first; a wisp’s flame puffs out.', choiceOf('release'), like('release', (t, kind) => {
    const d = chan({ wet: 0.3 }), m = chan({ pan: -0.2, panTo: 0.5, panT: 1.9, wet: 0.3 });
    settle(d, t, kind, 1, 1); whoosh(d, t, 0.5, 0.26, 800, 2600, { buf: 'pink', q: 1.2, att: 0.15, rel: 0.3 });
    let tt = t + 0.35; for (let i = 0; i < 22; i++) { noise(m, tt, 0.05, 0.3 * (1 - i / 30), { buf: 'pink', f: 2200 + i * 110, q: 1.2, att: 0.012 }); tt += 0.1 * Math.pow(0.965, i); }   // the wings, beat by beat
    (kind === 'wisp' ? H('b5 e6 g#6') : H('e5 b5 e6')).forEach((f, i) => { partials(m, f, t + 0.5 + i * 0.24, RING.wood, 0.2, 0.5); partials(m, f * 2, t + 0.5 + i * 0.24, RING.glass, 0.07, 0.6); });
  }), ['wraith'], RELEASES);

  // ---- 10. sealToll: a foe sealed, Kore's one deep bell (each rings on for about seven seconds, as the original does) ----
  def('sealToll_b', 'B, softer and further away: the same deep bell heard through mist from across the water: no clapper, its edge taken off, a great deal of room, and two high ghost notes that open slowly over it.', choiceOf('sealToll'), like('sealToll', (t) => {
    const d = chan({ wet: 0.95 }), f = 164.81, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(d);
    bell(lp, f, t, 0.8, { set: 'toll', len: 7, strike: 0 }); tone(d, 'sine', f / 2, t, 4.5, 0.2, { att: 0.03 }); noise(d, t, 0.3, 0.1, { buf: 'pink', type: 'lowpass', f: 900, att: 0.03 });
    [659.26, 987.77].forEach((g, i) => tone(chan({ pan: i ? 0.5 : -0.5, wet: 0.9 }), 'sine', g, t + 0.1, 5, 0.03, { swell: true, att: 1.2, rel: 3.5 }));
  }));
  def('sealToll_c', 'C, darker and lower: a bigger, heavier bell, a fourth lower, struck with a great weight: a deep thud under it and a long low tail.', choiceOf('sealToll'), like('sealToll', (t) => {
    const d = chan({ wet: 0.55 }), f = 123.47;
    bell(d, f, t, 1.0, { set: 'toll', len: 7, strike: 0 }); thump(d, t, 120, 40, 0.5, 0.5); noise(d, t, 0.12, 0.5, { type: 'lowpass', f: 900, to: 200, att: 0.002 });
    partials(d, f, t, [[2, 1, 4.5], [3, 0.6, 3.2], [4.07, 0.4, 2.2]], 0.13);                        // what a phone speaker can carry of so low a bell
    tone(d, 'sine', f / 2, t, 4.5, 0.3, { att: 0.01 });
  }));
  def('sealToll_d', 'D, crisper and more physical: the same deep bell struck hard and close: the clapper’s knock, a brighter ring, and her small gold bells shivering after it.', choiceOf('sealToll'), like('sealToll', (t) => {
    const d = chan({ wet: 0.4 }), f = 164.81;
    bell(d, f, t, 1.0, { set: 'toll', len: 7, strike: 0 }); knock(d, t, 330, 0.5, 0.1); noise(d, t, 0.04, 0.5, { type: 'lowpass', f: 3500, to: 600, att: 0.001 }); fm(d, 660, 1.41, 3, t, 0.12, 0.2, { idx1: 0.2 });
    partials(d, f, t, [[5.4, 0.3, 1.0], [6.8, 0.26, 0.8], [8.2, 0.2, 0.6], [10.7, 0.12, 0.4]], 0.4); tone(d, 'sine', f / 2, t, 4.5, 0.3, { att: 0.01 });
    for (let i = 0; i < 5; i++) jingle(chan({ pan: rnd(-0.6, 0.6), wet: 0.35 }), t + 0.12 + i * rnd(0.07, 0.13), 0.14 - i * 0.02, pick(KORE) * 2);
  }));

  // ---------------------------------- the plain names (Envoi's 13 effects, remade) ----------------------------------
  family('Plain sounds', 'Envoi’s old names, each remade. The battle’s Sol and story beats, the Spell Book, Everyone Who Fights and the Final Boss page still call these.');
  def('swish', 'A plain swing through the air.', 'screen.js: Sol’s old moves, flee-free story beats, anyMove; spellbook.js, lineup.js, bigbad.js', (t) => { whoosh(chan({ wet: 0.1 }), t, 0.2, 0.44, 1000, 3400, { q: 1.4 }); });
  def('hit', 'A plain blow landing: a punchy thud with a crack on top.', 'screen.js anyMove (a foe with no sounds of its own); kit.js hurt (the Spell Book and Final Boss pages)', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.15 }); thump(d, t, 180, 60, 0.18, 0.8 * p); noise(d, t, 0.08, 0.7 * p, { type: 'lowpass', f: 2600, to: 400, att: 0.001 }); noise(d, t, 0.02, 0.4 * p, { type: 'highpass', f: 3500, att: 0.001 });
  }, [1]);
  def('fire', 'A plain puff of flame.', 'spellbook.js (Envoi Io’s Flame Bolt and Harvest Moon)', (t) => { fire(chan({ wet: 0.2 }), t, 0.6, 0.6, { f0: 500, f1: 1600 }); });
  def('boom', 'A plain big blow: a deep slam and a burst of air.', 'screen.js: Sol’s Kestrel Stoop; spellbook.js and bigbad.js', (t, p) => {
    p = p || 1; const d = chan({ wet: 0.4 }); thump(d, t, 120, 35, 0.7, 0.9 * p); noise(d, t, 0.7, 0.8 * p, { type: 'lowpass', f: 3000, to: 200, att: 0.002 }); tone(d, 'sawtooth', 180, t, 0.4, 0.12 * p, { to: 60 });
  }, [1]);
  def('chime', 'A plain soft chime: four glass notes.', 'screen.js: Sol’s Kestrel and the story beats (she knows the stance, she learns Kestrel Stoop); spellbook.js', (t) => {
    H('a5 e6 a6 c#7').forEach((f, i) => partials(chan({ pan: -0.3 + i * 0.2, wet: 0.4 }), f, t + i * 0.06, RING.glass, 0.18, 0.9));
  });
  def('blade', 'A plain bright "shing" of a blade.', 'spellbook.js (Envoi Io’s Crescent and Moonsteel)', (t) => {
    const d = chan({ wet: 0.3 }); fm(d, 1900, 1.41, 1, t, 0.4, 0.14, { to: 2600, idx1: 0.1 }); noise(d, t, 0.15, 0.3, { type: 'highpass', f: 5500, att: 0.01 });
  });
  def('heal', 'A plain heal: five warm notes of wood and glass climbing.', 'spellbook.js; anyMove’s heals use `foeHeal`', (t) => { herbNotes(t, H('c5 e5 g5 c6 e6'), 0.08, 0.24); });
  def('guard', 'A plain guard going up: a knock and a rising hum.', 'screen.js SOL_MOVES.guard; spellbook.js (Bramble Cradle there)', (t) => {
    const d = chan({ wet: 0.25 }); knock(d, t, 330, 0.5, 0.15); tone(d, 'triangle', 330, t, 0.45, 0.16, { to: 495, swell: true });
  });
  def('moon', 'A plain moon spell: a soft rising chord with glints.', 'spellbook.js, lineup.js (a summon’s move), bigbad.js', (t) => {
    const d = chan({ wet: 0.5 }); H('d4 a4 d5 f#5').forEach((f) => tone(d, 'sine', f, t, 2.2, 0.08, { swell: true, att: 0.9, rel: 0.9 })); H('a6 d7 f#7').forEach((f, i) => partials(d, f, t + 0.5 + i * 0.2, RING.glass, 0.1, 0.8));
  });
  def('shriek', 'A plain cold cry (the wraith’s).', 'kept for other pages. Argument: how long, in seconds', (t, len) => wraithVoice(t, len || 0.9, 0.26), [0.9]);
  def('grasp', 'A plain low dragging grasp.', 'spellbook.js (Thornwake and Briar Grasp there)', (t) => {
    const d = chan({ wet: 0.3 }); noise(trem(d, 9, 0.6, t, 1.0), t, 1.0, 0.9, { buf: 'brown', type: 'lowpass', f: 380, swell: true }); creak(d, t, 0.8, 0.12, { f: 450, f1: 700, r0: 12, r1: 30 });
  });
  def('eclipse', 'A plain dark swell.', 'bigbad.js (the seal on the final boss)', (t) => {
    const d = chan({ wet: 0.45 }); fm(d, 65.4, 1.5, 1, t, 2.2, 0.3, { to: 49, idx1: 4, swell: true }); tone(d, 'triangle', 196, t, 2.2, 0.07, { to: 147, swell: true }); whoosh(d, t, 2.2, 0.2, 300, 1100, { buf: 'pink', att: 1.6, rel: 0.4 });
  });
  def('trance', 'A plain trance swell (no change in the music).', 'lineup.js and bigbad.js (the witches’ glow there)', (t) => { tranceSwell(t); H('e6 b6 e7').forEach((f, i) => partials(chan({ wet: 0.45 }), f, t + 0.6 + i * 0.09, RING.glass, 0.14, 0.9)); });

  // ================================================== 4. THE MUSIC ==================================================
  // Three looping parts, each written out below as notes, and three short pieces. Nothing is recorded: every note is a
  // few oscillators and filters, started a quarter of a second ahead on the audio clock by a 40 ms timer, so the phone
  // only ever does a handful of small jobs at a time. The parts:
  //   battle: ordinary fights. E minor, a fairground reel in 6/8, 138 beats a minute, 64 bars (about 56 seconds):
  //           A (the tune on a reedy fiddle), B (a flute over a harp, calmer), A again (bells join), C (a tense call
  //           and answer over drums), and round again
  //   boss:   the great foes and the bosses. D minor, 4/4, 112 beats a minute, 24 bars (about 51 seconds): heavy drums,
  //           a galloping bass, a brass tune, and a deep bell at the top of each section
  //   lift:   a witch in her trance, or Curtain Call. E major (the battle tune's key, turned bright), 6/8, 16 bars:
  //           a bell tune over a running harp. It cuts in on the next beat and hands back at its next bar
  // The band: each player has a place across the stereo picture and a share of the room (M for the music, P for the
  // short pieces, which play on the effects' side so the Effects setting rules them, as victory always has)
  let M = null, P = null;
  function band(music) {
    const s = (pan, wet) => chan({ pan, wet, music });
    return { lead: s(0, 0.2), bell: s(0.3, 0.3), harp: s(-0.4, 0.18), chord: s(0.35, 0.12), pad: s(0, 0.28), bass: s(0, 0), drum: s(0, 0.05), perc: s(-0.25, 0.1), cym: s(0.2, 0.25) };
  }
  function initMusic() { M = band(true); P = band(false); darkBand(M); }
  // ---- the players ----
  // the tune: 'reed' (a fiddle-like buzz), 'flute' (soft and round) or 'brass' (broad and dark). Long notes get a little vibrato
  const LEADS = { reed: ['sawtooth', 'square', 1.003, 0.35, 2300, 0.016], flute: ['triangle', 'sine', 2, 0.3, 2600, 0.05], brass: ['sawtooth', 'sawtooth', 1.005, 0.8, 1700, 0.035] };
  function iLead(K, f, t, dur, vel, kind) {
    const L = LEADS[kind || 'reed'], o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = gain(L[3]), fl = ctx.createBiquadFilter(), g = ctx.createGain(), t1 = t + Math.max(L[5], dur - 0.03);
    o1.type = L[0]; o2.type = L[1]; o1.frequency.value = f; o2.frequency.value = f * L[2];
    fl.type = 'lowpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(L[4] * 0.45, t); fl.frequency.linearRampToValueAtTime(L[4], t + L[5] * 2.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + L[5]); g.gain.setValueAtTime(vel, t1); g.gain.setTargetAtTime(0, t1, 0.05);
    if (dur > 0.3) { vibrato(o1.frequency, t + 0.14, dur, 5.6, f * 0.007); }
    o1.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(K.lead); o1.start(t); o2.start(t); o1.stop(t1 + 0.35); o2.stop(t1 + 0.35);
  }
  const iBell = (K, f, t, vel) => { fm(K.bell, f, 3.5, 2, t, 0.9, vel, { idx1: 0.02, idxT: 0.3 }); tone(K.bell, 'sine', f * 4, t, 0.15, vel * 0.2); };     // a glockenspiel
  function iHarp(K, f, t, vel, dur) {                                                                                                                    // a plucked string
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = gain(0.3), fl = ctx.createBiquadFilter(), g = ctx.createGain(); dur = dur || 0.5;
    o1.type = 'triangle'; o2.type = 'sawtooth'; o1.frequency.value = o2.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(Math.min(9000, f * 6), t); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.25);
    perc(g.gain, t, 0.004, vel, dur); o1.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(K.harp); o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function iChord(K, fs, t, dur, vel) {                                                                                                                  // a short chord, strummed hard
    const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(2600, t); fl.frequency.exponentialRampToValueAtTime(900, t + dur);
    perc(g.gain, t, 0.006, vel, dur); fl.connect(g); g.connect(K.chord);
    for (const f of fs) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(fl); o.start(t); o.stop(t + dur + 0.05); }
  }
  function iPad(K, fs, t, dur, vel) {                                                                                                                    // a held chord, soft at both ends
    const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = 'lowpass'; fl.frequency.value = 1300; swell(g.gain, t, 0.2, vel, dur + 0.15, 0.3); fl.connect(g); g.connect(K.pad);
    for (const f of fs) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = rnd(-6, 6); o.connect(fl); o.start(t); o.stop(t + dur + 0.25); }
  }
  function iBass(K, f, t, dur, vel) {                                                                                                                    // the bass, with an octave on top so a phone speaker can find it
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator(), g2 = gain(0.5), g3 = gain(0.4), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'triangle'; o1.frequency.value = o2.frequency.value = f; o3.frequency.value = f * 2;
    fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(f * 9, t); fl.frequency.exponentialRampToValueAtTime(f * 3, t + 0.12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.006); g.gain.exponentialRampToValueAtTime(vel * 0.5, t + dur); g.gain.setTargetAtTime(0, t + dur, 0.03);
    o1.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); o3.connect(g3); g3.connect(g); g.connect(K.bass);
    for (const o of [o1, o2, o3]) { o.start(t); o.stop(t + dur + 0.2); }
  }
  // the drums
  const kick = (K, t, v) => { tone(K.drum, 'sine', 150, t, 0.22, v, { to: 45, glide: 0.09, att: 0.002 }); tone(K.drum, 'triangle', 300, t, 0.1, v * 0.4, { to: 90, att: 0.002 }); noise(K.drum, t, 0.012, v * 0.4, { type: 'lowpass', f: 3000, att: 0.001 }); };
  const snare = (K, t, v) => { noise(K.drum, t, 0.17, v, { f: 1900, q: 0.7, att: 0.001 }); noise(K.drum, t, 0.1, v * 0.5, { type: 'highpass', f: 5000, att: 0.001 }); tone(K.drum, 'triangle', 210, t, 0.09, v * 0.5, { to: 160, att: 0.002 }); };
  const clap = (K, t, v) => { for (let i = 0; i < 3; i++) noise(K.perc, t + i * 0.011, i === 2 ? 0.14 : 0.02, v, { f: 1300, q: 1, att: 0.001 }); };
  const hat = (K, t, v) => noise(K.perc, t, 0.035, v, { type: 'highpass', f: 7500, att: 0.001 });
  const tamb = (K, t, v) => { noise(K.perc, t, 0.07, v, { type: 'highpass', f: 6500, att: 0.002 }); fm(K.perc, 5200, 1.48, 2, t, 0.06, v * 0.25); };          // the fair's tambourine: a cousin of the Jester's bells
  const tom = (K, t, f, v) => { tone(K.drum, 'sine', f * 1.6, t, 0.26, v, { to: f, glide: 0.08, att: 0.002 }); tone(K.drum, 'triangle', f * 3.2, t, 0.1, v * 0.3, { to: f * 2, att: 0.002 }); noise(K.drum, t, 0.03, v * 0.4, { type: 'lowpass', f: 900, att: 0.001 }); };
  const timp = (K, t, f, v) => { tone(K.drum, 'sine', f * 1.25, t, 0.7, v, { to: f, glide: 0.06, att: 0.003 }); tone(K.drum, 'triangle', f * 2, t, 0.35, v * 0.35, { att: 0.003 }); noise(K.drum, t, 0.04, v * 0.5, { type: 'lowpass', f: 700, att: 0.002 }); };
  const crash = (K, t, v) => { noise(K.cym, t, 1.5, v, { type: 'highpass', f: 5000, att: 0.002 }); noise(K.cym, t, 0.9, v * 0.6, { f: 9000, q: 1.5, att: 0.002 }); };
  const roll = (K, t, dur, v) => { const n = Math.round(dur / 0.055); for (let i = 0; i < n; i++) snare(K, t + i * dur / n, v * (0.3 + 0.7 * i / n)); };
  // ---- the dark parts' players (November 17, 2026; Chris: "a little darker, a little more ominous, ethereal") ----
  // the far room: whatever plays into it comes back dulled and a long way off, as echoes that fade into the reverb.
  // K.far is its door and K.echo its echo (a part sets the echo's time to its own beat at the top of each round)
  function farRoom() {
    const inp = gain(1), lp = ctx.createBiquadFilter(), dl = ctx.createDelay(2), fb = gain(0.5), dry = gain(0.3), wet = gain(0.9);
    lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5; dl.delayTime.value = 0.5;
    inp.connect(lp); lp.connect(dry); dry.connect(musBus); lp.connect(wet); wet.connect(musWet); lp.connect(dl); dl.connect(fb); fb.connect(lp);
    return { inp, dl };
  }
  // the dark parts' own seats in the band: the far room, the music box, the voices, the low strings and the tolling bell
  // (the music box, the voices and the bell each send a share of themselves into the far room as well)
  function darkBand(K) {
    const far = farRoom(), send = (ch, v) => { const g = gain(v); ch.connect(g); g.connect(far.inp); return ch; };
    K.far = far.inp; K.echo = far.dl;
    K.box = ctx.createBiquadFilter(); K.box.type = 'lowpass'; K.box.frequency.value = 4000; K.box.Q.value = 0.5;      // the music box, its edge taken off
    K.box.connect(send(chan({ pan: -0.1, wet: 0.3, music: true }), 0.3));
    K.choir = send(chan({ pan: 0.1, wet: 0.4, music: true }), 0.5);
    K.str = chan({ pan: 0.15, wet: 0.16, music: true });
    K.toll = send(chan({ pan: -0.2, wet: 0.45, music: true }), 0.4);
  }
  // a music box that has slipped out of tune: each tooth of its comb sounds twice, a hair apart, so the note beats
  // against itself, and the whole box wanders a little sharp and flat as an old mechanism does
  function iBox(K, f, t, vel, len) {
    const d = K.box, wob = 13 * Math.sin(t * 1.9) + 8 * Math.sin(t * 5.3 + 1), L = len || 1.5;
    tone(d, 'sine', f, t, L, vel, { att: 0.003, det: wob }); tone(d, 'sine', f, t + 0.011, L * 0.8, vel * 0.5, { att: 0.003, det: wob - 19 });
    tone(d, 'sine', f * 2, t, L * 0.3, vel * 0.22, { att: 0.002, det: wob + 7 }); fm(d, f, 3, 1.2, t, 0.25, vel * 0.35, { idx1: 0.02, idxT: 0.1 });      // the pluck of the tooth: bright for a moment
    noise(d, t, 0.012, vel * 0.12, { type: 'lowpass', f: 2200, att: 0.001 });
  }
  // a wordless voice, a few singers at once: the tool box's `voice` (a buzz through a vowel's mouth shape) twice, a
  // hair apart, each with its own slow waver. Low notes sing "oo", middle ones "oh", high ones "ah"
  function iChoir(K, f, t, dur, vel, o) {
    o = o || {}; const q = { form: o.form || (f < 300 ? OO : f < 560 ? OH : AH), swell: true, att: o.att || 0.5, rel: o.rel || 0.7, vib: 4.6, vibD: f * 0.006 };
    voice(K.choir, f * 0.997, t, dur, vel, q); voice(K.choir, f * 1.004, t + 0.03, dur, vel * 0.8, Object.assign({}, q, { vib: 5.3 }));
  }
  // a slow held note or cluster of notes, dull, and soft at both ends: the drones, the slow chords and the swells.
  // o: att and rel (seconds in and out), cut (how dull, in Hz), cut1 (it opens to this as it goes), type, to (the seat)
  function iDrone(K, fs, t, dur, vel, o) {
    o = o || {}; const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = 'lowpass'; fl.Q.value = 0.7;
    fl.frequency.setValueAtTime(o.cut || 600, t); if (o.cut1) fl.frequency.exponentialRampToValueAtTime(o.cut1, t + dur * 0.7);
    swell(g.gain, t, o.att || dur * 0.4, vel, dur, o.rel || dur * 0.4); fl.connect(g); g.connect(o.to || K.pad);
    fs.forEach((f, i) => [-7, 6].forEach((det) => { const os = ctx.createOscillator(); os.type = o.type || 'sawtooth'; os.frequency.value = f; os.detune.value = det + (i % 2 ? 3 : -2); os.connect(fl); os.start(t); os.stop(t + dur + 0.05); }));
  }
  // low strings, bowed: two buzzes a hair apart and one an octave up, dulled, with the bow's soft start. Short notes
  // pulse; long ones waver. o: att (the bow's start, seconds), hold (how much is left at the note's end, 0 to 1)
  function iStr(K, f, t, dur, vel, o) {
    o = o || {}; const fl = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = gain(0.35), att = o.att || 0.025, t1 = t + Math.max(att + 0.01, dur);
    fl.type = 'lowpass'; fl.Q.value = 0.8; fl.frequency.setValueAtTime(Math.min(1800, f * 14), t); fl.frequency.exponentialRampToValueAtTime(Math.min(1200, f * 7), t1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + att); g.gain.linearRampToValueAtTime(vel * (o.hold || 0.6), t1); g.gain.setTargetAtTime(0, t1, 0.05);
    [[f, -6, fl], [f, 6, fl], [f * 2, 3, g2]].forEach(([q, det, to]) => { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = q; os.detune.value = det; if (dur > 0.6) vibrato(os.frequency, t + 0.2, dur, 5.2, q * 0.005); os.connect(to); os.start(t); os.stop(t1 + 0.4); });
    g2.connect(fl); fl.connect(g); g.connect(K.str);
  }
  // a glass bell a long way off (the tool box's struck glass, played into the far room)
  const iGlass = (K, f, t, vel, len) => { partials(K.far, f, t, RING.glass, vel, len || 1.6); tone(K.far, 'sine', f / 2, t, 0.5, vel * 0.3, { att: 0.004 }); };
  // a soft deep drum: the tool box's `thump`, with a knock of the skin on top so a phone speaker still finds it
  const lowDrum = (K, t, f0, f1, dur, v) => { thump(K.drum, t, f0, f1, dur, v); tone(K.drum, 'triangle', f0 * 3.2, t, dur * 0.4, v * 0.45, { to: f1 * 3.6, att: 0.004 }); noise(K.drum, t, 0.035, v * 0.35, { type: 'lowpass', f: 700, att: 0.002 }); };
  // a heartbeat: two of them, the second softer
  const heart = (K, t, v) => { lowDrum(K, t, 105, 52, 0.24, v); lowDrum(K, t + 0.3, 92, 48, 0.2, v * 0.6); };
  // for drones and slow chords: how many bars the chord that starts at this bar is held (0 when this bar only carries
  // the bar before's chord on). The first bar always starts one, so a round can begin anywhere
  const heldFor = (S, bar) => { if (bar && S.chords[bar - 1].name === S.chords[bar].name) return 0; let n = 1; while (bar + n < S.bars && S.chords[bar + n].name === S.chords[bar].name) n++; return n; };
  // ---- the written music ----
  // a chord by name ('Em', 'B', 'A7', 'C#m'): its bass note (E2 up to D#3) and its three notes round middle C
  function chordOf(name) {
    const m = /^([A-G])([#b]?)(m?)$/.exec(name), root = SEMI[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), f = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
    return { name, bass: f(40 + ((root - 4 + 12) % 12)), notes: [0, m[3] ? 3 : 4, 7].map((x) => f(60 + (root + x) % 12)) };
  }
  // a tune, one line a bar: a note name starts a note, '-' holds it on, '.' is a rest
  function tuneOf(rows, per) {
    const at = new Map(); let last = null;
    rows.forEach((row, b) => { const tk = row.trim().split(/\s+/); if (tk.length !== per) throw new Error('bar ' + (b + 1) + ' has ' + tk.length + ' steps, not ' + per);
      tk.forEach((x, i) => { if (x === '-') { if (last) last.len++; } else if (x === '.') last = null; else { last = { f: hz(x), len: 1 }; at.set(b * per + i, last); } }); });
    return at;
  }
  const SONGS = {};
  const song = (name, o) => { o.name = name; o.sd = 60 / o.bpm / o.beat; o.chords = o.chords.trim().split(/\s+/).map(chordOf); o.bars = o.chords.length; o.mel = tuneOf(o.tune, o.per); o.unit = o.spb / o.per; o.seconds = o.bars * o.spb * o.sd; SONGS[name] = o; };
  // bpm: beats a minute; beat: steps in a beat; spb: steps in a bar; per: how many steps of the tune are written per bar
  song('battle', {
    what: 'Ordinary fights: a fairground reel in E minor.', bpm: 138, beat: 3, spb: 6, per: 6,
    chords: 'Em Em D D C C B B  Em Em G G Am Am B B   G G D D Am Am Em Em  C C G G Am Am B B   Em Em D D C C B B  Em Em G G Am Am B B   Em Em C C Am Am B B  Em Em C C D D B B',
    tune: [
      // A: the reel
      'e5 - b4 e5 - g5', 'f#5 - e5 b4 - -', 'd5 - a4 d5 - f#5', 'e5 - d5 a4 - -', 'c5 - g4 c5 - e5', 'd5 - c5 g4 - -', 'b4 - d#5 f#5 - a5', 'g5 - f#5 d#5 - b4',
      'e5 - b4 e5 - g5', 'b5 - a5 g5 f#5 e5', 'd5 - g5 b5 - d6', 'b5 - a5 g5 - d5', 'c5 - e5 a5 - c6', 'b5 - a5 e5 - c5', 'b4 d#5 f#5 b5 - a5', 'f#5 - d#5 b4 - -',
      // B: the calm in it
      'b5 - - d6 - -', 'b5 - - g5 - a5', 'a5 - - f#5 - -', 'a5 - - f#5 - d5', 'e5 - - a5 - -', 'c6 - - b5 - a5', 'g5 - - e5 - -', 'b4 - - e5 - f#5',
      'g5 - - c6 - -', 'e6 - - d6 - c6', 'b5 - - d6 - -', 'g5 - - b5 - a5', 'a5 - c6 e6 - c6', 'a5 - - e5 - a5', 'b5 - - f#5 - b5', 'b5 a5 g5 f#5 e5 d#5',
      // A again, with bells
      'e5 - b4 e5 - g5', 'f#5 - e5 b4 - -', 'd5 - a4 d5 - f#5', 'e5 - d5 a4 - -', 'c5 - g4 c5 - e5', 'd5 - c5 g4 - -', 'b4 - d#5 f#5 - a5', 'g5 - f#5 d#5 - b4',
      'e5 - b4 e5 - g5', 'b5 - a5 g5 f#5 e5', 'd5 - g5 b5 - d6', 'b5 - a5 g5 - d5', 'c5 - e5 a5 - c6', 'b5 - a5 e5 - c5', 'b4 d#5 f#5 b5 - a5', 'f#5 - d#5 b4 - -',
      // C: call and answer over the drums
      'e5 . . g5 f#5 e5', 'b4 - - . . .', 'e5 . . g5 a5 g5', 'e5 - - . . .', 'a5 . . c6 b5 a5', 'e5 - - . . .', 'f#5 . . a5 g5 f#5', 'd#5 - - b4 - -',
      'g5 . . b5 a5 g5', 'e5 - - b4 - -', 'g5 . . c6 b5 g5', 'e5 - - . . .', 'f#5 . . a5 d6 a5', 'f#5 - - d5 - -', 'b4 d#5 f#5 b5 f#5 d#5', 'b5 - - a5 g5 f#5',
    ],
    lead(K, f, t, dur, bar) {
      const sec = bar >> 4;
      if (sec === 1) iLead(K, f, t, dur, 0.34, 'flute'); else iLead(K, f, t, sec === 3 ? dur * 0.85 : dur, 0.26, 'reed');
      if (sec === 2) iBell(K, f * 2, t, 0.09);
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 4, sd = this.sd, last = (bar & 15) === 15;
      if ((bar & 15) === 0 && s === 0) crash(K, t, 0.2);
      if (sec === 1) {                                                                 // B: a held chord, a harp running over it, a light pulse
        if (s === 0) { iPad(K, ch.notes, t, sd * 6, 0.07); kick(K, t, 0.5); }
        if (s === 0 || s === 3) { iBass(K, s ? ch.bass * 1.5 : ch.bass, t, sd * 2.7, 0.4); tamb(K, t, 0.2); }
        iHarp(K, ch.notes[[0, 1, 2, 1, 2, 1][s]] * (s >= 3 ? 2 : 1), t, 0.13);
        if (s === 2 || s === 5) hat(K, t, 0.1);
      } else if (sec === 3) {                                                          // C: drums and bass drive, chords stab, the harp answers the tune
        if (s !== 1 && s !== 4) iBass(K, s === 5 ? ch.bass * 1.5 : ch.bass, t, sd * 0.9, 0.46);
        if (s === 0 || s === 3) { iChord(K, ch.notes, t, sd * 1.2, 0.15); kick(K, t, 0.6); } else tamb(K, t, 0.14);
        if (s === 5 || ((bar & 1) && s === 4)) tom(K, t, s === 5 ? 110 : 147, 0.4);
        if ((bar & 1) && s === 3) snare(K, t, 0.3);
        if ((bar & 1) && s >= 3 && !this.mel.has(bar * 6 + 3)) iHarp(K, ch.notes[s - 3] * 2, t, 0.2);
      } else {                                                                         // A: bass on the beats, chords off them, tambourine all the way
        if (s === 0) { iBass(K, ch.bass, t, sd * 1.8, 0.46); kick(K, t, 0.6); }
        if (s === 3) { iBass(K, ch.bass * 1.5, t, sd * 1.4, 0.38); snare(K, t, 0.3); if (sec === 2) kick(K, t, 0.35); }
        if (s === 5) iBass(K, ch.bass * 2, t, sd * 0.9, 0.32);
        if (s === 2 || s === 5) iChord(K, ch.notes, t, sd * 0.9, 0.13); else if (sec === 2 && (s === 1 || s === 4)) iChord(K, ch.notes, t, sd * 0.8, 0.08);
        tamb(K, t, s % 3 ? 0.14 : 0.3);
      }
      if (last && s >= 3) { snare(K, t, 0.2 + (s - 3) * 0.08); snare(K, t + sd / 2, 0.2 + (s - 3) * 0.08); }     // a roll into the next section
    },
  });
  song('boss', {
    what: 'The great foes and the bosses: heavy and dark, in D minor.', bpm: 112, beat: 4, spb: 16, per: 8,
    chords: 'Dm Dm Bb Bb Gm Gm A A   Dm C Bb A Dm C Gm A   Dm Dm Eb Eb Dm Dm A A',
    tune: [
      // A: the march
      'd5 - - a4 d5 - e5 f5', 'e5 - d5 - a4 - - -', 'd5 - - bb4 d5 - f5 g5', 'f5 - - - d5 - - -', 'g5 - - d5 g5 - a5 bb5', 'a5 - g5 - d5 - - -', 'a5 - - e5 c#5 - e5 g5', 'a5 - - - - - c#5 e5',
      // B: the lament, falling
      'a5 - - - f5 - d5 -', 'g5 - - - e5 - c5 -', 'f5 - - - d5 - bb4 -', 'e5 - - - c#5 - e5 -', 'd5 - f5 - a5 - d6 -', 'c6 - - - g5 - e5 -', 'd5 - g5 - bb5 - d6 -', 'c#6 - - - a5 - e5 -',
      // C: the threat, in hard short phrases
      'd5 . d5 . f5 e5 d5 .', 'a4 - - . . . . .', 'eb5 . eb5 . g5 f5 eb5 .', 'bb4 - - . . . . .', 'd5 . d5 . f5 e5 d5 .', 'a5 . g5 . f5 . e5 .', 'e5 - - - c#5 - - -', 'a4 - c#5 - e5 - a5 -',
    ],
    lead(K, f, t, dur, bar) {
      const sec = bar >> 3;
      if (sec === 1) { iLead(K, f, t, dur, 0.26, 'reed'); iLead(K, f / 2, t, dur, 0.14, 'flute'); } else { iLead(K, f, t, dur * (sec === 2 ? 0.85 : 1), 0.24, 'brass'); iLead(K, f / 2, t, dur * 0.9, 0.16, 'brass'); }
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 3, sd = this.sd, last = (bar & 7) === 7, power = [ch.bass * 2, ch.bass * 3, ch.bass * 4];
      if ((bar & 7) === 0 && s === 0) { crash(K, t, 0.24); bell(K.bell, 146.83, t, 0.3, { set: 'toll', len: 4, strike: 0 }); }
      if (sec === 1) {                                                                 // B: half as fast, voices held, the harp tolling the chord
        if (s === 0) { iPad(K, ch.notes.concat(ch.notes[0] * 2), t, sd * 16, 0.08); kick(K, t, 0.7); timp(K, t, ch.bass, 0.3); }
        if (s % 4 === 0) iBass(K, ch.bass, t, sd * 3.6, 0.42);
        if (s === 8) snare(K, t, 0.4);
        if (s % 2 === 0) { iHarp(K, ch.notes[[0, 1, 2, 1, 0, 2, 1, 2][s / 2]] * (s >= 8 ? 2 : 1), t, 0.12); hat(K, t, 0.08); }
      } else {                                                                         // A and C: the gallop
        if (s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14) iBass(K, s === 6 || s === 14 ? ch.bass * 2 : ch.bass, t, sd * 1.7, 0.5);
        if (sec === 0 ? (s === 0 || s === 6 || s === 12) : (s === 0 || s === 4)) iChord(K, power, t, sd * (sec ? 1.6 : 2.4), 0.16);
        if (s === 0 || s === 8 || (sec === 0 && s === 10)) kick(K, t, 0.8);
        if (s === 4 || s === 12) snare(K, t, 0.5);
        if (s % 2 === 0) hat(K, t, s % 4 ? 0.1 : 0.16);
        if (sec === 2 && (s === 0 || s === 6 || s === 8)) timp(K, t, s === 6 ? ch.bass * 1.5 : ch.bass, 0.4);
      }
      if (last && s >= 8 && s % 2 === 0) { snare(K, t, 0.2 + (s - 8) * 0.035); snare(K, t + sd, 0.2 + (s - 8) * 0.035); if (sec === 2) tom(K, t, 147 - (s - 8) * 6, 0.4); }
    },
  });
  song('lift', {
    what: 'A witch in her trance, or Curtain Call: the battle tune’s key turned bright.', bpm: 138, beat: 3, spb: 6, per: 6,
    chords: 'E E B B C#m C#m A A  E E B B A A B B',
    tune: [
      'e5 - g#5 b5 - e6', 'd#6 - e6 b5 - g#5', 'f#5 - b5 d#6 - f#6', 'e6 - d#6 b5 - f#5', 'e5 - g#5 c#6 - e6', 'd#6 - c#6 g#5 - e5', 'c#5 - e5 a5 - c#6', 'b5 - a5 e5 - f#5',
      'g#5 - b5 e6 - g#6', 'f#6 - e6 b5 - g#5', 'f#5 - b5 d#6 - f#6', 'e6 - d#6 c#6 - b5', 'a5 - c#6 e6 - c#6', 'a5 - - e5 - a5', 'b5 - d#6 f#6 - d#6', 'b5 - a5 f#5 - d#5',
    ],
    lead(K, f, t, dur) { iBell(K, f, t, 0.2); iLead(K, f, t, dur, 0.2, 'flute'); },
    play(K, bar, s, t, ch) {
      const sd = this.sd;
      if ((bar & 7) === 0 && s === 0) crash(K, t, 0.24);
      if (s === 0) { iPad(K, ch.notes, t, sd * 6, 0.06); iBass(K, ch.bass, t, sd * 2.6, 0.44); kick(K, t, 0.6); }
      if (s === 3) { iBass(K, ch.bass * 1.5, t, sd * 1.6, 0.36); clap(K, t, 0.3); kick(K, t, 0.4); }
      if (s === 5) iBass(K, ch.bass * 2, t, sd * 0.9, 0.3);
      iHarp(K, ch.notes[[0, 1, 2, 0, 2, 1][s]] * (s >= 3 ? 4 : 2), t, 0.12);
      tamb(K, t, s % 3 ? 0.18 : 0.34);
      if ((bar & 7) === 7 && s >= 3) snare(K, t, 0.2 + (s - 3) * 0.08);
    },
  });
  // ---- three darker parts, for Chris to choose from (November 17, 2026). He heard the battle reel and said: "it sounds
  // like a carnival. It's very happy and upbeat. I'm thinking a little darker, a little more ominous, ethereal."
  // Nothing above plays them yet: startMusic('ashenReel'), startMusic('ethereal') or startMusic('ominous') does.
  //   ashenReel: the battle reel itself after the fair has gone to ash. The same tune at three quarters of the speed
  //              (104 beats a minute), its F sharps flattened to F (the dark half step just above the home note), on an
  //              out-of-tune music box, over low drones and a heartbeat. 48 bars, about 55 seconds: A (the box alone),
  //              B (the box an octave down, voices under it), A again (low strings shadow the tune, a bell tolls)
  //   ethereal:  floating and ghostly, in E minor, 4/4, 76 beats a minute, 16 bars (about 51 seconds): slow chords, a
  //              wordless voice carrying a slow tune, glass bells a long way off, a soft pulse and a soft deep drum
  //   ominous:   heavy and threatening, in E minor with its sourest chords (F and B flat), 4/4, 88 beats a minute, 20
  //              bars (about 55 seconds): low strings pulsing, a tolling bell, kettle drums, sour swells. It builds in
  //              five steps of four bars, and its last two bars draw back so the round can begin again without a jolt
  song('ashenReel', {
    what: 'The battle reel after the fair has gone to ash: the same tune, slower and in a darker key, on a music box that has slipped out of tune, over low drones and a heartbeat.', bpm: 104, beat: 3, spb: 6, per: 6,
    chords: 'Em Em Dm Dm C C F B  Em Em Gm Gm Am Am B B   Em Em Dm Dm Am Am Em Em  C C Gm Gm Am Am B B   Em Em Dm Dm C C F B  Em Em Gm Gm Am Am B B',
    tune: [
      // A: the reel, gone dark
      'e5 - b4 e5 - g5', 'f5 - e5 b4 - -', 'd5 - a4 d5 - f5', 'e5 - d5 a4 - -', 'c5 - g4 c5 - e5', 'd5 - c5 g4 - -', 'a4 - c5 f5 - a5', 'g5 - f#5 d#5 - b4',
      'e5 - b4 e5 - g5', 'b5 - a5 g5 f5 e5', 'd5 - g5 bb5 - d6', 'bb5 - a5 g5 - d5', 'c5 - e5 a5 - c6', 'b5 - a5 e5 - c5', 'b4 d#5 f#5 b5 - a5', 'f#5 - d#5 b4 - -',
      // B: the calm in it
      'b5 - - d6 - -', 'b5 - - g5 - a5', 'a5 - - f5 - -', 'a5 - - f5 - d5', 'e5 - - a5 - -', 'c6 - - b5 - a5', 'g5 - - e5 - -', 'b4 - - e5 - f5',
      'g5 - - c6 - -', 'e6 - - d6 - c6', 'bb5 - - d6 - -', 'g5 - - bb5 - a5', 'a5 - c6 e6 - c6', 'a5 - - e5 - a5', 'b5 - - f#5 - b5', 'b5 a5 g5 f#5 e5 d#5',
      // A again, with the low strings under it
      'e5 - b4 e5 - g5', 'f5 - e5 b4 - -', 'd5 - a4 d5 - f5', 'e5 - d5 a4 - -', 'c5 - g4 c5 - e5', 'd5 - c5 g4 - -', 'a4 - c5 f5 - a5', 'g5 - f#5 d#5 - b4',
      'e5 - b4 e5 - g5', 'b5 - a5 g5 f5 e5', 'd5 - g5 bb5 - d6', 'bb5 - a5 g5 - d5', 'c5 - e5 a5 - c6', 'b5 - a5 e5 - c5', 'b4 d#5 f#5 b5 - a5', 'f#5 - d#5 b4 - -',
    ],
    lead(K, f, t, dur, bar) {
      const sec = bar >> 4;
      if (sec === 1) { iBox(K, f / 2, t, 0.34, 2); if (dur > this.sd * 2.5) iChoir(K, f / 2, t, dur + 0.4, 0.14); } else iBox(K, f, t, 0.3);
      if (sec === 2) iStr(K, f / 4, t, dur, 0.11, { att: 0.06, hold: 0.85 });
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 4, sd = this.sd, n = heldFor(this, bar);
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 3, t);
      if ((bar & 15) === 0 && s === 0) bell(K.toll, 246.94, t, sec === 2 ? 0.4 : 0.3, { set: 'toll', len: 5, strike: 0 });       // a far bell at the top of each section
      if (s === 0 && n) iDrone(K, [ch.bass, ch.bass * 1.5, ch.bass * 2], t, n * 6 * sd + 0.7, 0.1, { att: 0.7, rel: 0.7, cut: 460 });   // the drone, for as long as the chord lasts
      if (s === 0) heart(K, t, sec === 2 ? 0.62 : 0.55);                                // the heartbeat, once a bar
      if (sec === 1) {                                                                 // B: a slow harp under the box
        if (s % 2 === 0) iHarp(K, ch.notes[s / 2], t, 0.13, 0.8);
      } else {                                                                         // A: where the reel's chords used to stab, two soft plucks
        if (s === 2 || s === 5) iHarp(K, ch.notes[s === 2 ? 1 : 2], t, 0.18, 0.6);
        if (sec === 2) {                                                               // the last time: a slow bowed bass, and a kettle drum every four bars
          if (s === 0) iStr(K, ch.bass, t, sd * 2.6, 0.2); if (s === 3) iStr(K, ch.bass * 1.5, t, sd * 2, 0.13);
          if (s === 0 && (bar & 3) === 0) timp(K, t, ch.bass, 0.3);
        }
      }
    },
  });
  song('ethereal', {
    what: 'Floating and ghostly: slow chords, a wordless voice, glass bells a long way off in a big echoing room, and a soft pulse underneath.', bpm: 76, beat: 4, spb: 16, per: 8,
    chords: 'Em Em C C  Am Am Em Em  G G Bm Bm  C C Bm Bm',
    tune: [
      'e5 - - - - - d5 -', 'b4 - - - - - - -', 'c5 - - - - - e5 -', 'g5 - - - - - - .', 'a5 - - - - - g5 -', 'e5 - - - - - c5 -', 'b4 - - - - - - -', '- - - - . . . .',
      'd5 - - - - - g5 -', 'b5 - - - - - a5 -', 'f#5 - - - - - d5 -', 'f#5 - - - - - - .', 'g5 - - - - - e5 -', 'c5 - - - e5 - - -', 'd5 - - - - - b4 -', 'f#4 - - - - - . .',
    ],
    lead(K, f, t, dur) { iChoir(K, f, t, dur + 0.5, 0.2); iChoir(K, f / 2, t + 0.05, dur + 0.5, 0.1, { form: OO }); },      // the voice, and a lower one under her
    play(K, bar, s, t, ch) {
      const sd = this.sd, n = heldFor(this, bar), N = ch.notes;
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 3, t);
      if (s === 0 && n) {                                                              // the slow chord, each one fading into the next, and a breath of air above it
        const len = n * 16 * sd;
        iDrone(K, [ch.bass, N[0], N[2], N[1] * 2], t, len + 1.5, 0.07, { att: 1.5, rel: 1.5, cut: 800 });
        iDrone(K, [N[0] * 2, N[2] * 2, N[0] * 2.245], t, len + 1.5, 0.03, { att: 2, rel: 1.5, cut: 2000, type: 'sine', to: K.far });
      }
      if (s % 2 === 0) {                                                               // the pulse: a soft low note on every half beat, leaning on the first, with a muted pluck so a phone carries it
        const a = [1, 0.3, 0.45, 0.75, 0.3, 0.55, 0.4, 0.3][s / 2];
        tone(K.bass, 'triangle', ch.bass * 2, t, sd * 1.9, 0.24 * a, { att: 0.015 }); tone(K.bass, 'sine', ch.bass, t, sd * 1.9, 0.2 * a, { att: 0.015 }); iHarp(K, ch.bass * 4, t, 0.24 * a, 0.35);
      }
      if (s === 0 || s === 10 || (bar >= 8 && s === 6)) lowDrum(K, t, 96, 58, 0.3, s ? 0.28 : 0.42);       // a soft deep drum
      if (s % 4 === 2) noise(K.perc, t, 0.06, 0.05, { f: 2300, q: 1.5, att: 0.004 });                       // a hush of a shaker
      // the glass bells, far off: a few notes of the chord each bar, and a falling answer where the voice rests (bar 8)
      const g = (bar === 7 ? [[8, 0, 4], [10, 2, 2], [12, 1, 2], [14, 0, 2]] : (bar & 1) ? [[4, 2, 2], [7, 0, 4], [13, 1, 2]] : [[2, 0, 2], [5, 2, 2], [8, 1, 4], [14, 2, 2]]).find((x) => x[0] === s);
      if (g) { let f = N[g[1]] * g[2]; if (f > 1500) f /= 2; iGlass(K, f, t, 0.3); }
    },
  });
  song('ominous', {
    what: 'Heavy and threatening: low strings pulsing like something coming closer, a tolling bell, kettle drums and sour swells. It builds from almost nothing to its height, then draws back to begin again.', bpm: 88, beat: 4, spb: 16, per: 8,
    chords: 'Em Em Em Em  Em Em F F  Em Em Bb Bb  Am Am F B  Em F Em Em',
    tune: [
      '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .',                                                     // 1: the strings alone
      'e4 - - - - - f4 -', 'e4 - - - - - - -', 'a4 - - - - - g4 f4', 'f4 - - - - - . .',                                             // 2: the tune comes in, low
      'e4 - - - g4 - b4 -', 'c5 - - - b4 - - -', 'bb4 - - - d5 - c5 -', 'bb4 - - - - - - .',                                         // 3: it climbs
      'e5 - - - c5 - a4 -', 'c5 - - - e5 - - -', 'f5 - - - e5 - c5 -', 'd#5 - - - - - f#5 -',                                        // 4: higher, harder
      'g5 - - - e5 - b4 -', 'c5 - - - a4 - f4 -', 'e4 - - - - - - -', '- - - - . . . .',                                             // 5: the height, then it draws back
    ],
    // how hard the band plays at each bar: the build, and the two bars that draw back
    power(bar) { return bar >= 18 ? (bar === 18 ? 0.8 : 0.6) : [0.4, 0.6, 0.8, 1, 1.1][bar >> 2]; },
    lead(K, f, t, dur, bar) {                                                          // the tune: low brass, low strings under it, and an octave on top near the height
      const p = this.power(bar);
      iLead(K, f / 2, t, dur, 0.24 * p, 'brass'); iStr(K, f / 4, t, dur, 0.14 * p, { att: 0.08, hold: 0.85 }); if (bar >= 12 && bar < 18) iLead(K, f, t, dur, 0.09 * p, 'brass');
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 2, q = bar & 3, sd = this.sd, p = this.power(bar), n = heldFor(this, bar), ebb = bar >= 18;
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 4, t);
      if (s === 0 && (q === 0 || (sec >= 3 && q === 2))) bell(K.toll, 246.94, t, 0.5, { set: 'toll', len: 6, strike: 0 });   // the bell: every four bars, every two near the height
      if (s === 0 && n) iDrone(K, [ch.bass / 2, ch.bass, ch.bass * 1.5], t, n * 16 * sd + 0.8, 0.07 * (0.6 + 0.4 * p), { att: 0.8, rel: 0.8, cut: 420 });
      if (s % 2 === 0) {                                                               // the low strings, pulsing; once the tune is in, the seventh pulse of a bar leans up a half step
        const i = s / 2, f = ch.bass * (sec >= 1 && i === 6 ? 1.0595 : 1), a = (i === 0 ? 1 : i === 4 ? 0.8 : 0.55) * p;
        iStr(K, f, t, sd * 1.5, 0.36 * a); iStr(K, f * 2, t, sd * 1.3, (sec >= 2 ? 0.24 : 0.16) * a);
      } else if (sec >= 3 && !ebb) iStr(K, ch.bass * 2, t, sd * 0.8, 0.07 * p);         // near the height they play twice as fast
      if (sec >= 1 && s === 0) timp(K, t, ch.bass, 0.4 * p);                           // kettle drums: the top of each bar, two more into each new section, a roll into the height
      if (sec >= 1 && q === 3 && (s === 12 || s === 14)) timp(K, t, ch.bass * (s === 12 ? 1 : 1.5), 0.3 * p);
      if (bar === 15 && s >= 8 && s < 12) timp(K, t, ch.bass, 0.14 + (s - 8) * 0.04);
      if (sec >= 2 && (s === 8 || (sec >= 3 && !ebb && (s === 6 || s === 14)))) lowDrum(K, t, 120, 50, 0.3, 0.5 * p);     // a heavy low drum
      if (q === 2 && s === 0 && sec < 4) {                                             // a sour swell over the last two bars of each section: the chord's root, the note a half step above it and the note that fits least
        const r = ch.notes[0];
        iDrone(K, [r, r * 1.0595, r * 1.4142].concat(sec >= 2 ? [r * 2.119] : []), t, 32 * sd + 0.5, 0.045 * p, { att: 32 * sd, rel: 0.5, cut: 450, cut1: 1500 });
      }
      if (sec >= 3 && !ebb && s === 0 && !(bar & 1)) iDrone(K, [659.26, 698.46], t, 32 * sd, 0.022 * p, { att: 1.2, rel: 1.2, cut: 1700, to: trem(K.pad, 9, 0.7, t, 32 * sd) });   // near the height: high strings shivering on two notes a half step apart
    },
  });
  // ---- three more in the same dark vein, each at its own energy (November 17, 2026). Chris heard the three above and
  // said: "lock those three in ... Let's make three more in that direction, but different energy, same vibe." They use
  // the same players (the out-of-tune music box, the low strings, the voices, the far bell, the kettle and deep drums,
  // the drones) in the same key (E minor with its sour F and B flat), and nothing bright: no cymbals, no tambourine.
  //   frenzy:    the highest energy. A dance that cannot stop, in 6/8 at 150 beats a minute, 64 bars (about 51 seconds):
  //              the low strings gallop on every step over a deep drum. A (the music box runs a frantic tune), B (voices
  //              wail over it), C (hard short calls on low brass, kettle drums answering, a sour swell rising), D (the
  //              ashen reel's own tune comes back at full speed on the box, the strings shadowing it, the bell tolling)
  //   dirge:     the lowest energy. A lament, 4/4 at 52 beats a minute, 12 bars (about 55 seconds): a long low drone, a
  //              funeral drum and a faint pulse, a cold breath of wind, and the music box alone, a note or two a bar,
  //              with one low voice under its long notes. A bowed low string joins for the last four bars
  //   reckoning: rising and resolute. A slow march in 12/8 at 90 beats a minute, 24 bars (64 seconds), in six steps of
  //              four bars: the low strings tread alone, the tune comes in low on brass and climbs a step at a time,
  //              voices and a running harp join, then the music box on top, up to an arrival on the home chord with the
  //              great bell (bar 23). The last bar draws back so the round can begin again without a jolt
  song('frenzy', {
    what: 'The highest energy: a dance that cannot stop. Low strings galloping over a deep drum, the music box running a frantic tune, voices wailing, kettle drums. For ambushes, a fight going badly, the last stand.', bpm: 150, beat: 3, spb: 6, per: 6,
    chords: 'Em Em Em Em F F Em Em  Am Am Em Em F F B B   Am Am Em Em Bb Bb F F  Am Am Em Em F F B B   Em Em Em Em Bb Bb Bb Bb  Em Em Em Em F F B B   Em Em Dm Dm C C F B  Em Em Gm Gm Am Am B B',
    tune: [
      // A: the box runs
      'e5 - b4 e5 f5 g5', 'a5 - g5 f5 - e5', 'e5 - b4 e5 f5 g5', 'b5 - a5 g5 f5 e5', 'f5 - c5 f5 g5 a5', 'c6 - a5 f5 - c5', 'b4 e5 g5 b5 a5 g5', 'f5 - e5 d#5 - b4',
      'a5 - e5 a5 b5 c6', 'e6 - c6 a5 - e5', 'g5 - e5 g5 a5 b5', 'e6 - b5 g5 - e5', 'f5 a5 c6 f6 c6 a5', 'a5 - g5 f5 - e5', 'd#5 f#5 b5 d#6 b5 f#5', 'a5 - f#5 d#5 - b4',
      // B: the voices wail over the gallop
      'e5 - - - - -', 'c5 - - e5 - -', 'b4 - - - - -', '- - - g5 - -', 'f5 - - - - -', 'd5 - - f5 - -', 'a5 - - - - -', 'g5 - - f5 - -',
      'e5 - - a5 - -', 'b5 - - a5 - -', 'g5 - - - - -', 'e5 - - b4 - -', 'c5 - - f5 - -', 'a5 - - - g5 f5', 'f#5 - - - - -', 'd#5 - - b4 - -',
      // C: hard short calls, the kettle drums answering
      'e5 . . g5 f5 e5', 'b4 - - . . .', 'e5 . . g5 a5 g5', 'e5 - - . . .', 'f5 . . bb5 a5 f5', 'd5 - - . . .', 'f5 . . bb5 c6 bb5', 'e5 - - . . .',
      'g5 . . b5 a5 g5', 'e5 - - b4 - -', 'g5 . . b5 c6 b5', 'e6 - - . . .', 'f5 . . a5 c6 a5', 'f5 - - c5 - -', 'b4 d#5 f#5 b5 f#5 d#5', 'b5 - - a5 g5 f#5',
      // D: the ashen reel's own tune, at full speed
      'e5 - b4 e5 - g5', 'f5 - e5 b4 - -', 'd5 - a4 d5 - f5', 'e5 - d5 a4 - -', 'c5 - g4 c5 - e5', 'd5 - c5 g4 - -', 'a4 - c5 f5 - a5', 'g5 - f#5 d#5 - b4',
      'e5 - b4 e5 - g5', 'b5 - a5 g5 f5 e5', 'd5 - g5 bb5 - d6', 'bb5 - a5 g5 - d5', 'c5 - e5 a5 - c6', 'b5 - a5 e5 - c5', 'b4 d#5 f#5 b5 - a5', 'f#5 - d#5 b4 - -',
    ],
    lead(K, f, t, dur, bar) {
      const sec = bar >> 4;
      if (sec === 1) { iChoir(K, f, t, dur + 0.25, 0.17, { att: 0.12, rel: 0.3 }); iBox(K, f, t, 0.16, 1); }                 // B: a wailing voice, the box striking each of her notes
      else if (sec === 2) { iLead(K, f / 2, t, dur * 0.85, 0.19, 'brass'); iStr(K, f / 2, t, dur, 0.12, { att: 0.02 }); }   // C: low brass and strings, in short hard calls
      else { iBox(K, f, t, 0.27, 0.9); if (sec === 3) iStr(K, f / 2, t, dur, 0.11, { att: 0.03, hold: 0.8 }); }               // A and D: the box; in D the strings shadow it
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 4, q = bar & 15, sd = this.sd, n = heldFor(this, bar), N = ch.notes;
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 3, t);
      if (s === 0 && (q === 0 || (sec === 3 && (bar & 3) === 0))) bell(K.toll, 246.94, t, sec === 3 ? 0.42 : 0.34, { set: 'toll', len: 4, strike: 0 });   // the far bell: the top of each section, every four bars in D
      if (s === 0 && n) iDrone(K, [ch.bass, ch.bass * 1.5, ch.bass * 2], t, n * 6 * sd + 0.4, 0.08, { att: 0.3, rel: 0.4, cut: 460 });
      const a = [1, 0.5, 0.62, 0.85, 0.5, 0.7][s];
      if (sec === 2) {                                                                 // C: the gallop drops to a tremor; the strings stab on the two beats
        iStr(K, ch.bass * 2, t, sd * 0.6, 0.085 * a);
        if (s === 0 || s === 3) { iStr(K, ch.bass, t, sd * 1.6, 0.27 * a); N.forEach((x) => iStr(K, x / 2, t, sd * 1.2, 0.078)); }
        if ((bar & 1) && s >= 3 && !this.mel.has(bar * 6 + 3)) timp(K, t, ch.bass * [1.5, 1.26, 1][s - 3], 0.3 + (s - 3) * 0.06);     // the kettle drums answer where the call rests
        if ((q === 0 || q === 8) && s === 0) { const r = N[0]; iDrone(K, [r, r * 1.0595, r * 1.4142], t, 48 * sd, 0.05, { att: 48 * sd, rel: 0.3, cut: 450, cut1: 1600 }); }   // a sour swell, rising over each eight bars
      } else {                                                                         // the gallop: the bass note on every step, and the chord running over it an octave higher
        iStr(K, ch.bass * (s === 5 ? 1.5 : 1), t, sd * 0.85, 0.225 * a);
        iStr(K, N[[0, 1, 2, 0, 2, 1][s]] / 2, t, sd * 0.8, (sec === 0 && q < 8 ? 0.11 : 0.145) * a);
      }
      if (s === 0 || s === 3) lowDrum(K, t, 110, 52, 0.2, s ? 0.32 : 0.41);             // the deep drum on the two beats of every bar
      if (sec === 3 && s === 5) lowDrum(K, t, 96, 50, 0.16, 0.26);
      noise(K.perc, t, 0.05, [0.075, 0.03, 0.045, 0.06, 0.03, 0.045][s], { f: 2300, q: 1.5, att: 0.003 });      // a dry rattle on every step
      if ((sec || q >= 8) && (s === 2 || s === 5)) knock(K.perc, t, 440, 0.1, 0.09);   // and a knock of wood, like bones, off the beat
      if (sec !== 2 && sec && s === 0 && n) timp(K, t, ch.bass, 0.36);                 // kettle drums at each new chord, from B on
      if (sec === 3 && s === 0 && !(bar & 3)) iDrone(K, [659.26, 698.46], t, 24 * sd, 0.02, { att: 0.8, rel: 0.8, cut: 1700, to: trem(K.pad, 9, 0.7, t, 24 * sd) });   // D: high strings shivering
      if (q === 15 && s >= 3) timp(K, t, ch.bass * (s === 5 ? 1.5 : 1), 0.24 + (s - 3) * 0.08);      // three strokes into the next section, and round into the top
    },
  });
  song('dirge', {
    what: 'The lowest energy: a lament, nearly still. A long low drone, a funeral drum and a faint pulse, a cold breath of wind, and the music box alone, a note or two at a time, with one low voice under it. For the quiet dangerous places, a witch fallen, the night closing in.', bpm: 52, beat: 2, spb: 8, per: 8,
    chords: 'Em Em Em C  Am Am Em Em  F F Em B',
    tune: [
      'b5 - - - g5 - - -', 'e5 - - - - - f5 -', 'e5 - - - - - . .', 'g5 - - - e5 - - -',
      'c5 - - - - - a5 -', 'g5 - - - e5 - - -', 'b4 - - - - - - -', '- - - - . . . .',
      'c6 - - - a5 - - -', 'f5 - - - - - g5 -', 'e5 - - - b4 - - -', 'd#5 - - - - - f#5 -',
    ],
    lead(K, f, t, dur) {                                                               // the box, each note left to ring; under the long ones a single low voice, slow to come and slow to go
      iBox(K, f, t, 0.36, 3.2);
      if (dur > this.sd * 5) iChoir(K, f / 2, t + 0.3, dur + 1, 0.125, { form: OO, att: 1.4, rel: 1.6 });
    },
    play(K, bar, s, t, ch) {
      const sd = this.sd, n = heldFor(this, bar), N = ch.notes;
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 2, t);
      if (s === 0 && n) {                                                              // the drone, each chord fading into the next, and a thin cold air above it
        const len = n * 8 * sd;
        iDrone(K, [ch.bass, ch.bass * 1.5, ch.bass * 2, N[1]], t, len + 2.4, 0.105, { att: 2.4, rel: 2.4, cut: 480 });
        iDrone(K, [N[0] * 2, N[2] * 2], t, len + 2.4, 0.027, { att: 2.4, rel: 2.4, cut: 1800, type: 'sine', to: K.far });
      }
      if (s % 2 === 0) {                                                               // the faint pulse: a soft low note on each beat, with a muted pluck so a phone carries it
        const a = [1, 0.4, 0.65, 0.4][s / 2];
        tone(K.bass, 'triangle', ch.bass * 2, t, sd * 1.8, 0.25 * a, { att: 0.03 }); tone(K.bass, 'sine', ch.bass, t, sd * 1.8, 0.2 * a, { att: 0.03 }); iHarp(K, ch.bass * 4, t, 0.19 * a, 0.5);
      }
      if (s === 0 || s === 4) lowDrum(K, t, 92, 50, 0.32, s ? 0.27 : 0.46);            // the funeral drum: the first and third beats, and a soft stroke before every other bar
      if ((bar & 1) && s === 7) lowDrum(K, t, 84, 48, 0.22, 0.17);
      if (s === 0 && !(bar & 1)) whoosh(K.far, t, 16 * sd, 0.5, 320, 620, { buf: 'pink', q: 1.2 });        // a breath of cold wind, rising and falling over two bars
      if (s === 0 && (bar === 0 || bar === 6)) bell(K.toll, bar ? 164.81 : 246.94, t, bar ? 0.32 : 0.42, { set: 'toll', len: 7, strike: 0 });   // the far bell, twice a round
      if (bar >= 8 && s === 0) iStr(K, ch.bass, t, sd * 7, 0.15, { att: 0.8, hold: 0.7 });                   // the last four bars: one low string, bowed slowly
      // a glass bell or two, a long way off, where the box rests
      const g = (bar === 2 ? [[6, 2, 2]] : bar === 7 ? [[4, 0, 4], [6, 2, 2]] : bar === 10 ? [[7, 1, 2]] : []).find((x) => x[0] === s);
      if (g) iGlass(K, N[g[1]] * g[2], t, 0.27);
    },
  });
  song('reckoning', {
    what: 'Rising and resolute: a slow dark march that climbs. Low strings treading, the tune coming in low on brass and rising step by step, voices and a running harp joining, the music box on top, up to an arrival with the great bell. For Curtain Call, the final boss’s last phase, a hard-won stand.', bpm: 90, beat: 3, spb: 12, per: 12,
    chords: 'Em Em C C  Em Em C D  Em G C D  Am Am C D  Em G C D  C D Em B',
    tune: [
      '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . . . .',                           // 1: the strings tread alone
      'e4 - - - - - g4 - - a4 - -', 'b4 - - - - - - - - . . .', 'c5 - - - - - b4 - - g4 - -', 'a4 - - - - - - - - f#4 - -',                 // 2: the tune comes in, low
      'g4 - - - - - a4 - - b4 - -', 'd5 - - - - - - - - b4 - -', 'e5 - - - - - d5 - - c5 - -', 'd5 - - - - - a4 - - d5 - -',                // 3: it climbs; the voices come in
      'e5 - - - - - c5 - - e5 - -', 'a5 - - - - - g5 - - e5 - -', 'g5 - - - - - e5 - - c5 - -', 'f#5 - - - - - a5 - - - - -',               // 4: higher; the harp runs
      'g5 - - - - - a5 - - b5 - -', 'd6 - - - - - - - - b5 - -', 'e6 - - - - - d6 - - c6 - -', 'd6 - - - - - a5 - - d6 - -',                // 5: the height: step 3's tune an octave up, the box on top
      'e6 - - - - - c6 - - e6 - -', 'f#6 - - - - - d6 - - f#6 - -', 'g6 - - - - - - - - - - -', 'b4 - - - - - - - - . . .',                 // 6: three steps up to the arrival, then it draws back
    ],
    // how hard the band plays at each bar: the climb, and the last bar that draws back
    power(bar) { return bar === 23 ? 0.62 : [0.5, 0.64, 0.78, 0.9, 1, 1.06][bar >> 2]; },
    lead(K, f, t, dur, bar) {                                                          // the tune: brass, strings under it; from step 4 a voice on its long notes, from step 5 the box on top
      const p = this.power(bar), sec = bar >> 2, ebb = bar === 23;
      iLead(K, f / 2, t, dur, 0.22 * p, 'brass'); iStr(K, sec >= 4 ? f / 4 : f / 2, t, dur, 0.12 * p, { att: 0.08, hold: 0.85 });
      if (sec >= 3 && !ebb && dur > this.sd * 5) iChoir(K, f / 2, t, dur + 0.4, 0.12 * p, { att: 0.3 });
      if (sec >= 4 && !ebb) iBox(K, f, t, 0.24, 1.6);
    },
    play(K, bar, s, t, ch) {
      const sec = bar >> 2, q = bar & 3, sd = this.sd, p = this.power(bar), n = heldFor(this, bar), N = ch.notes, ebb = bar === 23;
      if (bar === 0 && s === 0) K.echo.delayTime.setValueAtTime(sd * 3, t);
      // the bell, on the chord's fifth: the top of the round, the top of each step from the third, every two bars from the height, and loudest at the arrival
      if (s === 0 && (bar === 0 || (sec >= 2 && q === 0) || (sec >= 4 && q === 2))) bell(K.toll, N[2] / 2, t, bar === 22 ? 0.6 : 0.3 + 0.15 * p, { set: 'toll', len: 6, strike: 0 });
      if (s === 0 && n) {                                                              // under it all: a low drone; from step 3 the chord itself, opening as the round climbs, and voices holding it
        const len = n * 12 * sd;
        iDrone(K, [ch.bass / 2, ch.bass, ch.bass * 1.5], t, len + 0.8, 0.06 * (0.6 + 0.4 * p), { att: 0.8, rel: 0.8, cut: 420 });
        if (sec >= 2) { iDrone(K, [N[0], N[1], N[2], N[0] * 2], t, len + 0.8, 0.035 * p, { att: 0.8, rel: 0.8, cut: 500 + 700 * p }); iChoir(K, N[0], t, len + 0.5, 0.07 * p); }
        if (sec >= 3) iChoir(K, N[2], t, len + 0.5, 0.06 * p);
        if (sec >= 5 && !ebb) iChoir(K, N[1] * 2, t, len + 0.5, 0.05 * p);
      }
      if (s % 3 === 0) {                                                               // the low strings tread: four to the bar, the last one leaning up to the fifth once the tune is in
        const i = s / 3, a = [1, 0.6, 0.8, 0.65][i] * p;
        iStr(K, ch.bass * (i === 3 && sec >= 1 ? 1.5 : 1), t, sd * 2.3, 0.36 * a); iStr(K, ch.bass * 2, t, sd * 2, (sec >= 2 ? 0.22 : 0.14) * a);
      } else if (s % 3 === 2 || sec >= 4) iStr(K, ch.bass * 2, t, sd * 0.8, (s % 3 === 2 ? 0.11 : 0.07) * p);      // a short step before each tread; at the height the strings fill every step
      if (sec >= 1 && s === 0) timp(K, t, ch.bass, 0.38 * p);                          // kettle drums: the top of each bar; from step 4 the third beat too; three strokes into each new step
      if (sec >= 3 && s === 6) timp(K, t, ch.bass * 1.5, 0.24 * p);
      if (sec >= 1 && q === 3 && !ebb && s >= 9) timp(K, t, ch.bass * (s === 11 ? 1.5 : 1), (0.18 + (s - 9) * 0.06) * p);
      if (bar === 21 && s >= 6 && s < 9) timp(K, t, ch.bass, 0.16 + (s - 6) * 0.04);   // and a roll into the arrival
      if (sec >= 3 && !ebb && (s === 3 || s === 9)) lowDrum(K, t, 120, 50, 0.3, 0.45 * p);                   // a heavy low drum between the treads, from step 4
      if (bar === 22 && s === 0) lowDrum(K, t, 120, 46, 0.45, 0.6);
      if (sec >= 3 && !ebb) iHarp(K, N[[0, 1, 2, 1, 2, 0][s % 6]] * (s >= 6 ? 2 : 1), t, 0.12 * p, 0.6);     // from step 4: a harp running over the chord
    },
  });
  const parts = ['battle', 'boss', 'lift', 'ashenReel', 'ethereal', 'ominous', 'frenzy', 'dirge', 'reckoning'].map((n) => ({ name: n, what: SONGS[n].what, seconds: SONGS[n].seconds, bars: SONGS[n].bars }));
  function playStep(K, S, bar, s, t) {
    S.play(K, bar, s, t, S.chords[bar]);
    if (s % S.unit === 0) { const ev = S.mel.get(bar * S.per + s / S.unit); if (ev) S.lead(K, ev.f, t, ev.len * S.unit * S.sd, bar); }
  }
  // ---- the scheduler ----
  let musOn = false, musicOff = false, musVol = 1, vols = null, timer = 0, fadeTO = 0, base = 'battle', cur = null, bar = 0, step = 0, nextT = 0, liftState = null;
  // the lift: asked for by a trance or a Curtain Call. x is how many seconds it lasts, or a function the music asks
  // "is she still in her trance?" (it waits up to 8 seconds for the first yes, then leaves at the first no)
  function lift(x) { if (ctx) liftState = { t0: ctx.currentTime, fn: typeof x === 'function' ? x : null, sec: typeof x === 'number' ? x : 14, seen: false }; }
  function lifted() {
    const L = liftState; if (!L) return false; const age = ctx.currentTime - L.t0; let on = age < L.sec;
    if (L.fn) { let v = false; try { v = !!L.fn(); } catch (e) { v = false; } if (v) L.seen = true; on = age < 240 && (L.seen ? v : age < 8); }
    if (!on) liftState = null; return on;
  }
  function tick() {
    const t = ctx.currentTime; if (nextT < t - 0.05) nextT = t + 0.05;      // the page was asleep: pick the beat up again from now
    while (nextT < t + 0.28) {
      if (step % cur.beat === 0) {                                          // the lift cuts in on any beat; everything else changes at a bar line
        const want = lifted() ? 'lift' : base;
        if (want !== cur.name && (want === 'lift' || step === 0)) { cur = SONGS[want]; bar = 0; step = 0; crash(M, nextT, 0.26); }
      }
      playStep(M, cur, bar, step, nextT);
      nextT += cur.sd; if (++step >= cur.spb) { step = 0; bar = (bar + 1) % cur.bars; }
    }
  }
  function musFade(v, sec) { const t = ctx.currentTime; for (const b of [musBus, musWet]) { b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(v, t + sec); } }
  // startMusic('battle' or 'boss'): the part to play (battle when not said). Called again while playing, it changes the part at the next bar
  function startMusic(mood) {
    if (!ctx || musicOff) return;
    base = SONGS[mood] ? mood : 'battle';
    if (musOn) return;
    clearTimeout(fadeTO); clearInterval(timer); musOn = true; liftState = null; cur = SONGS[base]; bar = 0; step = 0; nextT = ctx.currentTime + 0.06;
    musFade(MUS * musVol, 0.03); timer = setInterval(tick, 40); tick();
  }
  function stopMusic(fade) { if (!ctx || !musOn) return; musOn = false; liftState = null; const f = fade || 0.8; musFade(0, f); fadeTO = setTimeout(() => clearInterval(timer), f * 1000 + 60); }
  const setMood = (mood) => { if (SONGS[mood]) base = mood; };
  function setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : MASTER, ctx.currentTime, 0.05); }
  // the game's sound setting can keep the battle music quiet while the effects play
  function setMusicOff(m) { musicOff = m; if (m) stopMusic(0.3); }
  // the game's volumes, 0 to 1 each (the game's Music and Effects settings; 0.75 is where they start)
  function setVolumes(music, effects) {
    musVol = music / 0.75; vols = [music, effects]; if (!ctx) return;
    for (const b of [sfxBus, sfxWet]) b.gain.setTargetAtTime(SFX * effects / 0.75, ctx.currentTime, 0.05);
    if (musOn) for (const b of [musBus, musWet]) b.gain.setTargetAtTime(MUS * musVol, ctx.currentTime, 0.05);
  }
  // for a test's offline render: the whole of one part written onto the clock, from `from` seconds until `seconds`
  function score(part, seconds, from) {
    const S = SONGS[part]; for (const b of [musBus, musWet]) b.gain.value = MUS;
    for (let t = from || 0.05, b = 0, s = 0; t < seconds; t += S.sd) { playStep(M, S, b, s, t); if (++s >= S.spb) { s = 0; b = (b + 1) % S.bars; } }
  }

  // ---- the short pieces: played once, on the effects' side ----
  family('Music: the short pieces', 'Played once as a fight ends. (The three looping parts, battle, boss and lift, are the music itself: startMusic.)');
  // a piece is written as [note, when, how long] in steps of q seconds
  const line = (K, q, t, rows, vel, kind, bells) => rows.forEach(([n, at, len]) => { iLead(K, hz(n), t + at * q, len * q, vel, kind); if (bells) iBell(K, hz(n) * 2, t + at * q, vel * 0.4); });
  function finalChord(K, t, name, sec) {                                    // the last chord of a win: held, with a drum, a cymbal and Kore's bells pealing over it
    const ch = chordOf(name); iPad(K, ch.notes.concat(ch.notes[0] * 2), t, sec, 0.12); iBass(K, ch.bass, t, sec, 0.5); timp(K, t, ch.bass, 0.6); crash(K, t, 0.3);
    H('e6 g#6 b6 e7').forEach((f, i) => bell(K.bell, f, t + 0.08 + i * 0.13, 0.2, { len: 1.6, strike: 0.5 }));
    for (let i = 0; i < 9; i++) tamb(K, t + i * 0.07, 0.3 - i * 0.025);
  }
  def('victory', 'A fight is won: a quick run up the bright chord, three proud notes, and a held chord with a drum, a cymbal and bells. About four and a half seconds, in E major.', 'screen.js finish (an ordinary fight won) and finaleEnding', (t) => {
    const K = P, q = 0.15;
    line(K, q, t, [['b4', 0, 1], ['e5', 1, 1], ['g#5', 2, 1], ['b5', 3, 1], ['e6', 4, 2.6], ['c#6', 7, 1.7], ['d#6', 9, 1.7], ['e6', 11, 9]], 0.28, 'reed', true);
    [['E', 4, 2.6], ['A', 7, 1.8], ['B', 9, 1.8]].forEach(([n, at, len]) => { const ch = chordOf(n); iChord(K, ch.notes, t + at * q, len * q, 0.2); iBass(K, ch.bass, t + at * q, len * q, 0.5); timp(K, t + at * q, ch.bass, 0.5); });
    for (let i = 0; i < 4; i++) tamb(K, t + i * q, 0.3); roll(K, t + 9.6 * q, 1.4 * q, 0.34); finalChord(K, t + 11 * q, 'E', 1.6);
  });
  def('fanfare', 'A great foe or a set fight is won: a longer piece. A call, its answer a step higher, a drum roll, and the same held chord with bells. About eight seconds, in E major.', 'screen.js finish (the great wraith, Dawnroost and the Colossus: fights marked `fanfare`)', (t) => {
    const K = P, q = 0.16;
    line(K, q, t, [['e5', 0, 0.9], ['e5', 1, 0.45], ['e5', 1.5, 0.45], ['b5', 2, 1.8], ['g#5', 4, 0.9], ['b5', 5, 0.9], ['e6', 6, 2.7],
      ['f#5', 9, 0.9], ['f#5', 10, 0.45], ['f#5', 10.5, 0.45], ['c#6', 11, 1.8], ['a5', 13, 0.9], ['c#6', 14, 0.9], ['f#6', 15, 2.7],
      ['e6', 18, 0.9], ['d#6', 19, 0.9], ['c#6', 20, 0.9], ['d#6', 21, 1.9], ['e6', 23, 10]], 0.28, 'brass', true);
    [['E', 0, 4], ['E', 4, 5], ['F#m', 9, 4], ['A', 13, 5], ['B', 18, 5]].forEach(([n, at, len]) => { const ch = chordOf(n); iPad(K, ch.notes, t + at * q, len * q, 0.1); iBass(K, ch.bass, t + at * q, len * q * 0.9, 0.5); timp(K, t + at * q, ch.bass, 0.5); });
    [0, 2, 4, 6, 9, 11, 13, 15, 18, 19, 20].forEach((at) => snare(K, t + at * q, 0.26)); [6, 15].forEach((at) => crash(K, t + at * q, 0.2));
    roll(K, t + 21 * q, 2 * q, 0.4); finalChord(K, t + 23 * q, 'E', 2.2);
  });
  def('defeat', 'The party falls: a slow tune sinking in E minor on a flute, over held chords, ending on one soft low bell. About seven seconds.', 'screen.js finish (a lost fight) and sparedEnding', (t) => {
    const K = P, q = 0.34;
    line(K, q, t, [['b4', 0, 1], ['a4', 1, 1], ['g4', 2, 1], ['e4', 3, 2], ['c5', 5, 1], ['b4', 6, 1], ['a4', 7, 1], ['e4', 8, 2], ['g4', 10, 1], ['f#4', 11, 1], ['e4', 12, 5]], 0.32, 'flute');
    [['Em', 0, 5], ['Am', 5, 5], ['B', 10, 2], ['Em', 12, 5]].forEach(([n, at, len]) => { const ch = chordOf(n); iPad(K, ch.notes, t + at * q, len * q, 0.1); iBass(K, ch.bass, t + at * q, len * q * 0.9, 0.36); });
    timp(K, t, 82.4, 0.4); timp(K, t + 12 * q, 82.4, 0.4); bell(K.bell, 164.81, t + 12 * q, 0.4, { set: 'toll', len: 3.5, strike: 0 });
  });

  // ==================================================== THE FACE ====================================================
  // sfx.name(...) plays a sound now. Before the first tap, or while muted, it does nothing. A name that isn't in this
  // file plays nothing and is noted in `missing`; a sound that fails is noted in `errors` (both for the tests)
  const sfx = new Proxy(RAW, { get: (o, k) => (...a) => {
    if (!ctx || muted) return;
    if (typeof o[k] !== 'function') { missing.add(String(k)); return; }
    lvl = LEVEL[k] || 1;
    try { o[k](ctx.currentTime, ...a); } catch (e) { errors.push(String(k) + ': ' + e.message); }
    lvl = 1;
  } });
  return {
    init() { init(); if (ctx && vols) setVolumes(vols[0], vols[1]); }, sfx, startMusic, stopMusic, setMuted, setMusicOff, setVolumes,
    get muted() { return muted; }, get musicOn() { return musOn; },
    // beyond Envoi's face
    setMood, lift, score, catalog, families, parts, missing, errors, names: Object.keys(RAW), get mood() { return cur ? cur.name : null; },
    choices,   // the ten sounds heard most, each with its versions to choose from: [{ name: 'strike', options: ['strike', 'strike_b', 'strike_c', 'strike_d'] }, ...]
  };
}
