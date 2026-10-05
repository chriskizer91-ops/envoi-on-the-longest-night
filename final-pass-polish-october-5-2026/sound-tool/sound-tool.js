// sound-tool.js: Envoi Sound Check (the final polish pass, October 5, 2026, at Chris's word: "a tool that is all of the
// sound files that get used in the game ... they have to be in the tool in the way that they'll be in the game"). Every
// sound the game plays, through the game's own sound code (src/: the library, the footsteps, Chris's songs, the battle's
// sound, and the two cutscenes' own), the way the game plays it:
//   - a place is played as the game plays it: its sounds each now and then on the game's own timer (game.js, the 500 ms
//     tick), with its music, for a minute, so the wind is heard as it blows in the game, not as one button press;
//   - footsteps come one per painted footfall as Io walks, at her pace, breaking into a run after a moment (field.js);
//   - a fight's sounds come in the order and with the gaps its moves give them (screen.js), the sting before it, its theme;
//   - each cutscene's soundtrack plays its cues at their times (each cutscene's scene.js and player.js).
// Where the code shows a sound broken, a "Fixed" button plays it with the fix that waits on Chris's word (the switches
// ThareiaAudio.fix, Footsteps.fix and the battle's fix, off in the game), beside the game's own.
// Chris marks each Keep, Fix or Drop with a note (kept on his device), and Copy my notes gives them back as text.
(function () {
  'use strict';
  const AUD = window.ThareiaAudio, G = window.GAME_SOUND, $ = (id) => document.getElementById(id);
  function el(tag, cls, parent, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); if (text !== undefined) e.textContent = text; return e; }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), mmss = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const name = (id) => G.NAMES[id] || id;
  const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  // ---------- the game's three volumes (Settings: Off, Soft, Normal, Loud) ----------
  const LEVELS = [['Off', 0], ['Soft', 0.4], ['Normal', 0.75], ['Loud', 1]];
  const vol = { music: 0.75, sfx: 0.75, amb: 0.75 };

  // ---------- the engines, started by the first tap (browsers only make sound after one) ----------
  let on = false, SND = null, songs = null, feet = null;
  function start() {
    if (on) return true;
    try {
      AUD.sfxInit(); SND = window.makeBattleSound(); SND.init();
      songs = window.Songs.create({ src: (p) => p, ctx: () => AUD.sfxContext() });
      feet = window.Footsteps.make(() => AUD.sfxContext());
      on = true; applyVol();
    } catch (e) { $('nowText').textContent = 'This browser can’t make the game’s sound: ' + e.message; return false; }
    $('start').hidden = true; $('now').hidden = false;
    return true;
  }
  function applyVol() {
    if (!on) return;
    AUD.setVolume(vol.music, vol.sfx, vol.amb); SND.setVolumes(vol.music, vol.sfx); songs.setVolume(vol.music);
    SND.setMuted(!vol.music && !vol.sfx); SND.setMusicOff(!vol.music);
    if (seam) seam.volume = seamLevel();
  }

  // ---------- the fixes, on only while a "Fixed" button plays (the game keeps them off until Chris says yes) ----------
  function fixes(v) { AUD.fix.noise = v; window.Footsteps.fix.run = v; window.Footsteps.fix.stone = v; if (SND) SND.fix.noise = v; }
  const withFix = (fixed, fn) => { fixes(!!fixed); try { return fn(); } finally { fixes(false); } };

  // ---------- the game's own ways to sound (game.js: sfx, amb, music; each off at Off) ----------
  const sfx = (id, gain) => { if (vol.sfx) AUD.playSfx(id, undefined, gain); };
  const amb = (id, gain) => { if (vol.amb) AUD.playSfx(id, undefined, gain, 'amb'); };
  const SONG = { town: 'town', travel: 'wilds' }; // game.js: the music ids Chris's songs play for
  function music(id) {
    if (!vol.music) return;
    if (id && SONG[id]) { AUD.musicStop(0.6); songs.play(SONG[id]); } else { songs.stop(0.6); if (id) AUD.musicPlay(id); }
  }
  const B = () => SND.sfx; // the battle's effects

  // ---------- what's playing: one thing at a time, and a way to stop it ----------
  let timers = [], stoppers = [], nowT = null, seam = null;
  const after = (sec, fn) => { const id = setTimeout(() => { timers = timers.filter((x) => x !== id); fn(); }, sec * 1000); timers.push(id); };
  function stopAll(soft) {
    for (const id of timers) clearTimeout(id); timers = [];
    for (const f of stoppers.splice(0)) { try { f(); } catch (e) { /* gone */ } }
    if (on) { AUD.musicStop(soft ? 0.6 : 0.3); songs.stop(soft ? 0.6 : 0.3); SND.stopMusic(0.3); }
    if (seam) { seam.pause(); seam = null; }
    for (const b of document.querySelectorAll('.plays button.on')) b.classList.remove('on');
    setNow(null);
  }
  function setNow(text, secs, btn) {
    nowT = text ? { text, t0: performance.now(), secs, extra: '' } : null;
    if (btn) btn.classList.add('on');
    showNow();
  }
  function showNow() {
    const n = $('nowText');
    if (!nowT) { n.textContent = on ? 'Nothing playing' : ''; return; }
    const s = (performance.now() - nowT.t0) / 1000;
    n.textContent = nowT.text + ' · ' + mmss(s) + (nowT.secs ? ' of ' + mmss(nowT.secs) : '') + (nowT.extra ? ' · ' + nowT.extra : '');
  }
  setInterval(showNow, 250);
  // a button's play: the tap starts the sound if it isn't yet, stops what was playing, plays, and shows what plays
  function play(btn, label, secs, fn) {
    if (!start()) return;
    stopAll();
    setNow(label, secs, btn);
    fn();
    if (secs) after(secs + 0.3, () => stopAll(true));
  }

  // ---------- Io walking (field.js): one footstep each time her painted walk reaches frame 0 or 3 of its six ----------
  // She eases up to her pace (1.7 of her heights a second: game.js) in about a tenth of a second, and after 0.8 s of
  // walking without stopping breaks into a run, half as fast again by 1.6 s; she stops a little quicker than she starts
  const H = 52, PACE = 1.7, RUN = 0.5;
  function walk(kind, mapId, fixed, pattern, totalSecs) {
    let last = performance.now(), v = 0, run = 0, w = 0, raf = 0, t = 0;
    const moving = (time) => (pattern === 'loop' ? time % 9 < 6 : time < (pattern || 8));
    const frame = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; t += dt;
      const go = moving(t) && (!totalSecs || t < totalSecs);
      const top = go ? PACE * H * (1 + RUN * clamp((run - 0.8) / 0.8, 0, 1)) : 0;
      v += (top - v) * (1 - Math.exp(-dt / ((go ? 0.12 : 0.10) / 3))); if (!go && v < 2) v = 0;
      const moved = v * dt;
      if (moved > 0.02) {
        run += dt;
        const f0 = Math.floor(w * 6.4) % 6; w += moved / H; const f1 = Math.floor(w * 6.4) % 6;
        if (f1 !== f0 && (f1 === 0 || f1 === 3) && vol.sfx) withFix(fixed, () => feet.play(kind, mapId, vol.sfx));
      } else run = 0;
      if (nowT) nowT.extra = !go ? 'Io stands' : run > 1.6 ? 'Io runs' : run > 0.8 ? 'Io breaks into a run' : 'Io walks';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    stoppers.push(() => cancelAnimationFrame(raf));
  }

  // ---------- a place as the game plays it (game.js): each of its sounds now and then, on a 500 ms tick ----------
  // The first time, a sound comes within its shortest gap; then again after a gap between its shortest and its longest
  const placeOpts = { music: true, steps: false };
  function place(mapId, fixed, logEl) {
    const rows = G.AMBIENCE[mapId] || [], next = {}, t0 = performance.now() / 1000;
    if (placeOpts.music) music(G.MUSIC[mapId]);
    if (placeOpts.steps) walk('soft', mapId, fixed, 'loop');
    if (logEl) logEl.textContent = '';
    const tick = () => {
      const now = performance.now() / 1000;
      for (const [snd, a, b, v] of rows) {
        if (next[snd] == null) next[snd] = now + a * Math.random();
        else if (now >= next[snd]) {
          next[snd] = now + a + Math.random() * (b - a);
          withFix(fixed, () => amb(snd, v));
          if (logEl) logEl.textContent = (logEl.textContent ? logEl.textContent + ' · ' : 'Heard: ') + mmss(now - t0) + ' ' + SOUND_NAME[snd];
        }
      }
    };
    const iv = setInterval(tick, 500); tick();
    stoppers.push(() => clearInterval(iv));
  }

  // ---------- the game's sounds, named in plain words ----------
  const SOUND_NAME = {
    crickets: 'crickets', owl: 'an owl', clock: 'the clock', dog: 'a dog', river: 'the river', 'rope-creak': 'ropes creaking',
    leaves: 'leaves', frog: 'frogs', 'cave-drip': 'dripping', bats: 'bats', anvil: 'the anvil', campfire: 'a campfire',
    'vein-pulse': 'the node’s pulse', wind: 'wind', 'hammer-wood': 'hammering', sea: 'the sea and gulls', blizzard: 'a blizzard', bell: 'a bell',
  };
  const MUSIC_NAME = { title: 'Thareia (the made-up main theme)', town: 'your song Moonlit Forest Path', travel: 'your song Herbal Decay', marsh: 'Gloomfen Drift (made-up)', ruins: 'Beneath the Stone (made-up)' };
  // the sounds made of noise that the game cuts short (the library's 2 s of noise, started up to 1.5 s in, never looped)
  const CUT = { wind: 1, river: 1, leaves: 1, blizzard: 1, sea: 1, campfire: 1, bats: 1 };
  const CUT_WHY = 'the noise it’s made from runs out (it is 2 s long, starts up to 1.5 s in, and doesn’t loop), so it stops dead at a random moment between half a second and two seconds, whatever its length is meant to be. Fixed: it lasts as long as it’s written.';
  const placesOf = (snd) => Object.keys(G.AMBIENCE).filter((m) => G.AMBIENCE[m].some((r) => r[0] === snd));
  const gainOn = (snd, m) => G.AMBIENCE[m].find((r) => r[0] === snd)[3];

  // ---------- the list ----------
  // a card: { id (for the notes), title, where, wrong (what the code shows wrong, plain words), plays: [[label, secs,
  // fn(btn, card), fixed?]] }
  const GROUPS = [];
  const group = (title, note, cards, opts) => GROUPS.push({ title, note, cards, opts });

  // 1. footsteps
  const STEP_ROUND = 'Once Io breaks into a run (after about a second of walking), her steps come every 0.18 s, but the game drops any step that comes sooner than 0.19 s after the last one, so about every other running step is silent, unevenly. Fixed: no step is dropped.';
  const stepCard = (id, title, kind, map, where, extra) => ({
    id, title, where,
    wrong: (extra ? extra + ' ' : '') + STEP_ROUND,
    plays: [['Io walks 8 s, as in the game', 8, () => walk(kind, map, false, 8)], ['Fixed', 8, () => walk(kind, map, true, 8), true]],
  });
  group('Io’s footsteps', 'Footsteps are one of the four ideas on the try page: they’re on in your file (Soft steps), and Settings → Footsteps turns them off or to the cloak. One step sounds each time one of her painted feet lands, as below; walking, she breaks into a run after a moment, as in the game.', [
    stepCard('steps-earth', 'Soft steps on earth', 'soft', 'cottage', 'Io’s cottage, the Thornwood, the frozen pass, and all eight wilderness scenes (the snowy ones too: the cold moor, the frozen camp and Frostmere’s shore get this soft thud)'),
    stepCard('steps-stone', 'Soft steps on stone', 'soft', 'wickhollow', 'Wickhollow, Dawnroost and its living node, the northern crossroads, Misthollow and the dead Moonwell', 'Barely heard: a faint tick, about a third as loud as a step on earth. Fixed: two and a half times as loud.'),
    stepCard('steps-wood', 'Soft steps on wood', 'soft', 'jetty', 'The jetty, Bogmire, the fen’s dark heart and the shipyard'),
    stepCard('steps-cloak', 'The cloak’s swish (instead of steps)', 'cloak', 'cottage', 'Any map, with Settings → Footsteps on Cloak’s swish'),
  ]);

  // 2. the places, played as the game plays them
  const placeCards = Object.keys(G.AMBIENCE).map((m) => {
    const rows = G.AMBIENCE[m], cut = rows.map((r) => r[0]).filter((s) => CUT[s]);
    const card = {
      id: 'place-' + m, title: name(m),
      where: 'Its sounds: ' + list(rows.map(([s, a, b]) => SOUND_NAME[s] + ' (every ' + a + ' to ' + b + ' s)')) + '. Its music: ' + (MUSIC_NAME[G.MUSIC[m]] || G.MUSIC[m]) + '.',
      wrong: cut.length ? 'Its ' + list(cut.map((s) => SOUND_NAME[s])) + ' stop' + (cut.length > 1 ? '' : 's') + ' dead after half a second to two seconds: ' + CUT_WHY : '',
      log: true,
      plays: [['One minute here, as in the game', 60, (btn, c) => place(m, false, c.logEl)]],
    };
    if (cut.length) card.plays.push(['Fixed', 60, (btn, c) => place(m, true, c.logEl), true]);
    return card;
  });
  group('The places, as you walk them', 'Each place’s sounds come one at a time, now and then, never as a steady background: that is how the game plays them (each its own gap, picked at random each time). A minute here is a minute walking there. The line under each place names every sound as it plays.', placeCards, { place: true });

  // 3. each of the places' sounds on its own
  const ambCards = Object.keys(SOUND_NAME).filter((s) => placesOf(s).length).map((s) => {
    const at = placesOf(s), m = at.slice().sort((x, y) => gainOn(s, y) - gainOn(s, x))[0], v = gainOn(s, m);
    const card = {
      id: 'amb-' + s, title: SOUND_NAME[s][0].toUpperCase() + SOUND_NAME[s].slice(1),
      where: list(at.map(name)) + '. Played here as loud as at ' + name(m) + ', the loudest it is.',
      wrong: CUT[s] ? 'Made to last about 3 s, but ' + CUT_WHY : s === 'rope-creak' ? 'A buzzy sawtooth at the library’s strongest boost (16 times): it may sound harsh.' : s === 'crickets' ? 'A 3-second swell, then silence until the next: there’s no steady chirring under it.' : '',
      plays: [['Once, as the game plays it', 4, () => amb(s, v)]],
    };
    if (CUT[s]) card.plays.push(['Fixed', 4, () => withFix(true, () => amb(s, v)), true]);
    return card;
  });
  group('The places’ sounds, one at a time', 'Each of the sounds above on its own, played once, exactly as the game plays it there.', ambCards);

  // 4. what happens on the maps
  const once = (id, title, where, wrong, secs) => ({ id: 'sfx-' + id, title, where, wrong: wrong || '', plays: [['Play, as in the game', secs || 3, () => sfx(id)]] });
  group('Things that happen on the maps', null, [
    once('door', 'A door', 'Each time Io walks off one map onto another (one of the four ideas: on in your file, with no setting to turn it off), as the screen fades'),
    once('hearthfire', 'Resting', 'Resting at a camp’s fire or a Moonwell, under the fade to black', '', 3),
    once('chest', 'A well’s gift', 'A well’s letter leaves Io a herb she can carry'),
    once('coins', 'Shards', 'A well leaves shards, or a herb she can’t carry is traded for them'),
    once('node-wake', 'A node relit', 'Sol relights an Ember Line node', '', 4),
    once('secret', 'A keepsake found', 'Io kneels for a keepsake; a townsperson’s gift; the gifts after the first Bramble Colossus'),
  ]);

  // 5. the Magpie
  group('The Magpie', null, [
    { id: 'ship-takeoff', title: 'Taking off', where: 'Each flight begins, as her music (Sunstone Wind) starts', wrong: 'The rush of air in it is cut short, as the wind is: ' + CUT_WHY,
      plays: [['As in the game, with the flight’s music', 20, () => { music('flight'); sfx('ship-takeoff'); }], ['Fixed', 20, () => { music('flight'); withFix(true, () => sfx('ship-takeoff')); }, true]] },
    once('ship-land', 'Landing', 'When you press Land here, or Land where we took off', 'It plays when you press the button, not when she touches down: from far away, the bump comes well before the landing.', 3),
    { id: 'mist-wind', title: 'The cold mist turns her back', where: 'Flying into mist she can’t cross yet, at most once every 3 s', wrong: 'About four times as loud as the wind on the maps, and on the Effects volume instead of Surroundings; and cut short like it. Fixed: as loud as the maps’ wind, on Surroundings, and not cut short.',
      plays: [['Play, as in the game', 3, () => sfx('wind')], ['Fixed', 4, () => withFix(true, () => amb('wind', 0.3)), true]] },
    once('upgrade', 'An upgrade fitted', 'Paying for a Magpie upgrade in Bogmire, Dawnroost or the shipyard'),
  ]);

  // 6. menus and shops
  group('Menus and shops', 'Talking, opening the menu, choices, the title’s buttons and the keepsake cards make no sound.', [
    once('ui-save', 'Saving', 'The menu’s Save, and saving in a slot'),
    once('ui-confirm', 'A change made', 'A change on the Items page; picking an Effects level in Settings (its preview)'),
    once('heal', 'A herb used', 'Using a herb from the menu; healing outside a fight'),
    once('ui-buy', 'Buying', 'Buy, and Buy 10, in the herb shops'),
    { id: 'amb-preview', title: 'The Surroundings preview', where: 'Picking a Surroundings level in Settings', wrong: 'Crickets at 0.5, louder than they ever play on a map (0.18 to 0.3), so it doesn’t show how the places will sound.',
      plays: [['Play, as in the game', 4, () => amb('crickets', 0.5)]] },
  ]);

  // 7. the battles
  const blow = (big) => { B().swish(); after(0.04, () => B().hit(big ? 1.2 : 0.9)); };
  function fight(fanfare, fixed) {
    // as the game begins a fight: the map's music fades, the sting, the battle screen (the foes appear with a shriek),
    // "The foes attack!" and the theme; a few blows each way; the last foe falls, the theme fades, the win
    withFix(fixed, () => sfx('boss'));
    after(0.85, () => withFix(fixed, () => B().shriek(1.0)));
    after(2.6, () => SND.startMusic());
    after(5, () => blow(false)); after(5.6, () => blow(false));
    after(8.5, () => { B().shriek(0.6); after(0.3, () => B().swish()); after(0.5, () => B().hit(1.1)); });
    after(12, () => { B().fire(); after(0.5, () => B().boom(0.8)); });
    after(15.5, () => { B().shriek(0.5); after(0.3, () => B().fire()); [0.6, 0.85, 1.1].forEach((d) => after(d, () => B().hit(0.7))); });
    after(19, () => blow(true));
    after(21, () => { blow(true); after(0.1, () => B().shriek(0.9)); after(0.4, () => { B().boom(0.9); SND.stopMusic(1.2); }); after(1.8, () => (fanfare ? B().fanfare() : B().victory())); });
  }
  const fx = (id, title, where, fn, wrong, fixedFn) => ({ id: 'b-' + id, title, where, wrong: wrong || '', plays: [['Play, as in the game', 3, fn]].concat(fixedFn ? [['Fixed', 3, fixedFn, true]] : []) });
  const ECLIPSE_WRONG = 'Its swell is cut dead at 1 to 1.5 s, before it peaks: the battle’s noise is 1.5 s long, starts up to half a second in, and doesn’t loop. Fixed: it swells and fades over its 2.4 s.';
  group('Battles', 'In a fight, the gaps between a move’s sounds follow its animation: here they are close to the game’s, from its timing. Sounds marked “together” really do play at the same instant in the game.', [
    { id: 'b-fight', title: 'A fight, from the start to the win', where: 'Every fight but the story’s set ones (those end on the longer fanfare, the second button)', wrong: 'The sting’s crash before the fight is cut short, as the wind is (Fixed plays it whole).',
      plays: [['A wild fight (24 s)', 24, () => fight(false)], ['A set fight (27 s)', 27, () => fight(true)], ['Fixed', 24, () => fight(false, true), true]] },
    { id: 'b-theme', title: 'The battle theme', where: 'Every fight, from “The foes attack!”', wrong: 'One 7-second loop of four bars for the whole fight, starting at full volume with no fade-in.', plays: [['Play 30 s', 30, () => SND.startMusic()]] },
    fx('sting', 'The sting before every fight', 'As the screen swirls into a fight', () => sfx('boss'), 'Its crash is cut short, as the wind is.', () => withFix(true, () => sfx('boss'))),
    fx('blow', 'A sword blow', 'Attack, Flare Cut, Sunder, Ember Rush, Solar Crest, Daybreak, High Noon (each blow)', () => blow(false)),
    fx('bigblow', 'A big blow', 'The same, landing hard', () => blow(true)),
    fx('flame', 'Io’s Flame', 'Io’s Flame spell', () => { B().fire(); after(0.5, () => B().boom(0.8)); }),
    fx('moonlight', 'Io’s Moonlight', 'Io’s Trance attack: the moon, then each of its strikes', () => { B().moon(); [1.0, 1.5, 2.0].forEach((d) => after(d, () => B().boom(1.1))); }),
    fx('crescent', 'Io’s Crescent', 'A chime, a blade of moonlight, its hits', () => { B().chime(); after(0.3, () => B().blade()); [0.5, 0.7].forEach((d) => after(d, () => B().hit(0.7))); }),
    fx('briars', 'Io’s Briars', 'Fire, the briars grasping, a hit', () => { B().fire(); after(0.4, () => B().grasp()); after(0.9, () => B().hit(1.1)); }),
    fx('mend', 'Mend, Waxing Light, a herb in a fight', 'Healing in a fight', () => B().heal()),
    fx('guard', 'Defend and Guard', 'Io’s Defend, Sol’s Guard', () => B().guard()),
    fx('stoop', 'Sol’s Kestrel Stoop', 'She springs up and hangs in the air; on her next turn she dives (here 2.5 s later)', () => { B().swish(); after(2.5, () => { B().swish(); after(0.45, () => B().boom(1.2)); }); }),
    fx('trance', 'A Trance', 'A hero’s Trance: Io’s with the moon, Sol’s with fire', () => { B().trance(); B().moon(); after(1.2, () => { B().boom(0.7); B().chime(); }); }),
    fx('lunara', 'Lunara’s Moonfall', 'Lunara’s Silver Requiem: the moon, a blade, six beams, then Moonfall, two booms together', () => { B().moon(); after(0.4, () => B().blade()); for (let i = 0; i < 6; i++) after(0.8 + i * 0.15, () => B().hit(0.8)); after(1.9, () => B().eclipse()); after(3.3, () => { B().boom(1.5); B().boom(1.0); }); }, ECLIPSE_WRONG, () => withFix(true, () => { B().moon(); after(0.4, () => B().blade()); for (let i = 0; i < 6; i++) after(0.8 + i * 0.15, () => B().hit(0.8)); after(1.9, () => withFix(true, () => B().eclipse())); after(3.3, () => { B().boom(1.5); B().boom(1.0); }); })),
    fx('lastword', 'Envoi’s Last Word', 'Envoi’s strike: fire, its burns, then two booms together', () => { B().fire(); [0.3, 0.5, 0.7].forEach((d) => after(d, () => B().hit(0.8))); after(1.0, () => { B().boom(1.5); B().boom(1.0); }); }),
    fx('wraith-eclipse', 'A wraith’s Eclipse', 'The eclipse and a shriek together, then a boom', () => { B().eclipse(); B().shriek(1.4); after(1.6, () => B().boom(1.3)); }, ECLIPSE_WRONG, () => withFix(true, () => { B().eclipse(); B().shriek(1.4); after(1.6, () => B().boom(1.3)); })),
    fx('enrage', 'The Colossus’s Enrage', 'Its grasp, then the eclipse and a shriek together', () => { B().grasp(); after(0.5, () => { B().eclipse(); B().shriek(1.3); }); }, ECLIPSE_WRONG, () => withFix(true, () => { B().grasp(); after(0.5, () => withFix(true, () => { B().eclipse(); B().shriek(1.3); })); })),
    fx('charge', 'A foe gathering a charged blow', 'Any foe charging its next blow', () => B().eclipse(), ECLIPSE_WRONG, () => withFix(true, () => B().eclipse())),
    fx('falls', 'A foe falls', 'Every foe brought down', () => B().shriek(0.9)),
    fx('wisp', 'A wisp’s Flicker', 'Fire, then its hit', () => { B().fire(); after(0.4, () => B().hit(0.8)); }),
    fx('thunder', 'A storm’s thunder', 'A wild fight in a storm: lightning every few seconds, its thunder after (rain itself makes no sound)', () => { B().boom(0.5); after(4, () => B().boom(0.8)); }),
    fx('select', 'Choosing a command', 'Each command or target picked', () => B().select()),
    fx('menu', 'The arrow keys in a menu', 'A keyboard only (a phone hears only the choosing)', () => B().menu()),
    fx('chime', 'A Trance ready', 'A hero’s Trance gauge filling', () => B().chime()),
    fx('victory', 'A win', 'A wild fight won', () => B().victory()),
    fx('fanfare', 'A set fight won', 'The great wraith, Dawnroost’s node, every Bramble Colossus', () => B().fanfare()),
    fx('defeat', 'A fight lost', 'Losing a fight (fleeing is silent)', () => B().defeat()),
  ]);

  // 8. music
  const SEAM = 12;
  const seamLevel = () => clamp(seam && seam.level * vol.music / 0.75, 0, 1);
  function seamOf(id) {
    // a song's last 12 s and on round its loop, as its <audio loop> plays it in the game, at its level (songs.js)
    const S = window.Songs.SONGS[id], a = new Audio(S.file); a.loop = true; a.level = S.level; seam = a; a.volume = seamLevel();
    a.addEventListener('loadedmetadata', () => { a.currentTime = Math.max(0, a.duration - SEAM); a.play().catch(() => {}); }, { once: true });
  }
  const tune = (id, title, where, secs, wrong, fixed) => ({ id: 'm-' + id, title, where, wrong: wrong || '', plays: [['Play (' + mmss(secs) + ')', secs, () => music(id)]].concat(fixed ? [['Fixed', secs, () => { AUD.fix.noise = true; music(id); stoppers.push(() => { AUD.fix.noise = false; }); }, true]] : []) });
  group('Music', 'The made-up pieces loop for as long as you stay; your songs loop too, and carry on where they left off after a fight (the made-up pieces start again from the beginning).', [
    tune('title', 'Thareia (the made-up main theme)', 'The title, a new game’s opening, Io’s cottage, the ending', 52),
    tune('marsh', 'Gloomfen Drift (made-up)', 'Bogmire', 47),
    tune('ruins', 'Beneath the Stone (made-up)', 'The fen’s dark heart, Dawnroost’s living node, Misthollow, the dead Moonwell', 45, 'Its wind (bars 1 to 4) is all but silent: it swells too slowly for its cut-short noise. Fixed: the wind heard.', true),
    tune('flight', 'Sunstone Wind (made-up)', 'Flying the Magpie', 61, 'Its wind is all but silent, for the same reason. Fixed: the wind heard.', true),
    { id: 'm-town-song', title: 'Moonlit Forest Path (your song)', where: 'The towns: Wickhollow, the jetty, Dawnroost and the shipyard', wrong: 'At its loop (every 3:15) it jumps from a quiet ending straight back to its full start.',
      plays: [['Play (3:15)', 195, () => music('town')], ['Hear it loop', SEAM + 10, () => seamOf('town')]] },
    { id: 'm-wilds-song', title: 'Herbal Decay (your song)', where: 'The Thornwood, the crossroads, the frozen pass and all eight wilderness scenes', wrong: 'At its loop (every 3:52) it jumps from a quiet ending straight back to its start.',
      plays: [['Play (3:52)', 232, () => music('travel')], ['Hear it loop', SEAM + 10, () => seamOf('wilds')]] },
    tune('town', 'Market Day (made-up)', 'Only if your town song can’t play', 36),
    tune('travel', 'Over the Wilds (made-up)', 'Only if your wilds song can’t play', 74),
  ]);

  // 9. the cutscenes, each with its own sound engine (their source files, as the cutscenes have them)
  const csVol = (x) => Math.min(1.25, x / 0.75); // game.js csOpts: the game's volumes as the cutscenes take them
  function colossus(only) {
    // envoi-final-draft/cutscenes/colossus-first-meeting: its player.js makes the sounds, its scene.js times them. The
    // cutscene places each left or right, near or far, by where it is in the picture; here they come from the middle
    const s = window.makeFieldSounds(); s.setGroup('bramble', 0.9 * csVol(vol.sfx)); s.setGroup('night', 0.55 * csVol(vol.amb));
    s.init(); s.setWind(0.5);
    const cfx = window.cutsceneSfx(s);
    let last = performance.now(), raf = 0;
    const frame = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; s.tick(dt); raf = requestAnimationFrame(frame); };
    stoppers.push(() => { cancelAnimationFrame(raf); try { s.close(); } catch (e) { /* closed */ } });
    const when = (fn) => { const go = () => (s.ready ? fn() : after(0.2, go)); go(); };
    if (only) { when(() => only(s, cfx)); return; }
    raf = requestAnimationFrame(frame);
    const cue = (at, fn) => after(at, () => when(fn));
    // Io and Sol walk in through the frost (0 to 7.5 s), one step per footfall each
    for (let k = 0; k < 15; k++) { cue(0.3 + k * 0.5, () => cfx.play('step', { gain: 0.55 })); cue(0.55 + k * 0.5, () => cfx.play('step', { gain: 0.5 })); }
    cue(0.6, () => s.night('owl', { gain: 0.9, pan: -0.6, far: 0.8 }));
    cue(8.9, () => s.night('ice', { gain: 0.7, pan: 0.6, far: 0.8 }));
    cue(20.55, () => cfx.play('blade', { gain: 1 }));
    cue(22.4, () => cfx.play('rumble', { gain: 1 }));
    // the Colossus rises (its appear, 4.6 s, from 23.75 s): its sounds at their points through it (cast.js), and the
    // night falls quiet
    cue(23.75, () => s.setQuiet(true));
    for (const [u, id, g] of [[0, 'shoots', 0.8], [0.12, 'groan', 1], [0.42, 'step', 1], [0.45, 'step', 0.8], [0.58, 'groan', 0.7], [0.62, 'rustle', 1], [0.66, 'breath', 0.8]]) cue(23.75 + u * 4.6, () => s.bramble(id, { gain: g }));
    // it turns on its prey (alert, 1.8 s, from 33.25 s), and its heart beats while the camera is near (33 to 39 s)
    for (const [u, id, g] of [[0.04, 'creak', 0.8], [0.12, 'rustle', 0.8]]) cue(33.25 + u * 1.8, () => s.bramble(id, { gain: g }));
    for (let k = 0; k < 7; k++) cue(33.4 + k * 0.85, () => s.bramble('heart', { gain: 0.6 }));
    cue(40, () => s.setWind(0.42));
  }
  function finale(only) {
    // envoi-final-draft/cutscenes/finale-opening: its sound.js makes the beds and one-shots, its scene.js times them;
    // placed from the middle here, as above
    const m = window.makeMoonwellSounds(); m.setVolumes({ music: csVol(vol.music), effects: csVol(vol.sfx), surroundings: csVol(vol.amb) });
    m.init(); m.setWind(0.6);
    let last = performance.now(), raf = 0;
    const frame = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; m.tick(dt); raf = requestAnimationFrame(frame); };
    stoppers.push(() => { cancelAnimationFrame(raf); try { m.close(); } catch (e) { /* closed */ } });
    const when = (fn) => { const go = () => (m.ready ? fn() : after(0.2, go)); go(); };
    if (only) { when(() => only(m)); return; }
    raf = requestAnimationFrame(frame);
    const cue = (at, fn) => after(at, () => when(fn));
    cue(0, () => { m.night('wind', { gain: 1.3, secs: 2 }); m.night('hush', { gain: 0.05 }); });
    cue(14, () => m.play('flap', { pan: -0.6, far: 0.7 }));
    cue(21, () => m.night('wind', { gain: 1, secs: 4 }));
    cue(27, () => m.night('wind', { gain: 0.75, secs: 4 }));
    cue(28, () => m.night('hush', { gain: 1, secs: 4 }));
    cue(31, () => m.night('fire', { gain: 0.35, secs: 3 }));
    cue(36, () => m.night('wind', { gain: 0.55, secs: 4 }));
    cue(36.6, () => m.play('crack', { pan: 0.6, far: 0.4 }));
    cue(43.2, () => m.play('rite', {}));
    cue(43.5, () => m.night('hush', { gain: 0.55, secs: 3 }));
    cue(50, () => m.night('fire', { gain: 0.7, secs: 3 }));
    for (let k = 0; k < 22; k++) cue(50 + k * 0.5, () => m.play('step', { gain: 0.55 }));
    cue(54.1, () => m.play('blade', {}));
    cue(58.35, () => m.play('vow', {}));
    cue(64.6, () => m.night('bell', { far: 0.8 }));
    cue(65, () => m.night('wind', { gain: 0.6, secs: 4 }));
  }
  const csOne = (id, title, where, fn, wrong) => ({ id: 'cs-' + id, title, where, wrong: wrong || '', plays: [['Play', 8, () => fn()]] });
  const POS = 'The cutscene sets each sound left or right, near or far, by where it is in the picture; here they come from the middle. Everything else is as it plays.';
  group('Cutscenes', 'Each cutscene makes its own sounds, with its own engine: these play them through it. ' + POS, [
    { id: 'cs-colossus', title: 'The Colossus, first met: its whole soundtrack', where: 'Before the first wild fight with a Bramble Colossus (band 4), or Settings → Watch again', plays: [['Play (0:45)', 45, () => colossus()]] },
    csOne('colossus-wind', 'Wind in the spruce (its bed)', 'Under all of the Colossus’s cutscene', () => colossus(() => {})),
    csOne('colossus-owl', 'An eagle owl', 'The Colossus’s cutscene, at its start', () => colossus((s) => s.night('owl', { gain: 0.9 }))),
    csOne('colossus-ice', 'The lake ice', 'The Colossus’s cutscene', () => colossus((s) => s.night('ice', { gain: 0.7 }))),
    csOne('colossus-night', 'The night’s other calls: a tawny owl, redwings, the trees in the frost, wolves', 'Now and then, at random, until the Colossus rises', () => colossus((s) => { s.night('tawny', { gain: 0.8 }); after(2.2, () => s.night('redwings', { gain: 0.8 })); after(4, () => s.night('trees', { gain: 0.8 })); after(5.2, () => s.night('wolves', { gain: 0.8 })); })),
    csOne('colossus-rise', 'The Colossus rising: shoots, groans, its legs, its leaves, its breath', 'As it rises out of the snow', () => colossus((s) => { for (const [u, id, g] of [[0, 'shoots', 0.8], [0.12, 'groan', 1], [0.42, 'step', 1], [0.45, 'step', 0.8], [0.58, 'groan', 0.7], [0.62, 'rustle', 1], [0.66, 'breath', 0.8]]) after(u * 4.6, () => s.bramble(id, { gain: g })); })),
    csOne('colossus-alert', 'It turns on its prey: a creak, its leaves', 'As it turns on Io and Sol', () => colossus((s) => { s.bramble('creak', { gain: 0.8 }); after(0.15, () => s.bramble('rustle', { gain: 0.8 })); })),
    csOne('colossus-heart', 'Its heartbeat', 'Heard only while the camera is near it', () => colossus((s) => { for (let k = 0; k < 5; k++) after(k * 0.85, () => s.bramble('heart', { gain: 0.6 })); })),
    csOne('colossus-steps', 'Footsteps in the frost', 'Io and Sol walking in', () => colossus((s, f) => { for (let k = 0; k < 8; k++) after(k * 0.5, () => f.play('step', { gain: 0.55 })); })),
    csOne('colossus-blade', 'Sol’s blade lighting', 'Sol draws her blade', () => colossus((s, f) => f.play('blade', { gain: 1 }))),
    csOne('colossus-rumble', 'The ground rumbling', 'Before the ground splits', () => colossus((s, f) => f.play('rumble', { gain: 1 }))),
    { id: 'cs-finale', title: 'The finale’s opening: its whole soundtrack', where: 'Before the finale’s first try, or Settings → Watch again', wrong: 'The braziers’ fire is silent all through it: its level is set to nothing, though the scene turns it up twice and its notes say it’s heard near them.', plays: [['Play (1:12)', 72, () => finale()]] },
    csOne('finale-wind', 'Wind over the peaks, the well’s hush, the drone (its beds)', 'Under all of the finale’s opening', () => finale((m) => { m.night('wind', { gain: 1.2, secs: 1 }); m.night('hush', { gain: 1, secs: 1 }); })),
    csOne('finale-crack', 'Frost cracking', 'Now and then, and as the scene turns', () => finale((m) => { m.play('crack', {}); after(2.5, () => m.play('crack', {})); })),
    csOne('finale-flap', 'A banner snapping', 'Now and then, in the gusts', () => finale((m) => { m.play('flap', {}); after(2.5, () => m.play('flap', {})); })),
    csOne('finale-steps', 'Footsteps on frosted stone', 'Io and Sol walking up to the court', () => finale((m) => { for (let k = 0; k < 8; k++) after(k * 0.5, () => m.play('step', { gain: 0.55 })); })),
    csOne('finale-blade', 'Sol’s blade', 'Sol draws her blade', () => finale((m) => m.play('blade', {}))),
    csOne('finale-vow', 'Halcyon’s vow', 'Halcyon turns her blade and takes her stance', () => finale((m) => m.play('vow', {}))),
    csOne('finale-rite', 'Noctara’s rite', 'Noctara opens her arms to the eclipse', () => finale((m) => m.play('rite', {}))),
    csOne('finale-bell', 'The great bell', 'Far down in Misthollow, as the longest night begins', () => finale((m) => m.night('bell', {})), ''),
  ]);

  // ---------- Chris's marks, kept on his device ----------
  const KEY = 'envoi.soundcheck.v1';
  let marks = {};
  try { marks = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { marks = {}; }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (e) { /* not kept */ } };
  const ALL = GROUPS.flatMap((g) => g.cards.map((c) => Object.assign(c, { group: g.title })));
  function tally() {
    const n = ALL.filter((c) => marks[c.id] && marks[c.id].v).length;
    $('count').textContent = n + ' of ' + ALL.length + ' sounds marked';
    for (const g of GROUPS) if (g.tallyEl) g.tallyEl.textContent = g.cards.filter((c) => marks[c.id] && marks[c.id].v).length + ' of ' + g.cards.length;
  }

  // ---------- drawing the page ----------
  const vols = $('vols');
  for (const [k, label] of [['music', 'Music'], ['sfx', 'Effects'], ['amb', 'Surroundings']]) {
    const row = el('div', 'vol', vols); el('b', null, row, label);
    const btns = LEVELS.map(([t, v]) => { const b = el('button', null, row, t); b.type = 'button'; b.addEventListener('click', () => { vol[k] = v; for (const x of btns) x.setAttribute('aria-pressed', String(x === b)); applyVol(); }); b.setAttribute('aria-pressed', String(v === vol[k])); return b; });
  }
  const main = $('list');
  for (const g of GROUPS) {
    const d = el('details', 'group', main); const sm = el('summary', null, d); el('h2', null, sm, g.title); g.tallyEl = el('span', 'tally', sm);
    if (g.note) el('p', 'gnote', d, g.note);
    if (g.opts && g.opts.place) {
      const o = el('div', 'opts', d);
      for (const [k, t] of [['music', 'with its music'], ['steps', 'with Io walking (6 s walking, 3 s standing)']]) {
        const lab = el('label', null, o), cb = el('input', null, lab); cb.type = 'checkbox'; cb.checked = placeOpts[k]; el('span', null, lab, t);
        cb.addEventListener('change', () => { placeOpts[k] = cb.checked; });
      }
    }
    for (const c of g.cards) {
      const card = el('div', 'card', d); c.cardEl = card;
      el('h3', null, card, c.title);
      if (c.where) el('p', 'where', card, c.where);
      if (c.wrong) { const w = el('p', 'wrong', card); el('b', null, w, 'What’s wrong: '); w.appendChild(document.createTextNode(c.wrong)); }
      const plays = el('div', 'plays', card);
      for (const [label, secs, fn, fixed] of c.plays) {
        const b = el('button', fixed ? 'fixed' : null, plays, '▶ ' + label); b.type = 'button';
        b.addEventListener('click', () => play(b, c.title + (fixed ? ' (fixed)' : ''), secs, () => fn(b, c)));
      }
      if (c.log) c.logEl = el('p', 'log', card);
      const j = el('div', 'judge', card), mk = marks[c.id] || {};
      const vb = [['keep', 'Keep'], ['fix', 'Fix'], ['drop', 'Drop']].map(([v, t]) => { const b = el('button', null, j, t); b.type = 'button'; b.dataset.v = v; b.setAttribute('aria-pressed', String(mk.v === v)); return b; });
      const note = el('input', null, j); note.type = 'text'; note.placeholder = 'A note (what’s wrong, what you’d like)'; note.value = mk.note || '';
      const paint = () => { const m = marks[c.id] || {}; card.classList.toggle('marked-keep', m.v === 'keep'); card.classList.toggle('marked-fix', m.v === 'fix'); card.classList.toggle('marked-drop', m.v === 'drop'); for (const b of vb) b.setAttribute('aria-pressed', String(m.v === b.dataset.v)); };
      for (const b of vb) b.addEventListener('click', () => { const m = marks[c.id] || (marks[c.id] = {}); m.v = m.v === b.dataset.v ? '' : b.dataset.v; keep(); paint(); tally(); });
      note.addEventListener('input', () => { (marks[c.id] || (marks[c.id] = {})).note = note.value; keep(); });
      paint();
    }
  }
  tally();
  $('start').addEventListener('click', () => { start(); showNow(); });
  $('stopAll').addEventListener('click', () => stopAll(true));

  // ---------- Copy my notes: every sound he marked or wrote about, as text to paste to Claude ----------
  $('copy').addEventListener('click', async () => {
    const lines = ['Envoi Sound Check, my notes (' + new Date().toLocaleDateString() + '):'];
    for (const g of GROUPS) {
      const got = g.cards.filter((c) => marks[c.id] && (marks[c.id].v || (marks[c.id].note || '').trim()));
      if (!got.length) continue;
      lines.push('', g.title + ':');
      for (const c of got) { const m = marks[c.id]; lines.push('- ' + c.title + ' [' + c.id + ']: ' + (m.v ? m.v[0].toUpperCase() + m.v.slice(1) : 'no mark') + ((m.note || '').trim() ? ': ' + m.note.trim() : '')); }
    }
    if (lines.length === 1) lines.push('(nothing marked yet)');
    const text = lines.join('\n'), box = $('copyBox'), said = $('copied');
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { /* select it by hand below */ }
    box.value = text; box.hidden = false; if (!ok) { box.focus(); box.select(); }
    said.hidden = false; said.textContent = ok ? 'Copied. Paste it to Claude.' : 'Copy the text below (select it all), then paste it to Claude.';
  });
  // test hooks for the page's own check (check.mjs)
  window.__soundCheck = { groups: GROUPS, all: ALL, get on() { return on; }, stopAll, vol };
})();
