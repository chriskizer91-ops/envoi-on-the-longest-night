import { open, sleep, S } from './lib.mjs';
const only = process.argv[2] ? process.argv[2].split(',') : null;
const FIGHTS = [
  { name: 'first', ch: 0, level: 1, kind: 'first', manual: ['Witchcraft', 'Crescent Blades'], maxShots: 7 },
  { name: 'wild1', ch: 1, level: 4, kind: 'wild', opts: { band: 1, pack: ['wisp', 'wraith', 'wisp'], scene: 'gloamwood-road', weather: 'rain' }, maxShots: 5 },
  { name: 'great', ch: 1, level: 5, kind: 'greatWraith', maxShots: 7 },
  { name: 'node', ch: 2, level: 11, kind: 'dawnroost', maxShots: 2, manualSol: true },
  { name: 'halcyon', ch: 3, level: 18, kind: 'halcyon', maxShots: 2 },
  { name: 'bramble', ch: 3, level: 14, kind: 'wild', opts: { band: 3, pack: ['brambleAncient'], scene: 'northern-crossroads' }, maxShots: 1 },
  { name: 'frost', ch: 3, level: 14, kind: 'wild', opts: { band: 3, pack: ['frostWisp', 'frostWisp', 'wraith'], scene: 'northern-crossroads', weather: 'storm' }, maxShots: 4 },
  { name: 'colossus', ch: 4, level: 20, kind: 'wild', opts: { band: 4, pack: ['colossus'], scene: 'frozen-road' }, maxShots: 2, cut: true },
  { name: 'finale', ch: 4, level: 20, kind: 'finale', maxShots: 3, cut: true },
];
for (const F of FIGHTS) {
  if (only && !only.includes(F.name)) continue;
  const { browser, page, shot, waitFor, settle } = await open();
  try {
    await page.click('.title-box button:text-is("Chapters")');
    await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0);
    const chName = await page.evaluate((k) => window.Game.CHAPTERS[k].name, F.ch);
    await page.click('.talk-choices button:text-is("' + chName + '")');
    await settle();
    await page.evaluate(([L, ch]) => {
      const st = window.__game.state; st.level = L;
      Object.assign(st.flags, { party: true, refit: L > 5, envoi: L > 10, stoop: L > 15 });
      st.hp = { io: null, sol: null }; st.mp = null;
    }, [F.level, F.ch]);
    await page.evaluate(([k, o]) => { window.__game.battle(k, o); }, [F.kind, F.opts || {}]);
    if (F.cut) {
      await waitFor(() => !!document.querySelector('.cutscene-layer canvas'), null, 120000);
      const t0 = Date.now();
      for (const at of [6000, 20000]) {
        await sleep(Math.max(0, at - (Date.now() - t0)));
        if (await page.evaluate(() => !!document.querySelector('.cutscene-layer canvas'))) await shot('b-' + F.name + '-cut-' + at);
      }
      await page.keyboard.press('Escape');
    }
    await waitFor(() => !!window.__battle, null, 120000);
    await sleep(1500); await shot('b-' + F.name + '-intro');
    await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000);
    const cmdOpen = () => page.evaluate(() => { const u = document.getElementById('ui'); const c = document.getElementById('cmd'); return !!u && !u.hidden && !!c && c.querySelectorAll('button').length > 0; });
    if (F.manual || F.manualSol) {
      for (let i = 0; i < 80 && !(await cmdOpen()); i++) await sleep(500);
      await sleep(600); await shot('b-' + F.name + '-cmd');
      const btns = await page.$$eval('#cmd button', (b) => b.map((x) => x.textContent));
      console.log('cmd', JSON.stringify(btns));
      if (F.manual) {
        for (const label of F.manual) { await page.click('#cmd button:has-text("' + label + '")'); await sleep(700); await shot('b-' + F.name + '-pick-' + label.replace(/\W+/g, '')); }
        const t = await page.$$eval('#cmd button', (b) => b.map((x) => x.textContent)); console.log('targets', JSON.stringify(t));
        await page.click('#cmd button >> nth=0'); await sleep(2500); await shot('b-' + F.name + '-cast');
      }
      if (F.manualSol) {
        // Io picks the expert's move; on Sol's turn open Sword Arts
        await page.evaluate(() => { window.__battle.auto = 'expert'; });
        for (let i = 0; i < 60; i++) {
          await sleep(500);
          const who = await page.evaluate(() => { const s = document.getElementById('status'); return s ? s.innerHTML.length : 0; });
          const b = await page.$$eval('#cmd button', (b) => b.map((x) => x.textContent)).catch(() => []);
          if (b.some((x) => /Sword Arts/.test(x))) { await page.evaluate(() => { window.__battle.auto = null; }); await sleep(300); await page.click('#cmd button:has-text("Sword Arts")'); await sleep(700); await shot('b-' + F.name + '-swordarts'); await page.keyboard.press('Escape'); break; }
        }
      }
    }
    await page.evaluate(() => { window.__battle.auto = 'expert'; window.__battle.turbo = 1.5; });
    let last = '', n = 0; const tEnd = Date.now() + 120000;
    const seen = new Set();
    while (Date.now() < tEnd && n < F.maxShots) {
      const s = await page.evaluate(() => { const b = document.getElementById('banner'), B = window.__battle; return { banner: b ? b.textContent.trim() : '', state: B && B.state, over: B && B.state === 'over' }; });
      if (s.over) break;
      if (s.banner && s.banner !== last) {
        last = s.banner;
        const key = s.banner.replace(/\W+/g, '').slice(0, 24);
        if (!seen.has(key)) { seen.add(key); await sleep(650); await shot('b-' + F.name + '-' + (++n) + '-' + key); console.log(F.name, 'banner', s.banner); }
      }
      await sleep(200);
    }
    // finish it: weaken the foes and let the expert end it
    await page.evaluate(() => { const B = window.__battle; if (B && B.state !== 'over') for (const f of B.engine.foes) B.weaken(1, f.key); });
    await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 300000);
    await sleep(1200); await shot('b-' + F.name + '-end');
  } catch (e) { console.log('FAIL', F.name, e.message); await shot('fail-b-' + F.name).catch(() => {}); }
  await browser.close();
}
