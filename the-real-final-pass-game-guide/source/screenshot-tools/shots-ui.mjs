import { open, sleep, S } from './lib.mjs';
const { browser, page, shot, waitFor, talkThrough, settle } = await open();
// enter the finale chapter by the title's Chapters
await page.click('.title-box button:text-is("Chapters")');
await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0);
await sleep(500); await shot('ui-chapters');
await page.click('.talk-choices button:text-is("The approach to the finale")');
await settle();
await sleep(800);
const go = async (map, at, dir, f) => {
  await page.evaluate(([map, at, dir, f]) => { const g = window.__game; if (f) (new Function('st', f))(g.state); g.goField(map, at, dir); }, [map, at, dir || 's', f || null]);
  await waitFor((m) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, map, 60000);
  await page.evaluate(() => window.__game.field.setCounter && window.__game.field.setCounter(-1e6));
  await sleep(1200);
};
// every keepsake found, worn by their first wearer
await page.evaluate(() => { const st = window.__game.state; for (const it of window.LOOT.ITEMS) st.items[it.id] = it.wear === 'either' ? (['jetty-coin','hag-stone','forge-horseshoe','dockhand-gloves'].includes(it.id) ? 'io' : 'sol') : it.wear; st.shards = 12840; st.xp = 0; });
await go('misthollow', [768, 880], 'n');
await page.evaluate(() => { window.__game.menu(); });
await waitFor(() => !!document.querySelector('.gmenu'));
for (const tab of await page.$$eval('.gmenu-tabs button', (b) => b.map((x) => x.textContent))) {
  await page.click('.gmenu-tabs button:text-is("' + tab + '")'); await sleep(400); await shot('menu-' + tab.toLowerCase());
  if (tab === 'Settings') { for (let i = 1; i <= 3; i++) { await page.evaluate((i) => { const b = document.querySelector('.gmenu-body'); if (b) b.scrollTop = b.scrollHeight * i / 3; }, i); await sleep(300); await shot('menu-settings-' + i); } }
}
// a keepsake card from Items
await page.click('.gmenu-tabs button:text-is("Items")'); await sleep(300);
const names = await page.$$eval('.gmenu-body button', (b) => b.map((x) => x.textContent.trim()).slice(0, 40));
console.log('items buttons', JSON.stringify(names));
const want = names.find((n) => /Crescent Locket/.test(n)) || names[0];
if (want) { await page.click('.gmenu-body button:has-text("' + want.slice(0, 18) + '")'); await sleep(800); await shot('card-keepsake'); }
await page.keyboard.press('Escape'); await sleep(400); await page.keyboard.press('Escape'); await sleep(400);
// the herb shop in Misthollow (Sorrel)
try {
  await go('misthollow', [520, 640], 'w');
  await page.keyboard.press('Enter'); await sleep(1200); await shot('shop-1');
  for (let i = 0; i < 4; i++) { const ch = await page.$$eval('.talk-choices button', (b) => b.map((x) => x.textContent)); console.log('choices', JSON.stringify(ch)); if (ch.length) { const k = ch.findIndex((c) => /herb|buy|shop/i.test(c)); await page.click('.talk-choices button >> nth=' + Math.max(0, k)); } else await page.keyboard.press('Enter'); await sleep(1000); await shot('shop-' + (i + 2)); }
} catch (e) { console.log('FAIL shop', e.message); }
await page.keyboard.press('Escape'); await sleep(400); await page.keyboard.press('Escape'); await sleep(400);
await settle(20);
// Ysmera, with her portrait
try { await go('shipyard', [765, 548], 'n'); await page.keyboard.press('Enter'); await sleep(1500); await shot('talk-ysmera'); await settle(30); } catch (e) { console.log('FAIL ysmera', e.message); }
// Ede
try { await go('misthollow', [930, 700], 'e'); await page.keyboard.press('Enter'); await sleep(1500); await shot('talk-ede'); await settle(30); } catch (e) { console.log('FAIL ede', e.message); }
// the Magpie: up from the frozen camp
try {
  await go('frozen-camp', [360, 470], 'w');
  await page.keyboard.press('Enter');
  await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 30000);
  await sleep(500); await shot('magpie-ask');
  await page.click('.talk-choices button:text-is("Fly")');
  await waitFor(() => window.__game.mode === 'fly' && !!window.__game.flyer && window.__game.flyer.state.mode === 'fly', null, 120000);
  await sleep(1500); await shot('fly-1');
  await page.evaluate(() => window.__game.flyer.flyTo('shipyard'));
  await sleep(8000); await shot('fly-2');
  await waitFor(() => { const c = document.querySelector('.fly-card'); return !!c && !c.hidden; }, null, 300000);
  await sleep(500); await shot('fly-card');
  await page.evaluate(() => window.__game.flyer.flyTo('wickhollow'));
  await sleep(20000); await shot('fly-3');
} catch (e) { console.log('FAIL fly', e.message); await shot('fail-fly'); }
await browser.close();
