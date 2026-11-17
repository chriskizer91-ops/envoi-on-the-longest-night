// choices.js: the Sound Choices page (choices.html). The ten most common sounds come from sound.js's `choices` list
// (each: the battle's version, then _b, _c, _d); the next ten are listed here. Picks are kept on this phone and written
// out at the bottom so Chris can copy them into the conversation.
(() => {
  'use strict';
  const SND = makeBattleSound();
  const $ = (id) => document.getElementById(id);
  // the plain name of each sound, and the moment it plays
  const PLAIN = {
    select: ['Choosing a command', 'Every time you pick something in a menu.'],
    menu: ['Moving through a menu', 'Every step up or down a menu.'],
    swing: ['A blow on its way', 'Just before a witch’s blow lands.'],
    strike: ['A blow lands', 'A witch’s blow hitting a foe (Kore’s bells, or Io’s sickle).'],
    moonBladeFly: ['Moon Blades fly', 'Io’s most-used spell: each blade of moonlight in the air.'],
    moonBladeHit: ['Moon Blades land', 'Each blade hitting its foe.'],
    wispSip: ['A wisp’s sip', 'The commonest foe’s attack: it drinks a witch’s light.'],
    wraithClaw: ['A wraith’s blow', 'A shadow wraith hitting a witch.'],
    release: ['A foe released', 'A beaten foe let go: a breath out and a moth rising.'],
    sealToll: ['A foe sealed', 'Its Fate meets its Life: Kore’s one deep bell.'],
    foesAppear: ['Foes appear', 'The start of every fight.'],
    sealBegin: ['Sealed Fate begins', 'Kore starts her Sealed Fate.'],
    fateRipple: ['Fate ripples out', 'An ended foe’s end runs out to the others.'],
    chainLash: ['Kore’s chain', 'The chain of her flail whipping through.'],
    jesterJab: ['Kore’s taunt', 'Her mocking jab.'],
    wispCling: ['A wisp clings', 'A wisp latching on to a witch.'],
    wispWail: ['A wisp wails', 'A wisp’s cry.'],
    soulHome: ['A soul goes home', 'When the last foe is released.'],
    victory: ['Victory', 'A fight won.'],
    tranceReady: ['Trance ready', 'A witch’s Trance gauge is full.'],
  };
  const NEXT = ['foesAppear', 'sealBegin', 'fateRipple', 'chainLash', 'jesterJab', 'wispCling', 'wispWail', 'soulHome', 'victory', 'tranceReady'];
  const cat = Object.fromEntries(SND.catalog.map((c) => [c.name, c]));
  const TOP = (SND.choices || []).map((c) => c);
  let pick = {}, verdict = {};
  try { pick = JSON.parse(localStorage.getItem('mfw.soundPicks') || '{}'); verdict = JSON.parse(localStorage.getItem('mfw.soundVerdicts') || '{}'); } catch (e) {}
  const keep = () => { try { localStorage.setItem('mfw.soundPicks', JSON.stringify(pick)); localStorage.setItem('mfw.soundVerdicts', JSON.stringify(verdict)); } catch (e) {} };
  let started = false, tab = 0;
  // a sound's demo: its own example arguments (strike: Kore's blow, as the battle mostly hears it)
  // a sound with several takes (strike: Kore's and Io's) plays the next take each time the same letter is tapped again
  const turn = {};
  function hear(name, again) {
    if (!started) return ''; const c = cat[name]; if (!c) return '';
    if (!c.takes) { SND.sfx[name](...(c.demo || [])); return ''; }
    const ks = Object.keys(c.takes); turn[name] = again ? ((turn[name] || 0) + 1) % ks.length : 0;
    const k = ks[turn[name]]; SND.sfx[name](...c.takes[k]); return k;
  }
  function summary() {
    const L = ['My sound picks:'];
    for (const c of TOP) L.push('  ' + PLAIN[c.name][0] + ': ' + 'ABCD'[Math.max(0, c.options.indexOf(pick[c.name] || c.options[0]))] + (pick[c.name] ? '' : ' (not chosen yet)'));
    L.push('The next ten:');
    for (const n of NEXT) L.push('  ' + PLAIN[n][0] + ': ' + (verdict[n] || 'not heard yet'));
    $('sum').textContent = L.join('\n');
  }
  function show(i) {
    tab = i; [...$('tabs').children].forEach((b, j) => b.classList.toggle('on', j === i));
    const L = $('list'); L.innerHTML = '';
    $('about').textContent = i === 0 ? 'Each has the version in the battle now (A) and three new directions. Tap to hear; the last letter you tap is your pick.' :
      'The next ten most common, as they are now. Listen, then say whether each is fine or needs choices like the first ten.';
    if (i === 0) {
      if (!TOP.length) { L.innerHTML = '<div class="card"><div class="wh">The new versions are still being made.</div></div>'; }
      for (const c of TOP) {
        const el = document.createElement('div'); el.className = 'card';
        el.innerHTML = '<div class="nm"></div><div class="wh"></div><div class="opts"></div><div class="dir"></div>';
        el.querySelector('.nm').textContent = PLAIN[c.name][0]; el.querySelector('.wh').textContent = PLAIN[c.name][1];
        const opts = el.querySelector('.opts'), dir = el.querySelector('.dir');
        c.options.forEach((n, k) => {
          const b = document.createElement('button'); b.className = 'opt'; b.textContent = 'ABCD'[k];
          if ((pick[c.name] || null) === n) b.classList.add('on');
          b.onclick = () => {
            const take = hear(n, pick[c.name] === n); pick[c.name] = n; keep(); summary();
            opts.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === b));
            dir.textContent = (take ? 'Playing: ' + take + ' (tap ' + 'ABCD'[k] + ' again for the next). ' : '') + (k === 0 ? 'A: the one in the battle now. ' : '') + (cat[n] ? cat[n].what : '');
          };
          opts.appendChild(b);
        });
        L.appendChild(el);
      }
    } else {
      for (const n of NEXT) {
        const el = document.createElement('div'); el.className = 'card';
        el.innerHTML = '<div class="nm"></div><div class="wh"></div><button class="play">&#9654; Hear it</button><div class="verdict"><button>Fine as it is</button><button>Needs choices</button></div>';
        el.querySelector('.nm').textContent = PLAIN[n][0]; el.querySelector('.wh').textContent = PLAIN[n][1] + (cat[n] ? ' ' + cat[n].what : '');
        el.querySelector('.play').onclick = () => hear(n);
        const vb = el.querySelectorAll('.verdict button');
        vb.forEach((b) => { if (verdict[n] === b.textContent) b.classList.add('on'); b.onclick = () => { verdict[n] = b.textContent; keep(); summary(); vb.forEach((x) => x.classList.toggle('on', x === b)); }; });
        L.appendChild(el);
      }
    }
    window.scrollTo(0, 0);
  }
  [...$('tabs').children].forEach((b, i) => { b.onclick = () => show(i); });
  $('copy').onclick = () => {
    const t = $('sum').textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => { $('copy').textContent = 'Copied'; setTimeout(() => { $('copy').textContent = 'Copy my picks'; }, 1500); }, () => {});
  };
  $('gate').onclick = () => { SND.init(); started = true; $('gate').classList.add('gone'); };
  show(0); summary();
  window.__choices = { SND, show, hear, get pick() { return pick; }, get verdict() { return verdict; } };
})();
