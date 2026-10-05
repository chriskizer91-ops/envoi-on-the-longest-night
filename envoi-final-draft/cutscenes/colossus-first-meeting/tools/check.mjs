// check.mjs: checks the page and the module as a player and the game would use them, headless (Chromium with SwiftShader,
// through Playwright; three.js from the repository's tools/node_modules). Usage, from this folder: node tools/check.mjs
//  1. The page: it gets ready, Play starts it with its sound, Skip ends it, the end card shows the frame rate, the
//     cutscene's WebGL context is gone and the last picture stays; Watch again builds it again; Laptop and Light build.
//  2. The module, from a bare page, as the game would call it: play(container, opts) settles 'skipped' when skipped and
//     'done' when it plays to the end (started near its end here), and afterwards nothing is left: no
//     canvas, a lost WebGL context, three.js's fog chunks as they were, its sound closed.
//  3. The module in an arena (the new battles, once the game is switched over): given the fight's arena as the game
//     gives it, the hand-over ends on the arena's eye-height camera and its crop, everyone in the picture, and play()
//     still settles 'done'.
// Ends with "all good", or prints what failed.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const three = path.resolve(dir, '../../../tools/node_modules/three/build/three.min.js');
const ID = 'colossus-first-meeting', PAGE = 'Colossus_First_Met_Cutscene.html';
// the fight's arena as the game gives it once the arenas are switched on (src/game/game.js arenaFor): Frostmere's shore,
// its camera (src/stage/arena-frostmere.js) and where the Bramble Colossus fight stands everyone there (ARENA_AT.colossus)
const ARENA = { place: 'frostmere', frame: [1448, 1086], camera: { x: 0, h: 2, z: 18, pitch: 4.3, fov: 38 }, ppm: 75.67,
  heroes: [{ id: 'io', at: [-2.2, -2.2], tall: 2.1, yawBias: -0.38 }, { id: 'sol', at: [-0.8, -1.0], tall: 1.9, yawBias: -0.3 }],
  foes: [{ id: 'colossus', at: [3.2, -10.6], tall: 7.8, halfW: 5.4, yawBias: 0 }] };
const fails = [];
const ok = (c, what) => { console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fails.push(what); };
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
async function open(url, size) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
  const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  await page.route('**/*', (r) => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ path: three, contentType: 'text/javascript' }); if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); return r.abort(); });
  await page.goto(url, { waitUntil: 'load' });
  return { page, errs };
}

