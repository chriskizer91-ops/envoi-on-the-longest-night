// touch-test.mjs: plays a built map page as a phone would: the opening flight down to Io, one finger turning and tipping
// the land, two fingers pinching, sliding and twisting, "Move Io" to another place, and the find-Io button. Prints what the camera did, and page errors.
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
// (the flight down, and its last frames: slow without a graphics card, so wait until the camera has come to rest)
for (let i = 0, was = null; i < 60; i++) { await page.waitForTimeout(700); const v = await view(); if (was && v.dist < 1300 && Math.abs(v.dist - was.dist) < 0.01 && Math.abs(v.x - was.x) < 0.01) break; was = v; }
const v1 = await view(); check('then flies down to Io at Wickhollow (1348, 1838)', Math.hypot(v1.x - 1348, v1.y - 1838) < 30 && v1.dist < 1300, 'at ' + Math.round(v1.x) + ', ' + Math.round(v1.y) + ', ' + Math.round(v1.dist) + ' away');
// fingers on the canvas, as pointer events (two at once for the pinch)
const fingers = (steps) => page.evaluate((steps) => {
  const c = document.querySelector('#map canvas'), fire = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
  for (const [type, id, x, y] of steps) fire(type, id, x, y);
}, steps);
const deg = (r) => Math.round(r * 180 / Math.PI) + '°';
const side = [['pointerdown', 1, 80, 500]]; for (let i = 1; i <= 10; i++) side.push(['pointermove', 1, 80 + 25 * i, 500]); side.push(['pointerup', 1, 330, 500]);
await fingers(side); await page.waitForTimeout(700);
const v2 = await view(); check('one finger dragged sideways turns the land round Io', Math.abs(v2.yaw - v1.yaw) > 1 && Math.hypot(v2.x - v1.x, v2.y - v1.y) < 2, 'turned ' + deg(v2.yaw - v1.yaw) + ', still looking at ' + Math.round(v2.x) + ', ' + Math.round(v2.y));
const upward = [['pointerdown', 1, 200, 600]]; for (let i = 1; i <= 10; i++) upward.push(['pointermove', 1, 200, 600 - 12 * i]); upward.push(['pointerup', 1, 200, 480]);
await fingers(upward); await page.waitForTimeout(700);
const v3 = await view(); check('one finger dragged up tips the view down low, across the land', v3.tilt < v2.tilt - 0.3 && v3.tilt > 0.17, 'from ' + deg(v2.tilt) + ' above the ground to ' + deg(v3.tilt));
const pinch = [['pointerdown', 1, 150, 450], ['pointerdown', 2, 260, 450]]; for (let i = 1; i <= 10; i++) pinch.push(['pointermove', 1, 150 - 6 * i, 450], ['pointermove', 2, 260 + 6 * i, 450]); pinch.push(['pointerup', 1, 90, 450], ['pointerup', 2, 320, 450]);
await fingers(pinch); await page.waitForTimeout(300);
const v4 = await view(); check('two fingers spread zoom in', v4.dist < v3.dist * 0.75, Math.round(v3.dist) + ' to ' + Math.round(v4.dist) + ' away');
const slide = [['pointerdown', 1, 150, 450], ['pointerdown', 2, 260, 450]]; for (let i = 1; i <= 10; i++) slide.push(['pointermove', 1, 150, 450 + 12 * i], ['pointermove', 2, 260, 450 + 12 * i]); slide.push(['pointerup', 1, 150, 570], ['pointerup', 2, 260, 570]);
await fingers(slide); await page.waitForTimeout(300);
const v5 = await view(); check('two fingers slid together move across the land', Math.hypot(v5.x - v4.x, v5.y - v4.y) > 60 && Math.abs(v5.dist - v4.dist) < 2, Math.round(Math.hypot(v5.x - v4.x, v5.y - v4.y) * 10) + ' m');
const twist = [['pointerdown', 1, 150, 450], ['pointerdown', 2, 260, 450]]; for (let i = 1; i <= 10; i++) { const a = i * 0.06; twist.push(['pointermove', 1, 205 - 55 * Math.cos(a), 450 - 55 * Math.sin(a)], ['pointermove', 2, 205 + 55 * Math.cos(a), 450 + 55 * Math.sin(a)]); } twist.push(['pointerup', 1, 0, 0], ['pointerup', 2, 0, 0]);
await fingers(twist); await page.waitForTimeout(300);
const v6 = await view(); check('two fingers twisted turn the land', Math.abs(v6.yaw - v5.yaw) > 0.4, 'turned ' + deg(v6.yaw - v5.yaw));
await page.click('#move'); await page.waitForTimeout(200);
check('"Move Io" opens the list of places', await page.isVisible('#sheet'), (await page.locator('#sheet-list .place').count()) + ' places');
await page.click('.place[data-id="misthollow"]'); await page.waitForTimeout(3800);
const v7 = await view(), chip = await page.textContent('#chip');
check('choosing Misthollow flies there and names it', Math.hypot(v7.x - 3500, v7.y - 735) < 30 && /Misthollow/.test(chip), chip.trim() + ' · at ' + Math.round(v7.x) + ', ' + Math.round(v7.y));
await fingers(side); await page.waitForTimeout(500);
await page.click('#find'); await page.waitForTimeout(3000);
const v8 = await view(); check('the moon button finds Io again, north up', Math.hypot(v8.x - 3500, v8.y - 735) < 30 && Math.abs(Math.atan2(Math.sin(v8.yaw), Math.cos(v8.yaw))) < 0.01, 'at ' + Math.round(v8.x) + ', ' + Math.round(v8.y));
console.log(ok + ' passed, ' + bad + ' failed · ' + (errors.length ? errors.join('\n') : '0 page errors'));
await browser.close();
process.exit(bad ? 1 : 0);
