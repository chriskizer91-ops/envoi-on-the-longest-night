// lineup.js: every model that fights in the new game, on one page, for Chris to lock them in (November 16, 2026: "getting
// it locked in, all of them: the combat related models ... our two heroes, some summons of the two heroes, the animations of
// the two heroes which are not necessarily their own 3D models, and all of the foes from different parts of the game").
// At the dead Moonwell, where the finale is fought. Pick a group, a model, then any of its moves. A practice Shadow Wraith
// stands in as the heroes' target, and Io as the foes'. The numbers are only for show: no rules run here.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TEST = /[?&]test\b/.test(location.search);
  const panel = $('panel');
  const K = makeKit({ stage: $('stage'), paint: $('paint'), gl: $('gl'), arena: 'dead-moonwell', ui: () => panel.offsetHeight + 6, test: TEST, look: 'mf', zmax: 5, zoom: 1.25 });
  const { FX, SND, wait, until, untilP, untilT, shotAt, shotBoth, shotFit, hurt, ui, chest } = K;
  const V = () => new THREE.Vector3(), rnd = (a, b) => a + Math.random() * (b - a);
  const RL = window.BattleRules;

  // ---------- the two heroes, always here ----------
  const ioM = makeMoonIo({ weight: 'lightest' }); ioM.walkRun = true; ioM.camera = K.camera;
  const jesM = makeMoonJester({ weight: 'lightest' }); jesM.camera = K.camera;
  const io = K.actor('io', ioM, { home: [-2.6, -0.8], tall: 2.0, shadow: 0.55, yawBias: -0.95, witch: true });
  const jes = K.actor('jester', jesM, { home: [-1.2, 0.2], tall: 1.9, shadow: 0.5, yawBias: -1.45, witch: true });
  const ioTr = makeTrance(K.scene, io, { color: 0x9fe8c0, colors: [0xbfffe0, 0x9fe8c0, 0xe8f0ff, 0xffe9a8, 0xffffff] });
  const jTr = makeTrance(K.scene, jes, { color: 0xa64dff, colors: [0xb05cff, 0x7a2cff, 0xe0a8ff, 0xff6ad5, 0xffffff] });
  K.onFrame((dt, t) => { ioTr.update(dt, t); jTr.update(dt, t); });

  // ---------- every model, made the first time it is picked ----------
  const SMALL = [2.0, -3.0], MID = [2.2, -4.8], FAR = [1.6, -8.6], FARTHEST = [1.2, -11.5];
  const WELL = { x: K.ARENA.summon[0], z: K.ARENA.summon[1] };
  const KEPT = 'Envoi’s, kept', IN = 'In the battle';
  const FOES = RL.FOES;
  const ACT_NAME = { appear: 'Appears', die: 'Falls', hurt: 'Hurt', block: 'Blocks', alert: 'Alert', rest: 'Rests', burn: 'Burns', stagger: 'Staggers', kneel: 'Kneels', retreat: 'Retreats',
    counter: 'Counter', blackNoonCharge: 'Black Noon (gathering)', lure: 'Lure', cast: 'Soul Bolts', leave: 'Leaves', embrace: 'Embrace (heals)', charge: 'Gathers the moon', release: 'Silver Requiem',
    summon: 'Arrives', envoi: 'Its strike', breath: 'Frost Breath', wail: 'Wail', grasp: 'Shadow Grasp', blow: 'Blow', call: 'Call', change: 'Breaks open', ending: 'The end' };
  const fromRules = (rid) => (a) => (FOES[rid] && FOES[rid].moves[a === 'cast' ? 'bolts' : a] ? FOES[rid].moves[a === 'cast' ? 'bolts' : a].name : ACT_NAME[a] || a);
  const triOf = (m) => { if (m.paladin) return m.triangles; let n = 0; m.root.traverse((o) => { if (o.isMesh && o.geometry && o.visible !== false) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return n; };
  const thousand = (n) => (n >= 1000 ? Math.round(n / 1000) + ',000' : String(Math.round(n)));

  const L = [];
  const add = (o) => { L.push(o); return o; };
  // the heroes
  add({ id: 'io', group: 'heroes', name: 'Io', tag: IN, line: 'Moon Faire’s Io, the Herbal Witch, at her lightest. Her own spells are in her model; Envoi Io’s spells play on her six new moves, with the lights in the Spell Book.', hero: io });
  add({ id: 'jester', group: 'heroes', name: 'The Jester', tag: IN, line: 'Moon Faire’s Jester at her lightest, playing Moon Faire’s Fate rules. The first moves are the ones in the battle; the rest are her other Moon Faire moves.', hero: jes });
  // the summons
  add({ id: 'lunara', group: 'summons', name: 'Lunara', tag: IN, line: 'Envoi’s Lunara, Io’s summon: she heals the party, or gathers the moon and brings it down on the foe.', make: () => makeLunara({}), at: [WELL.x, WELL.z - 0.9], tall: 4.3, shadow: 0.9, side: 'summon', order: ['appear', 'embrace', 'charge', 'release', 'leave'] });
  add({ id: 'envoi', group: 'summons', name: 'Envoi, the Letter Wyrm', tag: IN, line: 'Envoi’s summon, made of Io’s letters to the dead: it wakes, strikes and wards the party.', make: () => makeEnvoi({}), at: [WELL.x - 0.6, WELL.z - 2.2], tall: 6.4, shadow: 1.6, side: 'summon', order: ['appear', 'summon', 'envoi', 'leave'] });
  add({ id: 'guardian', group: 'summons', name: 'Elderwood Guardian', tag: IN, line: 'Io’s own summon, part of her model: a seed becomes a sapling, a fawn, then a stag of living wood that charges and bursts into vines.', heroMove: 'guardian' });
  // the foes, as the wilds and the gates bring them
  const foe = (id, name, make, at, look, line) => add({ id, group: 'foes', name, tag: KEPT, line, make, at, tall: look.tall, shadow: look.shadow, side: 'foe', names: fromRules(look.rid || id) });
  foe('wisp', 'Wisp', () => makeWisp({ seed: 1 }), SMALL, { tall: 1.0, shadow: 0.3 }, 'The wilds’ smallest foe, from the first band on.');
  foe('frostWisp', 'Frost wisp', () => makeWisp({ seed: 2, frost: true }), SMALL, { tall: 1.0, shadow: 0.3 }, 'The cold wilds’ wisp: it breathes frost.');
  foe('wraith', 'Shadow Wraith', () => makeWraith({ level: 6 }), SMALL, { tall: 2.3, shadow: 0.75 }, 'The wraith of every band, and of Dawnroost’s gate.');
  foe('bramble', 'Bramble Horror', () => makeBramble({ variant: 'classic', level: 8 }), MID, { tall: 1.9, shadow: 1.0 }, 'A rooted thing of canes and berries: it lures, grabs and feeds.');
  foe('brambleAmbush', 'Bramble Horror, the ambusher', () => makeBramble({ variant: 'ambush', level: 8 }), MID, { tall: 1.6, shadow: 1.0, rid: 'bramble' }, 'The Bramble Horror that waits low in the grass.');
  foe('brambleTowering', 'Bramble Horror, the towering', () => makeBramble({ variant: 'towering', level: 10 }), MID, { tall: 2.3, shadow: 1.1, rid: 'bramble' }, 'The tall Bramble Horror.');
  foe('brambleAncient', 'Ancient Crown', () => makeBramble({ variant: 'ancient', level: 14 }), MID, { tall: 2.7, shadow: 1.5, rid: 'bramble' }, 'The oldest Bramble Horror, from the third band on.');
  // the big ones, and the bosses
  const big = (o) => add(Object.assign({ group: 'big', side: 'foe' }, o));
  big({ id: 'greatWraith', name: 'The great wraith', tag: KEPT, line: 'Gate 5’s great wraith in Bogmire: seven metres of shadow that swallows lamplight.', make: () => makeWraith({ level: 5, great: true }), at: FAR, tall: 7.4, shadow: 1.9, names: fromRules('greatWraith') });
  big({ id: 'colossus', name: 'Bramble Colossus', tag: KEPT, line: 'The wilds’ rarest foe: about eight metres tall and eleven across. Its heart opens when it blooms.', make: () => makeBrambleColossus({ level: 18 }), at: FARTHEST, tall: 7.8, shadow: 3.6, names: fromRules('colossus') });
  big({ id: 'halcyon', name: 'Halcyon, the paladin', tag: 'New', line: 'The new Halcyon: Moon Faire’s base doll (Io’s body) in its paladin outfit, at its light weight. A glow made in code is round her, and a light hides her face. Her moves are the doll’s own, under Halcyon’s names.', make: () => makeHalcyonPaladin({}), at: SMALL, tall: 1.75, shadow: 0.55, witch: true, names: fromRules('halcyon') });
  big({ id: 'fire1', name: 'The final boss', tag: 'In Noctara’s place', line: 'Moon Faire’s big bad, where the Queen of Darkness stood: a black sun in its corona. First form.', make: () => makeFinalFire({ detail: 0.5, form: 1 }), at: FARTHEST, tall: 8.4, shadow: 4.2, form: 1, order: ['blow', 'call', 'hurt', 'change'], names: (a) => ACT_NAME[a] || a });
  big({ id: 'fire2', name: 'The final boss, broken open', tag: 'In Noctara’s place', line: 'The same model in its second form, after the Curtain Call breaks it open and it fights on alone.', shares: 'fire1', at: FARTHEST, tall: 8.4, shadow: 4.2, form: 2, order: ['blow', 'call', 'hurt', 'ending'], names: (a) => ACT_NAME[a] || a });

  // the practice wraith: the heroes' and summons' target
  const dummy = K.actor('dummy', makeWraith({ level: 3 }), { home: SMALL, tall: 2.3, shadow: 0.75, side: 'foe' });

  // ---------- the moves ----------
  const dmg = (lo, hi) => Math.round(rnd(lo, hi));
  const SKIP = { idle: 1 };
  const NEAR = { crescent: 1.4, thorn: 1.4, salve: 1.3, revive: 1.3, guardian: 1.8 };
  async function heroOwn(h, anim, o) {
    o = o || {};
    const m = h.m, A = m.ACTIONS[anim]; if (!A) return;
    const tgt = o.at === 'foe' ? cur.target : o.at === 'friend' ? (h === io ? jes : io) : null;
    if (tgt && NEAR[anim]) await K.walkNear(h, tgt, NEAR[anim], 2.4); else if (tgt) { K.faceTo(h, tgt); await wait(0.3); }
    if (tgt) shotBoth(h.pos, tgt.pos, 1.15, 2.5); else shotAt(h.pos, 1.5, 2.5);
    if (o.glow) o.glow.set(1);
    m.play(anim, true);
    const hits = A.hits || [];
    for (let k = 0; k < hits.length; k++) {
      await untilP(m, hits[k]);
      if (o.kind === 'harm' && tgt) hurt(tgt, dmg(40, 90), { from: h, big: k === hits.length - 1 && hits.length > 1 });
      if (o.kind === 'heal') hurt(tgt || h, dmg(110, 160), { heal: true });
    }
    await until(() => !m.busy);
    if (o.glow) o.glow.set(0);
    if (anim === 'down' && m.down) { await wait(0.8); m.down(false); }
    if (tgt && NEAR[anim]) await K.goHome(h); else h.tyaw = h.home.yaw;
  }
  const IO_MOVES = [
    ['Harvest Crescent', 'crescent', 'foe', 'harm', 'Her plain attack: a gold sickle and a crescent of light.'],
    ['Thornwake', 'thorn', 'foe', 'harm', 'A crack of violet light runs to the foe and thorned roots burst up round it.'],
    ['Silverleaf Salve', 'salve', 'friend', 'heal', 'A silver-green ribbon of light winds round a friend and heals her.'],
    ['Moonflower Garden', 'garden', null, 'heal', 'White moonflowers open round the party and heal everyone.'],
    ['Rootbound Return', 'revive', null, 'none', 'Brings a fallen friend back (her grey practice friend stands in).', { practice: true }],
    ['Bramble Cradle', 'cradle', null, 'none', 'A cradle of brambles round her: whoever strikes her is cut.'],
    ['Throw', 'e_throw', 'foe', 'harm', 'Envoi Io’s Moonfire and Blades leave her hand on this move.'],
    ['Raise', 'e_raise', 'foe', 'harm', 'Envoi Io’s Crescent Moon rises from this move.'],
    ['Grasp', 'e_grasp', 'foe', 'harm', 'Envoi Io’s Briars come up from this move.'],
    ['Bless', 'e_bless', 'friend', 'heal', 'Envoi Io’s Lunar Mend, Moonsteel and Harvest Moon go to a friend on this move.'],
    ['Sky', 'e_sky', null, 'none', 'Envoi Io’s Waxing Light and her summons start from this move.'],
    ['Moon', 'e_moon', 'foe', 'harm', 'Envoi Io’s Moonlight, her trance spell, comes down on this move.'],
    ['Lunar Trance', 'e_sky', null, 'none', 'Her trance: silver-green mist and pixel motes as she calls the moon.', { glow: ioTr }],
    ['Hit', 'hit', null, 'none', 'Struck.'], ['Falls', 'down', null, 'none', 'Falls, and gets up again.'], ['Wins', 'win', null, 'none', 'The fight is won.'],
  ];
  const IO_MORE = ['herb', 'curtsey', 'twirl', 'wave', 'hat', 'sickle'];
  // the Jester turns her casting side (her left) to her target, as in the battle
  const jAim = (t) => { const dx = t.pos.x - jes.pos.x, dz = t.pos.z - jes.pos.z; jes.tyaw = Math.atan2(-dz, dx); jesM.targetDist = Math.hypot(dx, dz); };
  async function jesterCast(anim, o) {
    o = o || {};
    const t = cur.target, A = jesM.ACTIONS[anim]; if (!A) return;
    if (o.at !== 'self') jAim(t); else { jesM.targetDist = 0; jAim(t); }
    jesM.game.others = []; jesM.game.friends = [];
    jesM.game.fates = o.sealed ? [{ x: t.pos.x, y: 0, z: t.pos.z, r: 0.6, h: t.tall, k: 1, sealed: true }] : [];
    await wait(0.3);
    if (o.wide) shotFit(K.ptsOf([io, jes, t]).concat([{ x: t.pos.x, y: 4.5, z: t.pos.z }]), 1, 2); else if (o.at !== 'self') shotBoth(jes.pos, t.pos, 1.1, 2.5); else shotAt(jes.pos, 1.6, 2.5);
    if (o.glow) { jTr.set(1); SND.sfx.trance(); }
    jesM.play(anim, true);
    for (const h of A.hits || []) { await untilP(jesM, h); if (o.kind === 'harm') hurt(t, dmg(50, 110), { from: jes }); if (o.kind === 'heal') hurt(jes, dmg(90, 140), { heal: true }); }
    await until(() => !jesM.busy);
    if (o.glow) jTr.set(0);
    jesM.game.fates = []; jes.tyaw = jes.home.yaw;
  }
  const J_MOVES = [
    ['Gilded Rebuke', 'g_rebuke', 'harm', 'Her attack in the battle.'],
    ['Attack Taunt', 'taunt_attack', 'harm', 'She strikes and taunts: the next three blows on the party come to her instead.'],
    ['Heal Taunt', 'taunt_heal', 'heal', 'She heals herself and taunts.', { at: 'self' }],
    ['Sealed Fate', 'g_seal', 'harm', 'A sealed foe’s Fate has met its Life: the rings shut and it is ended.', { sealed: true, wide: true }],
    ['Curtain Call', 'g_curtain', 'harm', 'Sealed Fate when it leaves no foe standing: the night closes over the show, and she glows purple.', { sealed: true, wide: true, glow: true }],
    ['Doom Dance (trance)', 'dance', 'none', 'Her trance: purple mist and pixel motes, and every blow she lands writes Fate.', { at: 'self', glow: true }],
    ['Hurt', 'hit_dust', 'none', 'Struck.', { at: 'self' }], ['Hurt, laughing', 'hit_laugh', 'none', 'Struck, and laughing it off.', { at: 'self' }],
    ['Bows (win)', 'bow', 'none', 'The fight is won.', { at: 'self' }],
  ];
  const J_MORE = ['against_all_odds', 'hush', 'ill_omen', 'royal_reversal', 'last_toll', 'doom', 'gravity', 'jump', 'twirl', 'laugh', 'caper', 'prance', 'juggle', 'wave'];
  const pretty = (s) => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

  // a foe's or summon's move: aim it at Io (a summon at the practice wraith), play it, and let each blow land
  async function modelMove(e, a, act) {
    const m = a.m, A = m.ACTIONS[act]; if (!A) return;
    const prey = e.side === 'summon' ? dummy : io;
    if (e.side === 'foe') { K.faceTo(a, io); a.tyaw += 0.0; }
    if (act === 'appear' || act === 'summon') { a.shown = true; m.root.visible = true; if (m.fx) m.fx.visible = true; }
    const big = e.tall > 4;
    if (big) shotFit(K.ptsOf([a, io, jes]), 1, 2); else shotBoth(prey.pos, a.pos, 1.05, 2.5);
    m.play(act, true); SND.sfx[e.side === 'summon' ? 'moon' : 'swish']();
    const harms = !/^(appear|die|hurt|block|alert|rest|burn|leave|summon|kneel|retreat|stagger|change|ending|charge|lure|embrace|vowStance|blackNoonCharge)$/.test(act);
    for (const h of A.hits || []) {
      await untilP(m, h);
      if (act === 'embrace') { for (const f of [io, jes]) hurt(f, dmg(120, 180), { heal: true }); continue; }
      if (harms) hurt(prey, dmg(30, 90), { from: a, big: (A.hits || []).length === 1 && big });
    }
    if (act === 'hurt' || act === 'block') { K.num(a, String(dmg(100, 300)), 'hit'); }
    await until(() => !m.busy);
    if (/^(die|ending|leave|kneel|retreat)$/.test(act)) { await wait(1.0); if (m.reset) m.reset(e.form); if (e.form && m.setForm) m.setForm(e.form); if (e.side === 'summon' && act === 'leave') { a.shown = false; m.root.visible = false; if (m.fx) m.fx.visible = false; } }
    if (act === 'change' && m.setForm) { await wait(1.2); m.reset(1); m.setForm(1); }
    a.tyaw = K.faceYaw(a.pos, (e.side === 'summon' ? dummy : io).pos) + (e.side === 'summon' ? 0.3 : 0);
  }

  // ---------- picking ----------
  const made = {};
  let cur = null, busy = false;
  function actorOf(e) {
    if (e.hero) return e.hero;
    if (e.heroMove) return io;
    const k = e.shares || e.id;
    if (!made[k]) { const src = L.find((x) => x.id === k); made[k] = K.actor(k, src.make(), { home: src.at, tall: src.tall, shadow: src.shadow, side: src.side, shown: false, witch: !!src.witch }); made[k].tri = triOf(made[k].m); }
    return made[k];
  }
  function show(e) {
    for (const k in made) { const a = made[k]; a.shown = false; a.m.root.visible = false; if (a.m.fx) a.m.fx.visible = false; }
    const own = e.hero || e.heroMove ? null : actorOf(e);
    // the heroes stay; the practice wraith is their target, unless a foe of this page is shown
    const withDummy = !own || e.side === 'summon';
    dummy.shown = withDummy; dummy.m.root.visible = withDummy; if (dummy.m.fx) dummy.m.fx.visible = withDummy;
    if (own) {
      own.pos.x = own.home.x; own.pos.z = own.home.z;
      if (e.form && own.m.setForm) { own.m.reset(e.form); own.m.setForm(e.form); } else if (own.m.reset) own.m.reset();
      own.shown = e.side !== 'summon'; own.m.root.visible = own.shown; if (own.m.fx) own.m.fx.visible = own.shown;
      own.yaw = own.tyaw = K.faceYaw(own.pos, (e.side === 'summon' ? dummy : io).pos) + (e.side === 'summon' ? 0.3 : 0);
    }
    const t = own && e.side === 'foe' ? own : dummy;
    for (const h of [io, jes]) { h.home.yaw = K.faceYaw(h.pos, t.pos) + h.look.yawBias; h.tyaw = h.home.yaw; }
    cur = { e, a: own || (e.hero || io), target: t };
    frame(e, own);
  }
  // the camera on the one picked: a hero or a foe close, a summon with the party, a big one whole
  function frame(e, own) {
    if (e.hero) shotFit(K.ptsOf([e.hero]).concat([{ x: e.hero.pos.x + 0.6, y: 0, z: e.hero.pos.z + 0.6 }]), 1, 2);
    else if (e.heroMove) shotFit(K.ptsOf([io, dummy]), 1, 2);
    else if (e.side === 'summon') shotFit(K.ptsOf([own]).concat([{ x: own.pos.x - 1.5, y: 0, z: own.pos.z + 1 }, { x: own.pos.x + 1.5, y: 0, z: own.pos.z - 1 }]), 1, 2);
    else shotFit(K.ptsOf([own]).concat(e.tall > 4 ? [] : [{ x: own.pos.x - 1.2, y: 0, z: own.pos.z + 1.0 }, { x: own.pos.x + 1.2, y: 0, z: own.pos.z - 1.0 }]), 1, 2);
  }
  function movesOf(e) {
    if (e.hero === io) return IO_MOVES.map(([label, anim, at, kind, cap, x]) => ({ label, cap, run: () => { ioM.practice = !!(x && x.practice); return heroOwn(io, anim, Object.assign({ at, kind }, x || {})).then(() => { ioM.practice = false; }); } }))
      .concat(IO_MORE.map((a) => ({ label: pretty(a), more: true, cap: 'One of her Moon Faire moves outside the battle.', run: () => heroOwn(io, a) })));
    if (e.hero === jes) return J_MOVES.map(([label, anim, kind, cap, x]) => ({ label, cap, run: () => jesterCast(anim, Object.assign({ kind }, x || {})) }))
      .concat(J_MORE.filter((a) => jesM.ACTIONS[a]).map((a) => ({ label: pretty(a), more: true, cap: 'One of her Moon Faire moves outside the battle.', run: () => jesterCast(a, { at: 'self' }) })));
    if (e.heroMove) return [{ label: 'Summon the Guardian', cap: e.line, run: () => heroOwn(io, e.heroMove, { at: 'foe', kind: 'harm' }) }];
    const a = actorOf(e), keys = (e.order || Object.keys(a.m.ACTIONS).filter((k) => !SKIP[k]));
    return keys.filter((k) => a.m.ACTIONS[k]).map((k) => ({ label: e.names ? e.names(k) : ACT_NAME[k] || pretty(k), cap: '', run: () => modelMove(e, a, k) }));
  }

  // ---------- the panel ----------
  const GROUPS = [['heroes', 'Heroes'], ['summons', 'Summons'], ['foes', 'Foes'], ['big', 'Bosses']];
  let group = 'heroes';
  const tabs = $('tabs'), who = $('who'), moves = $('moves'), title = $('title'), tag = $('tag');
  function el(tagName, cls, text, parent) { const d = document.createElement(tagName); if (cls) d.className = cls; if (text != null) d.textContent = text; if (parent) parent.appendChild(d); return d; }
  function drawTabs() { tabs.innerHTML = ''; for (const [g, n] of GROUPS) { const b = el('button', g === group ? 'on' : '', n, tabs); b.type = 'button'; b.onclick = () => { if (busy) return; group = g; drawTabs(); pick(L.find((x) => x.group === g).id); }; } }
  function drawWho() { who.innerHTML = ''; for (const e of L.filter((x) => x.group === group)) { const b = el('button', 'chip' + (cur && cur.e === e ? ' on' : ''), e.name, who); b.type = 'button'; b.onclick = () => { if (!busy) pick(e.id); }; } }
  function drawMoves(e) {
    moves.innerHTML = '';
    let sep = false;
    for (const mv of movesOf(e)) {
      if (mv.more && !sep) { sep = true; el('span', 'sep', 'not in the battle:', moves); }
      const b = el('button', 'chip move' + (mv.more ? ' more' : ''), mv.label, moves); b.type = 'button';
      b.onclick = async () => {
        if (!sndOn) { try { SND.init(); } catch (err) { /* no sound */ } sndOn = true; }
        if (busy) return; busy = true; b.classList.add('on'); ui.banner(mv.label, 1.8); if (mv.cap) ui.cap(mv.cap);
        try { await mv.run(); } catch (err) { console.error(err); }
        await Promise.all([io, jes].map((h) => K.goHome(h))); frame(e, e.hero || e.heroMove ? null : actorOf(e));
        b.classList.remove('on'); busy = false; ui.cap(capOf(e));
      };
    }
  }
  let sndOn = false;
  const capOf = (e) => { const a = e.hero || e.heroMove ? null : actorOf(e); return e.line + (a ? '  About ' + thousand(a.tri) + ' triangles.' : ''); };
  function pick(id) {
    const e = L.find((x) => x.id === id); if (!e) return;
    show(e); title.textContent = e.name; tag.textContent = e.tag; tag.className = 'tag ' + (e.tag === IN || e.tag === 'New' ? 'in' : e.tag === KEPT ? 'kept' : 'change');
    drawWho(); drawMoves(e); ui.cap(capOf(e)); K.layout();
    if (e.side === 'summon') { const a = actorOf(e), act = a.m.ACTIONS.appear ? 'appear' : null; if (act) { busy = true; modelMove(e, a, act).then(() => { frame(e, a); busy = false; }); } }
  }

  drawTabs(); pick('io'); K.layout(); K.rest(50); K.compile(); K.start();
  // for the headless checks
  window.__ln = { K, L, pick, get busy() { return busy; }, get cur() { return cur; }, async play(label) { const b = [...moves.querySelectorAll('.chip')].find((x) => x.textContent === label); if (b) b.click(); }, group(g) { group = g; drawTabs(); }, io, jes, made };
})();
