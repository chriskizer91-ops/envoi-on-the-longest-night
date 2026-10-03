// sound.js: the battle's music and sound effects, all synthesized in the browser. Imported unchanged from
// reference/demos/night-square-shadow-wraith.html (its SND module): a D minor battle theme at 132 BPM and the swish, hit,
// fire, boom, chime, blade, heal, guard, moon, shriek, grasp, eclipse, menu, select, trance, victory and defeat effects.
// Defines makeBattleSound() -> { init, sfx, startMusic, stopMusic, setMuted, setMusicOff, muted }. Call init() from a tap or a click:
// browsers only start audio after the player touches the page.
function makeBattleSound() {
  'use strict';
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null, muted = false, musOn = false, timer = 0, fadeTO = 0, nextT = 0, step = 0;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.6;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.3; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const now = () => ctx.currentTime;
  function env(gn, t, a, peak, dur) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(f, t, dur, type, peak, bus, f2, att) {
    const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(gn, t, att || 0.005, peak, dur); o.connect(gn); gn.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dur, peak, ftype, f0, f1, q, bus, att) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gn = ctx.createGain(); env(gn, t, att || 0.005, peak, dur); s.connect(f); f.connect(gn); gn.connect(bus || sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const S = {
    swish() { const t = now(); noise(t, 0.2, 0.35, 'bandpass', 2600, 700, 1.4); },
    hit(p) { const t = now(); p = p || 1; tone(150, t, 0.18, 'sine', 0.55 * p, sfxBus, 45); noise(t, 0.09, 0.3 * p, 'lowpass', 1600, 300); tone(1900, t, 0.12, 'triangle', 0.08 * p, sfxBus, 1200); },
    fire() { const t = now(); noise(t, 0.55, 0.3, 'lowpass', 400, 2200, 1, sfxBus, 0.12); tone(90, t, 0.5, 'sawtooth', 0.06, sfxBus, 160); },
    boom(p) { const t = now(); p = p || 1; noise(t, 0.8, 0.55 * p, 'lowpass', 1200, 70); tone(80, t, 0.6, 'sine', 0.6 * p, sfxBus, 32); },
    chime() { const t = now(); [880, 1320, 1760, 2640].forEach((f, i) => tone(f, t + i * 0.06, 0.9, 'sine', 0.1, sfxBus)); },
    blade() { const t = now(); tone(1400, t, 0.22, 'sine', 0.12, sfxBus, 2600); noise(t, 0.15, 0.12, 'highpass', 5000, 8000); },
    heal() { const t = now(); [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.08, 0.7, 'sine', 0.12, sfxBus)); },
    guard() { const t = now(); tone(660, t, 0.4, 'triangle', 0.12, sfxBus, 990); tone(990, t + 0.05, 0.5, 'sine', 0.08, sfxBus); },
    moon() { const t = now(); [293.7, 349.2, 440, 587.3].forEach((f) => { tone(f, t, 2.4, 'sawtooth', 0.035, sfxBus, f * 1.003, 0.8); tone(f * 2, t + 0.4, 2.0, 'sine', 0.04, sfxBus, null, 0.6); }); [1760, 2349, 2637, 3520].forEach((f, i) => tone(f, t + 0.3 + i * 0.12, 1.4, 'sine', 0.07, sfxBus)); },
    shriek(len) { const t = now(), d = len || 0.9; [1100, 1170].forEach((f) => { const o = tone(f, t, d, 'sawtooth', 0.07, sfxBus, 260, 0.04); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 17; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d); }); noise(t, d, 0.12, 'bandpass', 1500, 400, 3); },
    grasp() { const t = now(); noise(t, 1.1, 0.4, 'lowpass', 180, 90, 1, sfxBus, 0.2); tone(55, t, 1.0, 'sawtooth', 0.12, sfxBus, 42, 0.1); },
    eclipse() { const t = now(); tone(42, t, 2.4, 'sawtooth', 0.16, sfxBus, 30, 0.6); noise(t, 2.4, 0.25, 'lowpass', 150, 900, 1, sfxBus, 1.6); },
    menu() { if (!ctx) return; tone(1100, now(), 0.05, 'square', 0.05); },
    select() { if (!ctx) return; const t = now(); tone(1320, t, 0.06, 'square', 0.06); tone(1760, t + 0.05, 0.08, 'square', 0.05); },
    trance() { const t = now(); tone(400, t, 0.9, 'sine', 0.14, sfxBus, 1600, 0.05); [1568, 2093, 2637].forEach((f, i) => tone(f, t + 0.5 + i * 0.09, 0.8, 'sine', 0.08)); },
    victory() { const t = now(); [587.3, 740, 880, 1175, 880, 1175].forEach((f, i) => { tone(f, t + i * 0.13, 0.18, 'square', 0.07); tone(f, t + i * 0.13, 0.2, 'triangle', 0.1); }); [587.3, 740, 880, 1175].forEach((f) => { tone(f, t + 0.85, 1.4, 'triangle', 0.09); tone(f / 2, t + 0.85, 1.4, 'sawtooth', 0.025); }); },
    defeat() { const t = now(); [440, 349.2, 293.7, 220].forEach((f, i) => tone(f, t + i * 0.38, 0.6, 'triangle', 0.12)); }
  };
  const sfx = new Proxy(S, { get: (o, k) => (...a) => { if (ctx && !muted) try { o[k](...a); } catch (e) { /* ignore */ } } });

  // battle theme: D minor, i - VI - VII - V, driving bass, arpeggios, drums
  const BPM = 132, SPB = 60 / BPM / 4;
  const CH = [[146.8, [293.7, 349.2, 440]], [116.5, [233.1, 293.7, 349.2]], [130.8, [261.6, 329.6, 392]], [110, [220, 277.2, 329.6]]];
  function schedule() {
    while (nextT < ctx.currentTime + 0.12) {
      const bar = Math.floor(step / 16) % 4, s16 = step % 16, t = nextT, ch = CH[bar];
      if (s16 % 2 === 0) { const f = s16 === 6 || s16 === 14 ? ch[0] * 2 : ch[0]; const o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f / 2; fl.type = 'lowpass'; fl.frequency.value = 420; env(gn, t, 0.005, 0.22, SPB * 1.8); o.connect(fl); fl.connect(gn); gn.connect(musBus); o.start(t); o.stop(t + SPB * 2); }
      const arp = [0, 1, 2, 1, 0, 2, 1, 2][s16 % 8], up = s16 >= 8 ? 2 : 1;
      { const o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = 'square'; o.frequency.value = ch[1][arp] * up; fl.type = 'lowpass'; fl.frequency.value = 2200; env(gn, t, 0.004, 0.035, SPB * 0.9); o.connect(fl); fl.connect(gn); gn.connect(musBus); o.start(t); o.stop(t + SPB); }
      if (s16 === 0 || s16 === 6 || s16 === 8 || s16 === 11) { tone(150, t, 0.2, 'sine', 0.5, musBus, 42); }
      if (s16 === 4 || s16 === 12) { noise(t, 0.16, 0.22, 'bandpass', 1900, 1200, 0.7, musBus); tone(190, t, 0.1, 'triangle', 0.12, musBus, 150); }
      if (s16 % 2 === 1) noise(t, 0.035, 0.06, 'highpass', 7000, 9000, 0.7, musBus);
      if (step % 64 === 0) noise(t, 1.2, 0.08, 'highpass', 5000, 3000, 0.5, musBus);
      nextT += SPB; step++;
    }
  }
  let musicOff = false;
  function startMusic() { if (!ctx || musOn || musicOff) return; clearTimeout(fadeTO); clearInterval(timer); musOn = true; nextT = ctx.currentTime + 0.05; step = 0; musBus.gain.cancelScheduledValues(ctx.currentTime); musBus.gain.setValueAtTime(0.3, ctx.currentTime); timer = setInterval(schedule, 25); }
  function stopMusic(fade) { if (!ctx || !musOn) return; musOn = false; const t = ctx.currentTime; musBus.gain.setValueAtTime(musBus.gain.value, t); musBus.gain.linearRampToValueAtTime(0.0001, t + (fade || 0.8)); fadeTO = setTimeout(() => { clearInterval(timer); }, (fade || 0.8) * 1000 + 50); }
  function setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05); }
  // the game's sound setting can keep the battle theme quiet while the effects play
  function setMusicOff(m) { musicOff = m; if (m) stopMusic(0.3); }
  return { init, sfx, startMusic, stopMusic, setMuted, setMusicOff, get muted() { return muted; } };
}
