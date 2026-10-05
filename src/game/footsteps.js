// footsteps.js: Io's footsteps on the walking maps, one of the small ideas Chris hasn't said yes to (handoff/tasks.md,
// I01), heard only where the page switches it on (window.ENVOI_TRY.steps, the page of polish to try): the two sounds of
// the Io on Foot page (src/walk/on-foot.js), as he heard them there. Soft steps are Path Polish's footsteps
// (follow-me-down-witch-way, versions/path-polish/game/src/sound.js): one short, quiet, filtered breath of noise as each
// foot lands, its colour from the ground (earth, stone or wood); the cloak is a soft swish with each step, no footfall.
// Defines window.Footsteps = { make(ctx) }: ctx() gives the game's audio context (or null before the first touch);
// make returns { play(kind, mapId, volume) }, kind 'soft' or 'cloak', volume the game's effects volume (0.75 Normal,
// as loud as on the Io on Foot page).
(function () {
  'use strict';
  // what each map is underfoot: the Io on Foot page's, and the wilderness scenes (earth, the frozen ones too)
  const GROUND = { cottage: 'earth', wickhollow: 'stone', jetty: 'wood', thornwood: 'earth', bogmire: 'wood', 'bogmire-heart': 'wood', dawnroost: 'stone', 'dawnroost-node': 'stone', crossroads: 'stone', shipyard: 'wood', 'frozen-pass': 'earth', misthollow: 'stone', moonwell: 'stone' };
  function make(ctx) {
    let AC = null, noise = null, lastT = 0;
    function ready() {
      const c = ctx();
      if (!c) return false;
      if (c !== AC) {
        AC = c; noise = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
        const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return AC.state !== 'closed';
    }
    function burst(out, type, freq, q, attack, dur, vol) {
      const t = AC.currentTime, src = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
      src.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + attack); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(gn).connect(out); src.start(t, Math.random() * 1.5, dur + 0.05);
    }
    function knock(out, freq, dur, vol) {
      const t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'sine'; o.frequency.value = freq; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    return {
      play(kind, mapId, volume) {
        if ((kind !== 'soft' && kind !== 'cloak') || !(volume > 0) || !ready() || AC.currentTime - lastT < 0.19) return false;
        lastT = AC.currentTime;
        // each step through a gain of its own at the effects' volume, freed when the step has sounded
        const out = AC.createGain(); out.gain.value = volume / 0.75; out.connect(AC.destination);
        setTimeout(() => { try { out.disconnect(); } catch (e) { /* gone */ } }, 600);
        if (kind === 'cloak') { burst(out, 'bandpass', 1900 + Math.random() * 500, 0.9, 0.07, 0.24, 0.045); return true; }
        const ground = GROUND[mapId] || 'earth';
        const s = { earth: ['lowpass', 560, 0.10, 0.052], stone: ['highpass', 1350, 0.045, 0.017], wood: ['bandpass', 340, 0.075, 0.061] }[ground];
        burst(out, s[0], s[1], 0.7, 0.006, s[2], s[3] * 2.2);
        if (ground === 'wood') knock(out, 135 + Math.random() * 25, 0.065, s[3] * 0.25);
        return true;
      },
    };
  }
  window.Footsteps = { make };
})();
