// touch-test.mjs: plays a built map page as a phone would: the opening flight down to Io, a one-finger drag, a two-finger
// pinch and twist, "Move Io" to another place, and the find-Io button. Prints what the camera did, and page errors.
// Usage: node moon-faire-witches/world-map/tools/touch-test.mjs dist/envoi-map-where.html
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const file = path.resolve(process.argv[2]);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/GL Driver/.test(m.text())) errors.push(m.text()); });
await page.goto('file://' + file + '?at=wickhollow', { waitUntil: 'load' });
// the camera's state, read off the canvas (map3d.js keeps a reader there), from the moment the map shows
const view = () => page.evaluate(() => { const c = document.querySelector('#map canvas'); return c && c.__v ? c.__v() : null; });
let v0 = null;
for (let i = 0; i < 600 && !v0; i++) { const shown = await page.evaluate(() => !document.getElementById('chip').hidden); if (shown) v0 = await view(); else await page.waitForTimeout(25); }
let ok = 0, bad = 0; const check = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' · ' + detail : '')); cond ? ok++ : bad++; };
check('the camera starts over the whole map', v0 && v0.dist > 9000, v0 && 'from ' + Math.round(v0.dist) + ' away');
await page.waitForTimeout(4500);
const v1 = await view(); check('then flies down to Io at Wickhollow (1348, 1838)', Math.hypot(v1.x - 1348, v1.y - 1838) < 30 && v1.dist < 1300, 'at ' + Math.round(v1.x) + ', ' + Math.round(v1.y) + ', ' + Math.round(v1.dist) + ' away');
// fingers on the canvas, as pointer events (two at once for the pinch)
const fingers = (steps) => page.evaluate((steps) => {
  const c = document.querySelector('#map canvas'), fire = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
  for (const [type, id, x, y] of steps) fire(type, id, x, y);
}, steps);
const drag = [['pointerdown', 1, 200, 600]]; for (let i = 1; i <= 10; i++) drag.push(['pointermove', 1, 200, 600 - 30 * i]); drag.push(['pointerup', 1, 200, 300]);
await fingers(drag); await page.waitForTimeout(600);
const v2 = await view(); check('a finger dragged up moves the map north-south (it looks further south)', v2.y > v1.y + 100, 'y ' + Math.round(v1.y) + ' to ' + Math.round(v2.y));
const pinch = [['pointerdown', 1, 150, 450], ['pointerdown', 2, 260, 450]]; for (let i = 1; i <= 10; i++) pinch.push(['pointermove', 1, 150 - 6 * i, 450], ['pointermove', 2, 260 + 6 * i, 450]); pinch.push(['pointerup', 1, 90, 450], ['pointerup', 2, 320, 450]);
await fingers(pinch); await page.waitForTimeout(300);
const v3 = await view(); check('two fingers spread zoom in', v3.dist < v2.dist * 0.75, Math.round(v2.dist) + ' to ' + Math.round(v3.dist) + ' away');
const twist = [['pointerdown', 1, 150, 450], ['pointerdown', 2, 260, 450]]; for (let i = 1; i <= 10; i++) { const a = i * 0.06; twist.push(['pointermove', 1, 205 - 55 * Math.cos(a), 450 - 55 * Math.sin(a)], ['pointermove', 2, 205 + 55 * Math.cos(a), 450 + 55 * Math.sin(a)]); } twist.push(['pointerup', 1, 0, 0], ['pointerup', 2, 0, 0]);
await fingers(twist); await page.waitForTimeout(300);
const v4 = await view(); check('two fingers twisted turn the map', Math.abs(v4.yaw - v3.yaw) > 0.4, 'turned ' + Math.round((v4.yaw - v3.yaw) * 180 / Math.PI) + '°');
await page.click('#move'); await page.waitForTimeout(200);
check('"Move Io" opens the list of places', await page.isVisible('#sheet'), (await page.locator('#sheet-list .place').count()) + ' places');
await page.click('.place[data-id="misthollow"]'); await page.waitForTimeout(3600);
const v5 = await view(), chip = await page.textContent('#chip');
check('choosing Misthollow flies there and names it', Math.hypot(v5.x - 3500, v5.y - 735) < 30 && /Misthollow/.test(chip), chip.trim() + ' · at ' + Math.round(v5.x) + ', ' + Math.round(v5.y));
await fingers(drag); await page.waitForTimeout(500);
await page.click('#find'); await page.waitForTimeout(3000);
const v6 = await view(); check('the moon button finds Io again, north up', Math.hypot(v6.x - 3500, v6.y - 735) < 30 && Math.abs(Math.atan2(Math.sin(v6.yaw), Math.cos(v6.yaw))) < 0.01, 'at ' + Math.round(v6.x) + ', ' + Math.round(v6.y));
console.log(ok + ' passed, ' + bad + ' failed · ' + (errors.length ? errors.join('\n') : '0 page errors'));
await browser.close();
process.exit(bad ? 1 : 0);
