// lab.js: the Battle Music Lab page (lab.html). Three shelves: Effects and Chopped are song files (lab-data.js, made
// by make_effects.py, make_chops.py and make_data.py) played through Web Audio so they loop with no gap; Made in code is
// the battle music written in src/battle/sound.js, every part it has (new dark parts appear here by themselves).
(() => {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  const S = { ctx: null, out: null, level: 0, cur: null, bufs: {}, cards: [], tab: 0 };
  const LEVELS = [{ name: 'Game level', file: 0.3, code: 0.75 }, { name: 'Louder', file: 1, code: 1.5 }];
  let SND = null;
  const $ = (id) => document.getElementById(id);
  const mmss = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const words = (n) => { const s = n.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); return s[0].toUpperCase() + s.slice(1); };
  const CODE_NAMES = { battle: 'Battle music (in the game now)', boss: 'Boss music (in the game now)', lift: 'Trance lift (in the game now)' };
  const TABS = [
    { name: 'Effects', about: 'Carnival of Ashes, whole, through different studio effects. Each card says what was done, how it changes the feel, and where it could go in the game.' },
    { name: 'Chopped', about: 'Carnival of Ashes cut into pieces and put back together as new music. These loop with no ending.' },
    { name: 'Made in code', about: 'The battle music the helper wrote in code (what plays in the battle now), and its darker versions as they arrive.' },
  ];

  function stopAll() {
    const c = S.cur; if (!c) return; S.cur = null;
    if (c.src) { try { c.src.stop(); } catch (e) {} c.src = null; }
    if (c.code) SND.stopMusic(0.3);
    c.el.classList.remove('on'); c.el.querySelector('.ic').innerHTML = '&#9654;'; c.el.querySelector('.bar i').style.width = '0';
  }
  // the song's bytes: read straight out of the page (some phone file viewers block fetching a song that sits inside
  // the page, which left every card saying "loading"), or fetched when it is a file beside the page
  function bytes(file) {
    if (file.startsWith('data:')) {
      const b64 = file.slice(file.indexOf(',') + 1), s = atob(b64), u = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      return Promise.resolve(u.buffer);
    }
    return fetch(file).then((r) => r.arrayBuffer());
  }
  async function buffer(file) {
    if (!S.bufs[file]) S.bufs[file] = bytes(file).then((a) => new Promise((ok, no) => S.ctx.decodeAudioData(a, ok, no)));
    S.bufs[file].catch(() => { delete S.bufs[file]; });
    return S.bufs[file];
  }
  async function play(c) {
    if (!S.ctx) return;
    if (S.cur === c) { stopAll(); return; }
    stopAll(); S.cur = c;
    c.el.classList.add('on'); c.el.querySelector('.ic').innerHTML = '&#10074;&#10074;';
    if (c.code) {
      SND.setVolumes(LEVELS[S.level].code, 1);
      setTimeout(() => { if (S.cur !== c) return; SND.startMusic(c.code === 'lift' ? 'battle' : c.code); if (c.code === 'lift') SND.lift(100000); c.t0 = S.ctx.currentTime; }, 350);
      return;
    }
    c.el.querySelector('.meta').textContent = 'loading';
    let b;
    try { b = await buffer(c.file); } catch (e) {
      // the phone couldn't decode it in Web Audio: play it as a plain audio element instead (it may gap at the loop)
      if (S.cur !== c) return;
      const a = new Audio(c.file); a.loop = true; a.volume = LEVELS[S.level].file; a.play().catch(() => {});
      c.src = { stop: () => a.pause() }; c.t0 = S.ctx.currentTime; c.len = 0; c.el.querySelector('.meta').textContent = 'playing';
      S.err = String(e && e.message || e); return;
    }
    if (S.cur !== c) return;
    c.el.querySelector('.meta').textContent = mmss(b.duration);
    const src = S.ctx.createBufferSource(); src.buffer = b; src.loop = true; src.connect(S.out); src.start(); c.src = src; c.t0 = S.ctx.currentTime; c.len = b.duration;
  }
  function card(title, meta, lines) {
    const el = document.createElement('div'); el.className = 'card'; el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.innerHTML = '<div class="top"><span class="ic">&#9654;</span><span class="nm"></span><span class="meta"></span></div>' +
      lines.filter((l) => l[1]).map(() => '<div class="line"><b></b> <span></span></div>').join('') + '<div class="bar"><i></i></div>';
    el.querySelector('.nm').textContent = title; el.querySelector('.meta').textContent = meta;
    const ls = el.querySelectorAll('.line'); lines.filter((l) => l[1]).forEach((l, i) => { ls[i].querySelector('b').textContent = l[0]; ls[i].querySelector('span').textContent = l[1]; });
    return el;
  }
  function show(i) {
    stopAll(); S.tab = i; const L = $('list'); L.innerHTML = ''; S.cards = [];
    [...$('tabs').children].forEach((b, j) => b.classList.toggle('on', j === i)); $('about').textContent = TABS[i].about;
    let items;
    if (i < 2) items = (i === 0 ? window.LAB_FX : window.LAB_CHOPS).map((r) => ({ file: r.file, el: card(r.title, mmss(r.seconds), [['Done:', r.did], ['Feel:', r.feel], ['Use:', r.use]]) }));
    else items = SND.parts.map((p) => ({ code: p.name, el: card(CODE_NAMES[p.name] || words(p.name), mmss(p.seconds), [['Feel:', p.what]]) }));
    for (const c of items) { c.el.onclick = () => play(c); L.appendChild(c.el); S.cards.push(c); }
    window.scrollTo(0, 0);
  }
  function tick() {
    const c = S.cur;
    if (c && c.t0 != null && S.ctx) { const len = c.len || (SND.parts.find((p) => p.name === c.code) || {}).seconds || 60; c.el.querySelector('.bar i').style.width = (100 * (((S.ctx.currentTime - c.t0) % len) / len)) + '%'; }
    requestAnimationFrame(tick);
  }
  TABS.forEach((t, i) => { const b = document.createElement('button'); b.className = 'tab'; b.textContent = t.name; b.onclick = () => show(i); $('tabs').appendChild(b); });
  $('lvl').onclick = () => {
    S.level = 1 - S.level; $('lvl').textContent = LEVELS[S.level].name;
    if (S.out) S.out.gain.setTargetAtTime(LEVELS[S.level].file, S.ctx.currentTime, 0.05);
    if (SND) SND.setVolumes(LEVELS[S.level].code, 1);
  };
  $('gate').onclick = () => {
    S.ctx = new AC(); S.out = S.ctx.createGain(); S.out.gain.value = LEVELS[S.level].file; S.out.connect(S.ctx.destination);
    SND = makeBattleSound({ context: S.ctx }); SND.init(); SND.setVolumes(LEVELS[S.level].code, 1);
    $('gate').classList.add('gone'); show(S.tab);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  SND = makeBattleSound(); show(0); requestAnimationFrame(tick);
  window.__lab = { S, show, play, get SND() { return SND; } };
})();
