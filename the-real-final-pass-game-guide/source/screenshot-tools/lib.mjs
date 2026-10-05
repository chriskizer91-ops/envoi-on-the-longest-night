import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const pw = require('/opt/node22/lib/node_modules/playwright');
export const S = process.env.S;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function open(w = 960, h = 540) {
  const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.setDefaultTimeout(20000);
  if (process.env.SHARP) await page.addInitScript((v) => { try { localStorage.setItem('envoi.sharp', v); } catch (e) {} }, process.env.SHARP);
  const errs = [];
  page.on('pageerror', (e) => { errs.push('pageerror: ' + e.message); console.log('ERR', e.message); });
  await page.goto('file://' + S + '/game.html', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!document.querySelector('.title h1'), null, { timeout: 60000 });
  const shot = async (name) => { await page.screenshot({ path: S + '/shots/' + name + '.png' }); console.log('shot', name); };
  const waitFor = async (fn, arg, ms) => { await page.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 250 }); };
  async function talkThrough(ms, until, onFirst) {
    const end = Date.now() + (ms || 60000); let first = true;
    while (Date.now() < end) {
      const st = await page.evaluate(() => { const b = document.querySelector('.talk'); return { open: !!b && !b.hidden, choices: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
      if (until && await page.evaluate(until)) return;
      if (!st.open) { if (!until) return; await sleep(250); continue; }
      if (first && onFirst) { first = false; await sleep(900); await onFirst(); }
      if (st.choices) await page.click('.talk-choices button');
      else await page.click('.talk-words');
      await sleep(150);
    }
    throw new Error('dialogue never closed');
  }
  async function settle(maxIter = 60, onTalk) {
    for (let i = 0; i < maxIter; i++) {
      await sleep(700);
      const s = await page.evaluate(() => { const g = window.__game, b = document.querySelector('.talk'); return { mode: g.mode, busy: g.busy, talk: b && !b.hidden ? b.textContent.slice(0, 80) : null, ch: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
      if (process.env.V) console.log('settle', JSON.stringify(s));
      if (s.talk && onTalk) { const r = await onTalk(s, i); if (r === 'stop') return; }
      if (s.ch) await page.click('.talk-choices button');
      else if (s.talk) await page.click('.talk-words');
      else if (s.mode !== 'title' && !s.busy) return;
    }
  }
  return { browser, page, errs, shot, waitFor, talkThrough, settle };
}
