// on-foot.js: the demo page for Io on foot (demos/io-on-foot.html): Path Polish's painted Io (src/walk/painted-io.js)
// walking the game's own ground maps, with the game's own field (src/game/field.js) and walk areas (src/game/maps.js).
// The panel picks the map, her height, how close the camera comes and her pace; shows the walk areas; tries the
// footstep sounds (none, Path Polish's soft steps, or a cloak's swish); and plays her two poses. Exits lead from map to
// map; there are no fights here. The townsfolk are still the pixel ones until their paper dolls are painted.
// Defines window.OnFoot = { start(cfg) }; cfg: { title, blurb, note, src(path) }.
(function () {
  'use strict';
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  // what each map is underfoot, for the soft steps
  const GROUND = { cottage: 'earth', wickhollow: 'stone', jetty: 'wood', thornwood: 'earth', bogmire: 'wood', 'bogmire-heart': 'wood', dawnroost: 'stone', 'dawnroost-node': 'stone', crossroads: 'stone', shipyard: 'wood', 'frozen-pass': 'earth', misthollow: 'stone', moonwell: 'stone' };

  // ---------- the footstep sounds to try ----------
  function makeSteps() {
    let ctx = null, noise = null, master = null;
    function wake() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function burst(type, freq, q, attack, dur, vol, at) {
      const t = ctx.currentTime + (at || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
      src.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + attack); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(gn).connect(master); src.start(t, Math.random() * 1.5, dur + 0.05);
    }
    function knock(freq, dur, vol) {
      const t = ctx.currentTime, o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    let lastT = 0;
    return {
      wake,
      // Path Polish's footsteps (follow-me-down-witch-way, versions/path-polish/game/src/sound.js): one short, quiet,
      // filtered breath of noise as each foot lands, its colour from the ground
      soft(ground) {
        if (!ctx || ctx.currentTime - lastT < 0.19) return; lastT = ctx.currentTime;
        const s = { earth: ['lowpass', 560, 0.10, 0.052], stone: ['highpass', 1350, 0.045, 0.017], wood: ['bandpass', 340, 0.075, 0.061] }[ground] || ['lowpass', 560, 0.10, 0.052];
        burst(s[0], s[1], 0.7, 0.006, s[2], s[3] * 2.2);
        if (ground === 'wood') knock(135 + Math.random() * 25, 0.065, s[3] * 0.25);
      },
      // her cloak: a soft swish with each step, no footfall at all
      cloak() {
        if (!ctx || ctx.currentTime - lastT < 0.19) return; lastT = ctx.currentTime;
        burst('bandpass', 1900 + Math.random() * 500, 0.9, 0.07, 0.24, 0.045);
      },
    };
  }

  function start(cfg) {
    document.title = cfg.title;
    // the map fills the screen, as in the game; the controls open over it
    const wrap = el('div', { class: 'wrap onfoot' }, document.body);
    const stage = el('main', { id: 'stage', 'aria-label': 'The map' }, wrap);
    const panel = el('section', { id: 'panel', class: 'win', 'aria-label': 'Controls', hidden: '' }, wrap);
    const tryBtn = el('button', { type: 'button', class: 'try', 'aria-expanded': 'false', 'aria-controls': 'panel' }, stage, '⚙ Try things');
    const shut = el('button', { type: 'button', class: 'shut', 'aria-label': 'Close' }, panel, '✕');
    const show = (on) => { panel.hidden = !on; tryBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    tryBtn.addEventListener('click', () => show(panel.hidden)); shut.addEventListener('click', () => show(false));
    el('h1', null, panel, cfg.title); if (cfg.blurb) el('p', { class: 'note' }, panel, cfg.blurb);
    const say = el('div', { class: 'toast win', hidden: '', role: 'status', 'aria-live': 'polite' }, stage);
    let sayT = 0;
    function note(text) { say.textContent = text; say.hidden = false; clearTimeout(sayT); sayT = setTimeout(() => { say.hidden = true; }, 2600); }

    const steps = makeSteps();
    const S = { ioH: 52, ioScreen: 0.15, pace: 1.7, showWalk: false, sound: 'off' }; // Chris's settings (October 3)
    const opts = {
      maps: MAPS, src: cfg.src, speed: 110, zoom: 0.7,
      get ioH() { return S.ioH; }, get ioScreen() { return S.ioScreen; }, get pace() { return S.pace; }, get showWalk() { return S.showWalk; },
      paintedIo: makePaintedIo(cfg.src),
      onExit: (ex) => {
        if (ex.to === 'world') { note(ex.label + ': the game goes out to the world map here.'); return; }
        go(ex.to, ex.at);
      },
      onEvent: () => {}, onEncounter: () => {}, onMenu: () => note('The game opens its menu here.'),
      onTalk: (p) => note(p.name + ' would talk here. The townsfolk are still pixels until their paper dolls are painted.'),
      onSpot: (s) => {
        if (s.kind === 'well') { field.pose('kneel', 1.8); note(s.label + ': she kneels for what was left there.'); }
        else if (s.kind === 'rest' && /Moonwell/.test(s.label)) { field.pose('cast', 2.2); note(s.label + ': she casts moonlight.'); }
        else note(s.label || 'The Magpie');
      },
      onStep: (m) => { if (S.sound === 'soft') steps.soft(GROUND[m.id] || 'stone'); else if (S.sound === 'cloak') steps.cloak(); },
    };
    const field = Field.create(stage, opts);
    const ids = Object.keys(MAPS);
    let mapId = null;
    function go(id, at, dir) { mapId = id; mapBtns.forEach((b, i) => b.setAttribute('aria-pressed', ids[i] === id ? 'true' : 'false')); return field.load(id, at, dir); }
    // any first touch or key wakes the sound
    window.addEventListener('pointerdown', steps.wake, true); window.addEventListener('keydown', steps.wake, true);

    el('h2', null, panel, 'Map');
    const mapBox = el('div', { class: 'togs', role: 'group', 'aria-label': 'Map' }, panel);
    const mapBtns = ids.map((id) => { const b = el('button', { class: 'tog', type: 'button', 'aria-pressed': 'false' }, mapBox, MAPS[id].name); b.addEventListener('click', () => go(id)); return b; });

    el('h2', null, panel, 'How she looks and moves');
    function slider(label, min, max, step, key, fmt) {
      const lab = el('label', { class: 'sl' }, panel); el('span', null, lab, label);
      const inp = el('input', { type: 'range', min, max, step, value: S[key] }, lab), out = el('output', null, lab, fmt(S[key]));
      inp.addEventListener('input', () => { S[key] = +inp.value; out.textContent = fmt(S[key]); });
    }
    slider('Height', 34, 64, 1, 'ioH', (v) => v + ' px');
    slider('Close', 0.1, 0.26, 0.01, 'ioScreen', (v) => Math.round(v * 100) + '%');
    slider('Pace', 1.2, 2.8, 0.1, 'pace', (v) => v.toFixed(1));
    const acts = el('div', { class: 'togs', style: 'margin-top:8px' }, panel);
    const kneel = el('button', { class: 'tog', type: 'button' }, acts, 'Kneel and gather');
    kneel.addEventListener('click', () => field.pose('kneel', 1.8));
    const cast = el('button', { class: 'tog', type: 'button' }, acts, 'Cast moonlight');
    cast.addEventListener('click', () => field.pose('cast', 2.2));
    const walkTog = el('button', { class: 'tog', type: 'button', 'aria-pressed': 'false' }, acts, 'Show where she can walk');
    walkTog.addEventListener('click', () => { S.showWalk = !S.showWalk; walkTog.setAttribute('aria-pressed', S.showWalk ? 'true' : 'false'); });

    el('h2', null, panel, 'Footsteps');
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Footsteps' }, panel);
    const segBtns = [['off', 'None'], ['soft', 'Soft steps'], ['cloak', 'Cloak swish']].map(([k, label]) => {
      const b = el('button', { type: 'button', 'aria-pressed': k === S.sound ? 'true' : 'false' }, seg, label);
      b.addEventListener('click', () => { steps.wake(); S.sound = k; segBtns.forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); });
      return b;
    });
    el('p', { class: 'note' }, panel, cfg.note || '');

    go('wickhollow');
    window.__onfoot = { field, S, go, P: field.P };
  }
  window.OnFoot = { start };
})();
