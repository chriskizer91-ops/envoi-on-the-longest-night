// bigbad.js: the final boss. Moon Faire's big bad ("the fire that would not end", game/models/foes/final-fire on moon-faire's
// claude/moon-faire-levelling) in Envoi's last place, the dead Moonwell at Misthollow, before Io and the Jester at their
// lightest, with two of Noctara's wraiths and two frost wisps at its side in its first form, as Moon Faire's chosen fight
// has helpers first and then it alone. Its own moves, the Jester's Sealed Fate run on into her Curtain Call (with her
// glow, src/trance.js) that brings everyone up again as it breaks open, and its ending. No rules run here: the numbers
// are only for show.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TEST = /[?&]test\b/.test(location.search);
  const panel = $('panel');
  const K = makeKit({ stage: $('stage'), paint: $('paint'), gl: $('gl'), arena: 'dead-moonwell', ui: () => panel.offsetHeight + 6, test: TEST, look: 'mf', zmax: 2.2, zoom: 1.3 });
  const { FX, SND, wait, until, untilP, shotAt, shotFit, hurt, ui, chest } = K;
  const V = () => new THREE.Vector3(), rnd = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;

  // ---------- who is here ----------
  const ioM = makeMoonIo({ weight: 'lightest' }); ioM.walkRun = true; ioM.camera = K.camera;
  const jesM = window.MF_WITCHES.jester.raw('lightest'); jesM.camera = K.camera;
  const fire = makeFinalFire({ detail: 0.5, form: 1 });
  const io = K.actor('io', ioM, { home: [-2.6, -0.8], tall: 2.0, shadow: 0.55, yawBias: -0.9, witch: true });
  const jes = K.actor('jester', jesM, { home: [-1.2, 0.2], tall: 1.9, shadow: 0.5, yawBias: -1.3, witch: true });
  const boss = K.actor('fire', fire, { home: [3.2, -11.5], tall: 8.4, shadow: 4.2, side: 'foe' });
  const helpers = [
    K.actor('w1', makeWraith({ level: 20 }), { home: [1.5, -5.2], tall: 2.3, shadow: 0.75, side: 'foe' }),
    K.actor('w2', makeWraith({ level: 20 }), { home: [5.0, -6.6], tall: 2.3, shadow: 0.75, side: 'foe' }),
    K.actor('f1', makeWisp({ level: 20 }), { home: [2.8, -3.8], tall: 1.0, shadow: 0.3, side: 'foe' }),
    K.actor('f2', makeWisp({ level: 20 }), { home: [4.6, -4.4], tall: 1.0, shadow: 0.3, side: 'foe' }),
  ];
  for (const h of helpers.slice(2)) if (h.m.state) { h.m.state.frost = 1; h.m.state.level = 20; }
  K.settle();
  boss.yaw = boss.tyaw = Math.atan2(io.pos.x - boss.pos.x, io.pos.z - boss.pos.z) * 0.6;       // turned a little toward the party
  for (const h of helpers) h.yaw = h.tyaw = Math.atan2(io.pos.x - h.pos.x, io.pos.z - h.pos.z);
  const heroes = [io, jes];
  // the glows: the Jester's purple for her Curtain Call, Io's silver-green for her trance
  const jTr = makeTrance(K.scene, jes, { color: 0xa64dff, colors: [0xb05cff, 0x7a2cff, 0xe0a8ff, 0xff6ad5, 0xffffff] });
  const iTr = makeTrance(K.scene, io, { color: 0x9fe8c0, colors: [0xbfffe0, 0x9fe8c0, 0xe8f0ff, 0xffe9a8, 0xffffff] });
  K.onFrame((dt, t) => { jTr.update(dt, t); iTr.update(dt, t); });

  // ---------- helpers ----------
  const dmg = (lo, hi) => Math.round(rnd(lo, hi));
  const form = () => fire.form || 1;
  const formBtn = $('look');
  const showForm = () => { formBtn.textContent = form() === 2 ? 'Final form' : 'Form one'; };
  function wide(k) { shotFit(K.ptsOf([io, jes, boss]).concat(helpers.filter((h) => h.shown).map((h) => ({ x: h.pos.x, y: 0, z: h.pos.z }))), 1, k || 2); }
  function setHelpers(on) { for (const h of helpers) { h.shown = on; h.m.root.visible = on; if (h.m.fx) h.m.fx.visible = on; } }
  // the Jester turns her casting side (her left) to whatever she casts at, as on her own pages
  function jesterAim(t) { const dx = t.x - jes.pos.x, dz = t.z - jes.pos.z; jes.tyaw = Math.atan2(-dz, dx); if ('targetDist' in jesM || true) jesM.targetDist = Math.hypot(dx, dz); }
  const hitJester = (n, big) => { hurt(jes, n, { big, from: boss }); if (jesM.play) jesM.play(Math.random() < 0.5 ? 'hit_dust' : 'hit_laugh', true); };

  const MOVES = [
    { id: 'blow', name: 'Its blow', cap: 'Its great iron hand rises and strikes down. The Jester has taunted it, so the blow falls on her, and she laughs it off.',
      async run() { shotFit(K.ptsOf([boss, jes]), 1, 2); fire.play('blow'); SND.sfx.swish();
        await untilP(fire, fire.ACTIONS.blow.hits[0]);
        const p = chest(jes); FX.ring(jes.pos, 0xff9a50, 0.2, 2.4, 0.6, 0.9); FX.burst(p, [1, 0.6, 0.3], 50, 4); FX.flashLight(p, 0xff9050, 5, 0.4, 8);
        SND.sfx.boom(1.2); hitJester(dmg(380, 460), true); K.shake(14);
        await until(() => !fire.busy); } },
    { id: 'call', name: 'Its call', cap: 'Its rings line up into one burning disc, flame streams in from the party’s side, and it bursts over everyone.',
      async run() { wide(1.5); fire.play('call'); SND.sfx.moon();
        await untilP(fire, fire.ACTIONS.call.cues && fire.ACTIONS.call.cues[0] != null ? fire.ACTIONS.call.cues[0] : 0.5);
        await untilP(fire, fire.ACTIONS.call.hits[0] != null ? fire.ACTIONS.call.hits[0] : 3.1 / 4.0);
        for (const h of heroes) { FX.burst(chest(h), [1, 0.55, 0.3], 40, 3.5); FX.ring(h.pos, 0xff7a40, 0.2, 1.8, 0.6, 0.9); }
        ui.flash('#ffb070', 0.45, 0.4); SND.sfx.boom(1.4); K.shake(16);
        hurt(io, dmg(260, 320), { from: boss }); hitJester(dmg(260, 320)); if (ioM.play) ioM.play('hit', true);
        await until(() => !fire.busy); } },
    { id: 'hurt', name: 'It takes a blow', cap: 'However hard it is struck, form one never shows it: a flinch and a ripple through its corona, and nothing breaks.',
      async run() { shotFit(K.ptsOf([boss]), 1, 2); await wait(0.5); FX.burst(V().set(boss.pos.x, 4.5, boss.pos.z + 1.5), [1, 0.9, 0.8], 60, 5); fire.play('hurt'); SND.sfx.hit(1.2); K.num(boss, String(dmg(900, 1100)), 'big'); K.shake(8);
        await until(() => !fire.busy); } },
    { id: 'curtain', name: 'Curtain Call', cap: 'Its Fate meets its Life and the Jester seals it. Her Sealed Fate runs on into her Curtain Call, glowing purple: the show is over, and everyone fallen stands up again. Then the fire breaks open into its final form.', form: 1,
      async run() {
        if (form() !== 1) { ui.cap('Curtain Call ends form one. Tap Start again first.'); return; }
        // its Fate, shown as Moon Faire shows it: dust falling round it like sand, locking into one ring once it is sealed
        jesM.game.fates = [{ x: boss.pos.x, y: 0, z: boss.pos.z, r: 3.2, h: 8.4, k: 1, sealed: true }];
        jesM.game.others = helpers.map((h) => ({ x: h.pos.x, z: h.pos.z, h: h.tall }));
        jesM.game.friends = [{ x: io.pos.x - 0.2, z: io.pos.z + 0.4 }];
        if (ioM.down) ioM.down(true);       // Io has fallen in the fight; the Curtain Call brings her up
        await wait(0.6);
        jesterAim(boss.pos); shotFit(K.ptsOf([jes, boss]), 1, 2); await wait(0.4);
        jTr.set(1); SND.sfx.trance(); ui.banner('Curtain Call', 3);
        jesM.play('g_curtain', true); ui.cinematic(true); ui.vignette(0.5);
        // her model's own moments for it, in order: land, zero, splash, doom, gone, rise (jester_kit.js, g_curtain)
        const A = jesM.ACTIONS.g_curtain, TAG = { land: 0, zero: 1, splash: 2, doom: 3, gone: 4, rise: 5 };
        const at = (tag, def) => (A.hits.length >= 6 ? A.hits[TAG[tag]] : def);
        await untilP(jesM, at('zero', 0.55)); K.num(boss, 'Sealed', 'buff'); SND.sfx.eclipse(); ui.flash('#c080ff', 0.5, 0.6); K.shake(10);
        await untilP(jesM, at('gone', 0.75)); setHelpers(false); SND.sfx.boom(0.8);
        await untilP(jesM, at('rise', 0.88)); if (ioM.down) ioM.down(false); for (const h of heroes) { FX.rise(() => h.pos, [0.85, 0.7, 1], 1.4, 50, 0.6); hurt(h, 'Full', { heal: true }); }
        await until(() => !jesM.busy); jTr.set(0); ui.vignette(0); ui.cinematic(false);
        // the change: it goes dark and still, light builds inside, and it breaks open
        jesM.game.fates = [];
        await wait(0.6); wide(1.2); ui.banner('It breaks open', 2.6); fire.play('change'); SND.sfx.moon();
        await wait(2.6); ui.flash('#ffffff', 0.7, 0.6); SND.sfx.boom(1.5); K.shake(20);
        await until(() => !fire.busy); showForm(); wide(1.2);
      } },
    { id: 'trance', name: 'Io’s trance', cap: 'Io in her trance: the same code glow in her own colours, silver-green light rising off her.',
      async run() { K.faceTo(io, boss); shotAt(io.pos, 1.4, 2); iTr.set(1); SND.sfx.trance(); ioM.play('e_sky', true); await until(() => !ioM.busy); await wait(1.2); iTr.set(0); await wait(0.8); io.tyaw = io.home.yaw; } },
    { id: 'ending', name: 'The ending', cap: 'Its corona goes out blade by blade, the shards fall, and the candle at its heart comes down as one small, ordinary flame. Its lanterns light again.', form: 2,
      async run() {
        if (form() !== 2) { ui.cap('The ending is for its final form. Tap Curtain Call first.'); return; }
        wide(1.2); fire.play('ending'); SND.sfx.victory && SND.sfx.victory();
        await wait(4.5); shotFit(K.ptsOf([boss]), 1.3, 1.5);
        for (let i = 0; i < 6; i++) { FX.rise(() => ({ x: boss.pos.x + rnd(-3, 3), z: boss.pos.z + rnd(-1, 1) }), [0.95, 0.95, 1], 2.5, 30, 1.5); await wait(0.25); }
        await wait(2.5); } },
    { id: 'again', name: 'Start again', cap: 'Back to form one, with its wraiths and frost wisps beside it.',
      async run() { fire.reset(1); if (fire.setForm) fire.setForm(1); setHelpers(true); if (ioM.down) ioM.down(false); ioM.reset(); jTr.set(0); iTr.set(0); showForm(); wide(1.5); await wait(0.6); } },
  ];

  // ---------- the page ----------
  let busy = false;
  const chips = $('chips');
  for (const s of MOVES) { const b = document.createElement('button'); b.className = 'chip'; b.textContent = s.name; b.dataset.id = s.id; b.onclick = () => run(s.id); chips.appendChild(b); }
  let sndOn = false;
  async function run(id) {
    if (!sndOn) { try { SND.init(); } catch (e) { /* no sound */ } sndOn = true; }
    if (busy) return;
    const s = MOVES.find((x) => x.id === id); if (!s) return;
    busy = true; chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
    ui.cap(s.cap);
    try { await s.run(); } catch (e) { console.error(e); }
    await Promise.all(heroes.map((h) => K.goHome(h))); wide(1.5);
    busy = false; chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
  }
  formBtn.onclick = () => { if (busy) return; const f = form() === 1 ? 2 : 1; fire.reset(f); if (fire.setForm) fire.setForm(f); setHelpers(f === 1); showForm(); wide(1.5); };
  showForm(); K.layout(); wide(50); K.compile(); K.start();
  ui.cap('The final boss of the new game, in Envoi’s last place, the dead Moonwell. The black sun Noctara meant to set over the moon on the longest night, made real. Tap a move.');
  window.__sb = { K, cast: run, get busy() { return busy; }, setBook() {}, io, jes, boss, helpers, fire };
})();