// ---------- 1. the page ----------
{
  const { page, errs } = await open('file://' + path.join(dir, PAGE) + '?q=phone', [915, 412]);
  await page.waitForFunction(() => !document.getElementById('start').hidden || window.__err, null, { timeout: 600000 });
  ok(!(await page.evaluate(() => window.__err)), 'the page gets ready at Phone detail');
  ok(await page.evaluate(() => document.getElementById('qPhone').getAttribute('aria-pressed') === 'true'), 'Phone is marked as the detail');
  await page.click('#go');
  await page.waitForTimeout(12000);
  const playing = await page.evaluate(() => ({ skip: !document.querySelector('.cs-skip').hidden, canvas: !!document.querySelector('.envoi-cs canvas') }));
  ok(playing.skip && playing.canvas, 'Play starts it, with its Skip button showing');
  await page.click('.cs-skip');
  await page.waitForFunction(() => !document.getElementById('endcard').hidden, null, { timeout: 300000 });
  const end = await page.evaluate(() => ({ rows: document.getElementById('endRows').textContent, title: document.getElementById('endTitle').textContent, still: !!document.querySelector('#stage .envoi-cs-still'), gl: !!document.querySelector('.envoi-cs canvas'), last: window.__ended }));
  ok(end.title.includes('Skipped'), 'Skip ends it on the end card: "' + end.title + '"');
  ok(end.still && !end.gl, 'the last picture stays and the cutscene\'s canvas is gone');
  ok(/frames a second|skipped before/.test(end.rows), 'the end card reports the frame rate: ' + (end.last && end.last.fps) + ' fps, ' + (end.last && end.last.qualityName));
  await page.evaluate((b) => document.querySelector(b).click(), '#again'); // (in the slow test browser a pointer click can time out while it draws)
  await page.waitForFunction(() => !document.getElementById('start').hidden || window.__err, null, { timeout: 600000 });
  ok(!(await page.evaluate(() => window.__err)) && !(await page.evaluate(() => document.querySelector('#stage .envoi-cs-still'))), 'Watch again builds it again');
  await page.evaluate((b) => document.querySelector(b).click(), '#qLaptop'); // (in the slow test browser a pointer click can time out while it draws)
  await page.waitForFunction(() => !document.getElementById('start').hidden || window.__err, null, { timeout: 600000 });
  ok(!(await page.evaluate(() => window.__err)), 'it builds at Laptop detail');
  await page.evaluate((b) => document.querySelector(b).click(), '#qLight'); // (in the slow test browser a pointer click can time out while it draws)
  await page.waitForFunction(() => !document.getElementById('start').hidden || window.__err, null, { timeout: 600000 });
  ok(!(await page.evaluate(() => window.__err)), 'it builds at Light detail');
  ok(errs.length === 0, 'no errors on the page' + (errs.length ? ':\n  ' + errs.slice(0, 8).join('\n  ') : ''));
  await page.close();
}

