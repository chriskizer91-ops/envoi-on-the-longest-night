// keys-test.mjs (the reskin job): the laptop keys and the mouse in a headless page: walk, tap twice to run, Shift to sprint;
// no thumb ring for a mouse, a ring for a finger. Usage: node keys-test.mjs dist/envoi-3d-wickhollow.html
import path from 'path'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + path.resolve(process.argv[2]) + '?test', { timeout: 240000 });
await page.waitForFunction(() => window.__ready, null, { timeout: 240000 });
const speed = async (label) => { const v = await page.evaluate(() => { const w = window.__w3d; w.setIo(777, 600, 3.14); w.step(1.5, 30, false); return +w.io.speed.toFixed(2); }); console.log(label.padEnd(44), v, 'm/s'); return v; };
await page.keyboard.down('w'); await speed('W held (walk)'); await page.keyboard.up('w');
await page.evaluate(() => window.__w3d.step(0.5, 30, false));
await page.keyboard.down('w'); await page.keyboard.up('w'); await page.keyboard.down('w'); await speed('W tapped twice and held (run)');
await page.keyboard.down('Shift'); await speed('... with Shift (sprint)'); await page.keyboard.up('Shift'); await speed('... Shift let go (run again)'); await page.keyboard.up('w');
await page.evaluate(() => window.__w3d.step(0.5, 30, false));
await page.keyboard.down('ArrowUp'); await speed('Arrow up held, after a pause (walk again)'); await page.keyboard.up('ArrowUp');
await page.keyboard.down('Shift'); await page.keyboard.down('w'); await speed('Shift + W, no double tap (sprint)'); await page.keyboard.up('w'); await page.keyboard.up('Shift');
// the mouse: no ring, and it turns the camera
const yaw0 = await page.evaluate(() => window.__w3d.C.yaw);
await page.mouse.move(200, 400); await page.mouse.down(); await page.mouse.move(320, 400, { steps: 5 });
const ring = await page.evaluate(() => getComputedStyle(document.getElementById('ring')).display);
await page.mouse.up();
const yaw1 = await page.evaluate(() => window.__w3d.C.yaw);
console.log('mouse drag on the left half: the ring is', ring, '· the camera turned', (yaw1 - yaw0).toFixed(2), 'radians');
// a finger: the ring shows
const cdp = await page.context().newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 400 }] });
console.log('a finger on the left half: the ring is', await page.evaluate(() => getComputedStyle(document.getElementById('ring')).display));
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
console.log(errs.length ? errs : 'no page errors'); await browser.close();
