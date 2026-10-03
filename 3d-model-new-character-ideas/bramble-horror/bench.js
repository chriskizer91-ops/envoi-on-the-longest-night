// bench.js: the Bramble Horror's model bench. The creature stands in a wild glade under the battle screen's lights. Io,
// the Witch (her original model, as every bench's supporting actors are), stands where its canes reach: she takes its
// blows, is lured toward its fruit, held and dragged in its Grab, and strikes back with her dagger and her flame. Big
// numbers on the game's level curve, hit-stop, a shaking camera, and its HP driving its wilt. three.js r128 (global
// THREE); needs makeBramble, makeBrambleOriginal (the Before switch), makeWitchOriginal and makeGlade.
// Test hooks for headless checks are on window.__bench.
(function () {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
 const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
 const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const FORMS = [
  { id: 'classic', name: 'Classic Horror', desc: 'Balanced form, common variant.' },
  { id: 'ambush', name: 'Low Ambush', desc: 'Flatter profile, disguises as ordinary blackberry thicket.' },
  { id: 'towering', name: 'Towering Reach', desc: 'Extended, aggressive posture.' },
  { id: 'ancient', name: 'Ancient Crown', desc: 'Older, more massive variant.' },
 ];
 const MOVES = [
  { id: 'appear', name: 'Appear', cap: 'Grows up out of the soil as an ordinary thicket, keeps still, then reveals itself: the ground heaves and its roots flare.' },
  { id: 'alert', name: 'Alert', cap: 'Senses prey. Canes rise and orient toward the target.' },
  { id: 'lure', name: 'Lure', cap: 'Presents ripe fruit to attract prey. One berry-laden cane extends and remains invitingly still while its fruit swells and gleams. The fruit is real. The danger is not.' },
  { id: 'strike', name: 'Strike', cap: 'Rapid cane lunge. Recurved thorns catch and hold, making escape difficult.' },
  { id: 'grab', name: 'Grab / Pull In', cap: 'Multiple canes lash out together, coil round the prey, yank it in, lift it on each squeeze and drag it to the root crown.' },
  { id: 'consume', name: 'Consume', cap: 'The canes cage the root crown and ribbons of life twist out of the prey into its hollow; it pulses as it feeds, its veins flaring: each pulse a blow, then a heal.' },
  { id: 'sweep', name: 'Thorn Sweep', cap: 'Winds round and sweeps its canes flat across the front. Not on the sheets: a blow on the whole party.' },
  { id: 'undergrowth', name: 'Undergrowth', isNew: true, cap: 'Stabs its canes into the soil; a pulse runs out along its roots, the ground splits, and thorned shoots burst up round the prey, close over it and squeeze. Not on the sheets: a big move for the higher levels.' },
  { id: 'hurt', name: 'Hurt', cap: 'Recoils from fire or heavy damage, then regroups.' },
  { id: 'burn', name: 'Scorch', isNew: true, cap: 'Its recoil from fire: it rears away from the flames, leaves catching and curling black, and smoulders as it regroups. Not on the sheets, which only say it fears fire.' },
  { id: 'block', name: 'Block', cap: 'Crosses its front canes into a wall of thorns.' },
  { id: 'rest', name: 'Rest', cap: 'Low profile. Appears as an ordinary, if unusually lush, blackberry thicket.' },
  { id: 'die', name: 'Defeated', cap: 'A last flail and a last pulse through its roots, then it collapses flat, drops its fruit, withers brown and crumbles away. Any move after this grows it back.' },
 ];
 // what each of its blows does to the prey at level 1: placeholders until the battle steps. They grow 20% a level (the
 // October 2 curve) with a swing of up to 25% either way; the hit-stop and the camera shake go with the weight of a blow.
 const BLOWS = { strike: [140], grab: [55, 55, 60], consume: [60, 60, 60], sweep: [120], undergrowth: [170, 230] };
 const HEALS = { consume: 60 };
 const SHAKE = { strike: [.07], grab: [.025, .03, .035], consume: [.02, .02, .02], sweep: [.06], undergrowth: [.14, .1] };
 const STOP = { strike: .09, sweep: .06, undergrowth: .11 };
 const HP1 = 1200, SWORD1 = 100, FIRE1 = 165;
 const TOGGLES = [
  { id: 'walk', name: 'Creep', note: 'canes as legs' },
  { id: 'guard', name: 'Guard', note: 'thorn wall' },
  { id: 'spin', name: 'Turntable', note: 'slow turn' },
 ];
 const opts = { variant: 'classic', level: 1, after: true, walk: false, guard: false, spin: false, prey: 'io', day: false, scenery: true, rings: true };
 const lvlK = () => Math.pow(1.2, opts.level - 1);
 const swing = (n) => Math.max(1, Math.round(n * (1 + (Math.random() * 2 - 1) * .25)));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);

 // ---------- renderer, scene, lights ----------
 const canvas = $('gl'), stage = $('stage');
 const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
 renderer.setClearColor(0x000000, 0); // with the glade off, the stage's own backdrop shows through
 renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
 const scene = new THREE.Scene();
 // the battle screen's lights (the Model Build Spec's Night square rig), and a plain overcast daylight
 const night = new THREE.Group(), day = new THREE.Group();
 night.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
 { const l = new THREE.DirectionalLight(0xb8c0ff, 0.62); l.position.set(-5, 9, -12); night.add(l); }
 { const l = new THREE.DirectionalLight(0xffdcc0, 0.42); l.position.set(2, 5, 10); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.4, 10, 2); l.position.set(2.8, 2.7, 2.6); night.add(l); }
 { const l = new THREE.PointLight(0xffb46a, 1.1, 10, 2); l.position.set(-3.2, 2.4, -1.5); night.add(l); }
 day.add(new THREE.HemisphereLight(0xe2ebff, 0x5c4a36, 1.0));
 { const l = new THREE.DirectionalLight(0xfff0d6, 1.15); l.position.set(4, 9, 6); day.add(l); }
 { const l = new THREE.DirectionalLight(0xbcd0ff, 0.25); l.position.set(-6, 4, -5); day.add(l); }
 scene.add(night, day); day.visible = false;
 const glade = makeGlade({ radius: 3.4 }); scene.add(glade.root);

 // ---------- the prey: Io as she is in the Night square demo, or a plain 1.8 m figure ----------
 const io = makeWitchOriginal(); scene.add(io.root); if (io.fx) scene.add(io.fx);
 const fig = new THREE.Group(), figBody = new THREE.Group(); fig.add(figBody); scene.add(fig);
 {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a4d63, roughness: .7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.17, .21, 1.05, 14), mat); body.position.y = 1.0; figBody.add(body);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(.19, .14, .5, 14), mat); legs.position.y = .25; figBody.add(legs);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), mat); hd.position.y = 1.67; figBody.add(hd);
 }
 // a soft blob shadow under the prey, as the battle draws them; it shrinks as she is lifted
 const blob = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(8,4,14,.62)'); q.addColorStop(.5, 'rgba(8,4,14,.3)'); q.addColorStop(1, 'rgba(8,4,14,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64);
  const mm = new THREE.Mesh(new THREE.CircleGeometry(.55, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  mm.rotation.x = -Math.PI / 2; mm.renderOrder = -6; scene.add(mm); return mm;
 })();
 // where the prey stands, how it moves, and whether it is held, lured, knocked back or cheering
 const PR = { home: V3(), x: 0, y: 0, z: 0, vy: 0, yaw: Math.PI, wb: 0, ph: 0, chest: 1.1, flinch: 0, lured: false, cheer: -1, atk: null };
 const _v = V3(), _w = V3(), _h = V3();
 const preyOn = () => opts.prey !== 'none';
 function preyChest(out) { if (opts.prey === 'io') return io.chestPos(out); return out.set(PR.x, PR.y + PR.chest, PR.z); }
 function preyHead(out) { preyChest(out); out.y += .55; return out; }
 function showPrey() { io.root.visible = opts.prey === 'io'; if (io.fx) io.fx.visible = io.root.visible; fig.visible = opts.prey === 'fig'; blob.visible = opts.prey !== 'none'; }

 // ---------- the creature ----------
 const cam = new THREE.PerspectiveCamera(30, 1, .1, 200);
 const view = { yaw: 1.0, pitch: .16, dist: 10, ty: .8, tz: 1.1 };
 const home = Object.assign({}, view);
 let m = null, buildMs = 0, hp = 1, hpMax = 1, deadT = -1, lastAct = '', lastP = -1;
 function dispose(o) { o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { for (const k of ['map', 'normalMap', 'emissiveMap']) if (x.material[k]) x.material[k].dispose(); if (x.material.uniforms && x.material.uniforms.uMap) x.material.uniforms.uMap.value.dispose(); x.material.dispose(); } }); }
 function build() {
  if (m) { scene.remove(m.root, m.fx); dispose(m.root); dispose(m.fx); }
  const t0 = performance.now();
  m = (opts.after ? makeBramble : makeBrambleOriginal)({ variant: opts.variant, level: opts.level });
  buildMs = performance.now() - t0;
  scene.add(m.root, m.fx);
  // the prey stands where the canes reach, facing the crown
  PR.home.set(0, 0, m.reach + .25); PR.x = PR.home.x; PR.z = PR.home.z; PR.y = 0; PR.vy = 0; PR.yaw = Math.PI; PR.lured = false; PR.cheer = -1; PR.atk = null;
  io.reset(); io.root.position.set(PR.x, 0, PR.z); io.root.rotation.y = PR.yaw; io.animate(0, 0, 0, 0);
  io.chestPos(_v); PR.chest = _v.y; // her chest's height, for holding her by it
  m.state.target = V3(0, PR.chest, PR.home.z);
  m.guard(opts.guard);
  hpMax = hp = Math.round(HP1 * lvlK()); deadT = -1; setHP(); setWilt(0);
  const f = FORMS.find((x) => x.id === opts.variant);
  $('tagName').textContent = f.name + (opts.level > 1 ? ' · level ' + opts.level : '') + (opts.after ? '' : ' · before');
  $('tagDesc').textContent = f.desc;
  // frame each form: the camera backs off for the bigger ones
  const k = Math.pow(m.width / 4.84, .9); home.dist = 10 * k; home.ty = .8 * Math.sqrt(k); home.tz = PR.home.z * .4; view.dist = home.dist; view.ty = home.ty; view.tz = home.tz;
  renderMoves(); updateStats(); updateCanes(); setAct('');
  $('fireNote').textContent = m.ACTIONS.burn ? 'it fears flame' : 'no Scorch before';
 }

 // ---------- HP and wilt: blows take HP, and wilt follows it ----------
 function setHP() {
  const f = hp / hpMax; $('hpFill').style.width = (f * 100).toFixed(1) + '%'; $('hpFill').classList.toggle('low', f < .3);
  $('hpVal').textContent = Math.round(hp).toLocaleString('en-US') + ' / ' + hpMax.toLocaleString('en-US');
 }
 function setWilt(w) { w = cl(w, 0, 1); m.state.wilt = w; $('wilt').value = Math.round(w * 100); $('wiltOut').textContent = Math.round(w * 100) + '%'; }
 const hpWilt = () => setWilt(1 - hp / hpMax);

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
 // a burst of light round where the blow lands
 const flash = (a, p3) => { if (REDUCED) return; flashA = Math.max(flashA, a); if (p3) { const p = toScreen(p3); stage.style.setProperty('--fx', p[0] + 'px'); stage.style.setProperty('--fy', p[1] + 'px'); } };
 const hitStop = (s) => { stopT = Math.max(stopT, s); };

 // ---------- the prey's side of the fight ----------
 function preyHurt() {
  if (opts.prey === 'io') { if (PR.cheer < 0) io.play('hurt', true); }
  else PR.flinch = 1;
 }
 // its blows on the prey
 function onHit(name, i) {
  if (!preyOn()) return;
  if (name === 'lure') { preyHead(_h); pop('Lured', _h, 'word'); PR.lured = true; return; }
  const base = (BLOWS[name] || [])[i]; if (!base) return;
  const last = i === BLOWS[name].length - 1, big = name === 'undergrowth' || name === 'strike';
  preyHead(_h); pop(swing(base * lvlK()), _h, big && last ? 'big' : '');
  if (name === 'strike') ring(m.anchor('hit', _v)); else if (name === 'grab') ring(m.anchor('grasp', _v)); else ring(preyChest(_v), name === 'undergrowth' || name === 'consume' ? 'vein' : '');
  shake((SHAKE[name] || [])[i] || .03); if (STOP[name]) hitStop(STOP[name]);
  if (name === 'strike' || (name === 'undergrowth' && i === 0)) flash(.5, _v);
  preyHurt();
 }
 // its cues: Consume heals it after each blow; Undergrowth's canes slam into the soil; Appear's ground heaves
 function onCue(name, i) {
  if (name === 'consume' && preyOn()) { const n = swing(HEALS.consume * lvlK()); hp = Math.min(hpMax, hp + n); setHP(); hpWilt(); m.anchor('top', _h); _h.y += .2; pop('+' + n.toLocaleString('en-US'), _h, 'heal'); }
  if (name === 'undergrowth' && i === 0) { shake(.09); hitStop(.05); }
  if (name === 'appear') shake(.05);
 }
 // the prey's blows on it: Io lunges with her dagger, or throws her flame, then the number lands on the crown
 const fireball = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  q.addColorStop(0, 'rgba(255,250,240,1)'); q.addColorStop(.25, 'rgba(255,170,90,.9)'); q.addColorStop(.6, 'rgba(190,80,255,.45)'); q.addColorStop(1, 'rgba(120,40,200,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const grp = new THREE.Group(), parts = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(mat); s.scale.setScalar(.42 - i * .055); grp.add(s); parts.push(s); }
  grp.visible = false; scene.add(grp); return { grp, parts, from: V3(), to: V3(), t: -1, trail: [] };
 })();
 function strikeBack(kind) {
  if (!m) return;
  if (m.gone) { m.play('appear', true); setAct('appear'); return; }
  if (PR.atk || deadT >= 0) return; // she waits for it to finish falling
  if (opts.prey === 'io' && PR.cheer < 0) {
   if (kind === 'fire') { io.play('throw', true); PR.atk = { kind, t: 0, at: .5 }; }
   else { io.play('lunge', true); PR.atk = { kind, t: 0, at: .34 }; }
  } else landBlow(kind);
 }
 function landBlow(kind) {
  if (!m || m.gone || deadT >= 0) return;
  const n = swing((kind === 'fire' ? FIRE1 : SWORD1) * lvlK());
  m.anchor('chest', _v); ring(_v, kind === 'fire' ? 'vein' : ''); m.anchor('top', _h); _h.y += .25; pop(n, _h, kind === 'fire' ? 'fire big' : '');
  shake(kind === 'fire' ? .05 : .035); hitStop(.05);
  if (kind === 'sever' && m.sever() >= 0) updateCanes();
  hp = Math.max(0, hp - n); setHP(); hpWilt();
  if (hp <= 0) { m.play('die', true); deadT = 0; setAct('die'); }
  else { const a = kind === 'fire' && m.ACTIONS.burn ? 'burn' : 'hurt'; if (!m.busy || m.ACTIONS[m.action].interrupt || m.action === 'alert' || m.action === 'rest') { m.play(a, true); setAct(a); } }
 }

 function stepPrey(dt, t) {
  if (!m) return;
  const H = m.holding || 0, onIo = opts.prey === 'io';
  // a blow of hers in flight: the lunge's dagger, or the flame she threw
  if (PR.atk) {
   const A = PR.atk; A.t += dt;
   if (A.at >= 0 && A.t >= A.at) {
    A.at = -1;
    if (A.kind === 'fire' && onIo) { io.flamePos(fireball.from); m.anchor('chest', fireball.to); fireball.t = 0; fireball.grp.visible = true; fireball.trail.length = 0; }
    else landBlow(A.kind);
   }
   if (A.at < 0 && (A.kind !== 'fire' || fireball.t < 0) && !io.busy) PR.atk = null;
  }
  if (fireball.t >= 0) {
   fireball.t += dt / .38; const f = Math.min(1, fireball.t);
   m.anchor('chest', fireball.to); _v.copy(fireball.from).lerp(fireball.to, f); _v.y += Math.sin(Math.PI * f) * .45;
   fireball.trail.unshift(_v.clone()); if (fireball.trail.length > fireball.parts.length * 2) fireball.trail.pop();
   fireball.parts.forEach((s, i) => s.position.copy(fireball.trail[Math.min(fireball.trail.length - 1, i * 2)]));
   if (f >= 1) { fireball.t = -1; fireball.grp.visible = false; landBlow('fire'); }
  }
  // where it belongs: home; a few steps toward the fruit while lured; in the canes while held
  if (m.action !== 'lure') PR.lured = false;
  let tx = PR.home.x, tz = PR.home.z;
  if (PR.lured) { m.anchor('lure', _v); tx = lerp(PR.home.x, _v.x, .3); tz = lerp(PR.home.z, _v.z, .3); }
  if (H > .01) {
   m.anchor('held', _v);
   PR.x = lerp(PR.x, _v.x, H); PR.z = lerp(PR.z, _v.z, H); PR.y = lerp(PR.y, Math.max(0, _v.y - PR.chest), H); PR.vy = 0; PR.wb = Math.max(0, PR.wb - dt * 3);
  } else {
   // dropped from the canes, she falls back to the soil
   if (PR.y > 0) { PR.vy -= 9.8 * dt; PR.y = Math.max(0, PR.y + PR.vy * dt); if (PR.y === 0) PR.vy = 0; }
   // knocked back by her own hurt, or lunging with her dagger
   if (onIo && io.busy && io.dash) { PR.x += Math.sin(PR.yaw) * io.dash * dt; PR.z += Math.cos(PR.yaw) * io.dash * dt; }
   else {
    const dx = tx - PR.x, dz = tz - PR.z, d = Math.hypot(dx, dz);
    if (d > .04 && PR.y === 0) { const sp = Math.min(1.25, .4 + 2 * d) * dt, s = Math.min(1, sp / d); PR.x += dx * s; PR.z += dz * s; PR.ph += sp * 4.4; PR.wb = Math.min(1, PR.wb + dt * 3); }
    else PR.wb = Math.max(0, PR.wb - dt * 3);
   }
  }
  // she faces the crown, or turns to walk back when she was thrown far from her place
  const away = Math.hypot(PR.home.x - PR.x, PR.home.z - PR.z), face = away > .45 && PR.wb > .3 && H < .01 ? Math.atan2(PR.home.x - PR.x, PR.home.z - PR.z) : Math.atan2(-PR.x, -PR.z);
  if (!(onIo && io.busy && io.dash)) PR.yaw += wrapA(face - PR.yaw) * (1 - Math.exp(-dt * 6));
  // she cheers when it falls, and stops when it grows back
  if (deadT >= 0) { deadT += dt; if (deadT > 2.2 && PR.cheer < 0 && onIo) { io.play('victory', true); PR.cheer = 1; } }
  if (deadT >= 0 && m.action === 'appear') { deadT = -1; if (PR.cheer > 0) { io.reset(); PR.cheer = -1; } }
  blob.position.set(PR.x, .012, PR.z); blob.scale.setScalar(Math.max(.35, 1 - PR.y * .9)); blob.material.opacity = Math.max(.25, 1 - PR.y * 1.2);
  if (onIo) { io.root.position.set(PR.x, PR.y, PR.z); io.root.rotation.y = PR.yaw; io.root.rotation.x = H * -.18; io.animate(PR.ph, PR.wb, t, dt); }
  else {
   PR.flinch = Math.max(0, PR.flinch - dt * 3.2);
   fig.position.set(PR.x, PR.y, PR.z); fig.rotation.y = PR.yaw; figBody.rotation.x = -.35 * Math.sin(Math.PI * PR.flinch) - H * .15;
  }
 }

 // ---------- camera: drag to orbit, wheel or pinch to zoom; the shake rides on top ----------
 let shT = 0;
 function placeCam(rdt) {
  const c = Math.cos(view.pitch); shT += rdt;
  const sx = shakeA * Math.sin(shT * 73), sy = shakeA * Math.sin(shT * 59 + 1.3) * .8;
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
  if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) view.dist = Math.max(3, Math.min(24, dist0 * pinch0 / d)); }
 });
 const up = (e) => { pts.delete(e.pointerId); if (!pts.size) stage.classList.remove('drag'); pinch0 = 0; };
 stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
 stage.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(3, Math.min(24, view.dist * Math.exp(e.deltaY * .0012))); }, { passive: false });
 $('resetView').addEventListener('click', () => Object.assign(view, home));

 // ---------- controls ----------
 function wbtn(label, small, pressed) { const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn'; b.innerHTML = '<span class="t"></span>' + (small !== null ? '<small></small>' : ''); b.querySelector('.t').textContent = label; if (small !== null) b.querySelector('small').textContent = small; if (pressed !== undefined) b.setAttribute('aria-pressed', String(!!pressed)); return b; }
 for (const f of FORMS) { const b = wbtn(f.name, null, f.id === opts.variant); b.dataset.id = f.id; b.title = f.desc; b.addEventListener('click', () => { opts.variant = f.id; for (const x of $('forms').children) x.setAttribute('aria-pressed', String(x.dataset.id === f.id)); build(); }); $('forms').appendChild(b); }
 const fmt = (n) => n.toFixed(2).replace(/^0/, '');
 function renderMoves() {
  const box = $('moves'); box.innerHTML = '';
  for (const mv of MOVES) {
   const A = m.ACTIONS[mv.id];
   const meta = A ? A.dur.toFixed(1) + ' s' + (A.hits.length ? ' · ' + A.hits.length + (A.hits.length > 1 ? ' hits' : ' hit') : A.hold ? ' · holds' : '') : 'not in Before';
   const b = wbtn(mv.name, meta); b.dataset.id = mv.id; b.title = mv.cap;
   if (mv.isNew) { b.classList.add('isnew'); const tg = document.createElement('b'); tg.className = 'newtag'; tg.textContent = 'new'; b.querySelector('small').prepend(tg); }
   if (!A) b.disabled = true;
   b.addEventListener('click', () => { if (m.play(mv.id, true)) setAct(m.action || mv.id); });
   box.appendChild(b);
  }
 }
 for (const tg of TOGGLES) {
  const b = wbtn(tg.name, tg.note, !!opts[tg.id]);
  b.addEventListener('click', () => { opts[tg.id] = !opts[tg.id]; b.setAttribute('aria-pressed', String(opts[tg.id])); if (tg.id === 'guard') m.guard(opts.guard); });
  $('toggles').appendChild(b);
 }
 for (const [id, name] of [['io', 'Io'], ['fig', 'Figure'], ['none', 'None']]) {
  const b = wbtn(name, null, opts.prey === id); b.dataset.id = id;
  b.title = id === 'io' ? 'Io, the Witch, as she is in the Night square demo' : id === 'fig' ? 'A plain 1.8 m figure, to judge the reach by' : 'No prey';
  b.addEventListener('click', () => { opts.prey = id; for (const x of $('preySeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(x.dataset.id === id)); showPrey(); });
  $('preySeg').appendChild(b);
 }
 function updateCanes() { const n = m.canes, tot = m.variant === 'ancient' ? 7 : 6; $('caneCount').textContent = n + ' of ' + tot + ' canes'; $('sever').disabled = n <= 1; }
 $('hitSword').addEventListener('click', () => strikeBack('sword'));
 $('hitFire').addEventListener('click', () => strikeBack('fire'));
 $('sever').addEventListener('click', () => strikeBack('sever'));
 $('regrow').addEventListener('click', () => { if (m.gone || deadT >= 0) { m.play('appear', true); setAct('appear'); } else m.regrow(); hp = hpMax; setHP(); hpWilt(); updateCanes(); });
 $('wilt').addEventListener('input', (e) => { const v = +e.target.value / 100; $('wiltOut').textContent = Math.round(v * 100) + '%'; m.state.wilt = v; hp = Math.max(1, Math.round(hpMax * (1 - v))); setHP(); });
 $('level').addEventListener('input', (e) => { $('levelOut').textContent = e.target.value; });
 $('level').addEventListener('change', (e) => { opts.level = +e.target.value; build(); });
 function setLight(isDay) {
  opts.day = isDay; day.visible = isDay; night.visible = !isDay; glade.setDay(isDay);
  stage.classList.toggle('day', isDay);
  $('lightDay').setAttribute('aria-pressed', String(isDay)); $('lightNight').setAttribute('aria-pressed', String(!isDay));
 }
 $('lightNight').addEventListener('click', () => setLight(false)); $('lightDay').addEventListener('click', () => setLight(true));
 $('scenery').addEventListener('click', (e) => { opts.scenery = !opts.scenery; e.currentTarget.setAttribute('aria-pressed', String(opts.scenery)); glade.setScenery(opts.scenery); });
 $('rings').addEventListener('click', (e) => { opts.rings = !opts.rings; e.currentTarget.setAttribute('aria-pressed', String(opts.rings)); glade.setRings(opts.rings); });
 function setVersion(after) {
  if (after === opts.after) return; opts.after = after;
  $('vAfter').setAttribute('aria-pressed', String(after)); $('vBefore').setAttribute('aria-pressed', String(!after)); build();
 }
 $('vBefore').addEventListener('click', () => setVersion(false)); $('vAfter').addEventListener('click', () => setVersion(true));

 // ---------- the move readout: name, length, and the hit and cue marks along it ----------
 let shown = null;
 function setAct(id) {
  const mv = MOVES.find((x) => x.id === id), track = $('track');
  for (const t of track.querySelectorAll('.tick')) t.remove();
  for (const b of $('moves').children) b.classList.toggle('on', b.dataset.id === id);
  shown = id || null;
  if (!mv || !m.ACTIONS[id]) { $('actName').textContent = opts.walk ? 'Creeping' : opts.guard ? 'Guard' : 'Idle'; $('actMeta').textContent = 'Rooted. Patient. Hungry.'; $('actCap').textContent = 'Canes arched out like legs, fruit hanging, a slow heartbeat in its roots; now and then a cane lifts and tastes the air. Pick a move to play it; red marks are where a blow lands, gold marks are cues for the battle screen.'; $('fill').style.width = '0'; shown = null; return; }
  const A = m.ACTIONS[id];
  $('actName').textContent = mv.name; $('actCap').textContent = mv.cap;
  $('actMeta').textContent = A.dur.toFixed(2) + ' s' + (A.hits.length ? ' · hits ' + A.hits.map(fmt).join(', ') : '') + (A.cues.length ? ' · cues ' + A.cues.map(fmt).join(', ') : '');
  for (const [list, cls] of [[A.cues, 'cue'], [A.hits, 'hit']]) for (const u of list) { const t = document.createElement('i'); t.className = 'tick ' + cls; t.style.left = (u * 100) + '%'; track.appendChild(t); }
 }
 function updateStats() {
  const s = m.stats;
  let fxd = 0; m.fx.traverse((o) => { if (o.isMesh || o.isPoints) fxd++; });
  const rows = [['triangles', Math.round(s.triangles / 100) / 10 + 'k'], ['draw calls', (s.drawCalls - fxd) + ' + ' + fxd + ' fx'], ['bones', s.bones], ['textures', s.textures], ['across', m.width.toFixed(1) + ' m'], ['built in', Math.round(buildMs) + ' ms']];
  $('stats').innerHTML = rows.map(([k, v]) => '<div><b>' + v + '</b>' + k + '</div>').join('');
 }

 // ---------- loop ----------
 function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.fov = cam.aspect < .9 ? 42 : 30; cam.updateProjectionMatrix(); }
 let gt = 0, phase = 0, statT = 0;
 function step(rdt) {
  // hit-stop: the world holds still a moment when a heavy blow lands
  let dt = rdt; if (stopT > 0) { stopT -= rdt; dt = 0; }
  gt += dt;
  if (opts.walk && !m.busy) phase += dt * 4.6;
  if (opts.spin && !pts.size) view.yaw += rdt * .18;
  m.animate(phase, opts.walk ? 1 : 0, gt, dt);
  // its hits and cues, as the battle screen would see them
  const a = m.action, p = m.progress, A = a ? m.ACTIONS[a] : null;
  if (a !== lastAct) { lastP = -1; lastAct = a; }
  if (A && p >= 0) { A.hits.forEach((h, i) => { if (lastP < h && p >= h) onHit(a, i); }); A.cues.forEach((h, i) => { if (lastP < h && p >= h) onCue(a, i); }); lastP = p; }
  if (a === 'appear' && hp < hpMax && p < .1) { hp = hpMax; setHP(); hpWilt(); }
  stepPrey(dt, gt);
  glade.update(gt);
  shakeA *= Math.exp(-rdt * 9); flashA *= Math.exp(-rdt * 7);
  placeCam(rdt);
  // the readout
  if (shown && p >= 0) $('fill').style.width = (p * 100).toFixed(1) + '%';
  else if (shown && !m.busy && !(m.ACTIONS[shown] && m.ACTIONS[shown].hold)) setAct('');
  else if (!shown) { const nm = opts.walk ? 'Creeping' : opts.guard ? 'Guard' : 'Idle'; if ($('actName').textContent !== nm) $('actName').textContent = nm; }
  if (shown !== a && a && m.ACTIONS[a] && MOVES.some((x) => x.id === a)) setAct(a);
  if ((statT += rdt) > 1) { statT = 0; updateCanes(); }
 }
 function render() { $('flash').style.opacity = flashA > .01 ? flashA.toFixed(3) : '0'; renderer.render(scene, cam); }
 const DBG = { freeze: false };
 function start() {
  build(); showPrey(); resize(); placeCam(0);
  new ResizeObserver(resize).observe(stage);
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
   ready: true, DBG, opts, view, get m() { return m; }, io, renderer, scene,
   play(name) { if (m.play(name, true)) setAct(m.action || name); },
   advance(sec) { const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) step(1 / 60); render(); },
   strike(kind) { strikeBack(kind); },
   set(o) { if (o.view) Object.assign(view, o.view); if (o.prey) { opts.prey = o.prey; showPrey(); } if (o.day !== undefined) setLight(o.day); if (o.after !== undefined) setVersion(o.after); if (o.variant || o.level) { if (o.variant) opts.variant = o.variant; if (o.level) opts.level = o.level; build(); } if (o.scenery !== undefined) { opts.scenery = o.scenery; glade.setScenery(o.scenery); } },
  };
 }
 // let the page paint "Growing the thicket" before the models are built
 requestAnimationFrame(() => setTimeout(() => {
  try { start(); }
  catch (err) { $('tagName').textContent = 'The scene could not start'; $('tagDesc').textContent = err.message + '. This page needs WebGL.'; console.error(err); }
 }, 30));
})();
