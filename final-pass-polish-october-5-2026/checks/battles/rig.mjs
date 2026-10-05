// rig.mjs: the battle screen's own code in node, for the battles checks. It loads three.js, the arenas
// (src/fx/arena.js, src/stage/arena-*.js), the battle rules and the game's fights (src/game/fights.js), and lifts the
// functions a check needs out of src/battle/screen.js by their text (start() is one closure, so they can't be required),
// to run them as they stand against small stand-ins for the rest of the screen.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
globalThis.THREE = require(path.join(R, 'tools/.cache/three.min.js'));
vm.runInThisContext(fs.readFileSync(path.join(R, 'src/fx/arena.js'), 'utf8'));
for (const f of fs.readdirSync(path.join(R, 'src/stage')).filter((f) => f.startsWith('arena-'))) require(path.join(R, 'src/stage', f));
for (const f of ['rules', 'engine', 'sim']) require(path.join(R, 'src/battle', f + '.js'));
require(path.join(R, 'src/game/fights.js'));

export const SRC = fs.readFileSync(path.join(R, 'src/battle/screen.js'), 'utf8');
// the text of a function or method of screen.js, from its first words to its closing brace
export function grab(marker, src = SRC) {
  const i = src.indexOf(marker); if (i < 0) throw new Error('screen.js has no ' + marker);
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  throw new Error('no end to ' + marker);
}
// one line of screen.js, from its first words to its end
export function line(marker, src = SRC) { const i = src.indexOf(marker); if (i < 0) throw new Error('screen.js has no ' + marker); return src.slice(i, src.indexOf('\n', i)); }

// an arena's locked camera, built as makeArenaField builds it (its own lines, from src/fx/arena.js)
const AS = fs.readFileSync(path.join(R, 'src/fx/arena.js'), 'utf8');
const camLines = AS.slice(AS.indexOf('const cam = new THREE.PerspectiveCamera('), AS.indexOf('cam.updateProjectionMatrix();') + 29);
const buildCam = new Function('THREE', 'CA', 'FW', 'FH', 'PI', camLines + '\nreturn cam;');
export function arenaOf(place) {
  const P = window.ARENAS[place], AV = makeArenaField.view(P);
  return { place: P, frame: AV.frame, ppm: AV.ppm, camera: buildCam(THREE, AV.camera, AV.frame[0], AV.frame[1], Math.PI) };
}

// a fight as the game sets it up in its arena (GameFights.config), with its heroes and foes standing at home
export function fightOf(kind, opts, level) {
  const P = { level: level || 16, xp: 0, flags: { party: true, envoi: kind === 'finale' }, hp: {}, herbs: {} };
  const c = window.GameFights.config(kind, P, Object.assign({ arena: true, weather: 'clear' }, opts || {}));
  const ids = kind === 'wild' ? (opts.pack || []) : null;
  return { c, ids };
}

// the camera director (its whole section of screen.js: shot, shotFit, shotField and the rest), with applyCam, toScreen
// and the arena's ZK, ZMAX and BELOW, run on an arena's camera at a screen size (w, h, and uiH: the battle windows'
// height as layoutView takes it), for the fighters given. `extra` names more stand-ins the code may read; run(code)
// evaluates more of screen.js (an action, say) in the same scope
export function director(place, size, fighters, extra) {
  const A = arenaOf(place), AF = { ppm: A.ppm, frame: A.frame, camera: A.camera };
  const IW = A.frame[0], IH = A.frame[1];
  const fullCam = A.camera.clone(), camera = fullCam.clone(), tmpV = new THREE.Vector3();
  const toPx = (p) => { tmpV.copy(p).project(fullCam); return [(tmpV.x + 1) / 2 * IW, (1 - tmpV.y) / 2 * IH]; };
  const UI = { menuOpen: !!size.menuOpen };
  const standing = () => fighters.filter((f) => !f.out && f.m.root.visible);
  const env = Object.assign({
    THREE, AF, IW, IH, REDUCED: false, UI, standing, toPx, tmpV, camera, DPR: 1, $: () => ({ hidden: true }), stage: {},
    paintImg: { complete: false }, paintCtx: null, paintCv: null, TOWN: { ver: 0 }, drawTown() {}, BF: null,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v), foes: fighters.filter((f) => f.side === 'foe'), heroes: fighters.filter((f) => f.side === 'hero'),
  }, extra || {});
  const section = SRC.slice(SRC.indexOf('// ---------- camera director'), SRC.indexOf('function addShake('));
  const body = [line('const ZK = AF ?'), line('const BELOW = AF ?'), section, grab('function applyCam('), grab('function toScreen('),
    // (run: more of screen.js, evaluated in the same scope, so it sees all of the above)
    'return { shot, shotAt, shotBoth, shotFit, shotField, applyCam, toScreen, view, cam, ZK, ZMAX, BELOW, run: (code) => eval(code) };'].join('\n');
  const names = Object.keys(env);
  const d = new Function(...names, body)(...names.map((k) => env[k]));
  Object.assign(d.view, { w: size.w, h: size.h, uiH: size.uiH, uiNow: size.uiNow || size.uiH });
  Object.assign(d.cam, { cx: IW / 2, cy: IH / 2, s: 1, tx: IW / 2, ty: IH / 2, ts: 1 });
  // the camera eased all the way into its shot
  d.settle = () => { for (let i = 0; i < 40; i++) d.applyCam(2); };
  d.screenOf = (x, y, z) => { const q = d.toScreen(new THREE.Vector3(x, y, z)); return { x: q[0], y: q[1] }; };
  return Object.assign(d, { UI, env, IW, IH, AF });
}

// a fighter as screen.js's fighter() makes one, standing at home (metres)
export function fighter(key, side, home, look) {
  return { key, side, look: look || {}, kind: (look && look.kind) || key, tall: (look && look.tall) || 2, pos: { x: home[0], z: home[1] }, home: { x: home[0], z: home[1] },
    out: false, m: { root: { visible: true }, action: null, busy: false, progress: 1, play() {}, guard() {}, ACTIONS: { stoop: { hits: [0.45] } } } };
}
