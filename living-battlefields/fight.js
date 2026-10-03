// fight.js: the Bramble Colossus against Io and Sol in a living meadow at night, seen through one locked camera. The
// camera never moves: every shot is a crop or a zoom of its frame, as the battle screen's shots are of its painting, so
// the meadow is made only where that frame sees it (field.js). Play the fight runs a choreographed fight from its
// Awakening to its fall, with the camera's shots, the storm of its Wrath and every sound made in code (sfx.js); the
// moves can also be played one by one. The fight's rules are the Colossus bench's (its blows, its Wrath at half its HP,
// its weak point and its fear of fire), with fixed numbers so the fight always runs the same way.
// three.js r128 (global THREE); needs makeLivingField, makeBrambleColossus, makeWitch, makeSol, makeBattleFX,
// makeIoSpells and makeFightSound. Test hooks for headless checks are on window.__fight.
(function () {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
 const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a)), PI = Math.PI;
 const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const _v = V3(), _w = V3(), _h = V3();

 // ---------- the moves ----------
 const MOVES = [
  { id: 'appear', name: 'Awakening', cap: 'The ground splits and it heaves up out of the earth, spikes first; its bud bursts open in a roar.' },
  { id: 'alert', name: 'Alert', cap: 'Its spire turns and leans at its prey; every cane rises toward it.' },
  { id: 'bloom', name: 'Siren Bloom', cap: 'Its flower opens wide and glowing pollen pours over the party, who step toward it.' },
  { id: 'lance', name: 'Thorn Lance', cap: 'Its lead arm spears down through its prey into the ground.' },
  { id: 'slam', name: 'Hammerfall', cap: 'Both arms twine into one club eleven metres up, then fall: the ground splits and a shockwave runs out.' },
  { id: 'whirl', name: 'Maelstrom', cap: 'Every cane whirls round it twice: a storm of thorns, dust and leaves.' },
  { id: 'volley', name: 'Thorn Volley', cap: 'It cracks its arms like whips and its thorns rain on the party in three waves.' },
  { id: 'devour', name: 'Devour', cap: 'It lifts its prey into its flower and feeds, three gulps, then spits her out.' },
  { id: 'briar', name: 'Thornwood', cap: 'Shoots as tall as young trees burst up round its prey and squeeze.' },
  { id: 'enrage', name: 'Wrath', cap: 'At half its HP it curls up, then bursts open in red light, and the sky turns to a red storm.' },
  { id: 'hurt', name: 'Hurt', cap: 'It recoils.' }, { id: 'burn', name: 'Scorch', cap: 'Its recoil from fire, which it fears.' }, { id: 'die', name: 'Felled', cap: 'Its spire cracks at its foot and topples like a tree; its heart goes dark.' },
 ];
 const MOVEBTN = ['appear', 'bloom', 'lance', 'slam', 'whirl', 'volley', 'devour', 'briar', 'enrage', 'die'];
 // its blows on the party (the bench's level 1 numbers), which strike everyone, and how hard each shakes the camera
 const BLOWS = { lance: [260], slam: [320, 150], whirl: [80, 80, 80, 95], volley: [110, 110, 125], devour: [70, 120, 120, 120], briar: [220, 300] };
 const PARTY = { slam: [0, 1], whirl: [1, 1, 1, 1], volley: [1, 1, 1], bloom: [1] };
 const HEALS = { devour: 150 };
 const SHAKE = { lance: [.1], slam: [.2, .08], whirl: [.035, .035, .035, .05], volley: [.04, .04, .055], devour: [.04, .03, .03, .035], briar: [.11, .08] };
 const STOP = { lance: .1, slam: .16, briar: .1 };
 // the party's blows: who, which motion, how hard (one number a hit), whether it burns
 const ATK = {
  dagger: { who: 'io', act: 'combo', dmg: [225, 225, 260] },
  flame: { who: 'io', act: 'throw', dmg: [550], fire: 1 },
  flare: { who: 'sol', act: 'flareCut', dmg: [800], fire: 1 },
  rush: { who: 'sol', act: 'emberRush', dmg: [275, 275, 275, 300], fire: 1 },
  sever: { who: 'sol', act: 'sunder', dmg: [375] },
  noon: { who: 'sol', act: 'highNoon', dmg: [120, 120, 130, 130, 140, 140, 420], fire: 1 },
 };
 const HP0 = 6400;

 // ---------- renderer, scene, lights ----------
 const canvas = $('gl'), stage = $('stage');
 const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
 let DPR = Math.min(2, window.devicePixelRatio || 1);
 renderer.setPixelRatio(DPR);
 const scene = new THREE.Scene();
 const hemi = new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1), moon = new THREE.DirectionalLight(0xb8c0ff, .62), fill = new THREE.DirectionalLight(0xffdcc0, .42);
 fill.position.set(2, 5, 10); scene.add(hemi, moon, fill);
 // the light of fire and spells on the actors (the field throws the same light on the ground and the grass)
 const actLight = new THREE.PointLight(0xff9a4a, 0, 16, 2); scene.add(actLight);
 let field = null, FX = null, SP = null, SND = null, m = null, io = null, sol = null, cam = null;

 // ---------- the director: shots are crops and zooms of the locked camera's frame ----------
 const FW = 2048, FH = 1536;
 const shot = { x: .48, y: .5, z: 1.04, tx: .48, ty: .5, tz: 1.04, k: 2.2 };
 let punch = 1, punchV = 0, shakeA = 0, shT = 0, flashA = 0, stopT = 0, slowT = 0, slowK = 1;
 const frameOf = (p, out) => { _w.copy(p).project(field.camera); out[0] = (_w.x + 1) / 2; out[1] = (1 - _w.y) / 2; return out; };
 const _f = [0, 0];
 function setShot(x, y, z, k) { shot.tx = x; shot.ty = y; shot.tz = Math.max(1.04, z); shot.k = k || 2.2; }
 // a shot on a point of the world, lifted (in metres) and zoomed
 function shotOn(p, z, k) { frameOf(p, _f); setShot(_f[0], _f[1], z, k); }
 const SHOTS = {
  wide: () => setShot(.48, .5, 1.04, 1.6),
  boss: () => shotOn(V3(0, 5.2, 0), 1.45, 2),
  bud: () => { m.anchor('bud', _v); shotOn(_v, 1.9, 2.4); },
  high: () => shotOn(V3(-.5, 6.5, 2), 1.18, 2.2),
  party: () => shotOn(V3(-.4, 1.6, 8.9), 1.75, 2.2),
  io: () => shotOn(V3(1.2, 1.4, 7.6), 2.1, 2.4),
  sol: () => shotOn(V3(-1.8, 1.4, 8), 2.1, 2.4),
  clash: () => shotOn(V3(-.5, 2.6, 5), 1.45, 2.2),
  heart: () => { m.anchor('heart', _v); shotOn(_v, 2.2, 2.6); },
 };
 const shake = (a) => { if (!REDUCED) shakeA = Math.max(shakeA, a); };
 const zoomPunch = (a) => { if (!REDUCED) punchV = Math.max(punchV, a); };
 const hitStop = (s) => { stopT = Math.max(stopT, s); };
 const slowMo = (k, s) => { if (!REDUCED) { slowK = k; slowT = s; } };
 function applyView(rdt) {
  const W = Math.max(1, stage.clientWidth), H = Math.max(1, stage.clientHeight), A = W / H, e = 1 - Math.exp(-rdt * shot.k);
  shot.x += (shot.tx - shot.x) * e; shot.y += (shot.ty - shot.y) * e; shot.z += (shot.tz - shot.z) * e;
  punchV *= Math.exp(-rdt * 5); punch = 1 + punchV;
  let ww, wh; if (A < FW / FH) { wh = FH; ww = FH * A; } else { ww = FW; wh = FW / A; }
  ww /= shot.z * punch; wh /= shot.z * punch;
  shT += rdt; const sa = shakeA * FH * .5;
  let cx = shot.x * FW + sa * Math.sin(shT * 71) + sa * .5 * Math.sin(shT * 23 + 1), cy = shot.y * FH + sa * .8 * Math.sin(shT * 59 + 1.3);
  cx = cl(cx, ww / 2, FW - ww / 2); cy = cl(cy, wh / 2, FH - wh / 2);
  cam.setViewOffset(FW, FH, cx - ww / 2, cy - wh / 2, ww, wh);
 }

 // ---------- numbers, rings and the flash, on the stage ----------
 const pops = $('pops');
 function toScreen(p) { _w.copy(p).project(cam); return [(_w.x + 1) / 2 * stage.clientWidth, (1 - _w.y) / 2 * stage.clientHeight, _w.z]; }
 function pop(text, p3, cls) {
  const p = toScreen(p3); if (p[2] > 1) return;
  const d = document.createElement('div'); d.className = 'dmg ' + (cls || ''); d.textContent = typeof text === 'number' ? text.toLocaleString('en-US') : text;
  d.style.left = (p[0] + (Math.random() - .5) * 24) + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove()); pops.appendChild(d);
 }
 function ring(p3, cls) { const p = toScreen(p3); if (p[2] > 1) return; const d = document.createElement('div'); d.className = 'ring ' + (cls || ''); d.style.left = p[0] + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove()); pops.appendChild(d); }
 const flash = (a, p3, color) => {
  if (REDUCED) return; flashA = Math.max(flashA, a);
  if (p3) { const p = toScreen(p3); stage.style.setProperty('--fx', p[0] + 'px'); stage.style.setProperty('--fy', p[1] + 'px'); }
  stage.style.setProperty('--fc', color || 'rgba(255,240,250,.75)');
 };
 // sound, panned by where on the screen it happens
 function sfx(name, p3, o) {
  if (!SND) return; o = o || {};
  let pan = 0; if (p3) { const p = toScreen(p3); pan = cl((p[0] / Math.max(1, stage.clientWidth)) * 2 - 1, -1, 1) * .8; }
  SND.play(name, Object.assign({ pan }, o));
 }

 // ---------- the party ----------
 const HEROES = [{ id: 'io', home: V3(1.4, 0, 8.6) }, { id: 'sol', home: V3(-2.3, 0, 9.2) }];
 const [IO, SOL] = HEROES;
 let prey = IO;
 const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(6,4,12,.66)'); q.addColorStop(.5, 'rgba(6,4,12,.32)'); q.addColorStop(1, 'rgba(6,4,12,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
 })();
 const blobMesh = () => { const mm = new THREE.Mesh(new THREE.CircleGeometry(.6, 24), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: false })); mm.rotation.x = -PI / 2; mm.renderOrder = -6; scene.add(mm); return mm; };
 function chestOf(h, out) { if (h === IO) return io.chestPos(out); return sol.anchor('chest', out); }
 const headOf = (h, out) => { chestOf(h, out); out.y += .55; return out; };
 const isHeld = (h) => !!m && h === prey && (m.holding || 0) > .01;
 function aim() { m.state.target = V3(prey.home.x, prey.cy || 1.15, prey.home.z); }
 function placeParty() {
  for (const h of HEROES) {
   Object.assign(h, { x: h.home.x, y: 0, z: h.home.z, vy: 0, fly: 0, held: 0, yaw: Math.atan2(-h.home.x, -h.home.z), cheer: -1, atk: null, charmed: false, wb: 0, ph: 0 });
   h.model.reset(); h.model.root.position.set(h.x, 0, h.z); h.model.root.rotation.set(0, h.yaw, 0); h.model.animate(0, 0, 0, 0); chestOf(h, _v); h.cy = _v.y;
  }
 }

 // ---------- HP, its Wrath, wilt ----------
 let hp = HP0, hpMax = HP0, deadT = -1, wrathDone = false, lastAct = '', lastP = -1, scripted = false;
 function setHP() {
  const f = hp / hpMax; $('hpFill').style.width = (f * 100).toFixed(1) + '%'; $('hpFill').classList.toggle('low', f < .25 && !(m.state.wrath > .5));
  $('hpVal').textContent = Math.round(hp).toLocaleString('en-US') + ' / ' + hpMax.toLocaleString('en-US');
 }
 function setWrath(on) {
  m.state.wrath = on ? 1 : 0; field.setWrath(on ? 1 : 0); $('phase').textContent = on ? 'Wrath' : 'Calm'; $('phase').classList.toggle('wrath', on);
  $('hpFill').classList.toggle('wrath', on); $('wrath').setAttribute('aria-pressed', String(on)); stage.classList.toggle('wrath', on); setHP();
 }
 const hpWilt = () => { m.state.wilt = (1 - hp / hpMax) * .8; };

 // ---------- its blows on the party, and what the meadow and the sound do with them ----------
 function heroHurt(h) { if (h.cheer < 0 && !isHeld(h)) { h.model.play('hurt', true); h.atk = null; sfx('thud', h.home); } }
 const swing = (n) => (scripted ? n : Math.max(1, Math.round(n * (1 + (Math.random() * 2 - 1) * .12))));
 function onHit(name, i) {
  meadowHit(name, i); soundHit(name, i);
  const all = PARTY[name] && PARTY[name][i], targets = all ? HEROES : [prey];
  if (name === 'bloom') { for (const h of targets) { headOf(h, _h); pop('Charmed', _h, 'word'); h.charmed = true; } return; }
  const base = (BLOWS[name] || [])[i]; if (!base) return;
  const big = name === 'lance' || (name === 'slam' && i === 0) || (name === 'briar' && i === 1);
  for (const h of targets) { headOf(h, _h); pop(swing(base), _h, big ? 'big' : ''); chestOf(h, _v); ring(_v, name === 'briar' || name === 'devour' ? 'vein' : ''); heroHurt(h); }
  shake((SHAKE[name] || [])[i] || .03); if (STOP[name] && !(name === 'slam' && i > 0)) hitStop(STOP[name]);
  if (big) { m.anchor(name === 'slam' ? 'grasp' : name === 'lance' ? 'hit' : 'snare', _v); flash(.6, _v); zoomPunch(name === 'slam' ? .07 : .04); }
  if (name === 'slam' && i === 0) slowMo(.3, .55);
 }
 const rnd2 = (a) => (Math.random() * 2 - 1) * a;
 function meadowHit(name, i) {
  const T = m.state.target, tx = T ? T.x : 1.4, tz = T ? T.z : 8.6;
  if (name === 'lance') { field.impact(tx, tz, .65); field.decal('crack', tx, tz, 2.2, { glow: .3 }); }
  if (name === 'slam') { field.impact(tx, tz, i ? 1 : .8); if (!i) { field.decal('crack', tx, tz - .5, 4.2, { glow: .7 }); field.throwDebris(tx, tz, 1.1, 22); } }
  if (name === 'briar') { field.impact(tx, tz, i ? .5 : .7); if (!i) field.decal('crack', tx, tz, 3, { glow: 1 }); }
  if (name === 'devour' && i === 0) field.impact(tx, tz, .35);
  if (name === 'volley') for (const h of HEROES) field.impact(h.home.x + rnd2(1.5), h.home.z + rnd2(1.5), .3);
  if (name === 'whirl') field.impact(rnd2(3), rnd2(3), .25);
 }
 function meadowCue(name, i) {
  if (name === 'appear') { if (i === 0) { field.impact(0, 0, .6); field.decal('crack', 0, .5, 5.5, { glow: 1, life: 20 }); } else { field.roar(1); field.impact(0, 0, 1); } }
  if (name === 'alert') field.roar(.35);
  if (name === 'enrage') { field.roar(1); field.impact(0, 0, 1); }
  if (name === 'devour' && i === 3) field.roar(.5);
  if (name === 'die' && i === 1) { m.anchor('bud', _v); field.impact(_v.x, _v.z, 1.2); field.throwDebris(_v.x, _v.z, 1, 18); field.decal('crack', _v.x, _v.z, 4, { glow: .2 }); }
 }
 function onCue(name, i) {
  meadowCue(name, i); soundCue(name, i);
  if (name === 'devour' && i < 3) { const n = HEALS.devour; hp = Math.min(hpMax, hp + n); setHP(); hpWilt(); m.anchor('bud', _h); pop('+' + n.toLocaleString('en-US'), _h, 'heal'); }
  if (name === 'appear') { if (i === 0) shake(.05); else { shake(.14); m.anchor('bud', _v); flash(.75, _v, 'rgba(255,200,230,.8)'); zoomPunch(.05); } }
  if (name === 'enrage') { setWrath(true); shake(.15); m.anchor('bud', _v); flash(.8, _v, 'rgba(255,120,80,.85)'); zoomPunch(.06); }
  if (name === 'briar' && i === 0) { shake(.08); hitStop(.05); }
  if (name === 'die' && i === 1) { shake(.2); hitStop(.1); zoomPunch(.06); }
  if (name === 'die' && i === 2) { m.anchor('heart', _v); flash(.4, _v); }
 }
 // each move's sounds, at its start, its hits and its cues
 function soundStart(name) {
  m.anchor('bud', _v);
  const S = {
   appear: () => sfx('rumble', _v, { gain: 1.2 }), alert: () => { sfx('creak', _v); sfx('growl', _v, { gain: .7 }); },
   bloom: () => { sfx('bloom', _v); sfx('pollen', _v, { delay: .6 }); }, lance: () => { sfx('creak', _v, { gain: .8 }); sfx('swoosh', _v, { delay: .55, rate: .8 }); },
   slam: () => { sfx('creak', _v, { gain: 1.1 }); sfx('rise', _v, { gain: .9 }); }, whirl: () => sfx('whirl', _v, { gain: 1.1 }),
   volley: () => sfx('creak', _v, { gain: .9 }), devour: () => sfx('creak', _v), briar: () => sfx('creak', _v, { rate: .8 }),
   enrage: () => sfx('growl', _v, { gain: 1, rate: .85 }), hurt: () => sfx('shriek', _v, { gain: .55, rate: 1.2 }), burn: () => { sfx('sizzle', _v); sfx('shriek', _v, { gain: .75, rate: 1.1 }); },
   die: () => sfx('shriek', _v, { gain: 1, rate: .9, delay: .3 }), block: () => sfx('creak', _v, { rate: 1.3 }),
  }[name];
  if (S) S();
 }
 function soundHit(name, i) {
  const T = m.state.target || _h.set(1.4, 0, 8.6);
  if (name === 'lance') { sfx('slam', T, { gain: 1 }); sfx('crack', T, { gain: .7 }); }
  if (name === 'slam') { if (!i) { sfx('smash', T, { gain: 1.3 }); sfx('crack', T, { gain: 1, delay: .05 }); sfx('debris', T, { delay: .15 }); } else sfx('shockwave', T, { gain: 1.1 }); }
  if (name === 'whirl') { sfx('whip', T, { rate: 1 + i * .06 }); sfx('rustle', T, { gain: .5 }); }
  if (name === 'volley') { sfx('thorns', T, { gain: .8 }); for (let k = 0; k < 4; k++) sfx('thunk', HEROES[k % 2].home, { delay: .08 + k * .07, rate: .9 + Math.random() * .3, gain: .7 }); }
  if (name === 'devour' && !i) { sfx('grab', T); }
  if (name === 'devour' && i) sfx('thud', T, { gain: .5 });
  if (name === 'briar') { if (!i) { sfx('crack', T, { gain: 1 }); sfx('shoots', T, { gain: 1.1 }); } else sfx('squeeze', T); }
  if (name === 'bloom') sfx('charm', T);
 }
 function soundCue(name, i) {
  m.anchor('bud', _v);
  if (name === 'appear') { if (i === 0) sfx('crack', V3(0, 0, 0), { gain: 1.2 }); else { sfx('roar', _v, { gain: 1.3 }); sfx('burst', _v); sfx('birds', V3(0, 12, -50), { delay: .4, gain: .7 }); } }
  if (name === 'alert') sfx('growl', _v, { gain: .5 });
  if (name === 'slam' && i === 0) sfx('heartbeat', _v, { gain: 1.2 });
  if (name === 'volley') sfx('whip', _v, { gain: 1, rate: i ? 1.1 : .95 });
  if (name === 'devour') { if (i < 3) sfx('gulp', _v, { rate: .9 + i * .08 }); else { sfx('burst', _v, { gain: .8 }); sfx('growl', _v, { gain: .6 }); } }
  if (name === 'briar' && i === 1) sfx('creak', _v, { rate: 1.2 });
  if (name === 'enrage') { sfx('roar', _v, { gain: 1.4, rate: .92 }); sfx('burst', _v, { gain: 1.1 }); sfx('thunder', null, { delay: .5, gain: 1 }); }
  if (name === 'die') { if (i === 0) sfx('creak', _v, { gain: 1.2, rate: .7 }); if (i === 1) { sfx('crash', _v, { gain: 1.4 }); sfx('debris', _v, { delay: .2 }); } if (i === 2) sfx('heartbeat', _v, { gain: .8, rate: .8 }); }
 }

 // ---------- the party's blows on it ----------
 const aimAt = (out) => m.anchor(m.open > .62 ? 'heart' : 'chest', out);
 function wake() {
  m.play('appear', true); deadT = -1; hp = hpMax; wrathDone = false; setWrath(false); setHP(); hpWilt(); m.regrow && m.regrow();
  for (const h of HEROES) if (h.cheer >= 0) { h.model.reset(); h.cheer = -1; }
  soundStart('appear'); setCaption('appear');
 }
 function strikeBack(kind) {
  if (!m || deadT >= 0) return false;
  if (m.gone) { wake(); return false; }
  const A = ATK[kind], h = A.who === 'io' ? IO : SOL;
  if (isHeld(h) || h.cheer >= 0 || h.atk) return false;
  const hits = h.model.ACTIONS[A.act].hits, cues = h.model.ACTIONS[A.act].cues || [];
  h.model.play(A.act, true); h.atk = { kind, A, hits, cues, n: 0, c: 0 };
  // its sound as it starts
  chestOf(h, _v);
  if (kind === 'dagger') sfx('slash', _v, { delay: .15 });
  if (kind === 'flame') sfx('spell', _v, { delay: .25 });
  if (kind === 'flare') { sfx('swoosh', _v, { delay: .45, rate: 1.1 }); sfx('flare', _v, { delay: .4 }); }
  if (kind === 'rush') sfx('rush', _v);
  if (kind === 'sever') sfx('swoosh', _v, { delay: .5, rate: .85, gain: 1.1 });
  if (kind === 'noon') sfx('flare', _v, { gain: 1.2 });
  return true;
 }
 // the fireball of Io's flame: from her hand, in an arc, onto it
 let fireball = null;
 function launchFlame() {
  const from = io.flamePos(V3()); aimAt(_v); const to = _v.clone();
  fireball = { t: 0, dur: .5 };
  FX.projectile({ from, to: () => aimAt(V3()), dur: .5, size: .55, color: 0xffb070, halo: 0xff6a20, arc: 1.4, trail: [1, .55, .2], light: 0xff8a3a, lightI: 3 }).then(() => { fireball = null; landBlow('flame', 0, true); });
 }
 function landBlow(kind, i, last) {
  if (!m || m.gone || deadT >= 0) return;
  const A = ATK[kind], weak = m.open > .62, fire = !!A.fire;
  let n = swing(A.dmg[Math.min(i, A.dmg.length - 1)]); if (weak) n *= 2;
  aimAt(_v); ring(_v, weak ? 'heart' : fire ? 'vein' : ''); _h.copy(_v); _h.y += .9 + (i || 0) * .45;
  pop(n, _h, (fire ? 'fire ' : '') + (weak || kind === 'flare' || (kind === 'noon' && last) ? 'big' : ''));
  if (weak) { _h.y += 1.1; pop('Weak point!', _h, 'weak'); sfx('weak', _v, { gain: 1.1 }); zoomPunch(.05); }
  shake(weak ? .07 : fire ? .045 : .03); hitStop(weak ? .09 : .05);
  // the blow's light, sparks and sound
  const col = fire ? [1, .55, .2] : [.85, .9, 1];
  FX.burst(_v, col, fire ? 46 : 26, fire ? 5 : 3.5);
  if (fire) { FX.flashLight(_v, 0xff8a3a, 4, .45, 9); glowAt(0, _v, 7, 0xff8030, 1.6, .5); sfx('fireHit', _v, { gain: .9 }); }
  sfx(kind === 'dagger' ? 'cut' : kind === 'flame' ? 'fireBurst' : 'swordHit', _v, { rate: .95 + Math.random() * .1 });
  if (kind === 'sever') { for (const k of [1, 2, 3, 0]) if (m.sever(k) >= 0) break; sfx('crash', _v, { gain: .8, rate: 1.25 }); field.impact(_v.x, _v.z + 1.5, .5); }
  hp = Math.max(0, hp - n); setHP(); hpWilt();
  if (hp <= 0) { m.play('die', true); deadT = 0; soundStart('die'); setCaption('die'); return; }
  if (!wrathDone && hp <= hpMax * .5) { wrathDone = true; m.play('enrage', true); soundStart('enrage'); setCaption('enrage'); return; }
  if (!last) return;
  const a = fire ? 'burn' : 'hurt', cur = m.action;
  if (!m.busy || m.ACTIONS[cur].interrupt || cur === 'alert' || cur === 'rest' || cur === 'bloom') { m.play(a, true); soundStart(a); }
 }
 // a light on the ground and the grass (the field's glows) that fades
 const GLOWS = [0, 1, 2, 3].map(() => ({ p: V3(), r: 0, c: new THREE.Color(), I: 0, t: 0, dur: 1 }));
 function glowAt(i, p, r, color, I, dur) { const G = GLOWS[i]; G.p.copy(p); G.r = r; G.c.set(color); G.I = I; G.t = 0; G.dur = dur; }

 // ---------- the party, every frame ----------
 function stepHero(h, dt, t) {
  const md = h.model, isPrey = h === prey, H = isPrey ? m.holding || 0 : 0, inside = isPrey ? m.inside || 0 : 0, wasHeld = h.held || 0; h.held = H;
  if (h.atk) {
   const A = h.atk, u = md.action === A.A.act ? md.progress : md.action === '' ? 1 : -2;
   if (u === -2) h.atk = null;
   else {
    if (A.kind === 'flame') { if (A.n === 0 && u >= (A.cues[0] || .44)) { A.n = 1; launchFlame(); } }
    else while (A.n < A.hits.length && u >= A.hits[A.n]) { const i = A.n++; landBlow(A.kind, i, i === A.hits.length - 1); }
    // fire on Sol's blade while she strikes with it
    if (h === SOL && A.A.fire && u > .1 && u < .95) { sol.anchor('hit', _v); actLight.position.copy(_v); actLight.color.set(0xff8a3a); actLight.intensity = Math.max(actLight.intensity, 2.2); glowAt(0, _v, 5, 0xff8030, 1.1, .2); }
    if (A.n >= A.hits.length && !md.busy && !(A.kind === 'flame' && fireball)) h.atk = null;
    if (A.kind === 'flame' && A.n && !fireball && !md.busy) h.atk = null;
   }
  }
  if (m.action !== 'bloom') h.charmed = false;
  let tx = h.home.x, tz = h.home.z;
  if (h.charmed) { m.anchor('bloom', _v); tx = lerp(h.home.x, _v.x, .22); tz = lerp(h.home.z, _v.z, .22); }
  if (H > .01) {
   m.anchor('held', _v);
   h.x = lerp(h.x, _v.x, H); h.z = lerp(h.z, _v.z, H); h.y = lerp(h.y, Math.max(0, _v.y - h.cy), H); h.vy = 0; h.wb = Math.max(0, h.wb - dt * 3); h.fly = 0;
  } else {
   if (wasHeld > .3 && Math.hypot(h.home.x - h.x, h.home.z - h.z) > 2) { const T = 1.1; h.fly = T; h.vx = (h.home.x - h.x) / T; h.vz = (h.home.z - h.z) / T; h.vy = (4.9 * T * T - h.y) / T; }
   if (h.fly > 0) { h.fly -= dt; h.x += h.vx * dt; h.z += h.vz * dt; }
   if (h.y > 0 || h.vy > 0) { h.vy -= 9.8 * dt; h.y = Math.max(0, h.y + h.vy * dt); if (h.y === 0) { if (h.vy < -6) { shake(.03); sfx('thud', h, { gain: .8 }); field.impact(h.x, h.z, .25); } h.vy = 0; h.fly = 0; } }
   if (h.fly > 0) h.wb = Math.max(0, h.wb - dt * 3);
   else if (md.busy && md.dash) { h.x += Math.sin(h.yaw) * md.dash * dt; h.z += Math.cos(h.yaw) * md.dash * dt; }
   else {
    const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz);
    if (d > .04 && h.y === 0) { const sp = Math.min(1.6, .4 + 2 * d) * dt, s = Math.min(1, sp / d); h.x += dx * s; h.z += dz * s; h.ph += sp * 4.4; h.wb = Math.min(1, h.wb + dt * 3); }
    else h.wb = Math.max(0, h.wb - dt * 3);
   }
  }
  const away = Math.hypot(h.home.x - h.x, h.home.z - h.z), face = away > .6 && h.wb > .3 && H < .01 ? Math.atan2(h.home.x - h.x, h.home.z - h.z) : Math.atan2(-h.x, -h.z);
  if (!(md.busy && md.dash)) h.yaw += wrapA(face - h.yaw) * (1 - Math.exp(-dt * 6));
  if (deadT > 2.4 && h.cheer < 0) { md.play('victory', true); h.cheer = 1; h.atk = null; }
  h.shadow.visible = inside < .5; h.shadow.position.set(h.x, .02, h.z); h.shadow.scale.setScalar(Math.max(.35, 1 - h.y * .25)); h.shadow.material.opacity = Math.max(.2, 1 - h.y * .3);
  md.root.visible = inside < .5; if (md.fx) md.fx.visible = md.root.visible;
  md.root.position.set(h.x, h.y, h.z); md.root.rotation.y = h.yaw; md.root.rotation.x = H * -.18; md.animate(h.ph, h.wb, t, dt);
 }

 // ---------- the captions ----------
 function setCaption(id, line) {
  const mv = MOVES.find((x) => x.id === id);
  $('actName').textContent = mv ? mv.name : id || '';
  $('actCap').textContent = line || (mv ? mv.cap : '');
 }
 const say = (name, line) => { $('actName').textContent = name; $('actCap').textContent = line || ''; };

 // ---------- Play the fight: a choreographed fight, from its Awakening to its fall ----------
 // the script yields { wait: seconds } or { until: () => true when done }
 const RUN = { gen: null, wait: 0, until: null };
 const W = (s) => ({ wait: s }), U = (f) => ({ until: f });
 function* boss(name, shotName, line) {
  if (shotName) SHOTS[shotName]();
  if (m.play(name, true)) { soundStart(name); setCaption(name, line); }
  yield U(() => m.action === name);
  yield U(() => m.action !== name || !m.busy);
 }
 function* hero(kind, shotName, line) {
  if (shotName) SHOTS[shotName]();
  const A = ATK[kind], h = A.who === 'io' ? IO : SOL;
  yield U(() => !h.atk && !h.model.busy);
  say((A.who === 'io' ? 'Io: ' : 'Sol: ') + { dagger: 'dagger', flame: 'flame', flare: 'Flare Cut', rush: 'Ember Rush', sever: 'Sunder', noon: 'High Noon' }[kind], line);
  strikeBack(kind);
  yield U(() => !h.atk && !fireball);
 }
 function* healIo() {
  const allies = [IO, SOL].map((h) => () => chestOf(h, V3()));
  SHOTS.party(); say('Io: Waxing Light', 'A crescent waxes full over the party and its light heals them both.');
  io.play('mend', true); const mend = io.ACTIONS.mend; sfx('moon', V3(0, 3, 9), { gain: 1 });
  glowAt(2, V3(-.5, 3, 9), 9, 0xbcd0ff, 1.2, 2.2);
  yield W(mend.dur * .05);
  SP.waxingLight({ sky: () => V3(-.4, 3.6, 8.9), allies, landIn: mend.dur * .55 }).then(() => { for (const h of HEROES) { headOf(h, _h); pop('+270', _h, 'heal'); } sfx('heal', V3(-.4, 2, 9)); });
  yield U(() => !io.busy);
 }
 function* fightScript() {
  scripted = true; stage.classList.add('cine');
  field.setWeather('clear'); setWrath(false); hp = hpMax; setHP(); hpWilt(); m.regrow(); deadT = -1; wrathDone = false; placeParty();
  m.play('rest', true); SHOTS.wide(); say('The wild meadow', 'Night in the wilds. A mound of brambles at the meadow\'s heart, larger than a house.');
  yield W(3);
  yield* boss('appear', 'boss', 'The ground splits and it heaves up out of the earth, spikes first.');
  SHOTS.wide(); yield W(.6);
  prey = SOL; aim();
  yield* hero('flare', 'clash', 'Sol\'s blade catches fire. It fears fire.');
  yield W(.4);
  yield* boss('lance', 'clash');
  yield W(.3);
  yield* hero('flame', 'wide');
  prey = IO; aim();
  yield W(.4);
  SHOTS.high(); if (m.play('slam', true)) { soundStart('slam'); setCaption('slam'); }
  yield U(() => m.action === 'slam'); yield U(() => m.progress > .45 || m.action !== 'slam');
  SHOTS.io(); yield U(() => m.progress > .58 || m.action !== 'slam'); SHOTS.wide(); yield U(() => m.action !== 'slam' || !m.busy);
  yield W(.3);
  yield* healIo();
  yield* hero('rush', 'clash', 'Four burning blows at a run.');
  yield W(.2);
  yield* boss('volley', 'wide');
  yield* hero('dagger', 'clash');
  yield W(.2);
  // its Wrath comes when Sol's blade takes it under half its HP
  yield* hero('flare', 'clash');
  yield U(() => m.action !== 'enrage' || !m.busy);
  SHOTS.wide(); say('Wrath', 'The sky turns to a red storm.'); yield W(1.2);
  field.strike(-9, -3); yield W(1.6);
  yield* boss('whirl', 'wide');
  yield W(.3);
  prey = IO; aim();
  SHOTS.boss(); if (m.play('devour', true)) { soundStart('devour'); setCaption('devour'); }
  yield U(() => m.action === 'devour'); yield U(() => m.progress > .74 || m.action !== 'devour');
  // Sol strikes its bare heart: double, and it lets Io go
  say('Sol: Flare Cut', 'At its open heart: a weak point.'); SHOTS.heart(); strikeBack('flare');
  yield U(() => !SOL.atk); yield U(() => m.action !== 'devour' || !m.busy);
  SHOTS.wide(); yield W(.4);
  field.strike(11, -16);
  prey = SOL; aim();
  yield* boss('briar', 'sol');
  yield W(.2);
  yield* hero('sever', 'clash', 'Sol cuts one of its great canes away.');
  yield W(.3);
  yield* boss('bloom', 'boss');
  yield W(.2);
  // the end: Sol's High Noon at its open heart
  yield* hero('noon', 'clash', 'Seven blows of noon light, the last at its heart.');
  yield U(() => deadT >= 0);
  SHOTS.boss(); yield U(() => deadT > 2.6);
  setWrath(false); field.setWeather('clear'); SHOTS.wide();
  say('Felled', 'Its heart goes dark, the storm clears and the moon comes out again.');
  sfx('victory', null, { delay: .4 });
  yield W(7);
  stage.classList.remove('cine'); scripted = false; setPlay(false);
 }
 function setPlay(on) {
  $('play').setAttribute('aria-pressed', String(on)); $('play').querySelector('.t').textContent = on ? 'Stop the fight' : 'Play the fight';
  if (on) { RUN.gen = fightScript(); RUN.wait = 0; RUN.until = null; } else { RUN.gen = null; scripted = false; stage.classList.remove('cine'); }
 }
 function stepScript(dt) {
  if (!RUN.gen) return;
  if (RUN.wait > 0) { RUN.wait -= dt; return; }
  if (RUN.until && !RUN.until()) return;
  const r = RUN.gen.next();
  if (r.done) { RUN.gen = null; return; }
  RUN.wait = r.value.wait || 0; RUN.until = r.value.until || null;
 }

 // ---------- controls ----------
 function wbtn(label, small, pressed) { const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn'; b.innerHTML = '<span class="t"></span>' + (small !== null ? '<small></small>' : ''); b.querySelector('.t').textContent = label; if (small !== null) b.querySelector('small').textContent = small; if (pressed !== undefined) b.setAttribute('aria-pressed', String(!!pressed)); return b; }
 function stopScript() { if (RUN.gen) setPlay(false); }
 function buildControls() {
  for (const id of MOVEBTN) {
   const mv = MOVES.find((x) => x.id === id), A = m.ACTIONS[id], b = wbtn(mv.name, A.dur.toFixed(1) + ' s' + (A.hits.length ? ' · ' + A.hits.length + (A.hits.length > 1 ? ' hits' : ' hit') : ''));
   b.title = mv.cap; b.addEventListener('click', () => { startAudio(); stopScript(); if (id === 'appear' || m.gone) { wake(); return; } if (deadT >= 0) return; if (m.play(id, true)) { soundStart(id); setCaption(id); } });
   $('moves').appendChild(b);
  }
  for (const [id, kind] of [['ioDagger', 'dagger'], ['ioFlame', 'flame'], ['solFlare', 'flare'], ['solRush', 'rush'], ['solSever', 'sever'], ['solNoon', 'noon']]) $(id).addEventListener('click', () => { startAudio(); stopScript(); strikeBack(kind); });
  $('ioHeal').addEventListener('click', () => { startAudio(); stopScript(); if (!io.busy) { RUN.gen = (function* () { yield* healIo(); })(); RUN.wait = 0; RUN.until = null; } });
  for (const [id, name] of [['io', 'Io'], ['sol', 'Sol']]) {
   const b = wbtn(name, null, prey.id === id); b.dataset.id = id; b.title = 'Who its single blows and Devour go for';
   b.addEventListener('click', () => { prey = id === 'io' ? IO : SOL; aim(); for (const x of $('preySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); });
   $('preySeg').appendChild(b);
  }
  for (const [id, name, tip] of [['clear', 'Clear', 'A fair night and a breeze'], ['rain', 'Rain', 'Rain, wind and puddles'], ['storm', 'Storm', 'Lightning, thunder and a gale']]) {
   const b = wbtn(name, null, id === 'clear'); b.dataset.id = id; b.title = tip; b.addEventListener('click', () => setWeather(id)); $('weatherSeg').appendChild(b);
  }
  $('wrath').addEventListener('click', () => setWrath(!(m.state.wrath > .5)));
  $('bolt').addEventListener('click', () => { startAudio(); const x = rnd2(14), z = -4 - Math.random() * 14; field.strike(x, z); });
  $('play').addEventListener('click', () => { startAudio(); setPlay(!RUN.gen); });
  $('start').addEventListener('click', () => { startAudio(); $('start').hidden = true; setPlay(true); });
  $('sound').addEventListener('click', () => { startAudio(); const on = !(SND && !SND.muted); if (SND) SND.setMuted(!on); $('sound').setAttribute('aria-pressed', String(on)); });
  $('painted').addEventListener('click', (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); field.setDebug(on); });
  $('cap60').addEventListener('click', (e) => { CAP = CAP === 30 ? 60 : 30; e.currentTarget.setAttribute('aria-pressed', String(CAP === 60)); e.currentTarget.querySelector('small').textContent = CAP === 60 ? 'as smooth as the phone can' : '30, as the game'; });
  // the painting as a picture, shown over the page to save: in the artifact viewer through its downloads capability
  // (the viewer confirms the save), in the page saved as a file through a plain download link
  let downloads = null, paintBlob = null;
  if (window.claude && window.claude.use) window.claude.use('downloads').then((d) => { downloads = d; }).catch(() => {});
  $('save').addEventListener('click', () => {
   const c = field.painting(); if (!c) return;
   c.toBlob((b) => { paintBlob = b; const u = URL.createObjectURL(b); $('paintImg').src = u; $('paintDl').href = u; $('paintView').hidden = false; }, 'image/jpeg', .92);
  });
  $('paintDl').addEventListener('click', (e) => {
   if (!downloads || !paintBlob) return;
   e.preventDefault();
   downloads.save({ filename: 'meadow-painting.jpg', data: paintBlob }).catch((err) => { if (err && err.code !== 'declined') say('Saving the painting', 'It could not be saved from here. Press and hold the picture to save it instead.'); });
  });
  $('paintClose').addEventListener('click', () => { $('paintView').hidden = true; });
  // a painting of Chris's own, from the phone, in place of the one made in code
  $('mine').addEventListener('change', (e) => {
   const f = e.target.files && e.target.files[0]; if (!f) return;
   const img = new Image(); img.onload = () => { field.usePainting(img); $('ours').disabled = false; say('Your painting', 'The far meadow is now your picture. The grass near enough to move, the trees, the mist, the weather and the fight stay live in front of it.'); }; img.src = URL.createObjectURL(f);
  });
  $('ours').addEventListener('click', () => { field.usePainting(null); $('ours').disabled = true; });
  if (SND) for (const name of SND.names) {
   const b = wbtn(SND.label(name), null); b.addEventListener('click', () => { startAudio(); SND.play(name, { pan: 0 }); }); $('sounds').appendChild(b);
  }
 }
 function setWeather(id) { field.setWeather(id); for (const x of $('weatherSeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); }
 let audioOn = false;
 function startAudio() { if (audioOn || !SND) return; audioOn = true; SND.init(); }

 // ---------- the cost, as it runs ----------
 const FPS = { n: 0, t: 0, ms: 0, fps: 0, cpu: 0 };
 function updateStats() {
  const i = renderer.info.render, S = field.stats;
  const rows = [['frames a second', FPS.fps ? FPS.fps.toFixed(0) : '–'], ['ms a frame, CPU', FPS.cpu.toFixed(1)], ['draw calls', i.calls], ['triangles', Math.round(i.triangles / 1000) + 'k'],
   ['painted tufts', Math.round(S.paintTufts / 100) / 10 + 'k'], ['painted trees', S.paintTrees], ['live tufts', Math.round(S.liveTufts / 100) / 10 + 'k'], ['painting took', Math.round(S.paintMs) + ' ms'], ['sounds made in', SND && SND.renderMs ? Math.round(SND.renderMs) + ' ms' : 'on Play']];
  $('stats').innerHTML = rows.map(([k, v]) => '<div><b>' + v + '</b>' + k + '</div>').join('');
 }

 // ---------- every frame ----------
 let gt = 0, CAP = 30, statT = 0;
 function step(rdt) {
  // hit-stop holds the world still a moment; slow motion stretches a big blow
  let dt = rdt; if (stopT > 0) { stopT -= rdt; dt = 0; } else if (slowT > 0) { slowT -= rdt; dt *= slowK; }
  gt += dt;
  m.animate(0, 0, gt, dt);
  const a = m.action, p = m.progress, A = a ? m.ACTIONS[a] : null;
  if (a !== lastAct) { lastP = -1; lastAct = a; }
  if (A && p >= 0) { A.hits.forEach((hh, i) => { if (lastP < hh && p >= hh) onHit(a, i); }); A.cues.forEach((hh, i) => { if (lastP < hh && p >= hh) onCue(a, i); }); lastP = p; }
  if (a === 'appear' && p >= 0 && p < .1 && hp < hpMax) { hp = hpMax; setHP(); hpWilt(); }
  if (a === 'appear' && p > .05 && p < .44) { shake(.03); if (Math.random() < dt * 2.5) field.impact(rnd2(2), rnd2(2), .3); }
  field.vortex(0, 0, 10, a === 'whirl' && p > .12 && p < .8 ? 1 : 0);
  field.update(gt, dt);
  const L = field.light;
  hemi.color.copy(L.hemiSky); hemi.groundColor.copy(L.hemiGround); hemi.intensity = L.hemiI;
  moon.position.copy(L.dir).multiplyScalar(30); moon.color.copy(L.color); moon.intensity = L.I; fill.color.copy(L.fillC); fill.intensity = L.fillI;
  // the heart's light on the ground while its flower is open, or in its wrath
  m.anchor('heart', _v); const hg = Math.max(cl(m.open - .3, 0, 1) * 1.2, m.state.wrath * .6) * (deadT >= 0 ? Math.max(0, 1 - deadT / 3) : 1);
  field.glow(1, _v.x, _v.y, _v.z, 8, hg > .02 ? (m.state.wrath > .5 ? new THREE.Color(1, .35, .2) : new THREE.Color(1, .3, .55)) : null, hg);
  for (let i = 0; i < 4; i++) { if (i === 1) continue; const G = GLOWS[i]; G.t += dt; const k = G.t < G.dur ? 1 - G.t / G.dur : 0; field.glow(i, G.p.x, G.p.y, G.p.z, G.r, G.c, G.I * k); }
  actLight.intensity *= Math.exp(-dt * 6);
  if (deadT >= 0) deadT += dt;
  for (const h of HEROES) stepHero(h, dt, gt);
  FX.update(dt, gt);
  stepScript(dt);
  if (SND && audioOn) SND.ambience({ wind: field.wind.z, gust: field.wind.w, rain: field.rain, wrath: field.wrath, night: 1 });
  shakeA *= Math.exp(-rdt * 7); flashA *= Math.exp(-rdt * 5);
  applyView(rdt);
 }
 function render() { $('flash').style.opacity = flashA > .01 ? flashA.toFixed(3) : '0'; renderer.render(scene, cam); }
 function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false);
  if (cam) applyView(0);
 }

 const DBG = { freeze: false };
 function start() {
  const t0 = performance.now();
  field = makeLivingField({});
  scene.fog = field.fog; scene.add(field.root);
  cam = field.camera.clone(); cam.far = 900; cam.updateProjectionMatrix();
  resize();
  field.bake(renderer);
  FX = makeBattleFX(); scene.add(FX.grp); SP = makeIoSpells(FX);
  m = makeBrambleColossus({ level: 1 }); scene.add(m.root, m.fx);
  io = makeWitch({}); sol = makeSol({});
  IO.model = io; SOL.model = sol;
  for (const h of HEROES) { scene.add(h.model.root); if (h.model.fx) scene.add(h.model.fx); h.shadow = blobMesh(); }
  SND = window.makeFightSound ? makeFightSound() : null;
  placeParty(); aim(); setWrath(false); setHP(); hpWilt();
  $('tagName').textContent = 'Bramble Colossus'; $('tagDesc').textContent = 'A wild boss · the meadow at night';
  buildControls(); applyView(10); updateStats();
  m.play('rest', true); setCaption('', ''); say('The wild meadow', 'Play the fight, or pick a move. The camera stays where it is: what is far off was painted once when the page opened, and what is near is alive.');
  field.onThunder = (k, near) => { sfx(near ? 'thunderNear' : 'thunder', null, { gain: .6 + .5 * k }); shake(near ? .08 : .02 + .03 * k); if (near) flash(.7, null, 'rgba(255,220,220,.8)'); };
  new ResizeObserver(resize).observe(stage);
  $('loading').hidden = true; $('start').hidden = false;
  console.log('fight ready in', Math.round(performance.now() - t0), 'ms; painting', Math.round(field.stats.paintMs), 'ms');
  let last = performance.now(), due = 0;
  function frame(now) {
   requestAnimationFrame(frame);
   // the frame rate cap: 30 a second by default, as the game
   if (CAP < 60 && now < due - 2) return;
   due = Math.max(due + 1000 / CAP, now);
   const rdt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
   const c0 = performance.now();
   if (!DBG.freeze) step(rdt);
   renderer.info.reset(); render();
   FPS.cpu = lerp(FPS.cpu, performance.now() - c0, .1); FPS.n++; FPS.t += rdt;
   if (FPS.t >= 1) { FPS.fps = FPS.n / FPS.t; FPS.n = 0; FPS.t = 0; }
   if ((statT += rdt) > 1) { statT = 0; updateStats(); }
  }
  renderer.info.autoReset = false;
  requestAnimationFrame(frame);
  window.__fight = {
   ready: true, DBG, field, renderer, scene, get cam() { return cam; }, get m() { return m; }, io, sol, HEROES, SHOTS, shot,
   get hp() { return hp; }, get deadT() { return deadT; }, get running() { return !!RUN.gen; }, get snd() { return SND; },
   play(name) { if (m.play(name, true)) { soundStart(name); setCaption(name); } }, strike: strikeBack, setWeather, setWrath, setPlay,
   advance(sec, quiet) { const n = Math.max(1, Math.round(sec * 30)); for (let i = 0; i < n; i++) step(1 / 30); if (!quiet) { renderer.info.reset(); render(); } return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
   setPrey(id) { prey = id === 'sol' ? SOL : IO; aim(); },
   // for pages built on this one (pass three's Battle Backgrounds): the frame-rate cap, and a fresh layout after the
   // renderer's pixel ratio changes
   get cap() { return CAP; }, set cap(v) { CAP = v; }, resize,
  };
 }
 requestAnimationFrame(() => setTimeout(() => {
  try { start(); }
  catch (err) { $('loading').textContent = 'The meadow could not be painted: ' + err.message + '. This page needs WebGL.'; console.error(err); }
 }, 40));
})();
