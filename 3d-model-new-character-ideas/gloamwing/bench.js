// bench.js: the Gloamwing's model bench. The great night-flier hovers over the wild meadow, whose hours and weather turn
// by themselves and answer its blows, or over the wild glade under the battle screen's lights, and the party faces it: Io
// the Witch and Sol (their original models, as every bench's supporting actors are). It turns to face its prey; its Swoop
// and Glut land on her, its Wing Gale on everyone, and its Moonlure and Hush lay a lure and a silence on the whole party;
// Glut heals it, and every moth it swallows is one more soul in its sac. The party strikes back with dagger, flame and
// sword. An HP bar, numbers on the game's level curve, hit-stop, a shaking camera, sounds made in code (its wingbeats
// among them), a fight it can play by itself, and its action sheet's eight poses held one after another to set beside
// Chris's sheet. three.js r128 (global THREE); needs makeGloamwing, makeWitchOriginal, makeSolOriginal, makeMeadow,
// makeGlade and makeFightSound. Test hooks for headless checks are on window.__bench.
(function () {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a)), PI = Math.PI;
 const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const IDLE_CAP = 'It hangs in the air on slow, deep wingbeats, its wings raised and glowing amber where the light comes through them, its moon-sac shining under its chest with the souls it has swallowed fluttering inside. Its head turns to its prey in quick owl\'s snaps. Pick a move to play it, or Watch a fight; red marks are where a blow lands, gold marks are cues for the battle screen.';
 const MOVES = [
  { id: 'appear', name: 'Gloaming', cap: 'It comes down out of the dark on spread wings and glides in, throws its wings up to brake with a screech and a great downbeat, and settles into its hover; its sac lights up.' },
  { id: 'moonlure', name: 'Moonlure', cap: 'It wraps its wings forward round its sac like a cloak and shuts its eyes. The sac blazes, and pale moths drift in to it out of the dark, some drawn out of the party\'s own light. A lure on the whole party.' },
  { id: 'swoop', name: 'Swoop', cap: 'It throws its wings up and rises, then dives at its prey with its wings swept back and its talons thrust forward, rakes her, and pulls up and back to its place with a great downbeat.' },
  { id: 'wingGale', name: 'Wing Gale', cap: 'It rears up in the air with its wings high and screeches; then one huge downbeat drives a blast of wind and dust over the whole party.' },
  { id: 'hush', name: 'Hush', cap: 'It lands and folds its wings tight round itself like a shroud, eyes half shut, its sac\'s light hidden; a ring of dusk rolls out and a hush falls on the whole party. Then it lifts off again.' },
  { id: 'glut', name: 'Glut', cap: 'It lands, spreads its wings low and throws its head back: a glowing moth is torn out of its prey\'s light and flies up into its beak. It snaps it up, and its sac brightens with one more soul inside. A blow on its prey, and a heal.' },
  { id: 'hurt', name: 'Hurt', cap: 'It is knocked back in the air, one wing flung up and the other down, its head thrown back, feathers flying.' },
  { id: 'block', name: 'Block', cap: 'It draws its wings forward round itself, a wall of folded wings.' },
  { id: 'die', name: 'Released', cap: 'Beaten, it falls out of the air and lies with its wings spread on the ground. Its sac splits open and every soul it swallowed rises out of it in a spiral of pale moths, up and away to the Moon. It lies spent, and stays. Rise again, or play any move, and it comes back.' },
  { id: 'rise', name: 'Rising', cap: 'Its sac fills with light again and it beats up off the ground. Not on the sheets: it is here so the bench can fight it again.' },
 ];
 // the action sheet's eight poses, held one after another: [action, where in it, the sheet's label]
 const SHEET = [['', 0, '1. Hovering'], ['moonlure', .5, '2. Moonlure'], ['swoop', .46, '3. Swoop'], ['wingGale', .32, '4. Wing Gale'], ['hush', .5, '5. Hush'], ['glut', .46, '6. Glut'], ['hurt', .22, '7. Hurt'], ['die', .62, '8. Released']];
 // its blows at level 1 (placeholders until the battle steps; they grow 20% a level with a swing of up to 25% either way),
 // which of its moves reach the whole party, what Glut heals, and how hard each shakes the camera and stops the world
 const BLOWS = { swoop: [260], wingGale: [170], glut: [150] };
 const PARTY = { wingGale: [1], moonlure: [1], hush: [1] };
 const HEALS = { glut: 300 };
 const SHAKE = { swoop: [.07], wingGale: [.1], glut: [.03], moonlure: [.015], hush: [.02] };
 const STOP = { swoop: .08, wingGale: .06 };
 // the party's blows at level 1
 const HIT = { dagger: 90, flame: 220, flare: 320, rush: 110 };
 const FIRE = { flame: 1, flare: 1, rush: 1 };
 const ATK = { dagger: ['io', 'combo', [.17, .37, .58]], flame: ['io', 'throw', [.5]], flare: ['sol', 'flareCut', [.55]], rush: ['sol', 'emberRush', [.3, .42, .54, .66]] };
 const HP1 = 4200;
 const TOGGLES = [{ id: 'walk', name: 'Fly on', note: 'leaning into its flight' }, { id: 'guard', name: 'Guard', note: 'wings drawn round' }, { id: 'spin', name: 'Turntable', note: 'slow turn' }];
 const opts = { level: 1, walk: false, guard: false, spin: false, party: 'both', prey: 'io', day: false, place: 'meadow', weather: 'clear', timeRuns: false, rings: true, auto: false, sheet: false, sound: false };
 const lvlK = () => Math.pow(1.2, opts.level - 1);
 const swing = (n) => Math.max(1, Math.round(n * (1 + (Math.random() * 2 - 1) * .25)));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);

 // ---------- renderer, scene, lights ----------
 const canvas = $('gl'), stage = $('stage');
 const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
 renderer.setClearColor(0x000000, 0);
 renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
 const scene = new THREE.Scene();
 // the battle screen's lights (the Model Build Spec's Night square rig), and a plain overcast daylight
 const night = new THREE.Group(), day = new THREE.Group();
 night.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
 { const l = new THREE.DirectionalLight(0xb8c0ff, 0.62); l.position.set(-5, 9, -12); night.add(l); }
 { const l = new THREE.DirectionalLight(0xffdcc0, 0.42); l.position.set(2, 5, 10); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.4, 22, 2); l.position.set(5.5, 5, 8.5); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.1, 20, 2); l.position.set(-6.5, 5, -3); night.add(l); }
 day.add(new THREE.HemisphereLight(0xe2ebff, 0x5c4a36, 1.0));
 { const l = new THREE.DirectionalLight(0xfff0d6, 1.15); l.position.set(4, 9, 6); day.add(l); }
 { const l = new THREE.DirectionalLight(0xbcd0ff, 0.25); l.position.set(-6, 4, -5); day.add(l); }
 scene.add(night, day); day.visible = false;
 const glade = makeGlade({ radius: 9, rings: 10 }); scene.add(glade.root);
 // the wild meadow (built the first time it is chosen): its own sky, hours and weather, and the lights it asks for
 const rig = new THREE.Group(), rigHemi = new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1), rigSun = new THREE.DirectionalLight(0xb8c0ff, .62), rigFill = new THREE.DirectionalLight(0xffdcc0, .42);
 rigFill.position.set(2, 5, 10); rig.add(rigHemi, rigSun, rigFill); rig.visible = false; scene.add(rig);
 let meadow = null;
 function getMeadow() {
  if (!meadow) { meadow = makeMeadow({ radius: 9, rings: 10 }); meadow.setTime(22); meadow.onThunder = (k) => shake(.02 + .03 * k); scene.add(meadow.root); }
  return meadow;
 }

 // ---------- sounds, all made in code (living-battlefields/sfx.js); off until asked for, as browsers want a tap ----------
 const SND = window.makeFightSound ? makeFightSound() : null;
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
 // a soft blob shadow under each of them, as the battle draws them; it shrinks as they are thrown up
 const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(8,4,14,.62)'); q.addColorStop(.5, 'rgba(8,4,14,.3)'); q.addColorStop(1, 'rgba(8,4,14,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
 })();
 const blobMesh = (r) => { const mm = new THREE.Mesh(new THREE.CircleGeometry(r || .55, 24), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); mm.rotation.x = -PI / 2; mm.renderOrder = -6; scene.add(mm); return mm; };
 const HEROES = [{ id: 'io', model: io, home: V3(1.3, 0, 6.9) }, { id: 'sol', model: sol, home: V3(-2.2, 0, 7.4) }, { id: 'fig', model: null, home: V3(1.3, 0, 6.9) }];
 for (const h of HEROES) Object.assign(h, { x: h.home.x, y: 0, z: h.home.z, vy: 0, kx: 0, kz: 0, yaw: PI, ph: 0, wb: 0, cheer: -1, atk: null, flinch: 0, cy: 1.15, shadow: blobMesh() });
 const [IO, SOL, FIG] = HEROES;
 const _v = V3(), _w = V3(), _h = V3();
 const heroOn = (h) => (opts.party === 'both' ? h !== FIG : opts.party === h.id);
 const preyHero = () => (opts.party === 'both' ? (opts.prey === 'sol' ? SOL : IO) : opts.party === 'none' ? null : HEROES.find((h) => h.id === opts.party));
 function chestOf(h, out) { if (h === IO) return io.chestPos(out); if (h === SOL) return sol.anchor('chest', out); return out.set(h.x, h.y + 1.15, h.z); }
 const headOf = (h, out) => { chestOf(h, out); out.y += .55; return out; };
 function showParty() {
  for (const h of HEROES) { const on = heroOn(h); if (h.model) { h.model.root.visible = on; if (h.model.fx) h.model.fx.visible = on; } else figure.visible = on; h.shadow.visible = on; }
  for (const id of ['ioDagger', 'ioFlame']) $(id).querySelector('small').textContent = heroOn(IO) ? (id === 'ioDagger' ? 'three cuts' : 'a ball of fire') : 'Io is not here: it lands at once';
  for (const id of ['solFlare', 'solRush']) $(id).querySelector('small').textContent = heroOn(SOL) ? (id === 'solFlare' ? 'one burning blow' : 'four, at a run') : 'Sol is not here: it lands at once';
  for (const b of $('preySeg').querySelectorAll('.wbtn')) b.disabled = opts.party !== 'both';
  if (m) aim();
 }
 // it aims at its prey's place: where she stands, at chest height
 function aim() { const h = preyHero() || IO; m.state.target = V3(h.home.x, h.cy, h.home.z); }

 // ---------- the Gloamwing ----------
 const cam = new THREE.PerspectiveCamera(30, 1, .1, 260);
 const view = { yaw: .55, pitch: .16, dist: 24, ty: 2.3, tz: 2.6 };
 const home = Object.assign({}, view);
 let m = null, mShadow = null, buildMs = 0, hp = 1, hpMax = 1, deadT = -1, lastAct = '', lastP = -1, mWalk = 0, mYaw = 0, lastBeats = 0;
 function dispose(o) { o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { for (const k of ['map', 'bumpMap', 'emissiveMap']) if (x.material[k]) x.material[k].dispose(); if (x.material.uniforms && x.material.uniforms.uMap && x.material.uniforms.uMap.value) x.material.uniforms.uMap.value.dispose(); x.material.dispose(); } }); }
 function placeParty() {
  for (const h of HEROES) {
   Object.assign(h, { x: h.home.x, y: 0, z: h.home.z, vy: 0, kx: 0, kz: 0, yaw: Math.atan2(-h.home.x, -h.home.z), cheer: -1, atk: null, wb: 0 });
   if (h.model) { h.model.reset(); h.model.root.position.set(h.x, 0, h.z); h.model.root.rotation.set(0, h.yaw, 0); h.model.animate(0, 0, 0, 0); chestOf(h, _v); h.cy = _v.y; }
  }
 }
 function build() {
  if (m) { scene.remove(m.root, m.fx); dispose(m.root); dispose(m.fx); }
  const t0 = performance.now();
  m = makeGloamwing();
  buildMs = performance.now() - t0;
  scene.add(m.root, m.fx);
  if (!mShadow) { mShadow = blobMesh(1); mShadow.scale.set(2.6, 2.2, 1); }
  placeParty(); aim(); m.guard(opts.guard);
  hpMax = hp = Math.round(HP1 * lvlK()); deadT = -1; setHP(); setPhase();
  $('tagName').textContent = 'Gloamwing' + (opts.level > 1 ? ' · level ' + opts.level : '');
  $('tagDesc').textContent = 'A great night-flier of the marshes, hunting the souls on their way to the Moon';
  renderMoves(); updateStats(); setAct('');
 }

 // ---------- HP, the souls in its sac ----------
 function setHP() {
  const f = hp / hpMax; $('hpFill').style.width = (f * 100).toFixed(1) + '%'; $('hpFill').classList.toggle('low', f < .25);
  $('hpVal').textContent = Math.round(hp).toLocaleString('en-US') + ' / ' + hpMax.toLocaleString('en-US');
 }
 let soulsShown = -1;
 function setPhase() {
  const down = deadT >= 0, full = m && m.state.moths >= 7, ph = $('phase');
  ph.textContent = down ? 'Released' : full ? 'Full' : 'Hunting';
  ph.classList.toggle('down', down); ph.classList.toggle('full', !down && full);
 }
 function syncSouls() {
  const n = Math.round(m.state.moths); if (n === soulsShown) return;
  soulsShown = n; $('souls').value = n; $('soulsOut').textContent = String(n); setPhase();
 }

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
 function heroHurt(h, up, push) {
  if (h.model && h.cheer < 0) { h.model.play('hurt', true); h.atk = null; } else if (!h.model) h.flinch = 1;
  if (up) h.vy = Math.max(h.vy, up);
  if (push) { _v.set(h.x - m.root.position.x, 0, h.z - m.root.position.z).normalize(); h.kx += _v.x * push; h.kz += _v.z * push; }
 }
 function onHit(name, i) {
  meadowHit(name, i); hitSound(name, i);
  const all = PARTY[name] && PARTY[name][i], targets = all ? HEROES.filter(heroOn) : [preyHero()].filter(Boolean);
  // Moonlure and Hush do no harm: the one draws the party a step toward it, the other silences them
  if (name === 'moonlure' || name === 'hush') {
   for (const h of targets) {
    headOf(h, _h); pop(name === 'moonlure' ? 'Lured' : 'Hushed', _h, name === 'moonlure' ? 'lure' : 'hush');
    if (name === 'moonlure') { _v.set(m.root.position.x - h.x, 0, m.root.position.z - h.z).normalize(); h.kx += _v.x * .9; h.kz += _v.z * .9; chestOf(h, _v); ring(_v, 'moon'); }
   }
   shake((SHAKE[name] || [])[i] || .02); return;
  }
  const base = (BLOWS[name] || [])[i];
  if (name === 'glut') { const n = swing(HEALS.glut * lvlK()); hp = Math.min(hpMax, hp + n); setHP(); m.anchor('head', _h); _h.y += .6; pop('+' + n.toLocaleString('en-US'), _h, 'heal'); }
  if (!targets.length || !base) return;
  const big = name === 'wingGale' || name === 'swoop';
  for (const h of targets) {
   headOf(h, _h); pop(swing(base * lvlK()), _h, (name === 'wingGale' ? 'wind ' : '') + (big ? 'big' : ''));
   chestOf(h, _v); ring(_v, name === 'glut' ? 'moon' : '');
   heroHurt(h, 0, name === 'wingGale' ? 2.4 : name === 'swoop' ? 1.4 : 0);
  }
  shake((SHAKE[name] || [])[i] || .03); if (STOP[name]) hitStop(STOP[name]);
  if (name === 'swoop') { m.anchor('talons', _v); flash(.35, _v); }
 }
 // in the meadow its blows land in the grass: its gale flattens it in a ring and shakes the trees, its swoop rakes it
 function meadowHit(name, i) {
  if (opts.place !== 'meadow' || !meadow) return;
  const T = m.state.target, tx = T ? T.x : 1.3, tz = T ? T.z : 6.9;
  if (name === 'wingGale') { meadow.impact(m.root.position.x, m.root.position.z + 2, 1); meadow.roar(.7); }
  if (name === 'swoop') meadow.impact(tx, tz, .4);
  if (name === 'hush') meadow.impact(m.root.position.x, m.root.position.z, .3);
 }
 function hitSound(name, i) {
  m.anchor('impact', _v);
  if (name === 'swoop') { sfx('cut', _v); sfx('thud', _v, { gain: .6 }); }
  if (name === 'wingGale') { m.anchor('chest', _h); sfx('shockwave', _h); sfx('swoosh', _h, { rate: .4 }); sfx('rustle', null, { gain: .8, delay: .1 }); }
  if (name === 'glut') { sfx('grab', _v, { gain: .8 }); }
  if (name === 'moonlure') { m.anchor('sac', _h); sfx('charm', _h); }
  if (name === 'hush') { sfx('moon', null, { rate: .6, gain: .55 }); }
 }
 function meadowCue(name, i) {
  if (opts.place !== 'meadow' || !meadow) return;
  if (name === 'appear' && i === 0) meadow.roar(.6);
  if (name === 'wingGale' && i === 0) meadow.roar(.8);
  if (name === 'die' && i === 0) { m.anchor('chest', _v); meadow.impact(_v.x, _v.z, .7); }
 }
 // its cues: its screeches, its wings wrapping and lifting, its sac blazing, the gulp, its fall, and its souls let go
 function onCue(name, i) {
  meadowCue(name, i);
  m.anchor('head', _v); m.anchor('sac', _h);
  if (name === 'appear') { if (i === 0) { shake(.04); sfx('shriek', _v, { rate: .8 }); } else { sfx('swoosh', _h, { rate: .6 }); sfx('charm', _h, { gain: .5 }); } }
  if (name === 'moonlure') { if (i === 0) sfx('swoosh', _h, { rate: .5, gain: .6 }); else { sfx('moon', _h); sfx('charm', _h, { delay: .2, gain: .7 }); flash(.25, _h); } }
  if (name === 'swoop') { sfx('shriek', _v, { rate: .95 }); sfx('rush', _h, { delay: .25 }); }
  if (name === 'wingGale') { shake(.05); sfx('shriek', _v, { rate: .75 }); }
  if (name === 'hush') { if (i === 0) { sfx('swoosh', _h, { rate: .45, gain: .7 }); sfx('rustle', _h, { gain: .5 }); } else sfx('swoosh', _h, { rate: .6 }); }
  if (name === 'glut') { sfx('gulp', _v, { rate: .8 }); sfx('heal', _h, { delay: .15, gain: .6 }); }
  if (name === 'die') {
   if (i === 0) { sfx('thud', _h); sfx('crash', _h, { gain: .5 }); shake(.08); hitStop(.05); }
   else if (i === 1) { sfx('burst', _h, { gain: .6 }); sfx('moon', _h); sfx('birds', _h, { delay: .3, gain: .7 }); flash(.5, _h); }
   else sfx('charm', _h, { gain: .5 });
  }
  if (name === 'rise') { if (i === 0) sfx('rise', _h); else sfx('swoosh', _h, { rate: .55 }); }
 }

 // ---------- the party's blows on it ----------
 const fireball = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(255,250,240,1)'); q.addColorStop(.25, 'rgba(255,170,90,.9)'); q.addColorStop(.6, 'rgba(190,80,255,.45)'); q.addColorStop(1, 'rgba(120,40,200,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const grp = new THREE.Group(), parts = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(mat); s.scale.setScalar(.5 - i * .06); grp.add(s); parts.push(s); }
  grp.visible = false; scene.add(grp); return { grp, parts, from: V3(), to: V3(), t: -1, trail: [] };
 })();
 const aimAt = (out) => m.anchor('chest', out);
 function wake() {
  m.play(deadT >= 0 || m.down ? 'rise' : 'appear', true); setAct(m.action); deadT = -1; hp = hpMax; setHP(); setPhase();
  for (const h of HEROES) if (h.cheer >= 0 && h.model) { h.model.reset(); h.cheer = -1; }
 }
 function strikeBack(kind) {
  if (!m) return;
  if (deadT >= 0) { if (deadT > 5.6) wake(); return; } // beaten: a blow brings it back (once it has finished falling)
  const [hid, act, hits] = ATK[kind], h = hid === 'io' ? IO : SOL;
  if (!heroOn(h) || h.cheer >= 0) { if (!h.atk) for (let i = 0; i < hits.length; i++) landBlow(kind, i === hits.length - 1, i); return; }
  if (h.atk || fireball.t >= 0) return;
  h.model.play(act, true); h.atk = { kind, act, hits, n: 0 };
  if (kind === 'flare') sfx('flare', _v.set(h.x, 1, h.z)); if (kind === 'rush') sfx('rush', _v.set(h.x, 1, h.z));
 }
 function landBlow(kind, last, i) {
  if (!m || deadT >= 0) return;
  const fire = !!FIRE[kind], n = swing(HIT[kind] * lvlK());
  aimAt(_v); ring(_v, fire ? 'fire' : ''); _h.copy(_v); _h.y += .9 + (i || 0) * .5; // a run of hits stacks up
  pop(n, _h, (fire ? 'fire ' : '') + (kind === 'flare' ? 'big' : ''));
  sfx(kind === 'dagger' ? 'slash' : kind === 'flame' ? 'fireHit' : 'swordHit', _v, { gain: kind === 'rush' ? .7 : 1 });
  shake(fire ? .035 : .03); hitStop(kind === 'flare' ? .07 : .045);
  hp = Math.max(0, hp - n); setHP();
  if (hp <= 0) { m.play('die', true); deadT = 0; setAct('die'); setPhase(); return; }
  if (!last) return;
  const cur = m.action;
  if (!m.busy || m.ACTIONS[cur].interrupt) { m.play('hurt', true); setAct('hurt'); }
 }

 // ---------- the party, every frame ----------
 function stepHero(h, dt, t) {
  if (!heroOn(h)) return;
  const md = h.model;
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
  // blown back by its gale, raked by its talons, drawn toward it by its lure, or walking back to her place
  if (h.y > 0 || h.vy > 0) { h.vy -= 9.8 * dt; h.y = Math.max(0, h.y + h.vy * dt); if (h.y === 0) { if (h.vy < -4) { shake(.025); sfx('thud', _v.set(h.x, 0, h.z), { gain: .5 }); } h.vy = 0; } }
  if (Math.abs(h.kx) + Math.abs(h.kz) > .01) { h.x += h.kx * dt; h.z += h.kz * dt; const d = Math.exp(-dt * 4); h.kx *= d; h.kz *= d; }
  else if (md && md.busy && md.dash) { h.x += Math.sin(h.yaw) * md.dash * dt; h.z += Math.cos(h.yaw) * md.dash * dt; }
  else if (h.y === 0) {
   const dx = h.home.x - h.x, dz = h.home.z - h.z, d = Math.hypot(dx, dz);
   if (d > .04) { const sp = Math.min(1.6, .4 + 2 * d) * dt, s = Math.min(1, sp / d); h.x += dx * s; h.z += dz * s; h.ph += sp * 4.4; h.wb = Math.min(1, h.wb + dt * 3); }
   else h.wb = Math.max(0, h.wb - dt * 3);
  }
  // she faces it, or turns to walk back when she was knocked far from her place
  const away = Math.hypot(h.home.x - h.x, h.home.z - h.z), face = away > .6 && h.wb > .3 ? Math.atan2(h.home.x - h.x, h.home.z - h.z) : Math.atan2(m.root.position.x - h.x, m.root.position.z - h.z);
  if (!(md && md.busy && md.dash)) h.yaw += wrapA(face - h.yaw) * (1 - Math.exp(-dt * 6));
  // they cheer when it falls
  if (deadT > 3.5 && h.cheer < 0 && md) { md.play('victory', true); h.cheer = 1; h.atk = null; if (h === IO) sfx('victory', null, { gain: .7 }); }
  h.shadow.position.set(h.x, .015, h.z); h.shadow.scale.setScalar(Math.max(.35, 1 - h.y * .25)); h.shadow.material.opacity = Math.max(.2, 1 - h.y * .3);
  if (md) { md.root.position.set(h.x, h.y, h.z); md.root.rotation.y = h.yaw; md.animate(h.ph, h.wb, t, dt); }
  else {
   h.flinch = Math.max(0, h.flinch - dt * 3.2);
   figure.position.set(h.x, h.y, h.z); figure.rotation.y = h.yaw; figBody.rotation.x = -.35 * Math.sin(PI * h.flinch);
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

 // ---------- Watch a fight: it and the party take turns until it falls, then it rises again ----------
 const AUTO = { t: 0, turn: 'foe', last: '', next: null, wait: 0 };
 const POOL = [['swoop', 1.4], ['wingGale', 1.1], ['moonlure', .7], ['hush', .55], ['glut', 1.0]];
 function autoStep(dt) {
  if (!opts.auto || !m || opts.sheet) return;
  if (deadT >= 0) { AUTO.next = null; if (deadT > 10) wake(); return; }
  if (AUTO.next) { if ((AUTO.wait -= dt) <= 0) { strikeBack(AUTO.next); AUTO.next = null; } return; }
  if (m.busy || homing() || HEROES.some((h) => h.atk) || fireball.t >= 0 || HEROES.some((h) => heroOn(h) && h.model && h.model.busy)) { AUTO.t = 0; return; }
  if ((AUTO.t += dt) < (AUTO.turn === 'foe' ? 1.1 : .7)) return;
  AUTO.t = 0;
  if (AUTO.turn === 'foe') {
   const pool = POOL.filter(([id]) => id !== AUTO.last && (id !== 'glut' || hp < hpMax * .8 || Math.random() < .3));
   let r = Math.random() * pool.reduce((s, x) => s + x[1], 0), pick = pool[0][0];
   for (const [id, w] of pool) if ((r -= w) <= 0) { pick = id; break; }
   AUTO.last = pick; if (m.play(pick, true)) setAct(pick); AUTO.turn = 'party';
  } else {
   // both of them strike, Sol a moment after Io
   const ioK = heroOn(IO) || !heroOn(SOL) ? (Math.random() < .65 ? 'dagger' : 'flame') : null, solK = heroOn(SOL) ? (Math.random() < .6 ? 'flare' : 'rush') : null;
   if (ioK) strikeBack(ioK); if (solK) { AUTO.next = solK; AUTO.wait = ioK ? .5 : 0; } AUTO.turn = 'foe';
  }
 }

 // ---------- Sheet poses: the action sheet's eight poses, each held for a few seconds ----------
 const SH = { i: -1, t: 0, hold: false };
 function sheetStep(dt) {
  if (!opts.sheet) return false;
  const [act, at, label] = SHEET[SH.i];
  if (!SH.hold) {
   const u = act ? m.progress : 1;
   if (!act ? SH.t > 1.4 : u >= at || u < 0) { SH.hold = true; SH.t = 0; }
  } else if (SH.t > 2.8) { sheetPose(SH.i + 1); return SH.hold; }
  SH.t += dt; $('actName').textContent = 'Sheet pose ' + label; return SH.hold;
 }
 function sheetPose(i) {
  SH.i = i % SHEET.length; SH.t = 0; SH.hold = false;
  const [act] = SHEET[SH.i];
  m.reset(); deadT = -1; m.root.position.set(0, 0, 0); setPhase();
  if (act) { m.play(act, true); setAct(act); } else setAct('');
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
  if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) view.dist = Math.max(6, Math.min(60, dist0 * pinch0 / d)); }
 });
 const up = (e) => { pts.delete(e.pointerId); if (!pts.size) stage.classList.remove('drag'); pinch0 = 0; };
 stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
 stage.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(6, Math.min(60, view.dist * Math.exp(e.deltaY * .0012))); }, { passive: false });
 $('resetView').addEventListener('click', () => Object.assign(view, home));

 // ---------- controls ----------
 function wbtn(label, small, pressed) { const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn'; b.innerHTML = '<span class="t"></span>' + (small !== null ? '<small></small>' : ''); b.querySelector('.t').textContent = label; if (small !== null) b.querySelector('small').textContent = small; if (pressed !== undefined) b.setAttribute('aria-pressed', String(!!pressed)); return b; }
 const fmt = (n) => n.toFixed(2).replace(/^0/, '');
 function stopSheet() { if (!opts.sheet) return; opts.sheet = false; $('sheet').setAttribute('aria-pressed', 'false'); }
 function renderMoves() {
  const box = $('moves'); box.innerHTML = '';
  for (const mv of MOVES) {
   const A = m.ACTIONS[mv.id], wide = PARTY[mv.id] && PARTY[mv.id].some(Boolean);
   const meta = A.dur.toFixed(1) + ' s' + (A.hits.length ? ' · ' + A.hits.length + (A.hits.length > 1 ? ' hits' : ' hit') : A.hold ? ' · holds' : '') + (wide ? ' ★' : '');
   const b = wbtn(mv.name, meta); b.dataset.id = mv.id; b.title = mv.cap;
   b.addEventListener('click', () => {
    stopSheet();
    if (deadT >= 0 && mv.id !== 'die') { wake(); return; }
    if (mv.id === 'die') { m.play('die', true); deadT = 0; hp = 0; setHP(); setPhase(); setAct('die'); return; }
    if (mv.id === 'rise' || mv.id === 'appear') { wake(); if (mv.id === 'appear' && m.action !== 'appear') { m.play('appear', true); setAct('appear'); } return; }
    if (m.play(mv.id, true)) setAct(m.action || mv.id);
   });
   box.appendChild(b);
  }
 }
 for (const tg of TOGGLES) {
  const b = wbtn(tg.name, tg.note, !!opts[tg.id]);
  b.addEventListener('click', () => { opts[tg.id] = !opts[tg.id]; b.setAttribute('aria-pressed', String(opts[tg.id])); if (tg.id === 'guard') m.guard(opts.guard); });
  $('toggles').appendChild(b);
 }
 for (const [id, name, tip] of [['both', 'Io and Sol', 'Io the Witch and Sol, as they are in their demos'], ['io', 'Io', 'Io alone'], ['fig', 'Figure', 'A plain 1.8 m figure, to judge its size by'], ['none', 'None', 'Nobody']]) {
  const b = wbtn(name, null, opts.party === id); b.dataset.id = id; b.title = tip;
  b.addEventListener('click', () => { opts.party = id; for (const x of $('partySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); placeParty(); showParty(); });
  $('partySeg').appendChild(b);
 }
 for (const [id, name] of [['io', 'Io'], ['sol', 'Sol']]) {
  const b = wbtn(name, null, opts.prey === id); b.dataset.id = id; b.title = 'Who its Swoop and Glut go for';
  b.addEventListener('click', () => { opts.prey = id; for (const x of $('preySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); aim(); });
  $('preySeg').appendChild(b);
 }
 $('ioDagger').addEventListener('click', () => { stopSheet(); strikeBack('dagger'); });
 $('ioFlame').addEventListener('click', () => { stopSheet(); strikeBack('flame'); });
 $('solFlare').addEventListener('click', () => { stopSheet(); strikeBack('flare'); });
 $('solRush').addEventListener('click', () => { stopSheet(); strikeBack('rush'); });
 $('wake').addEventListener('click', () => { stopSheet(); wake(); });
 $('souls').addEventListener('input', (e) => { m.state.moths = +e.target.value; syncSouls(); });
 $('auto').addEventListener('click', (e) => { stopSheet(); opts.auto = !opts.auto; e.currentTarget.setAttribute('aria-pressed', String(opts.auto)); AUTO.t = 0; AUTO.turn = m.busy ? 'party' : 'foe'; if (opts.auto && deadT >= 0) wake(); });
 $('sheet').addEventListener('click', (e) => { opts.sheet = !opts.sheet; e.currentTarget.setAttribute('aria-pressed', String(opts.sheet)); if (opts.sheet) { opts.auto = false; $('auto').setAttribute('aria-pressed', 'false'); sheetPose(0); } else { m.reset(); setAct(''); } });
 $('level').addEventListener('input', (e) => { $('levelOut').textContent = e.target.value; });
 $('level').addEventListener('change', (e) => { opts.level = +e.target.value; hpMax = Math.round(HP1 * lvlK()); hp = Math.min(hp, hpMax); if (deadT < 0) hp = hpMax; setHP(); $('tagName').textContent = 'Gloamwing' + (opts.level > 1 ? ' · level ' + opts.level : ''); });
 $('sound').addEventListener('click', (e) => {
  opts.sound = !opts.sound; e.currentTarget.setAttribute('aria-pressed', String(opts.sound)); e.currentTarget.textContent = opts.sound ? 'Sound on' : 'Sound off';
  if (SND) { if (opts.sound) SND.init(); SND.setMuted(!opts.sound); }
 });
 // Night square and Daylight: in the glade, the battle's light or an overcast day; in the meadow they set its clock to ten at
 // night (when its light is the Night square's) or to noon
 let mDay = false;
 function setLight(isDay) {
  if (opts.place === 'meadow') { meadow.setTime(isDay ? 12 : 22); syncHour(); mDay = isDay; }
  else { opts.day = isDay; day.visible = isDay; night.visible = !isDay; glade.setDay(isDay); }
  stage.classList.toggle('day', isDay); showDay(isDay);
 }
 function showDay(isDay) { const md = opts.place === 'meadow'; $('lightDay').setAttribute('aria-pressed', String(!md && isDay)); $('lightNight').setAttribute('aria-pressed', String(!md && !isDay)); }
 function setPlace(p) {
  opts.place = p; const md = p === 'meadow';
  if (md) getMeadow();
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

 // ---------- the move readout: name, length, and the hit and cue marks along it ----------
 let shown = null;
 const idleName = () => (opts.walk ? 'Flying on' : opts.guard ? 'Guard' : 'Hovering');
 function setAct(id) {
  const mv = MOVES.find((x) => x.id === id), track = $('track');
  for (const t of track.querySelectorAll('.tick')) t.remove();
  for (const b of $('moves').children) b.classList.toggle('on', b.dataset.id === id);
  shown = id || null;
  if (!mv || !m.ACTIONS[id]) { $('actName').textContent = idleName(); $('actMeta').textContent = 'Slow, deep wingbeats.'; $('actCap').textContent = IDLE_CAP; $('fill').style.width = '0'; shown = null; return; }
  const A = m.ACTIONS[id];
  $('actName').textContent = mv.name; $('actCap').textContent = mv.cap;
  $('actMeta').textContent = A.dur.toFixed(2) + ' s' + (A.hits.length ? ' · hits ' + A.hits.map(fmt).join(', ') : '') + (A.cues.length ? ' · cues ' + A.cues.map(fmt).join(', ') : '');
  for (const [list, cls] of [[A.cues, 'cue'], [A.hits, 'hit']]) for (const u of list) { const t = document.createElement('i'); t.className = 'tick ' + cls; t.style.left = (u * 100) + '%'; track.appendChild(t); }
 }
 function updateStats() {
  const s = m.stats;
  let fxd = 0; m.fx.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) fxd++; });
  const rows = [['triangles', Math.round(s.triangles / 100) / 10 + 'k'], ['draw calls', (s.drawCalls - fxd) + ' + ' + fxd + ' fx'], ['bones', s.bones], ['textures', s.textures], ['wingspan', m.wingspan.toFixed(0) + ' m'], ['built in', Math.round(buildMs) + ' ms']];
  $('stats').innerHTML = rows.map(([k, v]) => '<div><b>' + v + '</b>' + k + '</div>').join('');
 }

 // ---------- loop ----------
 function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.fov = cam.aspect < .9 ? 44 : 30; cam.updateProjectionMatrix();
  // a tall phone screen has a wider lens (44 degrees), so the camera comes in closer to keep it big beside the party
  const k = cam.aspect < .9 ? .8 : 1; if (home.k !== k) { const reset = view.dist === home.dist; home.k = k; home.dist = 24 * k; home.ty = 2.3 - (1 - k) * 1.5; if (reset) Object.assign(view, home); }
 }
 // after a swoop or a knock it flies back to its place
 const homing = () => !!m && !m.busy && deadT < 0 && Math.hypot(m.root.position.x, m.root.position.z) > .2;
 let gt = 0, statT = 0, hourT = 0, ambT = 0;
 function step(rdt) {
  // hit-stop: the world holds still a moment when a heavy blow lands
  let dt = rdt; if (stopT > 0) { stopT -= rdt; dt = 0; }
  gt += dt;
  const held = sheetStep(rdt), mdt = held ? 0 : dt, P = m.root.position;
  // it faces its prey (and flies home facing her too); its Swoop's dash carries it along its facing, there and back
  let flyW = 0;
  if (homing()) { const d = Math.hypot(P.x, P.z), v = Math.min(3, .5 + 1.5 * d) * mdt, s = Math.min(1, v / d); P.x -= P.x * s; P.z -= P.z * s; flyW = 1; }
  else if (opts.walk && !m.busy && deadT < 0) flyW = 1;
  mWalk += (flyW - mWalk) * (1 - Math.exp(-mdt * 4));
  const T = m.state.target;
  if (T && deadT < 0 && !(m.busy && m.dash)) mYaw += wrapA(Math.atan2(T.x - P.x, T.z - P.z) - mYaw) * (1 - Math.exp(-mdt * 2.5));
  m.root.rotation.y = mYaw;
  if (opts.spin && !pts.size) view.yaw += rdt * .12;
  m.animate(0, mWalk, gt, mdt);
  if (m.busy && m.dash) { P.x += Math.sin(mYaw) * m.dash * mdt; P.z += Math.cos(mYaw) * m.dash * mdt; }
  mShadow.position.set(P.x, .012, P.z); mShadow.material.opacity = Math.max(.12, .85 - m.lift * .14); mShadow.scale.set(2.6 * (1 + m.lift * .06), 2.2 * (1 + m.lift * .06), 1);
  // its wingbeats: a deep whoosh at the top of each stroke
  if (m.beats !== lastBeats) { lastBeats = m.beats; if (!opts.sheet) { m.anchor('chest', _v); sfx('swoosh', _v, { rate: .5 + Math.random() * .08, gain: .2 }); } }
  // its hits and cues, as the battle screen would see them
  const a = m.action, p = m.progress, A = a ? m.ACTIONS[a] : null;
  if (a !== lastAct) { lastP = -1; lastAct = a; if (a === 'hurt' || a === 'block') { m.anchor('head', _v); if (a === 'hurt') sfx('shriek', _v, { rate: 1.25, gain: .55 }); else sfx('swoosh', _v, { rate: .8, gain: .6 }); } }
  if (A && p >= 0) { A.hits.forEach((hh, i) => { if (lastP < hh && p >= hh) onHit(a, i); }); A.cues.forEach((hh, i) => { if (lastP < hh && p >= hh) onCue(a, i); }); lastP = p; }
  if (a === 'appear' && p >= 0 && p < .1 && hp < hpMax) { hp = hpMax; setHP(); }
  if (opts.place === 'meadow' && meadow) {
   meadow.vortex(P.x, P.z + 1.5, 7, a === 'wingGale' && p > .44 && p < .62 ? .6 : 0);
   meadow.timeRate = opts.timeRuns ? .07 : 0; meadow.update(gt, dt, cam);
   const L = meadow.light; rigHemi.color.copy(L.hemiSky); rigHemi.groundColor.copy(L.hemiGround); rigHemi.intensity = L.hemiI;
   rigSun.position.copy(L.dir).multiplyScalar(20); rigSun.color.copy(L.color); rigSun.intensity = L.I; rigFill.color.copy(L.fillC); rigFill.intensity = L.fillI;
   if ((hourT += rdt) > .25) { hourT = 0; syncHour(); const dd = meadow.day; if (dd !== mDay) { mDay = dd; stage.classList.toggle('day', dd); } }
   if (SND && opts.sound && (ambT += rdt) > .5) { ambT = 0; const w = meadow.weather; SND.ambience({ wind: w === 'storm' ? .9 : w === 'rain' ? .6 : .3, gust: w === 'storm' ? .8 : .2, rain: w === 'storm' ? 1 : w === 'rain' ? .7 : 0, night: mDay ? 0 : 1 }); }
  } else if (SND && opts.sound && (ambT += rdt) > .5) { ambT = 0; SND.ambience({ wind: .25, night: opts.day ? 0 : 1 }); }
  if (deadT >= 0) deadT += dt;
  for (const h of HEROES) stepHero(h, dt, gt);
  stepFireball(dt);
  autoStep(rdt);
  if (opts.place !== 'meadow') glade.update(gt);
  shakeA *= Math.exp(-rdt * 8); flashA *= Math.exp(-rdt * 6);
  placeCam(rdt);
  // the readout
  if (shown && p >= 0) $('fill').style.width = (p * 100).toFixed(1) + '%';
  if (!opts.sheet) {
   if (shown && p < 0 && !(m.ACTIONS[shown] && m.ACTIONS[shown].hold)) setAct('');
   else if (!shown && $('actName').textContent !== idleName()) $('actName').textContent = idleName();
   if (shown !== a && a && m.ACTIONS[a] && MOVES.some((x) => x.id === a)) setAct(a);
  }
  if ((statT += rdt) > .25) { statT = 0; syncSouls(); }
 }
 function render() { $('flash').style.opacity = flashA > .01 ? flashA.toFixed(3) : '0'; renderer.render(scene, cam); }
 const DBG = { freeze: false };
 function start() {
  build(); setPlace(opts.place); showParty(); resize(); placeCam(0);
  new ResizeObserver(resize).observe(stage);
  m.play('appear', true); setAct('appear'); // it comes down out of the dark as the page opens
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
   ready: true, DBG, opts, view, get m() { return m; }, get meadow() { return meadow; }, io, sol, renderer, scene, HEROES, SND,
   get hp() { return hp; }, get deadT() { return deadT; }, AUTO,
   play(name) { if (name === 'die') { m.play('die', true); deadT = 0; hp = 0; setHP(); setPhase(); setAct('die'); } else if (name === 'rise') wake(); else if (m.play(name, true)) setAct(m.action || name); },
   advance(sec, quiet) { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) step(1 / 60); if (!quiet) render(); },
   strike(kind) { strikeBack(kind); },
   sheet(on) { if (on !== opts.sheet) $('sheet').click(); },
   set(o) {
    if (o.view) Object.assign(view, o.view);
    if (o.party) { opts.party = o.party; placeParty(); showParty(); }
    if (o.prey) { opts.prey = o.prey; aim(); }
    if (o.place) setPlace(o.place);
    if (o.day !== undefined) setLight(o.day);
    if (o.level) { opts.level = o.level; hpMax = hp = Math.round(HP1 * lvlK()); setHP(); }
    if (o.time !== undefined) { getMeadow().setTime(o.time); syncHour(); }
    if (o.weather) setWeather(o.weather);
    if (o.timeRuns !== undefined) opts.timeRuns = !!o.timeRuns;
    if (o.souls !== undefined) { m.state.moths = o.souls; syncSouls(); }
    if (o.walk !== undefined) opts.walk = !!o.walk;
    if (o.auto !== undefined) { opts.auto = o.auto; AUTO.t = 0; AUTO.turn = 'foe'; }
    if (o.hp !== undefined) { hp = o.hp; setHP(); }
   },
  };
 }
 // let the page paint "Calling the Gloamwing" before the models are built
 requestAnimationFrame(() => setTimeout(() => {
  try { start(); }
  catch (err) { $('tagName').textContent = 'The scene could not start'; $('tagDesc').textContent = err.message + '. This page needs WebGL.'; console.error(err); }
 }, 30));
})();
