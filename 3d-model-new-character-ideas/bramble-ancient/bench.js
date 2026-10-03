// bench.js: the Bramble Ancient's model bench, a test of how far the Bramble Colossus can go. The Ancient stands in a wild
// meadow at night whose hours and weather can turn and answer its blows, or in the wild glade under the battle screen's
// lights, and the party faces it: Io the Witch and Sol (their original models, as every bench's supporting actors are).
// Its single blows land on its prey and its big ones on everyone; its own two moves are Rootquake (its roots heave up
// under the whole party) and Monolith (it tears a standing stone out of the ground and hurls it at its prey). The party
// strikes back with dagger, flame and sword. A boss bar with its second phase at half HP, numbers on the game's level
// curve, hit-stop, a shaking camera, its weak point (the heart, bare while the flower is open), sounds made in code, and a
// fight it can play by itself.
// three.js r128 (global THREE); needs makeBrambleAncient, makeWitchOriginal, makeSolOriginal, makeMeadow, makeGlade and
// makeFightSound, and, to compare sizes, makeBrambleColossus. Test hooks for headless checks are on window.__bench.
(function () {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
 const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a)), PI = Math.PI;
 const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const MOVES = [
  { id: 'appear', name: 'Awakening', cap: 'The ground shakes and splits among the old stones, and it heaves up out of the earth; its legs slam down round it, it rears, its birds burst out of it, and its flower bursts open in a roar of light.' },
  { id: 'alert', name: 'Alert', cap: 'It senses prey. The spire turns and leans at it, the flower parts on the glow of its heart, every cane rises toward it, and the birds lift off its arms.' },
  { id: 'quake', name: 'Rootquake', isNew: true, cap: 'It rears and roars, then drives every cane into the earth. The ground splits from its feet out to the party, and its great roots heave up out of the soil in three waves, the last under the party\'s feet: one blow on everyone. Then they sink back.' },
  { id: 'hurl', name: 'Monolith', isNew: true, cap: 'Its left arm reaches round to the standing stone at its left, coils round it and tears it out of the earth, swings it high and back at its side, and hurls it at its prey, where it shatters. Then its roots draw the stone back up where it stood.' },
  { id: 'bloom', name: 'Siren Bloom', cap: 'Its double flower opens as wide as a room, its arms spread in welcome, and sweet glowing pollen pours off its heart over the party, who take a step toward it. A charm, not damage.' },
  { id: 'lance', name: 'Thorn Lance', cap: 'Its lead arm, bristling with old arrows, draws back high over the spire, then spears down through its prey into the ground, and rips free.' },
  { id: 'slam', name: 'Hammerfall', cap: 'Both arms rise high and twine into one great club, hang there while the heart blazes, then fall on its prey; the ground splits and a shockwave runs out over the whole party.' },
  { id: 'whirl', name: 'Maelstrom', cap: 'It winds round, then every cane whirls round it twice, flat out at three heights: a storm of thorns, dust and leaves that strikes the whole party four times.' },
  { id: 'volley', name: 'Thorn Volley', cap: 'It rears, bristling, and cracks its arms and mane forward like whips, flinging its thorns in high arcs that rain down on the party in three waves.' },
  { id: 'devour', name: 'Devour', cap: 'Its arms seize its prey and lift it high; the flower opens, takes it in and shuts. Three gulps, each a blow and then a heal, while stolen life spirals down the spire into its roots; then it spits its prey back out.' },
  { id: 'briar', name: 'Thornwood', cap: 'It drives its canes into the soil; a pulse runs out along its roots, the ground splits, and shoots as tall as young trees burst up round its prey, close over it and squeeze.' },
  { id: 'enrage', name: 'Wrath', cap: 'At half its HP it curls in on itself, then bursts open in a ring of red light: its second phase. Its veins burn ember-red, its leaves redden, its heart beats faster and the carved signs on its stones burn with it.' },
  { id: 'hurt', name: 'Hurt', cap: 'It recoils, the spire rocking back and every cane flinching away.' },
  { id: 'burn', name: 'Scorch', cap: 'Its recoil from fire, which it fears: it rears away from the flames, beating at them, leaves and moss catching and curling black, and smoulders as it regroups.' },
  { id: 'block', name: 'Block', cap: 'Its arms cross before the spire and the flower shuts tight.' },
  { id: 'rest', name: 'Rest', cap: 'Bowed over its mound with its flower hidden among the leaves and moss: from far off, an old wooded hill among standing stones.' },
  { id: 'die', name: 'Felled', cap: 'A last flail and a last flare of its flower, then the spire cracks at its foot and topples like an old oak. Its birds scatter, its heart gives a last beat and goes dark, and it withers away, leaving its stones standing. Any move after this wakes it again.' },
 ];
 const IDLE_CAP = 'Its spire leans toward the party, the flower just parted on the glow of its heart; each heartbeat runs down into its roots and lights the signs carved on its stones. Fireflies drift round it and birds sit on its arms. Pick a move to play it, or Watch a fight; red marks are where a blow lands, gold marks are cues for the battle screen.';
 // its blows at level 1 (placeholders until the battle steps; they grow 20% a level with a swing of up to 25% either way),
 // which of them strike the whole party, what Devour heals, and how hard each shakes the camera and stops the world
 const BLOWS = { lance: [300], slam: [370, 170], whirl: [90, 90, 90, 110], volley: [125, 125, 140], devour: [80, 140, 140, 140], briar: [250, 340], quake: [300], hurl: [440] };
 const PARTY = { slam: [0, 1], whirl: [1, 1, 1, 1], volley: [1, 1, 1], bloom: [1], quake: [1] };
 const HEALS = { devour: 170 };
 const SHAKE = { lance: [.1], slam: [.17, .07], whirl: [.035, .035, .035, .05], volley: [.04, .04, .055], devour: [.04, .03, .03, .035], briar: [.11, .08], quake: [.16], hurl: [.17] };
 const STOP = { lance: .1, slam: .14, briar: .1, quake: .1, hurl: .13 };
 // the party's blows at level 1, and which of them burn: Io's dagger (three cuts) and flame, Sol's Flare Cut, Ember Rush
 // (four) and the Sunder that severs a great cane
 const HIT = { dagger: 90, flame: 220, flare: 320, rush: 110, sever: 150 };
 const FIRE = { flame: 1, flare: 1, rush: 1 };
 const ATK = { dagger: ['io', 'combo', [.17, .37, .58]], flame: ['io', 'throw', [.5]], flare: ['sol', 'flareCut', [.55]], rush: ['sol', 'emberRush', [.3, .42, .54, .66]], sever: ['sol', 'sunder', [.58]] };
 const HP1 = 8000;
 const TOGGLES = [{ id: 'walk', name: 'Creep', note: 'its legs walk' }, { id: 'guard', name: 'Guard', note: 'arms crossed' }, { id: 'spin', name: 'Turntable', note: 'slow turn' }];
 const opts = { level: 1, walk: false, guard: false, spin: false, party: 'both', prey: 'io', day: false, place: 'meadow', weather: 'clear', timeRuns: false, rings: true, small: false, auto: false, sound: false };
 const lvlK = () => Math.pow(1.2, opts.level - 1);
 const swing = (n) => Math.max(1, Math.round(n * (1 + (Math.random() * 2 - 1) * .25)));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);

 // ---------- renderer, scene, lights ----------
 const canvas = $('gl'), stage = $('stage');
 const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
 renderer.setClearColor(0x000000, 0); // with the glade off, the stage's own backdrop shows through
 renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
 const scene = new THREE.Scene();
 // the battle screen's lights (the Model Build Spec's Night square rig, its two lamps set further out for a creature this
 // big), and a plain overcast daylight
 const night = new THREE.Group(), day = new THREE.Group();
 night.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
 { const l = new THREE.DirectionalLight(0xb8c0ff, 0.62); l.position.set(-5, 9, -12); night.add(l); }
 { const l = new THREE.DirectionalLight(0xffdcc0, 0.42); l.position.set(2, 5, 10); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.7, 28, 2); l.position.set(6.5, 7, 11.5); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.4, 26, 2); l.position.set(-8.5, 6.5, -3.5); night.add(l); }
 day.add(new THREE.HemisphereLight(0xe2ebff, 0x5c4a36, 1.0));
 { const l = new THREE.DirectionalLight(0xfff0d6, 1.15); l.position.set(4, 9, 6); day.add(l); }
 { const l = new THREE.DirectionalLight(0xbcd0ff, 0.25); l.position.set(-6, 4, -5); day.add(l); }
 scene.add(night, day); day.visible = false;
 const glade = makeGlade({ radius: 13, rings: 14 }); scene.add(glade.root);
 // the wild meadow (built the first time it is chosen): its own sky, hours and weather, and the lights it asks for, which
 // at night are the Night square's (its two lanterns stand in for the battle's lamps)
 const rig = new THREE.Group(), rigHemi = new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1), rigSun = new THREE.DirectionalLight(0xb8c0ff, .62), rigFill = new THREE.DirectionalLight(0xffdcc0, .42);
 rigFill.position.set(2, 5, 10); rig.add(rigHemi, rigSun, rigFill); rig.visible = false; scene.add(rig);
 let meadow = null;
 function getMeadow() {
  if (!meadow) { meadow = makeMeadow({ radius: 13, rings: 14 }); meadow.setTime(21.5); meadow.onThunder = (k) => { shake(.02 + .03 * k); sfx(k > .8 ? 'thunderNear' : 'thunder', null, { gain: .5 + .5 * k }); }; scene.add(meadow.root); }
  return meadow;
 }

 // ---------- sounds, all made in code (living-battlefields/sfx.js); off until asked for, as browsers want a tap ----------
 const SND = window.makeFightSound ? makeFightSound() : null;
 const cam = new THREE.PerspectiveCamera(30, 1, .1, 280);
 const _sp = V3();
 function sfx(name, at, o) {
  if (!SND || !opts.sound) return; o = Object.assign({}, o || {});
  if (at && o.pan === undefined) { _sp.copy(at).project(cam); o.pan = cl(_sp.x * .8, -.9, .9); }
  SND.play(name, o);
 }

 // ---------- the party: Io and Sol as they are in their demos, or a plain 1.8 m figure in Io's place ----------
 const io = makeWitchOriginal(), sol = makeSolOriginal();
 scene.add(io.root, sol.root); if (io.fx) scene.add(io.fx); if (sol.fx) scene.add(sol.fx);
 const figure = new THREE.Group(), figBody = new THREE.Group(); figure.add(figBody); scene.add(figure);
 {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a4d63, roughness: .7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.17, .21, 1.05, 14), mat); body.position.y = 1.0; figBody.add(body);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(.19, .14, .5, 14), mat); legs.position.y = .25; figBody.add(legs);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), mat); hd.position.y = 1.67; figBody.add(hd);
 }
 // a soft blob shadow under each of them, as the battle draws them; it shrinks as they are lifted
 const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(8,4,14,.62)'); q.addColorStop(.5, 'rgba(8,4,14,.3)'); q.addColorStop(1, 'rgba(8,4,14,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
 })();
 const blobMesh = () => { const mm = new THREE.Mesh(new THREE.CircleGeometry(.55, 24), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); mm.rotation.x = -PI / 2; mm.renderOrder = -6; scene.add(mm); return mm; };
 // where each stands (further out than before the Colossus, for its longer reach), how she moves, and whether she is
 // held, charmed, knocked back, attacking or cheering
 const HEROES = [{ id: 'io', model: io, home: V3(1.7, 0, 10.4) }, { id: 'sol', model: sol, home: V3(-2.8, 0, 11.1) }, { id: 'fig', model: null, home: V3(1.7, 0, 10.4) }];
 for (const h of HEROES) Object.assign(h, { x: h.home.x, y: 0, z: h.home.z, vy: 0, yaw: PI, ph: 0, wb: 0, cheer: -1, atk: null, flinch: 0, charmed: false, cy: 1.15, shadow: blobMesh() });
 const [IO, SOL, FIG] = HEROES;
 const _v = V3(), _w = V3(), _h = V3();
 const heroOn = (h) => (opts.party === 'both' ? h !== FIG : opts.party === h.id);
 const preyHero = () => (opts.party === 'both' ? (opts.prey === 'sol' ? SOL : IO) : opts.party === 'none' ? null : HEROES.find((h) => h.id === opts.party));
 function chestOf(h, out) { if (h === IO) return io.chestPos(out); if (h === SOL) return sol.anchor('chest', out); return out.set(h.x, h.y + 1.15, h.z); }
 const headOf = (h, out) => { chestOf(h, out); out.y += .55; return out; };
 const isHeld = (h) => !!m && h === preyHero() && (m.holding || 0) > .01;
 function showParty() {
  for (const h of HEROES) { const on = heroOn(h); if (h.model) { h.model.root.visible = on; if (h.model.fx) h.model.fx.visible = on; } else figure.visible = on; h.shadow.visible = on; }
  for (const id of ['ioDagger', 'ioFlame']) $(id).querySelector('small').textContent = heroOn(IO) ? (id === 'ioDagger' ? 'three cuts' : 'it fears fire') : 'Io is not here: it lands at once';
  for (const id of ['solFlare', 'solRush']) $(id).querySelector('small').textContent = heroOn(SOL) ? (id === 'solFlare' ? 'one burning blow' : 'four, at a run') : 'Sol is not here: it lands at once';
  for (const b of $('preySeg').querySelectorAll('.wbtn')) b.disabled = opts.party !== 'both';
  if (m) aim();
 }
 // the Ancient aims at its prey's place: where she stands at chest height
 function aim() { const h = preyHero() || IO; m.state.target = V3(h.home.x, h.cy, h.home.z); }

 // ---------- the Ancient ----------
 const view = { yaw: .8, pitch: .15, dist: 40, ty: 4.4, tz: 5.8 };
 const home = Object.assign({}, view);
 let m = null, small = null, buildMs = 0, hp = 1, hpMax = 1, deadT = -1, wrathDone = false, lastAct = '', lastP = -1, lastBeats = 0, lastStartles = 0;
 function dispose(o) { o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { for (const k of ['map', 'normalMap', 'emissiveMap']) if (x.material[k]) x.material[k].dispose(); if (x.material.uniforms && x.material.uniforms.uMap) x.material.uniforms.uMap.value.dispose(); x.material.dispose(); } }); }
 function placeParty() {
  for (const h of HEROES) {
   Object.assign(h, { x: h.home.x, y: 0, z: h.home.z, vy: 0, fly: 0, held: 0, yaw: Math.atan2(-h.home.x, -h.home.z), cheer: -1, atk: null, charmed: false, wb: 0 });
   if (h.model) { h.model.reset(); h.model.root.position.set(h.x, 0, h.z); h.model.root.rotation.set(0, h.yaw, 0); h.model.animate(0, 0, 0, 0); chestOf(h, _v); h.cy = _v.y; }
  }
 }
 function build() {
  if (m) { scene.remove(m.root, m.fx); dispose(m.root); dispose(m.fx); }
  const t0 = performance.now();
  m = makeBrambleAncient({ level: opts.level });
  buildMs = performance.now() - t0;
  scene.add(m.root, m.fx);
  placeParty(); aim(); m.guard(opts.guard);
  hpMax = hp = Math.round(HP1 * lvlK()); deadT = -1; wrathDone = false; setWrath(false); setHP(); setWilt(0);
  lastBeats = m.beats; lastStartles = m.startles;
  $('tagName').textContent = 'Bramble Ancient' + (opts.level > 1 ? ' · level ' + opts.level : '');
  $('tagDesc').textContent = 'Boss · a test of the Colossus grown old';
  if (small) { scene.remove(small.root, small.fx); dispose(small.root); dispose(small.fx); small = null; }
  setSmall(opts.small);
  renderMoves(); updateStats(); updateCanes(); setAct('');
 }
 // the Colossus it grew from, beside it at its own size, off its right side and facing Sol (built the first time it is
 // asked for)
 function setSmall(on) {
  opts.small = on; $('small').setAttribute('aria-pressed', String(on));
  if (on && !small && window.makeBrambleColossus) { small = makeBrambleColossus({ level: opts.level }); small.root.position.set(-15, 0, 5); small.root.rotation.y = 1.25; small.state.target = V3(-2.8, 1.2, 11.1); scene.add(small.root, small.fx); }
  if (small) small.root.visible = small.fx.visible = on;
 }

 // ---------- HP, its Wrath, and wilt ----------
 function setHP() {
  const f = hp / hpMax; $('hpFill').style.width = (f * 100).toFixed(1) + '%'; $('hpFill').classList.toggle('low', f < .25 && !(m && m.state.wrath > .5));
  $('hpVal').textContent = Math.round(hp).toLocaleString('en-US') + ' / ' + hpMax.toLocaleString('en-US');
 }
 function setWrath(on) {
  m.state.wrath = on ? 1 : 0; $('phase').textContent = on ? 'Wrath' : 'Calm'; $('phase').classList.toggle('wrath', on);
  if (meadow) meadow.setWrath(on ? 1 : 0); // in the meadow the sky turns to a red storm
  $('wrath').setAttribute('aria-pressed', String(on)); $('hpFill').classList.toggle('wrath', on); setHP();
 }
 function setWilt(w) { w = cl(w, 0, 1); m.state.wilt = w; $('wilt').value = Math.round(w * 100); $('wiltOut').textContent = Math.round(w * 100) + '%'; }
 const hpWilt = () => setWilt((1 - hp / hpMax) * .8);

 // ---------- numbers, rings, the flash, the shake and the hit-stop ----------
 const pops = $('pops');
 function toScreen(p) { _w.copy(p).project(cam); return [(_w.x + 1) / 2 * stage.clientWidth, (1 - _w.y) / 2 * stage.clientHeight, _w.z]; }
 function pop(text, p3, cls) {
  const p = toScreen(p3); if (p[2] > 1) return;
  const d = document.createElement('div'); d.className = 'dmg ' + (cls || ''); d.textContent = typeof text === 'number' ? text.toLocaleString('en-US') : text;
  d.style.left = (p[0] + (Math.random() - .5) * 24) + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove()); pops.appendChild(d);
 }
 function ring(p3, cls) { const p = toScreen(p3); if (p[2] > 1) return; const d = document.createElement('div'); d.className = 'ring ' + (cls || ''); d.style.left = p[0] + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove()); pops.appendChild(d); }
 let shakeA = 0, flashA = 0, stopT = 0;
 const shake = (a) => { if (!REDUCED) shakeA = Math.max(shakeA, a); };
 const flash = (a, p3) => { if (REDUCED) return; flashA = Math.max(flashA, a); if (p3) { const p = toScreen(p3); stage.style.setProperty('--fx', p[0] + 'px'); stage.style.setProperty('--fy', p[1] + 'px'); } };
 const hitStop = (s) => { stopT = Math.max(stopT, s); };

 // ---------- its blows on the party ----------
 function heroHurt(h) { if (h.model && h.cheer < 0 && !isHeld(h)) { h.model.play('hurt', true); h.atk = null; } else if (!h.model) h.flinch = 1; sfx('thud', _v.set(h.x, 1, h.z), { gain: .45 }); }
 function onHit(name, i) {
  meadowHit(name, i); soundHit(name, i);
  const all = PARTY[name] && PARTY[name][i], targets = all ? HEROES.filter(heroOn) : [preyHero()].filter(Boolean);
  if (!targets.length) return;
  if (name === 'bloom') { for (const h of targets) { headOf(h, _h); pop('Charmed', _h, 'word'); h.charmed = true; } return; }
  const base = (BLOWS[name] || [])[i]; if (!base) return;
  const big = name === 'lance' || name === 'quake' || name === 'hurl' || (name === 'slam' && i === 0) || (name === 'briar' && i === 1);
  const rc = name === 'briar' || name === 'devour' ? 'vein' : name === 'quake' ? 'root' : name === 'hurl' ? 'stone' : '';
  for (const h of targets) { headOf(h, _h); pop(swing(base * lvlK()), _h, big ? 'big' : ''); chestOf(h, _v); ring(_v, rc); heroHurt(h); }
  if (name === 'hurl') { headOf(targets[0], _h); _h.y += .9; pop('Crushed', _h, 'stone'); }
  shake((SHAKE[name] || [])[i] || .03); if (STOP[name] && !(name === 'slam' && i > 0)) hitStop(STOP[name]);
  if (big) { m.anchor(name === 'slam' ? 'grasp' : name === 'lance' ? 'hit' : name === 'hurl' ? 'stone' : 'snare', _v); flash(.55, _v); }
 }
 // in the meadow its blows land in the grass: a shockwave runs out through it, and the bigger ones shake the trees and put
 // the birds up
 const rnd2 = (a) => (Math.random() * 2 - 1) * a;
 function preyFeet() { const T = m.state.target; return [T ? T.x : 1.7, T ? T.z : 10.4]; }
 function meadowHit(name, i) {
  if (opts.place !== 'meadow' || !meadow) return;
  const [tx, tz] = preyFeet();
  if (name === 'lance') meadow.impact(tx, tz, .6);
  if (name === 'slam') meadow.impact(tx, tz, i ? 1 : .7);
  if (name === 'briar') meadow.impact(tx, tz, i ? .5 : .65);
  if (name === 'devour' && i === 0) meadow.impact(tx, tz, .3);
  if (name === 'volley') { const hs = HEROES.filter(heroOn); for (const h of hs.length ? hs : [IO]) meadow.impact(h.home.x + rnd2(1.5), h.home.z + rnd2(1.5), .3); }
  if (name === 'quake') { const hs = HEROES.filter(heroOn); for (const h of hs.length ? hs : [IO]) meadow.impact(h.home.x, h.home.z, .8); }
  if (name === 'hurl') meadow.impact(tx, tz, 1);
 }
 function meadowCue(name, i) {
  if (opts.place !== 'meadow' || !meadow) return;
  const [tx, tz] = preyFeet();
  if (name === 'appear') { if (i === 0) meadow.impact(0, 0, .5); else { meadow.roar(1); meadow.impact(0, 0, .9); } }
  if (name === 'alert') meadow.roar(.35);
  if (name === 'enrage') { meadow.roar(1); meadow.impact(0, 0, 1); }
  if (name === 'devour' && i === 3) meadow.roar(.5);
  if (name === 'die' && i === 1) { m.anchor('bud', _v); meadow.impact(_v.x, _v.z, 1); }
  if (name === 'quake') { if (i === 0) meadow.roar(.9); else if (i === 1) meadow.impact(0, 0, .8); else { const f = i === 2 ? .42 : .7; meadow.impact(tx * f, tz * f, .55); } }
  if (name === 'hurl' && (i === 1 || i === 3)) { m.anchor('stone', _v); meadow.impact(_v.x, _v.z, i === 1 ? .6 : .35); }
 }
 // its cues: Devour heals it after each gulp; the Awakening rumbles and roars; Wrath turns it; Thornwood's canes stab the
 // soil; Rootquake roars, stabs the soil and splits it; the Monolith's stone tears out and rises again; Felled's spire hits
 // the ground
 function onCue(name, i) {
  meadowCue(name, i); soundCue(name, i);
  if (name === 'devour' && i < 3 && preyHero()) { const n = swing(HEALS.devour * lvlK()); hp = Math.min(hpMax, hp + n); setHP(); hpWilt(); m.anchor('bud', _h); pop('+' + n.toLocaleString('en-US'), _h, 'heal'); }
  if (name === 'appear') { if (i === 0) shake(.05); else { shake(.13); m.anchor('bud', _v); flash(.7, _v); } }
  if (name === 'enrage') { setWrath(true); shake(.13); m.anchor('bud', _v); flash(.7, _v); }
  if (name === 'briar' && i === 0) { shake(.08); hitStop(.05); }
  if (name === 'quake') { if (i === 0) shake(.04); else if (i === 1) { shake(.1); hitStop(.05); m.anchor('bud', _v); flash(.3, _v); } else shake(.07); }
  if (name === 'hurl') { if (i === 1) { shake(.08); m.anchor('stone', _v); flash(.25, _v); } if (i === 3) shake(.04); }
  if (name === 'die' && i === 1) { shake(.16); hitStop(.08); }
  if (name === 'die' && i === 2) { m.anchor('heart', _v); flash(.35, _v); }
 }
 // each move's sounds, at its start, its hits and its cues (the living battlefield's, and the Ancient's own)
 function soundStart(name) {
  m.anchor('bud', _v);
  const S = {
   appear: () => sfx('rumble', _v, { gain: 1.2 }), alert: () => { sfx('creak', _v); sfx('growl', _v, { gain: .7 }); },
   bloom: () => { sfx('bloom', _v); sfx('pollen', _v, { delay: .6 }); }, lance: () => { sfx('creak', _v, { gain: .8 }); sfx('swoosh', _v, { delay: .55, rate: .8 }); },
   slam: () => { sfx('creak', _v, { gain: 1.1 }); sfx('rise', _v, { gain: .9 }); }, whirl: () => sfx('whirl', _v, { gain: 1.1 }),
   volley: () => sfx('creak', _v, { gain: .9 }), devour: () => sfx('creak', _v), briar: () => sfx('creak', _v, { rate: .8 }),
   enrage: () => sfx('growl', _v, { gain: 1, rate: .85 }), hurt: () => { sfx('shriek', _v, { gain: .55, rate: 1.1 }); sfx('creak', _v, { gain: .5, rate: 1.2 }); }, burn: () => { sfx('sizzle', _v); sfx('shriek', _v, { gain: .75, rate: 1.05 }); },
   die: () => sfx('shriek', _v, { gain: 1, rate: .85, delay: .3 }), block: () => sfx('creak', _v, { rate: 1.3 }),
   quake: () => { sfx('creak', _v, { gain: 1.1, rate: .7 }); sfx('growl', _v, { gain: .8, rate: .8 }); }, hurl: () => sfx('creak', _v, { gain: .9, rate: .85 }),
  }[name];
  if (S) S();
 }
 function soundHit(name, i) {
  const T = m.state.target || _h.set(1.7, 0, 10.4);
  if (name === 'lance') { sfx('slam', T, { gain: 1 }); sfx('crack', T, { gain: .7 }); }
  if (name === 'slam') { if (!i) { sfx('smash', T, { gain: 1.3 }); sfx('crack', T, { gain: 1, delay: .05 }); sfx('debris', T, { delay: .15 }); } else sfx('shockwave', T, { gain: 1.1 }); }
  if (name === 'whirl') { sfx('whip', T, { rate: 1 + i * .06 }); sfx('rustle', T, { gain: .5 }); }
  if (name === 'volley') { sfx('thorns', T, { gain: .8 }); for (let k = 0; k < 4; k++) sfx('thunk', HEROES[k % 2].home, { delay: .08 + k * .07, rate: .9 + Math.random() * .3, gain: .7 }); }
  if (name === 'devour' && !i) { sfx('grab', T); }
  if (name === 'devour' && i) sfx('thud', T, { gain: .5 });
  if (name === 'briar') { if (!i) { sfx('crack', T, { gain: 1 }); sfx('shoots', T, { gain: 1.1 }); } else sfx('squeeze', T); }
  if (name === 'bloom') sfx('charm', T);
  if (name === 'quake') { sfx('crash', T, { gain: 1.2, rate: .85 }); sfx('debris', T, { delay: .1 }); sfx('shockwave', T, { gain: .9, delay: .05 }); }
  if (name === 'hurl') { sfx('smash', T, { gain: 1.4, rate: .8 }); sfx('crash', T, { gain: 1, delay: .04 }); sfx('debris', T, { delay: .12, gain: 1.2 }); sfx('shockwave', T, { gain: .8, delay: .06 }); }
 }
 function soundCue(name, i) {
  m.anchor('bud', _v);
  if (name === 'appear') { if (i === 0) sfx('crack', V3(0, 0, 0), { gain: 1.2 }); else { sfx('roar', _v, { gain: 1.3 }); sfx('burst', _v); sfx('birds', _v, { delay: .4, gain: .7 }); } }
  if (name === 'alert') sfx('growl', _v, { gain: .5 });
  if (name === 'slam' && i === 0) sfx('heartbeat', _v, { gain: 1.2 });
  if (name === 'volley') sfx('whip', _v, { gain: 1, rate: i ? 1.1 : .95 });
  if (name === 'devour') { if (i < 3) sfx('gulp', _v, { rate: .9 + i * .08 }); else { sfx('burst', _v, { gain: .8 }); sfx('growl', _v, { gain: .6 }); } }
  if (name === 'briar' && i === 1) sfx('creak', _v, { rate: 1.2 });
  if (name === 'enrage') { sfx('roar', _v, { gain: 1.4, rate: .92 }); sfx('burst', _v, { gain: 1.1 }); sfx('thunder', null, { delay: .5, gain: 1 }); }
  if (name === 'die') { if (i === 0) sfx('creak', _v, { gain: 1.2, rate: .7 }); if (i === 1) { sfx('crash', _v, { gain: 1.4 }); sfx('debris', _v, { delay: .2 }); } if (i === 2) sfx('heartbeat', _v, { gain: .8, rate: .8 }); }
  if (name === 'quake') {
   const [tx, tz] = preyFeet();
   if (i === 0) sfx('roar', _v, { gain: 1.4, rate: .8 });
   else if (i === 1) { sfx('slam', V3(0, 0, 3), { gain: 1.2, rate: .75 }); sfx('rumble', V3(0, 0, 3), { gain: 1.3 }); sfx('shockwave', V3(0, 0, 3), { gain: .7, delay: .05 }); }
   else { const f = i === 2 ? .42 : .7; _h.set(tx * f, 0, tz * f); sfx('crack', _h, { gain: 1.1, rate: .9 + .1 * (i - 2) }); sfx('debris', _h, { gain: .8, delay: .08 }); }
  }
  if (name === 'hurl') {
   m.anchor('stone', _h);
   if (i === 0) { sfx('grab', _h, { gain: .9, rate: .85 }); sfx('creak', _h, { gain: .8, rate: .75, delay: .1 }); }
   if (i === 1) { sfx('crack', _h, { gain: 1.2, rate: .85 }); sfx('debris', _h, { gain: 1, delay: .06 }); sfx('rumble', _h, { gain: .8 }); }
   if (i === 2) { sfx('swoosh', _h, { gain: 1.3, rate: .55 }); sfx('roar', _v, { gain: .9, rate: 1.05 }); }
   if (i === 3) { sfx('rise', _h, { gain: .9, rate: .8 }); sfx('rumble', _h, { gain: .6 }); }
  }
 }

 // ---------- the party's blows on it ----------
 const fireball = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(255,250,240,1)'); q.addColorStop(.25, 'rgba(255,170,90,.9)'); q.addColorStop(.6, 'rgba(190,80,255,.45)'); q.addColorStop(1, 'rgba(120,40,200,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const grp = new THREE.Group(), parts = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(mat); s.scale.setScalar(.5 - i * .06); grp.add(s); parts.push(s); }
  grp.visible = false; scene.add(grp); return { grp, parts, from: V3(), to: V3(), t: -1, trail: [] };
 })();
 const aimAt = (out) => m.anchor(m.open > .62 ? 'heart' : 'chest', out);
 function wake() {
  m.play('appear', true); setAct('appear'); soundStart('appear'); deadT = -1; hp = hpMax; wrathDone = false; setWrath(false); hpWilt(); updateCanes();
  for (const h of HEROES) if (h.cheer >= 0 && h.model) { h.model.reset(); h.cheer = -1; }
 }
 function strikeBack(kind) {
  if (!m) return;
  if (m.gone) { wake(); return; }
  if (deadT >= 0) return; // they wait for it to finish falling
  const [hid, act, hits] = ATK[kind], h = hid === 'io' ? IO : SOL;
  if (!heroOn(h) || isHeld(h) || h.cheer >= 0) { if (!h.atk) for (let i = 0; i < hits.length; i++) landBlow(kind, i === hits.length - 1, i); return; }
  if (h.atk || fireball.t >= 0) return;
  h.model.play(act, true); h.atk = { kind, act, hits, n: 0 };
  _v.set(h.x, 1, h.z);
  if (kind === 'dagger') sfx('slash', _v, { delay: .15 });
  if (kind === 'flame') sfx('spell', _v, { delay: .25 });
  if (kind === 'flare') { sfx('swoosh', _v, { delay: .45, rate: 1.1 }); sfx('flare', _v, { delay: .4 }); }
  if (kind === 'rush') sfx('rush', _v);
  if (kind === 'sever') sfx('swoosh', _v, { delay: .5, rate: .85, gain: 1.1 });
 }
 function landBlow(kind, last, i) {
  if (!m || m.gone || deadT >= 0) return;
  const weak = m.open > .62, fire = !!FIRE[kind];
  let n = swing(HIT[kind] * lvlK()); if (weak) n *= 2;
  aimAt(_v); ring(_v, weak ? 'heart' : fire ? 'vein' : ''); _h.copy(_v); _h.y += .9 + (i || 0) * .5; // a run of hits stacks up
  pop(n, _h, (fire ? 'fire ' : '') + (weak || kind === 'flare' ? 'big' : ''));
  if (weak) { _h.y += 1.1; pop('Weak point!', _h, 'weak'); sfx('weak', _v, { gain: 1.1 }); }
  if (fire) sfx('fireHit', _v, { gain: .9 });
  sfx(kind === 'dagger' ? 'cut' : kind === 'flame' ? 'fireBurst' : 'swordHit', _v, { rate: .95 + Math.random() * .1 });
  shake(weak ? .06 : fire ? .04 : .03); hitStop(weak ? .08 : .045);
  if (kind === 'sever') { for (const k of [2, 3, 1, 0]) if (m.sever(k) >= 0) break; updateCanes(); sfx('crash', _v, { gain: .8, rate: 1.25 }); } // the mane first, then its arms
  hp = Math.max(0, hp - n); setHP(); hpWilt();
  if (hp <= 0) { m.play('die', true); deadT = 0; setAct('die'); soundStart('die'); return; }
  if (!wrathDone && hp <= hpMax * .5) { wrathDone = true; m.play('enrage', true); setAct('enrage'); soundStart('enrage'); return; }
  if (!last) return;
  const a = fire ? 'burn' : 'hurt', cur = m.action;
  if (!m.busy || m.ACTIONS[cur].interrupt || cur === 'alert' || cur === 'rest' || cur === 'bloom') { m.play(a, true); setAct(a); soundStart(a); }
 }

 // ---------- the party, every frame ----------
 function stepHero(h, dt, t) {
  if (!heroOn(h)) return;
  const md = h.model, prey = h === preyHero(), H = prey ? m.holding || 0 : 0, inside = prey ? m.inside || 0 : 0, wasHeld = h.held || 0; h.held = H;
  // her blow in flight: each of its hits lands as her action reaches it; another action (hurt) cuts it short
  if (h.atk && md) {
   const A = h.atk, u = md.action === A.act ? md.progress : md.action === '' ? 1 : -2;
   if (u === -2) h.atk = null;
   else {
    while (A.n < A.hits.length && u >= A.hits[A.n]) {
     const i = A.n++;
     if (A.kind === 'flame') { io.flamePos(fireball.from); aimAt(fireball.to); fireball.t = 0; fireball.grp.visible = true; fireball.trail.length = 0; sfx('fireBurst', fireball.from, { gain: .6, rate: 1.3 }); }
     else landBlow(A.kind, i === A.hits.length - 1, i);
    }
    if (A.n >= A.hits.length && !md.busy) h.atk = null;
   }
  }
  // where she belongs: home; a few steps toward the flower while charmed; in its arms while held, and hidden while she is
  // inside its shut flower
  if (m.action !== 'bloom') h.charmed = false;
  let tx = h.home.x, tz = h.home.z;
  if (h.charmed) { m.anchor('bloom', _v); tx = lerp(h.home.x, _v.x, .22); tz = lerp(h.home.z, _v.z, .22); }
  if (H > .01) {
   m.anchor('held', _v);
   h.x = lerp(h.x, _v.x, H); h.z = lerp(h.z, _v.z, H); h.y = lerp(h.y, Math.max(0, _v.y - h.cy), H); h.vy = 0; h.wb = Math.max(0, h.wb - dt * 3); h.fly = 0;
  } else {
   // let go far from her place (its move cut short), she is flung back to it; otherwise she drops to the soil
   if (wasHeld > .3 && Math.hypot(h.home.x - h.x, h.home.z - h.z) > 2) { const T = 1.1; h.fly = T; h.vx = (h.home.x - h.x) / T; h.vz = (h.home.z - h.z) / T; h.vy = (4.9 * T * T - h.y) / T; }
   if (h.fly > 0) { h.fly -= dt; h.x += h.vx * dt; h.z += h.vz * dt; }
   if (h.y > 0 || h.vy > 0) { h.vy -= 9.8 * dt; h.y = Math.max(0, h.y + h.vy * dt); if (h.y === 0) { if (h.vy < -6) { shake(.03); sfx('thud', _v.set(h.x, 0, h.z), { gain: .7 }); } h.vy = 0; h.fly = 0; } }
   // knocked back by her own hurt, lunging with her blade, or walking back to her place
   if (h.fly > 0) h.wb = Math.max(0, h.wb - dt * 3);
   else if (md && md.busy && md.dash) { h.x += Math.sin(h.yaw) * md.dash * dt; h.z += Math.cos(h.yaw) * md.dash * dt; }
   else {
    const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz);
    if (d > .04 && h.y === 0) { const sp = Math.min(1.6, .4 + 2 * d) * dt, s = Math.min(1, sp / d); h.x += dx * s; h.z += dz * s; h.ph += sp * 4.4; h.wb = Math.min(1, h.wb + dt * 3); }
    else h.wb = Math.max(0, h.wb - dt * 3);
   }
  }
  // she faces the Ancient, or turns to walk back when she was carried or thrown far from her place
  const away = Math.hypot(h.home.x - h.x, h.home.z - h.z), face = away > .6 && h.wb > .3 && H < .01 ? Math.atan2(h.home.x - h.x, h.home.z - h.z) : Math.atan2(-h.x, -h.z);
  if (!(md && md.busy && md.dash)) h.yaw += wrapA(face - h.yaw) * (1 - Math.exp(-dt * 6));
  // they cheer when it falls
  if (deadT > 2.4 && h.cheer < 0 && md) { md.play('victory', true); h.cheer = 1; h.atk = null; if (h === IO) sfx('victory', null, { gain: .7 }); }
  h.shadow.visible = inside < .5; h.shadow.position.set(h.x, .015, h.z); h.shadow.scale.setScalar(Math.max(.35, 1 - h.y * .25)); h.shadow.material.opacity = Math.max(.2, 1 - h.y * .3);
  if (md) {
   md.root.visible = inside < .5; if (md.fx) md.fx.visible = md.root.visible;
   md.root.position.set(h.x, h.y, h.z); md.root.rotation.y = h.yaw; md.root.rotation.x = H * -.18; md.animate(h.ph, h.wb, t, dt);
  } else {
   h.flinch = Math.max(0, h.flinch - dt * 3.2); figure.visible = inside < .5;
   figure.position.set(h.x, h.y, h.z); figure.rotation.y = h.yaw; figBody.rotation.x = -.35 * Math.sin(PI * h.flinch) - H * .15;
  }
 }
 function stepFireball(dt) {
  if (fireball.t < 0) return;
  fireball.t += dt / .45; const f = Math.min(1, fireball.t);
  aimAt(fireball.to); _v.copy(fireball.from).lerp(fireball.to, f); _v.y += Math.sin(PI * f) * 1.2;
  fireball.trail.unshift(_v.clone()); if (fireball.trail.length > fireball.parts.length * 2) fireball.trail.pop();
  fireball.parts.forEach((s, i) => s.position.copy(fireball.trail[Math.min(fireball.trail.length - 1, i * 2)]));
  if (f >= 1) { fireball.t = -1; fireball.grp.visible = false; landBlow('flame', true); }
 }

 // ---------- Watch a fight: it and the party take turns until it falls, then it wakes again ----------
 const AUTO = { t: 0, turn: 'boss', last: '', next: null, wait: 0 };
 const CALM = [['bloom', 1], ['lance', 1.6], ['slam', 1.4], ['whirl', 1.1], ['volley', 1.3], ['devour', 1.2], ['briar', 1.1], ['quake', 1.6], ['hurl', 1.8]];
 const WRATH = [['bloom', .5], ['lance', 1.3], ['slam', 1.8], ['whirl', 1.8], ['volley', 1.4], ['devour', 1.3], ['briar', 1.8], ['quake', 2.2], ['hurl', 2.2]];
 function autoStep(dt) {
  if (!opts.auto || !m) return;
  if (deadT >= 0) { AUTO.next = null; if (deadT > 7.5) wake(); return; }
  if (AUTO.next) { if ((AUTO.wait -= dt) <= 0) { strikeBack(AUTO.next); AUTO.next = null; } return; }
  if (m.gone || m.busy || HEROES.some((h) => h.atk) || fireball.t >= 0 || HEROES.some((h) => heroOn(h) && h.model && h.model.busy)) { AUTO.t = 0; return; }
  if ((AUTO.t += dt) < (AUTO.turn === 'boss' ? 1.1 : .7)) return;
  AUTO.t = 0;
  if (AUTO.turn === 'boss') {
   // its lead arm lances and its left arm throws the stone: once one is severed, its move waits until it grows back
   const pool = (m.state.wrath > .5 ? WRATH : CALM).filter(([id]) => id !== AUTO.last && (id !== 'devour' || preyHero()) && !(id === 'lance' && m.cut(0)) && !(id === 'hurl' && m.cut(1)));
   let r = Math.random() * pool.reduce((s, x) => s + x[1], 0), pick = pool[0][0];
   for (const [id, w] of pool) if ((r -= w) <= 0) { pick = id; break; }
   AUTO.last = pick; if (m.play(pick, true)) { setAct(pick); soundStart(pick); } AUTO.turn = 'party';
  } else {
   // both of them strike, Sol a moment after Io
   const ioK = heroOn(IO) || !heroOn(SOL) ? (Math.random() < .5 ? 'dagger' : 'flame') : null, solK = heroOn(SOL) ? (Math.random() < .6 ? 'flare' : 'rush') : null;
   if (ioK) strikeBack(ioK); if (solK) { AUTO.next = solK; AUTO.wait = ioK ? .5 : 0; } AUTO.turn = 'boss';
  }
 }

 // ---------- camera: drag to orbit, wheel or pinch to zoom; the shake rides on top ----------
 let shT = 0;
 function placeCam(rdt) {
  const c = Math.cos(view.pitch), k = view.dist / 12; shT += rdt;
  const sx = shakeA * k * Math.sin(shT * 73), sy = shakeA * k * Math.sin(shT * 59 + 1.3) * .8;
  cam.position.set(Math.sin(view.yaw) * view.dist * c, view.ty + Math.sin(view.pitch) * view.dist, view.tz + Math.cos(view.yaw) * view.dist * c);
  cam.lookAt(0, view.ty, view.tz);
  if (shakeA > 1e-4) { cam.translateX(sx); cam.translateY(sy); }
 }
 const pts = new Map(); let pinch0 = 0, dist0 = 0;
 stage.addEventListener('pointerdown', (e) => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); stage.classList.add('drag'); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = view.dist; } });
 stage.addEventListener('pointermove', (e) => {
  const p = pts.get(e.pointerId); if (!p) return;
  if (pts.size === 1) { view.yaw -= (e.clientX - p.x) * .006; view.pitch = Math.max(.02, Math.min(1.3, view.pitch + (e.clientY - p.y) * .004)); }
  p.x = e.clientX; p.y = e.clientY;
  if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) view.dist = Math.max(9, Math.min(80, dist0 * pinch0 / d)); }
 });
 const up = (e) => { pts.delete(e.pointerId); if (!pts.size) stage.classList.remove('drag'); pinch0 = 0; };
 stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
 stage.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(9, Math.min(80, view.dist * Math.exp(e.deltaY * .0012))); }, { passive: false });
 $('resetView').addEventListener('click', () => Object.assign(view, home));

 // ---------- controls ----------
 function wbtn(label, small, pressed) { const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn'; b.innerHTML = '<span class="t"></span>' + (small !== null ? '<small></small>' : ''); b.querySelector('.t').textContent = label; if (small !== null) b.querySelector('small').textContent = small; if (pressed !== undefined) b.setAttribute('aria-pressed', String(!!pressed)); return b; }
 const fmt = (n) => n.toFixed(2).replace(/^0/, '');
 function playMove(id) {
  if (deadT >= 0 && id !== 'appear' && m.gone) { wake(); return; }
  if (m.play(id, true)) { setAct(m.action || id); soundStart(id); }
 }
 function renderMoves() {
  const box = $('moves'); box.innerHTML = '';
  for (const mv of MOVES) {
   const A = m.ACTIONS[mv.id], wide = PARTY[mv.id] && PARTY[mv.id].some(Boolean);
   const meta = A.dur.toFixed(1) + ' s' + (A.hits.length ? ' · ' + A.hits.length + (A.hits.length > 1 ? ' hits' : ' hit') : A.hold ? ' · holds' : '') + (wide ? ' ★' : '');
   const b = wbtn(mv.name, meta); b.dataset.id = mv.id; b.title = mv.cap; if (mv.isNew) b.classList.add('new');
   b.addEventListener('click', () => playMove(mv.id));
   box.appendChild(b);
  }
 }
 for (const tg of TOGGLES) {
  const b = wbtn(tg.name, tg.note, !!opts[tg.id]);
  b.addEventListener('click', () => { opts[tg.id] = !opts[tg.id]; b.setAttribute('aria-pressed', String(opts[tg.id])); if (tg.id === 'guard') m.guard(opts.guard); });
  $('toggles').appendChild(b);
 }
 for (const [id, name, tip] of [['both', 'Io and Sol', 'Io the Witch and Sol, as they are in their demos'], ['io', 'Io', 'Io alone'], ['fig', 'Figure', 'A plain 1.8 m figure, to judge its reach by'], ['none', 'None', 'Nobody']]) {
  const b = wbtn(name, null, opts.party === id); b.dataset.id = id; b.title = tip;
  b.addEventListener('click', () => { opts.party = id; for (const x of $('partySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); placeParty(); showParty(); });
  $('partySeg').appendChild(b);
 }
 for (const [id, name] of [['io', 'Io'], ['sol', 'Sol']]) {
  const b = wbtn(name, null, opts.prey === id); b.dataset.id = id; b.title = 'Who its single blows, Devour and the Monolith go for';
  b.addEventListener('click', () => { opts.prey = id; for (const x of $('preySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); aim(); });
  $('preySeg').appendChild(b);
 }
 function updateCanes() { const n = m.greatCanes; $('caneCount').textContent = n + ' of 4 great canes'; $('sever').disabled = n < 1; }
 $('ioDagger').addEventListener('click', () => strikeBack('dagger'));
 $('ioFlame').addEventListener('click', () => strikeBack('flame'));
 $('solFlare').addEventListener('click', () => strikeBack('flare'));
 $('solRush').addEventListener('click', () => strikeBack('rush'));
 $('sever').addEventListener('click', () => strikeBack('sever'));
 $('regrow').addEventListener('click', () => { if (m.gone || deadT >= 0) wake(); else { m.regrow(); hp = hpMax; wrathDone = false; setWrath(false); hpWilt(); sfx('shoots', m.anchor('bud', _v), { gain: .7 }); } updateCanes(); });
 $('wrath').addEventListener('click', () => setWrath(!(m.state.wrath > .5)));
 $('auto').addEventListener('click', (e) => { opts.auto = !opts.auto; e.currentTarget.setAttribute('aria-pressed', String(opts.auto)); AUTO.t = 0; AUTO.turn = m.busy ? 'party' : 'boss'; if (opts.auto && (m.gone || deadT >= 0)) wake(); });
 $('wilt').addEventListener('input', (e) => { const v = +e.target.value / 100; $('wiltOut').textContent = Math.round(v * 100) + '%'; m.state.wilt = v; });
 $('level').addEventListener('input', (e) => { $('levelOut').textContent = e.target.value; });
 $('level').addEventListener('change', (e) => { opts.level = +e.target.value; build(); });
 $('sound').addEventListener('click', (e) => {
  opts.sound = !opts.sound; e.currentTarget.setAttribute('aria-pressed', String(opts.sound)); e.currentTarget.textContent = opts.sound ? 'Sound on' : 'Sound off';
  if (SND) { if (opts.sound) SND.init(); SND.setMuted(!opts.sound); }
 });
 // Night square and Daylight: in the glade, the battle's light or an overcast day; in the meadow they set its clock to ten at
 // night (when its light is the Night square's) or to noon, so there they are not left pressed
 let mDay = false; // whether the meadow's clock says day (the glade keeps its own light in opts.day)
 function setLight(isDay) {
  if (opts.place === 'meadow') { meadow.setTime(isDay ? 12 : 22); syncHour(); mDay = isDay; }
  else { opts.day = isDay; day.visible = isDay; night.visible = !isDay; glade.setDay(isDay); }
  stage.classList.toggle('day', isDay); showDay(isDay);
 }
 function showDay(isDay) { const md = opts.place === 'meadow'; $('lightDay').setAttribute('aria-pressed', String(!md && isDay)); $('lightNight').setAttribute('aria-pressed', String(!md && !isDay)); }
 function setPlace(p) {
  opts.place = p; const md = p === 'meadow';
  if (md) { getMeadow(); meadow.setWrath(m && m.state.wrath > .5 ? 1 : 0); }
  if (meadow) { meadow.root.visible = md; meadow.setRings(opts.rings); }
  glade.root.visible = !md; glade.setScenery(p === 'glade'); glade.setRings(opts.rings);
  rig.visible = md; night.visible = !md && !opts.day; day.visible = !md && opts.day; glade.setDay(opts.day);
  if (md) mDay = meadow.day; stage.classList.toggle('day', md ? mDay : opts.day); showDay(md ? mDay : opts.day);
  $('lightNight').querySelector('small').textContent = md ? '10 pm, battle light' : 'the battle\'s light';
  $('lightDay').querySelector('small').textContent = md ? 'noon' : 'overcast';
  for (const b of $('placeSeg').querySelectorAll('.wbtn')) b.setAttribute('aria-pressed', String(b.dataset.id === p));
  $('meadowCtl').hidden = !md; if (md) syncHour();
 }
 const clock = (h) => { const mn = Math.round(h * 60) % 1440, hh = Math.floor(mn / 60); return ((hh + 11) % 12 + 1) + ':' + String(mn % 60).padStart(2, '0') + (hh < 12 ? ' am' : ' pm'); };
 let hourDrag = false;
 function syncHour() { if (!meadow || hourDrag) return; $('hour').value = meadow.time.toFixed(2); $('hourOut').textContent = clock(meadow.time); }
 function setWeather(id) { opts.weather = id; getMeadow().setWeather(id); for (const x of $('weatherSeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); }
 for (const [id, name, note] of [['meadow', 'Wild meadow', 'hours, weather'], ['glade', 'Wild glade', 'the first bench\'s'], ['bare', 'Bare floor', 'nothing round it']]) {
  const b = wbtn(name, note, opts.place === id); b.dataset.id = id; b.addEventListener('click', () => setPlace(id)); $('placeSeg').appendChild(b);
 }
 for (const [id, name, tip] of [['clear', 'Clear', 'A fair sky and a breeze'], ['rain', 'Rain', 'Rain, a stronger wind and puddles'], ['storm', 'Storm', 'A thunderstorm: lightning, thunder and a gale']]) {
  const b = wbtn(name, null, opts.weather === id); b.dataset.id = id; b.title = tip; b.addEventListener('click', () => setWeather(id)); $('weatherSeg').appendChild(b);
 }
 $('hour').addEventListener('pointerdown', () => { hourDrag = true; });
 for (const ev of ['pointerup', 'pointercancel', 'change']) $('hour').addEventListener(ev, () => { hourDrag = false; });
 $('hour').addEventListener('input', (e) => { getMeadow().setTime(+e.target.value); $('hourOut').textContent = clock(+e.target.value); });
 $('timeRuns').addEventListener('click', (e) => { opts.timeRuns = !opts.timeRuns; e.currentTarget.setAttribute('aria-pressed', String(opts.timeRuns)); });
 $('lightNight').addEventListener('click', () => setLight(false)); $('lightDay').addEventListener('click', () => setLight(true));
 $('rings').addEventListener('click', (e) => { opts.rings = !opts.rings; e.currentTarget.setAttribute('aria-pressed', String(opts.rings)); glade.setRings(opts.rings); if (meadow) meadow.setRings(opts.rings); });
 $('small').addEventListener('click', () => setSmall(!opts.small));

 // ---------- the move readout: name, length, and the hit and cue marks along it ----------
 let shown = null;
 const idleName = () => (opts.walk ? 'Creeping' : opts.guard ? 'Guard' : 'Idle');
 function setAct(id) {
  const mv = MOVES.find((x) => x.id === id), track = $('track');
  for (const t of track.querySelectorAll('.tick')) t.remove();
  for (const b of $('moves').children) b.classList.toggle('on', b.dataset.id === id);
  shown = id || null;
  if (!mv || !m.ACTIONS[id]) { $('actName').textContent = idleName(); $('actMeta').textContent = 'Rooted. Ancient. Hungry.'; $('actCap').textContent = IDLE_CAP; $('fill').style.width = '0'; shown = null; return; }
  const A = m.ACTIONS[id];
  $('actName').textContent = mv.name; $('actCap').textContent = mv.cap;
  $('actMeta').textContent = A.dur.toFixed(2) + ' s' + (A.hits.length ? ' · hits ' + A.hits.map(fmt).join(', ') : '') + (A.cues.length ? ' · cues ' + A.cues.map(fmt).join(', ') : '');
  for (const [list, cls] of [[A.cues, 'cue'], [A.hits, 'hit']]) for (const u of list) { const t = document.createElement('i'); t.className = 'tick ' + cls; t.style.left = (u * 100) + '%'; track.appendChild(t); }
 }
 function updateStats() {
  const s = m.stats;
  let fxd = 0; m.fx.traverse((o) => { if (o.isMesh || o.isPoints) fxd++; });
  const rows = [['triangles', Math.round(s.triangles / 100) / 10 + 'k'], ['draw calls', (s.drawCalls - fxd) + ' + ' + fxd + ' fx'], ['bones', s.bones], ['textures', s.textures], ['to its flower', m.height.toFixed(1) + ' m'], ['built in', Math.round(buildMs) + ' ms']];
  $('stats').innerHTML = rows.map(([k, v]) => '<div><b>' + v + '</b>' + k + '</div>').join('');
 }

 // ---------- loop ----------
 function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.fov = cam.aspect < .9 ? 42 : 30; cam.updateProjectionMatrix();
  // a tall phone screen (with its wider lens) comes a little closer, so the Ancient fills it with the party still in view
  const k = cam.aspect < .9 ? .82 : 1; if (home.k !== k) { const reset = view.dist === home.dist; home.k = k; home.dist = 40 * k; home.ty = 4.4 + (k - 1) * 3.4; if (reset) Object.assign(view, home); }
 }
 let gt = 0, phase = 0, statT = 0, rumbleT = 0, hourT = 0, ambT = 0;
 function step(rdt) {
  // hit-stop: the world holds still a moment when a heavy blow lands
  let dt = rdt; if (stopT > 0) { stopT -= rdt; dt = 0; }
  gt += dt;
  if (opts.walk && !m.busy) phase += dt * 3.2;
  if (opts.spin && !pts.size) view.yaw += rdt * .12;
  m.animate(phase, opts.walk ? 1 : 0, gt, dt);
  // its hits and cues, as the battle screen would see them
  const a = m.action, p = m.progress, A = a ? m.ACTIONS[a] : null;
  if (a !== lastAct) { lastP = -1; lastAct = a; }
  if (A && p >= 0) { A.hits.forEach((hh, i) => { if (lastP < hh && p >= hh) onHit(a, i); }); A.cues.forEach((hh, i) => { if (lastP < hh && p >= hh) onCue(a, i); }); lastP = p; }
  if (a === 'appear' && p >= 0 && p < .1 && hp < hpMax) { hp = hpMax; setHP(); hpWilt(); }
  if (a === 'appear' && p > .05 && p < .44) shake(.03); // the ground rumbles while it rises
  if (a === 'quake' && p > .34 && p < .62) shake(.035); // and while its roots heave
  // its heartbeat, faint, when it is still; its birds as they are put up
  if (m.beats !== lastBeats) { lastBeats = m.beats; if (!m.busy && !m.gone) sfx('heartbeat', m.anchor('heart', _v), { gain: .16, rate: .8 }); }
  if (m.startles !== lastStartles) { lastStartles = m.startles; sfx('birds', m.anchor('bud', _v), { gain: .7, delay: .15 }); }
  if (opts.place === 'meadow' && meadow) {
   // the meadow: the ground ripples while it rises and while its roots heave, its Maelstrom raises a whirlwind, and its
   // lights are the bench's
   if (a === 'appear' && p > .05 && p < .44 && (rumbleT -= dt) <= 0) { rumbleT = .45; meadow.impact(rnd2(2), rnd2(2), .3); }
   if (a === 'quake' && p > .34 && p < .6 && (rumbleT -= dt) <= 0) { rumbleT = .3; const [tx, tz] = preyFeet(), f = Math.random(); meadow.impact(tx * f + rnd2(2), tz * f + rnd2(2), .3); }
   meadow.vortex(0, 0, 12, a === 'whirl' && p > .12 && p < .8 ? 1 : 0);
   meadow.timeRate = opts.timeRuns ? .07 : 0; meadow.update(gt, dt, cam);
   const L = meadow.light; rigHemi.color.copy(L.hemiSky); rigHemi.groundColor.copy(L.hemiGround); rigHemi.intensity = L.hemiI;
   rigSun.position.copy(L.dir).multiplyScalar(20); rigSun.color.copy(L.color); rigSun.intensity = L.I; rigFill.color.copy(L.fillC); rigFill.intensity = L.fillI;
   if ((hourT += rdt) > .25) { hourT = 0; syncHour(); const dd = meadow.day; if (dd !== mDay) { mDay = dd; stage.classList.toggle('day', dd); } }
   if (SND && opts.sound && (ambT += rdt) > .5) { ambT = 0; const w = meadow.weather; SND.ambience({ wind: w === 'storm' ? .9 : w === 'rain' ? .6 : .3, gust: w === 'storm' ? .8 : .2, rain: w === 'storm' ? 1 : w === 'rain' ? .7 : 0, wrath: m.state.wrath > .5 ? 1 : 0, night: mDay ? 0 : 1 }); }
  } else if (SND && opts.sound && (ambT += rdt) > .5) { ambT = 0; SND.ambience({ wind: .25, wrath: m.state.wrath > .5 ? 1 : 0, night: opts.day ? 0 : 1 }); }
  if (deadT >= 0) deadT += dt;
  for (const h of HEROES) stepHero(h, dt, gt);
  stepFireball(dt);
  autoStep(rdt);
  if (small && small.root.visible) small.animate(0, 0, gt, dt);
  if (opts.place !== 'meadow') glade.update(gt);
  shakeA *= Math.exp(-rdt * 8); flashA *= Math.exp(-rdt * 6);
  placeCam(rdt);
  // the readout
  if (shown && p >= 0) $('fill').style.width = (p * 100).toFixed(1) + '%';
  else if (shown && !m.busy && !(m.ACTIONS[shown] && m.ACTIONS[shown].hold)) setAct('');
  else if (!shown && $('actName').textContent !== idleName()) $('actName').textContent = idleName();
  if (shown !== a && a && m.ACTIONS[a] && MOVES.some((x) => x.id === a)) setAct(a);
  if ((statT += rdt) > 1) { statT = 0; updateCanes(); }
 }
 function render() { $('flash').style.opacity = flashA > .01 ? flashA.toFixed(3) : '0'; renderer.render(scene, cam); }
 const DBG = { freeze: false };
 function start() {
  build(); setPlace(opts.place); showParty(); resize(); placeCam(0);
  new ResizeObserver(resize).observe(stage);
  wake(); // it rises out of the earth as the page opens
  let last = performance.now();
  function frame(now) {
   const rdt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
   if (!DBG.freeze) step(rdt);
   render();
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // test hooks for headless checks: freeze the clock, then step it by hand
  window.__bench = {
   ready: true, DBG, opts, view, get m() { return m; }, get meadow() { return meadow; }, io, sol, renderer, scene, cam, HEROES, SND, render,
   get hp() { return hp; }, get deadT() { return deadT; },
   play(name) { playMove(name); },
   advance(sec, quiet) { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) step(1 / 60); if (!quiet) render(); },
   strike(kind) { strikeBack(kind); },
   sound(on) { if (opts.sound !== !!on) $('sound').click(); },
   set(o) {
    if (o.view) Object.assign(view, o.view);
    if (o.party) { opts.party = o.party; placeParty(); showParty(); }
    if (o.prey) { opts.prey = o.prey; aim(); }
    if (o.place) setPlace(o.place);
    if (o.day !== undefined) setLight(o.day);
    if (o.level) { opts.level = o.level; build(); }
    if (o.scenery !== undefined) setPlace(o.scenery ? 'glade' : 'bare');
    if (o.time !== undefined) { getMeadow().setTime(o.time); syncHour(); }
    if (o.weather) setWeather(o.weather);
    if (o.timeRuns !== undefined) opts.timeRuns = !!o.timeRuns;
    if (o.small !== undefined) setSmall(o.small);
    if (o.wrath !== undefined) setWrath(!!o.wrath);
    if (o.auto !== undefined) { opts.auto = o.auto; AUTO.t = 0; AUTO.turn = 'boss'; }
    if (o.hp !== undefined) { hp = o.hp; setHP(); hpWilt(); }
   },
  };
 }
 // let the page paint "Waking the Ancient" before the models are built
 requestAnimationFrame(() => setTimeout(() => {
  try { start(); }
  catch (err) { $('tagName').textContent = 'The scene could not start'; $('tagDesc').textContent = err.message + '. This page needs WebGL.'; console.error(err); }
 }, 30));
})();
