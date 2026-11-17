// song-bed.js: Chris's song "Herbal Decay" playing very quietly under everything in the game, with a volume knob
// (Chris, November 17, 2026: "this song quite under everything with a volume knob in the menu of the game but everywhere
// in the game ... very quiet in the entire game, slightly louder in battles, with your six code generated songs over it").
// Load ../music/herbal-decay.js before this file (it says where the song is). Then:
//   SongBed.place('world' | 'battle')  how loud it sits: very quiet walking about, a little louder in a fight
//   SongBed.button()                   a menu button that opens the knob (for a page's own menu row)
//   SongBed.float()                    the same knob as a small round button in the top corner (for pages with no menu)
// It starts at the player's first tap or key (phones only allow sound after a touch) and loops with no gap. The knob,
// 0 to 10 (5 is as set), is kept on this phone ('mfw.songBed') and shared by every page of the game.
(() => {
  'use strict';
  // how loud it sits at knob 5: the song is about -15 LUFS as made; walking about it plays near -36, in a fight near
  // -32, about 11 dB under the battle music made in code, so it is always beneath everything
  const LEVEL = { world: 0.085, battle: 0.135 };
  // Off unless the knob is turned up (Chris, November 17, afternoon: "I want the song in there but your six dark songs
  // work better"; his songs are to be come back to when he's ready). A new key, so an earlier setting doesn't carry over
  const KEY = 'mfw.songBed.v2';
  let ctx = null, gain = null, src = null, where = 'world', knob = 0, started = false, el = null, failed = false;
  try { const v = parseFloat(localStorage.getItem(KEY)); if (v >= 0 && v <= 10) knob = v; } catch (e) {}
  let mutedBy = null;      // a page's own Sound on/off (the battle's): when it says muted, the song is silent too
  const level = () => (mutedBy && mutedBy() ? 0 : LEVEL[where] * knob / 5);
  function bytes(file) {
    if (/^data:/.test(file)) { const s = atob(file.slice(file.indexOf(',') + 1)), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return Promise.resolve(u.buffer); }
    return fetch(file).then((r) => r.arrayBuffer());
  }
  function start() {
    if (started || !window.SONG_BED_FILE || knob <= 0) return; started = true;     // at 0 nothing is even loaded
    const AC = window.AudioContext || window.webkitAudioContext;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    if (ctx) {
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
      bytes(window.SONG_BED_FILE).then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then((buf) => {
        src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(gain); src.start();
        gain.gain.setTargetAtTime(level(), ctx.currentTime, 1.2);          // a slow fade in
      }).catch(plain);
    } else plain();
  }
  // a phone that can't decode it in Web Audio plays it as a plain audio element instead
  function plain() {
    failed = true; el = new Audio(window.SONG_BED_FILE); el.loop = true; el.volume = Math.min(1, level()); el.play().catch(() => {});
  }
  function apply(fade) {
    if (gain && ctx) gain.gain.setTargetAtTime(level(), ctx.currentTime, fade || 0.4);
    if (el) el.volume = Math.min(1, level());
  }
  function setKnob(v) { knob = Math.max(0, Math.min(10, v)); try { localStorage.setItem(KEY, String(knob)); } catch (e) {} if (!started) start(); apply(0.08); }
  const first = () => { start(); if (ctx && ctx.state === 'suspended') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, first, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!ctx) { if (el) document.hidden ? el.pause() : el.play().catch(() => {}); return; } if (document.hidden) ctx.suspend(); else if (started) ctx.resume(); });

  // the knob: a small panel with one slider, opened from a button
  let panel = null;
  function makePanel() {
    if (panel) return panel;
    const st = document.createElement('style');
    st.textContent = '.sbed-panel{position:fixed;z-index:60;left:50%;top:30%;transform:translateX(-50%);width:min(320px,88vw);padding:14px 16px;border-radius:14px;background:rgba(18,13,26,.96);border:1px solid rgba(255,255,255,.16);color:#efe8f6;font:14px "Atkinson Hyperlegible",system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)}' +
      '.sbed-panel[hidden]{display:none}.sbed-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sbed-top b{font-family:"IM Fell English",Georgia,serif;font-weight:400;font-size:18px;color:#e2bd6a}' +
      '.sbed-x{font:inherit;color:#b6a9c8;background:none;border:0;font-size:22px;line-height:1;cursor:pointer;padding:0 4px}.sbed-row{display:flex;align-items:center;gap:10px}.sbed-row input{flex:1;accent-color:#e2bd6a}.sbed-row output{width:2ch;text-align:right;font-weight:700}' +
      '.sbed-note{margin-top:8px;font-size:12px;color:#b6a9c8;line-height:1.4}.sbed-float{position:fixed;z-index:59;right:10px;top:10px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(18,13,26,.72);color:#e2bd6a;font-size:18px;cursor:pointer}';
    document.head.appendChild(st);
    panel = document.createElement('div'); panel.className = 'sbed-panel'; panel.hidden = true;
    panel.innerHTML = '<div class="sbed-top"><b>Herbal Decay</b><button class="sbed-x" aria-label="Close">&times;</button></div>' +
      '<div class="sbed-row"><span>Off</span><input type="range" min="0" max="10" step="1" aria-label="Song volume"><output></output></div>' +
      '<div class="sbed-note">Off for now: the six dark pieces carry the fights. Turn it up to hear your song quietly under everything (5 is the level it was set at).</div>';
    const r = panel.querySelector('input'), o = panel.querySelector('output');
    r.value = knob; o.textContent = knob;
    r.oninput = () => { setKnob(+r.value); o.textContent = r.value; first(); };
    panel.querySelector('.sbed-x').onclick = () => { panel.hidden = true; };
    document.body.appendChild(panel);
    return panel;
  }
  function toggle() { makePanel(); panel.hidden = !panel.hidden; first(); }
  window.SongBed = {
    place(p) { if (LEVEL[p]) { where = p; apply(1.5); } },
    follow(fn) { mutedBy = fn; let was = null; setInterval(() => { const m = !!(fn && fn()); if (m !== was) { was = m; apply(0.15); } }, 250); },
    // a button for a menu row; cls is the row's own button class so it matches its neighbours
    button(cls) {
      const b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; b.id = 'songbed';
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3v10.6A4 4 0 1 0 11 17V7h6V3Z"/></svg><span>Song</span>';
      b.onclick = toggle; return b;
    },
    open() { toggle(); },
    float() { const b = document.createElement('button'); b.className = 'sbed-float'; b.setAttribute('aria-label', 'Song volume'); b.textContent = '♪'; b.onclick = toggle; document.body.appendChild(b); return b; },
    get knob() { return knob; }, set knob(v) { setKnob(v); }, get level() { return level(); }, get playing() { return !!(src || (el && !el.paused)); }, get place_() { return where; }, get failed() { return failed; },
  };
})();