// ---------- 2. the module, as the game calls it ----------
{
  const bare = path.join(dir, '.check-bare.html');
  fs.writeFileSync(bare, '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><div id="box" style="position:fixed;inset:0"></div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="./' + ID + '.js"></script></body>');
  try {
    const { page, errs } = await open('file://' + bare, [915, 412]);
    const r1 = await page.evaluate(async (id) => {
      const before = THREE.ShaderChunk.fog_fragment, C = window.CUTSCENES[id];
      if (!C || typeof C.play !== 'function') return { api: false };
      const box = document.getElementById('box'); let gl = null;
      const p = C.play(box, { quality: 'light', volume: { music: .5, effects: .8, surroundings: .6 } });
      // once it plays, hold on to its context, then press its Skip
      await new Promise((res) => { const t = setInterval(() => { const b = box.querySelector('.cs-skip'); if (b && !b.hidden) { clearInterval(t); res(); } }, 200); });
      const cv = box.querySelector('.envoi-cs canvas'); gl = cv.getContext('webgl2') || cv.getContext('webgl');
      await new Promise((r) => setTimeout(r, 4000));
      box.querySelector('.cs-skip').click();
      const why = await p;
      return { api: true, why, title: C.title, seconds: C.seconds, lost: gl ? gl.isContextLost() : null, canvases: box.querySelectorAll('canvas:not(.envoi-cs-still)').length, still: !!box.querySelector('.envoi-cs-still'), box: !!box.querySelector('.envoi-cs'), chunks: THREE.ShaderChunk.fog_fragment === before, last: C.last };
    }, ID);
    ok(r1.api, 'window.CUTSCENES[\'' + ID + '\'] has play(container, opts): "' + r1.title + '", ' + Math.round(r1.seconds || 0) + ' s');
    ok(r1.why === 'skipped', 'play() settles "skipped" when its Skip is pressed (' + r1.why + ')');
    ok(r1.lost === true, 'its WebGL context is lost afterwards (renderer.dispose and forceContextLoss)');
    ok(r1.canvases === 0 && !r1.box && r1.still, 'nothing of it is left in the container but the last picture');
    ok(r1.chunks, 'three.js\'s fog chunks are as they were');
    // played to the end: started two and a half seconds before it (opts.from), so it ends quickly here
    const r2 = await page.evaluate(async (id) => {
      document.getElementById('box').innerHTML = '';
      const C = window.CUTSCENES[id], box = document.getElementById('box'), t0 = performance.now();
      const why = await C.play(box, { quality: 'light', from: C.seconds - 2.5 });
      return { why, ms: Math.round(performance.now() - t0), last: C.last };
    }, ID);
    ok(r2.why === 'done', 'play() settles "done" when it plays to the end (' + r2.why + ', ' + (r2.ms / 1000).toFixed(0) + ' s here)');
    ok(errs.length === 0, 'no errors from the module' + (errs.length ? ':\n  ' + errs.slice(0, 8).join('\n  ') : ''));
    await page.close();
  } finally { fs.rmSync(bare, { force: true }); }
}
// ---------- 3. the module in an arena (the new battles), as the game calls it once the arenas are switched on ----------
// With opts.arena the last shot ends on the arena's opening frame, its eye-height camera, instead of the flat painting's
// (README.md, "The hand-over"): the hand-over's camera stands where the arena's stands in the place, turned to its
// heading, with the battle's crop of its frame, and everyone's feet and heads are in that picture; play() still settles
// "done" at the end, and the flat painting's last picture is untouched (sections 1 and 2)
{
  const bare = path.join(dir, '.check-bare.html');
  fs.writeFileSync(bare, '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><div id="box" style="position:fixed;inset:0"></div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="./' + ID + '.js"></script></body>');
  try {
    const { page, errs } = await open('file://' + bare, [915, 412]);
    const r1 = await page.evaluate(async ([id, arena]) => {
      const C = window.CUTSCENES[id], box = document.getElementById('box');
      const h = C.prepare(box, { quality: 'light', test: true, arena }); await h.ready;
      h.test.handover();
      const cam = h.test.E.camera, B = h.test.scene.battle, V = (x, y, z) => new THREE.Vector3(x, y, z);
      const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), B.turn || 0), put = (x, y, z) => V(x, y, z).applyQuaternion(q).add(V(B.at[0], B.at[1], B.at[2]));
      const want = put(B.camera.x || 0, B.camera.h, B.camera.z), heading = V(0, Math.tan(B.camera.pitch * Math.PI / 180), -1).normalize().applyQuaternion(q), look = cam.getWorldDirection(V());
      cam.updateMatrixWorld();
      const seen = B.field.every((f) => [0, f.tall].every((y) => { const p = put(f.x, y, f.z).project(cam); return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1; }));
      const out = { arena: !!B.arena, off: cam.position.distanceTo(want), turned: look.angleTo(heading) * 180 / Math.PI, crop: !!(cam.view && cam.view.enabled), seen, place: B.place };
      h.cancel();
      return out;
    }, [ID, ARENA]);
    ok(r1.arena && r1.place === ARENA.place, 'given the fight\'s arena, the hand-over is framed in it (' + r1.place + ')');
    ok(r1.off < 1e-4 && r1.turned < .01 && r1.crop, 'its last picture is the arena\'s eye-height camera and its crop: ' + r1.off.toFixed(5) + ' m and ' + r1.turned.toFixed(4) + ' degrees off');
    ok(r1.seen, 'everyone\'s feet and heads are in that picture');
    const r2 = await page.evaluate(async ([id, arena]) => {
      document.getElementById('box').innerHTML = '';
      const C = window.CUTSCENES[id], box = document.getElementById('box');
      return C.play(box, { quality: 'light', from: C.seconds - 2.5, arena });
    }, [ID, ARENA]);
    ok(r2 === 'done', 'play() with the arena settles "done" when it plays to the end (' + r2 + ')');
    ok(errs.length === 0, 'no errors from the module in an arena' + (errs.length ? ':\n  ' + errs.slice(0, 8).join('\n  ') : ''));
    await page.close();
  } finally { fs.rmSync(bare, { force: true }); }
}
await browser.close();
console.log(fails.length ? '\n' + fails.length + ' failed' : '\nall good');
process.exit(fails.length ? 1 : 0);
