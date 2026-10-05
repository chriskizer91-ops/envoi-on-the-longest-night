import { open, sleep, S } from './lib.mjs';
const which = process.argv[2] ? process.argv[2].split(',') : ['card', 'shop', 'ysmera', 'ede', 'fly'];
async function enter(chName) {
  const o = await open();
  await o.page.click('.title-box button:text-is("Chapters")');
  await o.waitFor(() => document.querySelectorAll('.talk-choices button').length > 0);
  await o.page.click('.talk-choices button:text-is("' + chName + '")');
  await o.settle();
  o.go = async (map, at, dir) => {
    await o.page.evaluate(([map, at, dir]) => { window.__game.goField(map, at, dir); }, [map, at, dir || 's']);
    await o.waitFor((m) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, map, 60000);
    await o.page.evaluate(() => window.__game.field.setCounter && window.__game.field.setCounter(-1e6));
    await sleep(1200);
  };
  return o;
}
for (const w of which) {
  let o;
  try {
    o = await enter('The approach to the finale');
    const { page, shot } = o;
    if (w === 'card') {
      await page.evaluate(() => { const st = window.__game.state; for (const it of window.LOOT.ITEMS) st.items[it.id] = it.wear === 'either' ? 'sol' : it.wear; });
      await page.evaluate(() => { window.__game.menu(); });
      await o.waitFor(() => !!document.querySelector('.gmenu'));
      await page.click('.gmenu-tabs button:text-is("Items")'); await sleep(500);
      const btns = await page.$$('.gmenu-body button');
      console.log('item buttons', btns.length);
      await btns[0].click(); await sleep(900); await shot('card-keepsake-1');
    }
    if (w === 'shop') {
      await o.go('misthollow', [520, 640], 'w');
      await page.keyboard.press('Enter');
      for (let i = 0; i < 12; i++) {
        await sleep(900);
        const html = await page.evaluate(() => document.body.innerText.slice(0, 2000));
        if (/Buy/.test(html) && /herbs/.test(html)) break;
        const ch = await page.$$('.talk-choices button');
        if (ch.length) await ch[0].click(); else await page.keyboard.press('Enter');
      }
      await sleep(600); await shot('shop');
    }
    if (w === 'ysmera') { await o.go('shipyard', [765, 532], 'n'); await page.keyboard.press('Enter'); await sleep(1800); await shot('talk-ysmera'); }
    if (w === 'ede') { await o.go('misthollow', [925, 700], 'e'); await page.keyboard.press('Enter'); await sleep(1800); await shot('talk-ede'); }
    if (w === 'fly') {
      await o.go('frozen-camp', [356, 442], 'w');
      await page.keyboard.press('Enter');
      await o.waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 30000);
      await sleep(400); await shot('magpie-ask');
      await page.click('.talk-choices button:text-is("Fly")');
      await o.waitFor(() => window.__game.mode === 'fly' && !!window.__game.flyer && window.__game.flyer.state.mode === 'fly', null, 120000);
      await sleep(2500); await shot('fly-1');
      await page.evaluate(() => window.__game.flyer.flyTo('shipyard'));
      await sleep(9000); await shot('fly-2');
      await o.waitFor(() => { const c = document.querySelector('.fly-card'); return !!c && !c.hidden; }, null, 300000);
      await sleep(600); await shot('fly-card');
    }
  } catch (e) { console.log('FAIL', w, e.message); if (o) await o.shot('fail-' + w).catch(() => {}); }
  if (o) await o.browser.close();
}
