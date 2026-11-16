// spellbook.js: Io's spell book. Moon Faire's Io (the Herbal Witch, lightest) in Envoi's river glade with the Jester beside
// her and a Shadow Wraith across the clearing. One row of chips plays her own seven Moon Faire spells; the other plays Envoi
// Io's spells, redone on her: Envoi's own lights (battle-fx.js, io-spells.js) on new moves of hers (src/io-new-moves.frag.js).
// Chris picks which spells she keeps. The numbers that pop up are only for show: no rules run here.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TEST = /[?&]test\b/.test(location.search);
  const panel = $('panel');
  const K = makeKit({ stage: $('stage'), paint: $('paint'), gl: $('gl'), arena: 'river-glade', ui: () => panel.offsetHeight + 6, test: TEST, look: 'mf', zmax: +(new URLSearchParams(location.search).get('zmax')) || 3, zoom: 1.8 });
  const { FX, IOS, SND, wait, until, untilP, untilT, shotAt, shotBoth, shotFit, hurt, ui, chest } = K;
  const V = () => new THREE.Vector3(), rnd = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;

  // ---------- who is here ----------
  const ioM = makeMoonIo({ weight: 'lightest' }); ioM.walkRun = true; ioM.camera = K.camera;
  const jesM = window.MF_WITCHES.jester.raw('lightest');
  const io = K.actor('io', ioM, { home: [-2.6, -0.6], tall: 2.0, shadow: 0.55, yawBias: -0.95, witch: true });
  const jes = K.actor('jester', jesM, { home: [-1.1, 0.7], tall: 1.9, shadow: 0.5, yawBias: -1.45, witch: true });
  const foe = K.actor('wraith', makeWraith({ level: 3 }), { home: [2.3, -3.0], tall: 2.3, shadow: 0.75, side: 'foe' });
  const WELL = { x: K.ARENA.summon[0], z: K.ARENA.summon[1] }, LUN = { x: WELL.x, z: WELL.z - 0.9 };
  const lu = K.actor('lunara', makeLunara({}), { home: [LUN.x, LUN.z], tall: 4.3, shadow: 0.9, side: 'summon', shown: false });
  K.settle(); lu.yaw = lu.tyaw = 0.3;
  const heroes = [io, jes];

  // ---------- helpers ----------
  const dmg = (lo, hi) => Math.round(rnd(lo, hi));
  const walkNear = (a, t, d) => K.walkNear(a, t, d, 2.4);
  const homeAll = async () => { await Promise.all(heroes.map((h) => K.goHome(h))); };
  function strikeFx(t, big, color) { const p = chest(t); FX.slash(p, color || 0xffffff, rnd(0, TAU), big ? 1.3 : 0.9, 0.3); FX.burst(p, [1, 0.95, 0.85], big ? 50 : 24, big ? 4 : 3); }
  // a move of Io's own: walk up if it is built to land near, play it, and fire what happens at its seconds
  async function own(spec) {
    const m = io.m, A = m.ACTIONS[spec.anim], tgt = spec.at === 'foe' ? foe : spec.at === 'friend' ? jes : null;
    ioM.practice = !!spec.practice;
    if (tgt && A.near) await walkNear(io, tgt, A.near); else if (tgt) { K.faceTo(io, tgt); await wait(0.3); } else { io.tyaw = spec.yaw != null ? spec.yaw : io.home.yaw; await wait(0.3); }
    if (spec.cam) spec.cam(); else if (tgt) shotBoth(io.pos, tgt.pos, 1.15, 2.5); else shotAt(io.pos, 1.5, 2.5);
    m.play(spec.anim, true);
    const evs = (spec.at_ || []).slice().sort((a, b) => a[0] - b[0]);
    for (const [t, fn] of evs) { await untilT(m, t); fn(); }
    await until(() => !m.busy);
    ioM.practice = false;
    if (tgt && A.near) await K.goHome(io); else io.tyaw = io.home.yaw;
  }

  // ---------- her own spells (Moon Faire) ----------
  const MF = [
    { id: 'crescent', name: 'Harvest Crescent', cap: 'Her plain attack. Her moon pendant unfolds into a gold sickle, and one wide cut sends a crescent of light into the foe.',
      run: () => own({ anim: 'crescent', at: 'foe', at_: [[1.1, () => SND.sfx.chime()], [2.06, () => SND.sfx.blade()], [2.38, () => hurt(foe, dmg(40, 55), { from: io })]] }) },
    { id: 'thorn', name: 'Thornwake', cap: 'Her one spell that harms. She drives her dagger into the ground; a crack of violet light runs to the foe and thorned roots burst up round it.',
      run: () => own({ anim: 'thorn', at: 'foe', at_: [[1.8, () => SND.sfx.fire()], [2.3, () => SND.sfx.grasp()], [2.62, () => hurt(foe, dmg(70, 90), { big: true, from: io })], [3.6, () => hurt(foe, dmg(12, 18), { from: io })]] }) },
    { id: 'salve', name: 'Silverleaf Salve', cap: 'Heals one friend. A pressed leaf from her book turns fresh and silver-green and winds round the Jester as a ribbon of light.',
      run: () => own({ anim: 'salve', at: 'friend', at_: [[2.4, () => SND.sfx.chime()], [5.4, () => { SND.sfx.heal(); hurt(jes, dmg(110, 130), { heal: true }); }]] }) },
    { id: 'garden', name: 'Moonflower Garden', cap: 'Heals the whole party. Glowing seeds fly out in a ring and open into white moonflowers round the Jester and her.',
      run: async () => { io.tyaw = 0.35; await wait(0.4); const p = ioM.local(-0.9, 0, 0.02); await K.moveTo(jes, p.x, p.z, 2.0); jes.tyaw = 0.2;
        await own({ anim: 'garden', yaw: 0.35, cam: () => shotFit(K.ptsOf([io, jes]).concat([{ x: io.pos.x, y: 0, z: io.pos.z + 1.6 }]), 1, 2), at_: [[3.5, () => SND.sfx.chime()], [7.5, () => { SND.sfx.heal(); hurt(io, dmg(80, 95), { heal: true }); hurt(jes, dmg(80, 95), { heal: true }); }]] });
        await K.goHome(jes); } },
    { id: 'guardian', name: 'Elderwood Guardian', cap: 'Her summon. A seed becomes a sapling, a fawn, then a stag of living wood that charges the foe and bursts into vines.',
      run: () => own({ anim: 'guardian', at: 'foe', cam: () => shotFit(K.ptsOf([io, foe]).concat([{ x: io.pos.x, y: 2.8, z: io.pos.z }]), 1, 2),
        at_: [[1.5, () => SND.sfx.chime()], [4.0, () => SND.sfx.moon()], [7.0, () => shotAt(io.pos, 1.3, 2)], [11.6, () => { SND.sfx.swish(); shotBoth(io.pos, foe.pos, 1.1, 3); }], [13.02, () => { hurt(foe, dmg(150, 180), { big: true, from: io }); K.ui.flash('#e8ffd8', 0.3, 0.4); }]] }) },
    { id: 'revive', name: 'Rootbound Return', cap: 'Brings a fallen friend back. Her grey practice friend stands in for the fallen one on this page.',
      run: () => own({ anim: 'revive', practice: true, cam: () => shotAt(io.pos, 1.6, 2.5), at_: [[3.0, () => SND.sfx.chime()], [6.4, () => SND.sfx.heal()]] }) },
    { id: 'cradle', name: 'Bramble Cradle', cap: 'Her guard. A dome of woven branches grows up round her, taller than her hat, and blows bounce off it as sparks.',
      run: () => own({ anim: 'cradle', cam: () => shotAt(io.pos, 1.5, 2.5), at_: [[0.6, () => SND.sfx.guard()], [2.9, () => SND.sfx.hit(0.5)], [3.5, () => SND.sfx.hit(0.5)], [4.1, () => SND.sfx.hit(0.5)]] }) },
  ];

  // ---------- Envoi Io's spells, on her ----------
  const EN = [
    { id: 'flame', name: 'Flame', cap: 'Witchfire gathers in her palm; she winds back and throws it at the foe.',
      async run() { K.faceTo(io, foe); shotBoth(io.pos, foe.pos, 1.05, 2.5); await wait(0.3); const m = io.m; m.play('e_throw', true); SND.sfx.fire();
        await untilP(m, m.ACTIONS.e_throw.cues[0]);
        await FX.projectile({ from: m.flamePos(V()), to: () => chest(foe), dur: 0.5, arc: 0.45, color: 0xe08cff, halo: 0x9a3cff, size: 0.34, trail: [0.8, 0.35, 1], light: 0xb455ff, lightI: 3 });
        const p = chest(foe); FX.burst(p, [0.85, 0.4, 1], 60, 4.2); FX.ring(foe.pos, 0xc060ff, 0.2, 1.9, 0.6, 0.9); FX.flashLight(p, 0xc070ff, 4, 0.4, 7); SND.sfx.boom(0.8);
        hurt(foe, dmg(45, 60), { big: true, from: io }); await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'blades', name: 'Crescent Blades', cap: 'Five crescent blades of moonlight gather round her as she lifts her hand, then fly at the foe one after another.',
      async run() { K.faceTo(io, foe); shotAt(io.pos, 1.55, 2.5); await wait(0.3); const m = io.m, C = m.ACTIONS.e_raise.cues; m.play('e_raise', true); SND.sfx.chime();
        await untilP(m, C[0]); const list = FX.blades(() => chest(io), 5);
        await untilP(m, C[1]); shotBoth(io.pos, foe.pos, 1.05, 3);
        const hits = [];
        for (let i = 0; i < 5; i++) { SND.sfx.blade(); hits.push(FX.launchBlade(list[i], () => chest(foe), 0.32).then(() => { const p = chest(foe); FX.slash(p, 0xcfe0ff, rnd(0, TAU), 0.9, 0.25); hurt(foe, dmg(9, 14), { from: io }); })); await wait(0.13); }
        await Promise.all(hits); await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'briars', name: 'Briars', cap: 'She leans in with her palm over the ground; a violet sigil opens under the foe and briars burst up and grip it as she closes her fist.',
      async run() { K.faceTo(io, foe); shotBoth(io.pos, foe.pos, 1.05, 2.5); await wait(0.3); const m = io.m; m.play('e_grasp', true); SND.sfx.fire();
        await untilP(m, m.ACTIONS.e_grasp.cues[0]); shotAt(foe.pos, 1.45, 3.2);
        FX.sigil(foe.pos, 0xc070ff, 2.4, 1.8, 2); FX.briars(foe.pos, 1.7); FX.burst(new THREE.Vector3(foe.pos.x, 0.25, foe.pos.z), [0.75, 0.35, 1], 50, 3, { up: 1 }); SND.sfx.grasp();
        await untilP(m, m.ACTIONS.e_grasp.hits[0]); FX.flashLight(chest(foe), 0xb455ff, 3, 0.4); hurt(foe, dmg(55, 70), { big: true, from: io });
        await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'mend', name: 'Lunar Mend', cap: 'Heals one friend. She offers her open palm; soft light rises round the Jester and a sigil glows at her feet.',
      async run() { K.faceTo(io, jes); shotBoth(io.pos, jes.pos, 1.1, 2.5); await wait(0.3); const m = io.m; m.play('e_bless', true); SND.sfx.heal();
        await untilP(m, m.ACTIONS.e_bless.cues[0]); FX.rise(() => jes.pos, [0.6, 1, 0.75], 1.5, 40, 0.55); FX.sigil(jes.pos, 0xb8ffd0, 1.8, 1.8, 1.5);
        await untilP(m, m.ACTIONS.e_bless.hits[0]); FX.burst(chest(jes), [0.6, 1, 0.75], 30, 2, { up: 1 }); hurt(jes, dmg(90, 110), { heal: true });
        await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'waxing', name: 'Waxing Light', cap: 'Heals the whole party. She lifts both arms to the sky and a waxing moon pours its light down on the Jester and her.',
      async run() { io.tyaw = K.faceYaw(io.pos, { x: io.pos.x + 0.3, z: io.pos.z + 1 }); shotFit(K.ptsOf(heroes).concat([{ x: io.pos.x, y: 3.2, z: io.pos.z }]), 1, 2.5); await wait(0.3);
        const m = io.m, A = m.ACTIONS.e_sky; m.play('e_sky', true); SND.sfx.heal();
        await untilP(m, A.cues[0]);
        const p = { x: (io.pos.x + jes.pos.x) / 2, z: (io.pos.z + jes.pos.z) / 2 };
        IOS.waxingLight({ sky: () => V().set(p.x, 2.9, p.z), allies: heroes.map((f) => () => chest(f)), landIn: (A.hits[0] - A.cues[0]) * A.dur });
        await untilP(m, A.hits[0]); hurt(io, dmg(140, 160), { heal: true }); hurt(jes, dmg(140, 160), { heal: true });
        await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'moonsteel', name: 'Moonsteel', cap: 'A blessing on her partner. On Sol it lit her sword; here a bar of moonsteel light flows from her palm along the Jester’s bell chain.',
      async run() { K.faceTo(io, jes); shotBoth(io.pos, jes.pos, 1.1, 2.5); await wait(0.3); const m = io.m, A = m.ACTIONS.e_bless; m.play('e_bless', true); SND.sfx.chime();
        await untilP(m, A.cues[0]);
        const blade = (A2, B2) => { jes.m.anchor('handR', B2); jes.m.anchor('bells', A2); A2.sub(B2).multiplyScalar(1.6).add(B2); };
        IOS.moonsteel({ palm: () => io.m.flamePos(V()), blade, releaseIn: (A.cues[1] - A.cues[0]) * A.dur, landIn: (A.hits[0] - A.cues[0]) * A.dur, glowFor: IOS.SPELLS.moonsteel.glow });
        await untilP(m, A.hits[0]); SND.sfx.blade(); K.num(jes, 'Moonsteel', 'buff');
        await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'harvest', name: 'Harvest Moon', cap: 'A warm full moon swells over her palm and sinks into the Jester, filling her with strength for her next blows.',
      async run() { K.faceTo(io, jes); shotBoth(io.pos, jes.pos, 1.1, 2.5); await wait(0.3); const m = io.m, A = m.ACTIONS.e_bless; m.play('e_bless', true); SND.sfx.chime();
        await untilP(m, A.cues[0]);
        const blade = (A2, B2) => { jes.m.anchor('handR', B2); jes.m.anchor('bells', A2); A2.sub(B2).multiplyScalar(1.6).add(B2); };
        IOS.harvestMoon({ palm: () => io.m.flamePos(V()), chest: () => chest(jes), feet: () => jes.pos, blade, releaseIn: (A.cues[1] - A.cues[0]) * A.dur, landIn: (A.hits[0] - A.cues[0]) * A.dur, glowFor: IOS.SPELLS.harvest.glow });
        await untilP(m, A.hits[0]); SND.sfx.fire(); K.num(jes, 'Harvest Moon', 'buff');
        await until(() => !m.busy); io.tyaw = io.home.yaw; } },
    { id: 'moonlight', name: 'Moonlight', cap: 'Her big one. She gathers the moon with both arms raised, then brings a pillar of moonlight down on the foe.',
      async run() { ui.cinematic(true); ui.vignette(0.55); K.faceTo(io, foe); shotAt(io.pos, 1.5, 2); await wait(0.3);
        const m = io.m, A = m.ACTIONS.e_moon; m.play('e_moon', true); SND.sfx.moon();
        await untilP(m, A.cues[0]); await untilP(m, A.cues[1] - 0.12); shotAt(foe.pos, 1.3, 3.2); await untilP(m, A.cues[1]);
        FX.beam(foe.pos, 0xe6eeff, 3.4, 14, 1.9); FX.sigil(foe.pos, 0xdfe9ff, 3.4, 2.1, 3);
        for (let k = 0; k < A.hits.length; k++) { await untilP(m, A.hits[k]); const p = chest(foe);
          FX.burst(p, [0.85, 0.92, 1], 70, 5, { spread: 0.3 }); FX.ring(foe.pos, 0xe6eeff, 0.3, 3.2, 0.7, 1); FX.flashLight(p, 0xe8f0ff, 6, 0.5, 9);
          ui.flash('#ffffff', 0.75 - k * 0.2, 0.35); SND.sfx.boom(1.1); hurt(foe, dmg(60, 80), { big: true, from: io }); }
        await until(() => !m.busy); ui.vignette(0); ui.cinematic(false); io.tyaw = io.home.yaw; } },
    { id: 'lunara', name: 'Lunara', cap: 'Her summons from Envoi: Lunara, the Pale Mother, rises from the moonlight, heals the party with her Embrace, then strikes with Silver Requiem.',
      async run() { await summonLunara(); await wait(0.8); await lunaraStrike(); } },
  ];

  // Lunara, as Envoi's battle screen summons her (src/battle/screen.js, summonLunara and lunaraStrike), with Io's new sky move
  async function summonLunara() {
    ui.banner('Summon: Lunara', 2.8); ui.cinematic(true); ui.vignette(0.6);
    io.tyaw = K.faceYaw(io.pos, LUN); shotAt(io.pos, 1.7, 2.4);
    const m = io.m, A = m.ACTIONS.e_sky; m.play('e_sky', true); SND.sfx.chime();
    FX.sigil(io.pos, 0xd8c8ff, 1.9, 2.6, -2);
    await untilP(m, A.cues[0]);
    await FX.projectile({ from: m.flamePos(V()), to: new THREE.Vector3(WELL.x, 1.1, WELL.z), dur: 0.7, arc: 1.7, color: 0xffffff, halo: 0xcfe0ff, size: 0.26, trail: [0.85, 0.9, 1], light: 0xe6eeff, lightI: 3 });
    shotAt(WELL, 1.5, 2.6); SND.sfx.moon(); SND.sfx.boom(0.6);
    FX.ring(WELL, 0xe6eeff, 0.2, 2.6, 0.7, 1); FX.ring(WELL, 0xbfd6ff, 0.2, 4.2, 1.2, 0.8); FX.sigil(WELL, 0xdfe9ff, 4.4, 4.8, 1.2);
    FX.geyser(WELL, 2.6, [0.85, 0.9, 1]); FX.beam(WELL, 0xe6eeff, 2.4, 14, 2.4);
    for (const [dx, dz] of [[1.7, 1.0], [-1.7, 1.0], [1.7, -1.0], [-1.7, -1.0]]) FX.beam({ x: WELL.x + dx, z: WELL.z + dz }, 0xcfe0ff, 0.5, 10, 2.6);
    ui.flash('#dfe8ff', 0.5, 0.5); K.shake(8);
    await wait(0.4);
    const L = lu.m; lu.shown = true; L.root.visible = true; if (L.fx) L.fx.visible = true; L.play('appear', true);
    shotFit(K.ptsOf([io, jes, foe]).concat([{ x: LUN.x, y: 4.6, z: LUN.z }, { x: LUN.x, y: 0, z: LUN.z }]), 1, 0.9);
    await untilP(L, L.ACTIONS.appear.cues[1]);
    FX.burst(L.anchor('head', V()), [0.75, 1, 0.88], 90, 4.5, { spread: 0.9 }); FX.ring(LUN, 0xdfffee, 0.4, 4.6, 0.9, 0.8);
    ui.flash('#ffffff', 0.45, 0.4); SND.sfx.chime(); SND.sfx.boom(0.5); K.shake(5);
    await until(() => !L.busy);
    L.play('embrace', true); SND.sfx.heal();
    await untilP(L, L.ACTIONS.embrace.cues[0]);
    FX.converge(() => L.anchor('chest', V()), [0.8, 1, 0.88], 1.0, 90);
    for (const f of heroes) FX.rise(() => f.pos, [0.75, 1, 0.85], 1.2, 40, 0.6);
    await untilP(L, L.ACTIONS.embrace.hits[0]);
    for (const f of heroes) { FX.sigil(f.pos, 0xd8ffe8, 1.7, 2.2, 1.5); FX.ring(f.pos, 0xd8ffe8, 0.2, 1.5, 0.8, 0.9); FX.burst(chest(f), [0.75, 1, 0.85], 30, 2, { up: 1 }); FX.flashLight(chest(f), 0xc8ffdc, 2.2, 0.8, 4); hurt(f, dmg(200, 230), { heal: true }); }
    await until(() => !L.busy);
    ui.vignette(0); ui.cinematic(false); io.tyaw = io.home.yaw;
  }
  async function lunaraStrike() {
    const L = lu.m, R = L.ACTIONS.release_l || L.ACTIONS.release;
    ui.banner('Lunara: Silver Requiem', 3.2); ui.cinematic(true); ui.vignette(0.75);
    shotFit(K.ptsOf([io, jes, foe]).concat([{ x: LUN.x, y: 5.2, z: LUN.z }]), 1, 2);
    L.play('charge', true); SND.sfx.moon();
    const orbP = () => L.anchor('orb', V());
    FX.converge(orbP, [0.85, 0.9, 1], 1.9, 110); FX.rise(() => LUN, [0.85, 0.9, 1], 1.9, 50, 1.4);
    await until(() => !L.busy);
    L.play('release', true); SND.sfx.blade(); FX.burst(orbP(), [0.9, 0.95, 1], 50, 3.5);
    await untilP(L, R.cues[0]);
    FX.projectile({ from: orbP(), to: () => new THREE.Vector3(foe.pos.x, 9.5, foe.pos.z), dur: 0.55, arc: 1.4, tex: L.moonTex, color: 0xffffff, halo: 0xcfe0ff, size: 1.0, trail: [0.8, 0.85, 1], light: 0xe6eeff, lightI: 4 });
    shotFit(K.ptsOf([io, jes, foe]), 1, 3);
    for (let k = 0; k < 6; k++) {
      await untilP(L, R.hits[k]);
      const a = rnd(0, TAU), r = rnd(0.2, 0.8), p = { x: foe.pos.x + Math.cos(a) * r, z: foe.pos.z + Math.sin(a) * r * 0.8 };
      FX.beam(p, 0xe6eeff, 0.9, 12, 0.55); FX.ring(p, 0xe6eeff, 0.1, 1.2, 0.5, 0.9); FX.burst(new THREE.Vector3(p.x, 0.3, p.z), [0.8, 0.88, 1], 26, 3, { up: 1 });
      hurt(foe, dmg(20, 30), { from: lu });
    }
    await untilP(L, R.cues[1]);
    ui.banner('Moonfall', 1.6); SND.sfx.eclipse(); shotAt(foe.pos, 1.15, 3);
    const dur = (R.hits[6] - R.cues[1]) * R.dur;
    FX.ring(foe.pos, 0xdfe8ff, 3.5, 1.0, dur, 0.7); FX.moonfall(foe.pos, L.moonTex, dur);
    await untilP(L, R.hits[6]);
    const p = chest(foe);
    ui.flash('#ffffff', 1.0, 0.8); SND.sfx.boom(1.5); SND.sfx.boom(1.0); K.shake(22); K.hitStop(0.25);
    FX.beam(foe.pos, 0xffffff, 5.4, 16, 1.6); FX.sigil(foe.pos, 0xe6eeff, 4.8, 1.9, 3);
    for (const [r1, d, op] of [[5.5, 0.9, 1], [7.5, 1.3, 0.7], [3.5, 0.6, 1]]) FX.ring(foe.pos, 0xffffff, 0.3, r1, d, op);
    FX.burst(p, [0.9, 0.95, 1], 160, 6.5, { spread: 0.6 }); FX.flashLight(p, 0xffffff, 10, 0.9, 13);
    hurt(foe, dmg(240, 280), { big: true, from: lu });
    await wait(1.0);
    L.play('leave', true); FX.burst(L.anchor('head', V()), [0.75, 1, 0.88], 70, 3, { spread: 1.0 });
    await until(() => !L.busy); lu.shown = false; L.root.visible = false; if (L.fx) L.fx.visible = false;
    ui.vignette(0); ui.cinematic(false);
  }

  // ---------- the page ----------
  const BOOKS = { mf: MF, envoi: EN };
  let book = 'mf', busy = false, played = null;
  const chips = $('chips'), tabs = document.querySelectorAll('[data-book]');
  function drawChips() {
    chips.innerHTML = '';
    for (const s of BOOKS[book]) { const b = document.createElement('button'); b.className = 'chip'; b.textContent = s.name; b.dataset.id = s.id; b.onclick = () => cast(s.id); chips.appendChild(b); }
    tabs.forEach((t) => t.classList.toggle('on', t.dataset.book === book));
  }
  tabs.forEach((t) => (t.onclick = () => { book = t.dataset.book; drawChips(); K.layout(); }));
  let sndOn = false;
  async function cast(id) {
    if (!sndOn) { try { SND.init(); } catch (e) { /* no sound */ } sndOn = true; }
    if (busy) return;
    const s = MF.concat(EN).find((x) => x.id === id); if (!s) return;
    busy = true; played = id;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
    ui.banner(s.name, 2.4); ui.cap(s.cap);
    try { await s.run(); } catch (e) { console.error(e); }
    await homeAll(); K.rest(1.6);
    busy = false; chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
  }
  const lookBtn = $('look');
  const LOOKS = { mf: 'Light: Moon Faire', envoi: 'Light: Envoi' };
  lookBtn.onclick = () => { const l = K.setLook(K.look === 'mf' ? 'envoi' : 'mf'); lookBtn.textContent = LOOKS[l]; };
  lookBtn.textContent = LOOKS[K.look];
  drawChips(); K.layout(); K.rest(50); K.compile(); K.start();
  ui.cap('Tap a spell to watch it. The first row is her own; the other tab has Envoi Io’s spells, made for her.');
  // for the headless checks
  window.__sb = { K, cast, get busy() { return busy; }, setBook(b) { book = b; drawChips(); }, io, jes, foe, lu };
})();
